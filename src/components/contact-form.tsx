
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
import { Send, Smile, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
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
};

type Conversation = {
  id: string;
  senderName: string;
  senderEmail: string;
  lastMessageAt: Timestamp;
  messages: Message[];
};

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳',
  '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
  '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '❤️', '😮', '🙏'
];


export function ContactForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'conversations', user.email!);
  }, [firestore, user]);
  
  const { data: conversationData, isLoading: isHistoryLoading } = useDoc<Conversation>(conversationRef);

  const getSentAtDate = (sentAt: Message['sentAt']) => {
    if (!sentAt) return new Date();
    if (sentAt instanceof Timestamp) {
      return sentAt.toDate();
    }
    return sentAt;
  };
  
  const messages = conversationData?.messages?.sort((a, b) => getSentAtDate(a.sentAt).getTime() - getSentAtDate(b.sentAt).getTime()) || [];

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  const markMessagesAsRead = useCallback(async () => {
    if (!firestore || !conversationData || !user || !conversationRef) return;

    const unreadMessages = conversationData.messages.filter(
      (msg) => msg.sentBy === 'admin' && (!msg.readBy || !msg.readBy[user.email!])
    );

    if (unreadMessages.length === 0) return;

    const batch = writeBatch(firestore);
    const updatedMessages = conversationData.messages.map((msg) => {
        if (unreadMessages.some(unread => unread.id === msg.id)) {
            return { ...msg, readBy: { ...msg.readBy, [user.email!]: Timestamp.now() } };
        }
        return msg;
    });

    batch.update(conversationRef, { messages: updatedMessages });
    await batch.commit();
  }, [firestore, conversationData, user, conversationRef]);

  useEffect(() => {
    if (conversationData) {
      markMessagesAsRead();
    }
  }, [conversationData, markMessagesAsRead]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !conversationRef) return;

    let imageUrl: string | undefined = undefined;

    if (values.attachment) {
      const storage = getStorage();
      const filePath = `attachments/${conversationRef.id}/${Date.now()}_${values.attachment.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, values.attachment);
      imageUrl = await getDownloadURL(fileRef);
    }

    if (!values.replyMessage && !imageUrl) {
        replyForm.reset();
        return;
    }

    const replyData: any = {
      id: uuidv4(),
      sentAt: new Date(),
      sentBy: 'visitor' as const,
      senderName: user.displayName || user.email!,
      senderEmail: user.email!,
      readBy: {},
    };

    if(values.replyMessage) {
        replyData.text = values.replyMessage;
    }
    if(imageUrl) {
        replyData.imageUrl = imageUrl;
    }

    replyForm.reset();

    const conversationPayload = {
        id: user.email!,
        senderName: user.displayName || user.email!,
        senderEmail: user.email!,
        lastMessageAt: serverTimestamp(),
        messages: arrayUnion(replyData),
    };

    try {
        if (conversationData) {
            await updateDoc(conversationRef, {
              messages: arrayUnion(replyData),
              lastMessageAt: serverTimestamp()
            });
        } else {
            await setDoc(conversationRef, conversationPayload);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Reply Failed', description: e.message });
    }
  }

  const formatMessageTimestamp = (date: Date) => {
      return format(date, 'p');
  };

  const MessageStatus = ({ message }: { message: Message }) => {
    if (message.sentBy !== 'visitor' || !conversationData) return null;
    const adminRead = Object.keys(message.readBy || {}).length > 0;

    if (adminRead) {
      return <CheckCheck className="h-4 w-4 text-blue-500 inline" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground inline" />;
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = replyForm.getValues('replyMessage') || '';
    replyForm.setValue('replyMessage', currentMessage + emoji);
  };

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <div className="h-[600px] rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Live Chat</h3>
          <p className="text-sm text-muted-foreground">Ask me anything!</p>
        </div>

        <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}>
            {isHistoryLoading ? (
               <div key="loading" className="flex justify-center items-center h-full">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
            ) : !user ? (
                <div key="login-prompt" className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">You need an account to chat.</p>
                    <Button asChild variant="link" className="mt-2">
                        <Link href="/login">Login or Sign Up</Link>
                    </Button>
                </div>
            ) : (
                <div key="messages-list" className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2 group", msg.sentBy === 'visitor' && 'justify-end')}>
                       <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.sentBy === 'visitor' && 'items-end')}>
                         <div className={cn("relative leading-1.5 p-2 rounded-xl", msg.sentBy === 'visitor' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none shadow-sm')}>
                            {msg.imageUrl && (
                                <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-md mb-2" />
                            )}
                            {msg.text && <p className="text-sm font-normal px-1 pb-2">{msg.text}</p>}
                            
                            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground/80 flex items-center gap-1">
                                {msg.sentBy === 'visitor' && <MessageStatus message={msg} />}
                                <span>{msg.sentAt ? formatMessageTimestamp(getSentAtDate(msg.sentAt)) : ''}</span>
                            </div>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
            )}
        </ScrollArea>
        
        {user && (
           <div className="p-4 border-t">
              <Form {...replyForm}>
                <form
                  onSubmit={replyForm.handleSubmit(handleReply)}
                  className="flex gap-2"
                >
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                           <Smile className="h-5 w-5" />
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1 border-none shadow-none bg-transparent mb-2">
                          <div className="grid grid-cols-10 gap-0.5">
                              {EMOJIS.map(emoji => (
                                  <button key={emoji} type="button" onClick={() => handleEmojiSelect(emoji)} className="text-xl p-0.5 rounded-md hover:bg-muted transition-colors">
                                      {emoji}
                                  </button>
                              ))}
                          </div>
                      </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => replyForm.setValue('attachment', e.target.files?.[0])} />

                  <FormField
                    control={replyForm.control}
                    name="replyMessage"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input placeholder="Type your message..." {...field} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
        )}
      </div>
    </div>
  );
}

    