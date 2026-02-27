
'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Send, Smile, Paperclip, Check, CheckCheck, Loader2, MessageCircle } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import {
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Reply cannot be empty.').optional(),
  attachment: z.instanceof(File).optional(),
});

type Message = {
  id: string;
  text?: string;
  imageUrl?: string;
  sentAt: Timestamp | Date;
  sentBy: 'admin' | 'visitor';
  senderName: string;
  senderEmail: string;
  readBy: { [key: string]: Timestamp };
  reactions?: { [emoji: string]: string };
};

type Conversation = {
  id: string;
  senderName: string;
  senderEmail: string;
  lastMessageAt: Timestamp;
  messages: Message[];
  typing?: { [key: string]: boolean };
  presence?: { [key: string]: 'online' | Timestamp };
};

const EMOJIS = ['😀', '😍', '👍', '❤️', '😂', '🔥', '✨', '🙏'];
const ADMIN_NAME = 'Sarthak';
const ADMIN_EMAIL = 'sarthak040624@gmail.com';

export function ContactForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'conversations', user.email);
  }, [firestore, user?.email]);
  
  const { data: conversationData, isLoading: isHistoryLoading } = useDoc<Conversation>(conversationRef);
  
  const getSentAtDate = (sentAt: any) => {
    if (!sentAt) return new Date();
    return sentAt instanceof Timestamp ? sentAt.toDate() : new Date(sentAt);
  };
  
  const messages = useMemo(() => {
    return conversationData?.messages?.sort((a, b) => getSentAtDate(a.sentAt).getTime() - getSentAtDate(b.sentAt).getTime()) || [];
  }, [conversationData]);

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  const handleTyping = useCallback(() => {
    if (!conversationRef || !user?.email) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    updateDoc(conversationRef, { [`typing.${user.email}`]: true });
    typingTimeoutRef.current = setTimeout(() => {
        updateDoc(conversationRef, { [`typing.${user.email}`]: false });
    }, 2000);
  }, [conversationRef, user?.email]);

  const markMessagesAsRead = useCallback(async () => {
    if (!firestore || !conversationData || !user?.email || !conversationRef) return;
    const unreadMessages = conversationData.messages.filter(msg => msg.sentBy === 'admin' && (!msg.readBy || !msg.readBy[user.email!]));
    if (unreadMessages.length === 0) return;
    const updatedMessages = conversationData.messages.map(msg => {
        if (unreadMessages.some(unread => unread.id === msg.id)) {
            return { ...msg, readBy: { ...msg.readBy, [user.email!]: Timestamp.now() } };
        }
        return msg;
    });
    updateDoc(conversationRef, { messages: updatedMessages });
  }, [firestore, conversationData, user?.email, conversationRef]);

  useEffect(() => {
    if (conversationData) markMessagesAsRead();
  }, [conversationData, markMessagesAsRead]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => { setTimeout(scrollToBottom, 50); }, [messages]);

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !conversationRef) return;
    if (!values.replyMessage && !values.attachment) return;

    const replyData: Message = {
        id: uuidv4(),
        sentBy: 'visitor',
        senderName: user.displayName || user.email!,
        senderEmail: user.email!,
        sentAt: new Date(),
        readBy: { [user.email!]: Timestamp.now() },
        reactions: {},
    };

    if (values.replyMessage) replyData.text = values.replyMessage;
    
    if (values.attachment) {
        const storage = getStorage();
        const filePath = `attachments/${conversationRef.id}/${Date.now()}_${values.attachment.name}`;
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, values.attachment);
        replyData.imageUrl = await getDownloadURL(fileRef);
    }
    
    replyForm.reset();

    if (conversationData) {
        updateDoc(conversationRef, {
          messages: arrayUnion(replyData),
          lastMessageAt: serverTimestamp(),
          [`typing.${user.email!}`]: false,
        });
    } else {
        setDoc(conversationRef, {
            id: user.email!,
            senderName: user.displayName || user.email!,
            senderEmail: user.email!,
            lastMessageAt: serverTimestamp(),
            messages: [replyData],
            typing: { [user.email!]: false },
            presence: { [user.email!]: 'online' },
        });
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!conversationRef || !user?.email || !conversationData) return;
    const updatedMessages = conversationData.messages.map(msg => {
        if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (reactions[user.email!] === emoji) delete reactions[user.email!];
            else reactions[user.email!] = emoji;
            return { ...msg, reactions };
        }
        return msg;
    });
    updateDoc(conversationRef, { messages: updatedMessages });
  };

  const adminPresence = conversationData?.presence?.[ADMIN_EMAIL];
  const isAdminTyping = conversationData?.typing?.[ADMIN_EMAIL];

  return (
    <div className="mt-12 max-w-lg mx-auto p-4">
      <div className="h-[650px] rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl text-card-foreground shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">S</div>
                {adminPresence === 'online' && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />}
             </div>
             <div>
                <h3 className="font-bold text-base leading-none">Support with {ADMIN_NAME}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                    {isAdminTyping ? <span className="text-primary font-bold animate-pulse">Typing...</span> : (
                        adminPresence === 'online' ? 'Online' : (adminPresence instanceof Timestamp ? `Last seen ${formatDistanceToNow(adminPresence.toDate(), { addSuffix: true })}` : 'Offline')
                    )}
                </p>
             </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-transparent to-black/20" ref={scrollAreaRef}>
             {isHistoryLoading ? (
               <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>
            ) : !user ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><MessageCircle className="w-8 h-8 text-white/20" /></div>
                    <p className="text-muted-foreground text-sm font-medium">Please sign in to start a conversation with Sarthak.</p>
                    <Button asChild variant="outline" className="rounded-full px-8"><Link href="/login">Login</Link></Button>
                </div>
            ) : (
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2 group", msg.sentBy === 'visitor' && 'flex-row-reverse')}>
                       <div className={cn("flex flex-col gap-1.5 w-full max-w-[80%]", msg.sentBy === 'visitor' && 'items-end')}>
                         <div className={cn(
                            "relative p-4 rounded-2xl shadow-xl transition-all duration-300", 
                            msg.sentBy === 'visitor' 
                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                : 'bg-white/10 text-white border border-white/5 rounded-bl-none backdrop-blur-md'
                         )}>
                            {msg.imageUrl && <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-xl mb-3 shadow-inner border border-black/20" />}
                            {msg.text && <p className="text-sm font-medium leading-relaxed">{msg.text}</p>}
                            <div className="text-[9px] text-white/50 flex items-center justify-end gap-1.5 mt-2 font-bold uppercase tracking-widest">
                                {msg.sentBy === 'visitor' && (
                                    Object.keys(msg.readBy || {}).some(k => k === ADMIN_EMAIL) 
                                        ? <CheckCheck className="h-3 w-3 text-blue-300" /> 
                                        : <Check className="h-3 w-3" />
                                )}
                                <span>{msg.sentAt ? format(getSentAtDate(msg.sentAt), 'p') : ''}</span>
                            </div>
                           {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className={cn("absolute -bottom-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-lg", msg.sentBy === 'visitor' ? "right-2" : "left-2")}>
                                    {Object.entries(msg.reactions).map(([email, emoji]) => (
                                        <span key={email} className="cursor-default hover:scale-125 transition-transform">{emoji}</span>
                                    ))}
                                </div>
                            )}
                         </div>
                       </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-white/5" aria-label="Reaction">
                                    <Smile className="w-4 h-4 text-white/40" />
                                </Button>
                            </PopoverTrigger>
                             <PopoverContent className="w-fit p-1 bg-black/90 backdrop-blur-2xl border-white/10 rounded-full shadow-2xl" side="top">
                                <div className="flex gap-1">
                                    {EMOJIS.map((emoji) => (
                                        <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="text-lg p-1.5 rounded-full hover:bg-white/10 transition-colors">{emoji}</button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                  ))}
                </div>
            )}
        </ScrollArea>
        
        {user && (
           <div className="p-6 bg-white/5 backdrop-blur-xl border-t border-white/5">
              <Form {...replyForm}>
                <form onSubmit={replyForm.handleSubmit(handleReply)} className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl h-10 w-10 text-white/40 hover:bg-white/5 hover:text-white transition-all"><Paperclip className="h-5 w-5" /></Button>
                  <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => replyForm.setValue('attachment', e.target.files?.[0])} />

                  <FormField
                    control={replyForm.control}
                    name="replyMessage"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input 
                            placeholder="Message..." 
                            {...field} 
                            autoComplete="off" 
                            onInput={handleTyping} 
                            className="bg-white/5 border-white/10 rounded-xl h-10 focus:ring-primary/40 transition-all text-sm"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting} className="rounded-xl h-10 w-10 bg-primary shadow-lg shadow-primary/20"><Send className="h-4 w-4" /></Button>
                </form>
              </Form>
            </div>
        )}
      </div>
    </div>
  );
}
