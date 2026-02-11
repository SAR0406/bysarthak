
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { Send, Smile, Paperclip, Check, CheckCheck, Loader2, MoreHorizontal } from 'lucide-react';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import React from 'react';

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
  presence?: { [key: string]: 'online' | 'offline' };
};

const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
    '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳',
    '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
    '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
    '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '❤️', '🙏'
];

const ADMIN_EMAIL = 'sarthak040624@gmail.com';

export function ContactForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'conversations', user.email!);
  }, [firestore, user]);
  
  const { data: conversationData, isLoading: isHistoryLoading } = useDoc<Conversation>(conversationRef);
  
  const getSentAtDate = (sentAt: Message['sentAt']) => {
    if (!sentAt) return new Date();
    return sentAt instanceof Timestamp ? sentAt.toDate() : sentAt;
  };
  
  const messages = conversationData?.messages?.sort((a, b) => getSentAtDate(a.sentAt).getTime() - getSentAtDate(b.sentAt).getTime()) || [];

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  const handleTyping = useCallback(() => {
    if (!conversationRef || !user?.email) return;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    
    updateDoc(conversationRef, { [`typing.${user.email}`]: true });

    typingTimeoutRef.current = setTimeout(() => {
        updateDoc(conversationRef, { [`typing.${user.email}`]: false });
    }, 2000);
  }, [conversationRef, user?.email]);

  useEffect(() => {
      return () => {
          if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
  }, []);

  const markMessagesAsRead = useCallback(async () => {
    if (!firestore || !conversationData || !user || !conversationRef) return;
    const unreadMessages = conversationData.messages.filter(msg => msg.sentBy === 'admin' && (!msg.readBy || !msg.readBy[user.email!]));
    if (unreadMessages.length === 0) return;

    const batch = writeBatch(firestore);
    const updatedMessages = conversationData.messages.map(msg => {
        if (unreadMessages.some(unread => unread.id === msg.id)) {
            return { ...msg, readBy: { ...msg.readBy, [user.email!]: Timestamp.now() } };
        }
        return msg;
    });
    batch.update(conversationRef, { messages: updatedMessages });
    await batch.commit();
  }, [firestore, conversationData, user, conversationRef]);

  // Set presence
  useEffect(() => {
    if (!firestore || !user?.email) return;
    const conversationRef = doc(firestore, 'conversations', user.email);
    updateDoc(conversationRef, { [`presence.${user.email}`]: 'online' }).catch(() => {});
    const onUnload = () => updateDoc(conversationRef, { [`presence.${user.email}`]: 'offline' });
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [firestore, user]);


  useEffect(() => {
    if (conversationData) { markMessagesAsRead(); }
  }, [conversationData, markMessagesAsRead]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableView) { scrollableView.scrollTop = scrollableView.scrollHeight; }
    }
  };

  useEffect(() => { setTimeout(scrollToBottom, 50); }, [messages]);

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !conversationRef) return;
    
    if (!values.replyMessage && !values.attachment) {
      replyForm.reset();
      return;
    }

    const replyData: Omit<Message, 'sentAt' | 'readBy'> & { sentAt: Date } = {
        id: uuidv4(),
        sentBy: 'visitor' as const,
        senderName: user.displayName || user.email!,
        senderEmail: user.email!,
        sentAt: new Date(),
    };

    if (values.replyMessage) {
        replyData.text = values.replyMessage;
    }
    
    if (values.attachment) {
        const storage = getStorage();
        const filePath = `attachments/${conversationRef.id}/${Date.now()}_${values.attachment.name}`;
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, values.attachment);
        replyData.imageUrl = await getDownloadURL(fileRef);
    }
    
    replyForm.reset();

    try {
      if (conversationData) {
        await updateDoc(conversationRef, {
          messages: arrayUnion(replyData),
          lastMessageAt: serverTimestamp(),
          [`typing.${user.email!}`]: false,
        });
      } else {
        await setDoc(conversationRef, {
            id: user.email!,
            senderName: user.displayName || user.email!,
            senderEmail: user.email!,
            lastMessageAt: serverTimestamp(),
            messages: [replyData],
            typing: { [user.email!]: false },
            presence: { [user.email!]: 'online' },
        });
      }
    } catch (e: any) { toast({ variant: 'destructive', title: 'Reply Failed', description: e.message }); }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!conversationRef || !user?.email || !conversationData) return;

    const messageIndex = conversationData.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
      
    const updatedMessages = [...conversationData.messages];
    const message = updatedMessages[messageIndex];

    // Ensure reactions object exists
    if (!message.reactions) {
        message.reactions = {};
    }
    
    const userReaction = Object.keys(message.reactions).find(key => message.reactions![key] === user.email);

    if (userReaction === emoji) {
        // User is removing their reaction
        delete message.reactions[emoji];
    } else {
        // Remove previous reaction if it exists
        if(userReaction) delete message.reactions[userReaction];
        // Add new reaction
        message.reactions[emoji] = user.email!;
    }
    
    await updateDoc(conversationRef, { messages: updatedMessages });
};

  const formatMessageTimestamp = (date: Date) => format(date, 'p');

  const MessageStatus = ({ message }: { message: Message }) => {
    if (message.sentBy !== 'visitor' || !conversationData) return null;
    const adminRead = Object.keys(message.readBy || {}).some(key => key === ADMIN_EMAIL);
    return adminRead ? <CheckCheck className="h-4 w-4 text-blue-500 inline" /> : <Check className="h-4 w-4 text-muted-foreground inline" />;
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = replyForm.getValues('replyMessage') || '';
    replyForm.setValue('replyMessage', currentMessage + emoji);
  };
  
  const isTyping = conversationData?.typing?.[ADMIN_EMAIL];

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <div className="h-[600px] rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Live Chat</h3>
          <p className="text-sm text-muted-foreground">{isTyping ? 'Admin is typing...' : 'Ask me anything!'}</p>
        </div>

        <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}>
             {isHistoryLoading ? (
               <div key="loading" className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : !user ? (
                <div key="login" className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">You need an account to chat.</p>
                    <Button asChild variant="link" className="mt-2"><Link href="/login">Login or Sign Up</Link></Button>
                </div>
            ) : (
                <div key="messages-list" className="space-y-1">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2.5 group", msg.sentBy === 'visitor' && 'justify-end')}>
                       <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.sentBy === 'visitor' && 'items-end')}>
                         <div className={cn("relative leading-1.5 p-2 rounded-xl", msg.sentBy === 'visitor' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none shadow-sm')}>
                            {msg.imageUrl && <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-md mb-2" />}
                            {msg.text && <p className="text-sm font-normal px-1">{msg.text}</p>}
                            <div className="text-xs text-muted-foreground/80 flex items-center justify-end gap-1 mt-1">
                                {msg.sentBy === 'visitor' && <MessageStatus message={msg} />}
                                <span>{msg.sentAt ? formatMessageTimestamp(getSentAtDate(msg.sentAt)) : ''}</span>
                            </div>
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className="absolute -bottom-3 right-2 bg-card border rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
                                    {Object.keys(msg.reactions).map((emoji, i) => <span key={i}>{emoji}</span>)}
                                    <span className='ml-1 text-muted-foreground'>{Object.keys(msg.reactions).length}</span>
                                </div>
                            )}
                         </div>
                       </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Add reaction">
                                    <Smile className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1 border-none shadow-none bg-transparent mb-2">
                                <div className="flex gap-0.5 bg-card border rounded-full p-1 shadow-md">
                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                        <button key={emoji} type="button" onClick={() => handleReaction(msg.id, emoji)} className="text-lg p-1 rounded-full hover:bg-muted transition-colors">
                                            {emoji}
                                        </button>
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
           <div className="p-4 border-t">
              <Form {...replyForm}>
                <form onSubmit={replyForm.handleSubmit(handleReply)} className="flex gap-2">
                   <Popover>
                      <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Open emoji picker"><Smile className="h-5 w-5" /></Button></PopoverTrigger>
                      <PopoverContent className="w-auto p-1 border-none shadow-none bg-transparent mb-2">
                          <div className="grid grid-cols-10 gap-0.5">
                              {EMOJIS.map((emoji,i) => (
                                  <button key={`${emoji}-${i}`} type="button" onClick={() => handleEmojiSelect(emoji)} className="text-xl p-0.5 rounded-md hover:bg-muted transition-colors">{emoji}</button>
                              ))}
                          </div>
                      </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file"><Paperclip className="h-5 w-5" /></Button>
                  <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => replyForm.setValue('attachment', e.target.files?.[0])} />

                  <FormField
                    control={replyForm.control}
                    name="replyMessage"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input placeholder="Type your message..." {...field} autoComplete="off" onInput={handleTyping} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting} aria-label="Send message"><Send className="h-4 w-4" /></Button>
                </form>
              </Form>
            </div>
        )}
      </div>
    </div>
  );
}
