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
import { Send, Smile, Paperclip, Check, CheckCheck, Loader2, MessageCircle, Plus, Camera } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import {
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
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
      <div className="h-[650px] rounded-[24px] bg-white text-slate-900 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-slate-200">
        
        {/* Solid Header */}
        <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-primary-gradient text-white font-bold">S</AvatarFallback>
                </Avatar>
                {adminPresence === 'online' && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />}
             </div>
             <div>
                <h3 className="font-bold text-slate-900 text-[15px] tracking-tight">{ADMIN_NAME}</h3>
                <p className="text-[11px] font-medium text-slate-400">
                    {isAdminTyping ? <span className="text-primary animate-pulse">Typing...</span> : (
                        adminPresence === 'online' ? 'Active Now' : 'Offline'
                    )}
                </p>
             </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-slate-400"><MoreVertical className="w-5 h-5" /></Button>
        </div>

        {/* Solid Content Area */}
        <ScrollArea className="flex-1 p-5 bg-[#F8FAFC]" ref={scrollAreaRef}>
             {isHistoryLoading ? (
               <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
            ) : !user ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-6">
                    <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center">
                        <MessageCircle className="w-10 h-10 text-primary/20" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-900">Start a conversation</h4>
                        <p className="text-slate-500 text-sm">Please sign in to message Sarthak and get support.</p>
                    </div>
                    <Button asChild className="rounded-full px-10 bg-primary-gradient border-none shadow-lg"><Link href="/login">Sign In</Link></Button>
                </div>
            ) : (
                <div className="space-y-6">
                  {messages.map((msg) => {
                    const isMe = msg.sentBy === 'visitor';
                    const isRead = Object.keys(msg.readBy || {}).some(k => k === ADMIN_EMAIL);
                    
                    return (
                        <div key={msg.id} className={cn("flex items-end gap-2 group", isMe && 'flex-row-reverse')}>
                           <div className={cn("flex flex-col gap-1 w-full max-w-[75%]", isMe && 'items-end')}>
                             <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={cn(
                                    "relative p-3.5 rounded-[20px] bubble-shadow transition-all", 
                                    isMe 
                                        ? 'bg-primary-gradient text-white rounded-br-none' 
                                        : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none'
                                )}
                             >
                                {msg.imageUrl && <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-xl mb-2.5 shadow-sm" />}
                                {msg.text && <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>}
                                <div className={cn("text-[10px] flex items-center justify-end gap-1.5 mt-1.5 font-bold uppercase", isMe ? "text-white/60" : "text-slate-400")}>
                                    <span>{msg.sentAt ? format(getSentAtDate(msg.sentAt), 'p') : ''}</span>
                                    {isMe && (
                                        isRead ? <CheckCheck className="h-3.5 w-3.5 text-white" /> : <Check className="h-3.5 w-3.5" />
                                    )}
                                </div>

                                {/* Reactions */}
                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                    <div className={cn(
                                      "absolute -bottom-3.5 bg-white border border-slate-100 rounded-full px-1.5 py-0.5 text-[11px] flex items-center gap-1 shadow-sm ring-1 ring-slate-900/5", 
                                      isMe ? "right-2" : "left-2"
                                    )}>
                                        {Object.entries(msg.reactions).map(([email, emoji]) => (
                                            <span key={email} className="hover:scale-125 transition-transform">{emoji}</span>
                                        ))}
                                    </div>
                                )}
                             </motion.div>
                           </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-slate-200/50 text-slate-400">
                                        <Smile className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                 <PopoverContent className="w-fit p-1 bg-white border-slate-200 rounded-full shadow-xl" side="top">
                                    <div className="flex gap-1">
                                        {EMOJIS.map((emoji) => (
                                            <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="text-base p-1.5 rounded-full hover:bg-slate-50 transition-colors hover:scale-125">{emoji}</button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    );
                  })}
                </div>
            )}
        </ScrollArea>
        
        {/* Solid Input Bar */}
        {user && (
           <div className="p-5 bg-white border-t border-slate-100">
              <Form {...replyForm}>
                <form onSubmit={replyForm.handleSubmit(handleReply)} className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full h-10 w-10 text-slate-400 hover:text-primary hover:bg-slate-50">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => replyForm.setValue('attachment', e.target.files?.[0])} />
                  </div>

                  <FormField
                    control={replyForm.control}
                    name="replyMessage"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input 
                            placeholder="Type a message..." 
                            {...field} 
                            autoComplete="off" 
                            onInput={handleTyping} 
                            className="bg-slate-100 border-none rounded-full h-11 px-6 focus-visible:ring-primary/20 transition-all text-sm font-medium"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting} className="rounded-full h-11 w-11 bg-primary-gradient shadow-lg shadow-primary/20 shrink-0">
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </form>
              </Form>
            </div>
        )}
      </div>
    </div>
  );
}

// Minimal placeholder icons
function MoreVertical(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
  );
}
