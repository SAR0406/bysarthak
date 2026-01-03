
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore, errorEmitter, FirestorePermissionError, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Send, Phone, Video, Smile, Paperclip, Check, CheckCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isThisYear, isWithinInterval, subMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import Link from 'next/link';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.').optional(),
  attachment: z.instanceof(File).optional(),
});

type UserDetails = {
  name: string;
  email: string;
};

type Reaction = { [key: string]: string }; // userEmail: emoji

type ChatMessage = {
  id: string;
  text?: string;
  imageUrl?: string;
  sentAt: Date | Timestamp;
  sentBy: 'visitor' | 'admin';
  senderName: string;
  senderEmail: string;
  readBy: { [key: string]: Timestamp };
  reactions: Reaction;
};

type Presence = {
  visitor?: Timestamp;
  admin?: Timestamp;
}

type Typing = {
  visitor?: boolean;
  admin?: boolean;
}

type Conversation = {
  messages: ChatMessage[];
  presence?: Presence;
  typing?: Typing;
};

const ADMIN_NAME = 'Sarthak';
const ADMIN_EMAIL = 'sarthak040624@gmail.com';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳',
  '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
  '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', ...REACTION_EMOJIS
];


export function ContactForm() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && !isUserLoading) {
      setUserDetails({
        name: user.displayName || 'Authenticated User',
        email: user.email!,
      });
    } else {
      setUserDetails(null);
    }
  }, [user, isUserLoading]);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !userDetails?.email) return null;
    return doc(firestore, 'conversations', userDetails.email);
  }, [firestore, userDetails?.email]);
  
  const getSentAtDate = (sentAt: ChatMessage['sentAt']) => {
    if (!sentAt) return new Date();
    if (sentAt instanceof Timestamp) {
      return sentAt.toDate();
    }
    return sentAt;
  };

  const { data: conversationData, isLoading: isHistoryLoading } = useDoc<Conversation>(conversationRef);

  const messages = conversationData?.messages?.sort((a, b) => getSentAtDate(a.sentAt).getTime() - getSentAtDate(b.sentAt).getTime()) || [];

  const handleSetTyping = useCallback((isTyping: boolean) => {
     if (!conversationRef) return;
      updateDoc(conversationRef, { "typing.visitor": isTyping });
  }, [conversationRef]);
  
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSetTyping(true);
    if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleSetTyping(false);
    }, 2000);
  }

  // --- Presence Management ---
  useEffect(() => {
    if (!conversationRef) return;

    const updatePresence = () => {
      updateDoc(conversationRef, {
        "presence.visitor": serverTimestamp(),
      });
    };
    updatePresence(); // Initial update
    const interval = setInterval(updatePresence, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [conversationRef]);

  const isAdminOnline = () => {
    if (!conversationData?.presence?.admin) return false;
    const lastSeen = conversationData.presence.admin.toDate();
    return isWithinInterval(lastSeen, { start: subMinutes(new Date(), 2), end: new Date() });
  };
  // -------------------------

  const markMessagesAsRead = useCallback(async () => {
    if (!firestore || !conversationData || !userDetails) return;

    const unreadMessages = conversationData.messages.filter(
      (msg) => msg.sentBy === 'admin' && !msg.readBy[userDetails.email!]
    );

    if (unreadMessages.length === 0) return;

    const batch = writeBatch(firestore);
    const updatedMessages = conversationData.messages.map((msg) => {
        if (unreadMessages.some(unread => unread.id === msg.id)) {
            return { ...msg, readBy: { ...msg.readBy, [userDetails.email!]: Timestamp.now() } };
        }
        return msg;
    });

    batch.update(conversationRef!, { messages: updatedMessages });
    await batch.commit();
  }, [firestore, conversationData, userDetails, conversationRef]);

  useEffect(() => {
    if (conversationData && userDetails) {
      markMessagesAsRead();
    }
  }, [conversationData, userDetails, markMessagesAsRead]);

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
  });

  const handleMessageSubmit = async (values: z.infer<typeof messageSchema>) => {
    if (!firestore || !userDetails || !conversationRef) return;

    handleSetTyping(false);
    if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    let imageUrl: string | undefined = undefined;

    if (values.attachment) {
        const storage = getStorage();
        const filePath = `attachments/${userDetails.email}/${Date.now()}_${values.attachment.name}`;
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, values.attachment);
        imageUrl = await getDownloadURL(fileRef);
    }

    if (!values.message && !imageUrl) {
        messageForm.reset();
        return;
    }

    const newMessagePayload: Omit<ChatMessage, 'id'> & {id?: string} = {
      id: uuidv4(),
      senderName: userDetails.name,
      senderEmail: userDetails.email,
      text: values.message,
      imageUrl,
      sentAt: new Date(),
      sentBy: 'visitor' as const,
      readBy: {},
      reactions: {},
    };

    messageForm.reset();

    const conversationPayload = {
      senderName: userDetails.name,
      senderEmail: userDetails.email,
      lastMessageAt: serverTimestamp(),
      messages: arrayUnion(newMessagePayload),
    };

    setDoc(conversationRef, conversationPayload, { merge: true }).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: conversationRef.path,
        operation: 'write',
        requestResourceData: conversationPayload,
      }));
    });
  };

  const formatMessageTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'p');
    }
    if (isThisYear(date)) {
      return format(date, 'MMM d, p');
    }
    return format(date, 'P, p');
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableView) {
        setTimeout(() => scrollableView.scrollTop = scrollableView.scrollHeight, 50);
      }
    }
  }, [messages]);


  const showFeatureComingSoon = () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Voice and video call functionality will be added in a future update.',
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = messageForm.getValues('message') || '';
    messageForm.setValue('message', currentMessage + emoji);
  };
  
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!firestore || !userDetails || !conversationData || !conversationRef) return;

    const messageIndex = conversationData.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = conversationData.messages[messageIndex];
    const newReactions = { ...message.reactions };

    if (newReactions[userDetails.email] === emoji) {
      delete newReactions[userDetails.email]; // Toggle off reaction
    } else {
      newReactions[userDetails.email] = emoji; // Add/change reaction
    }
    
    const updatedMessages = [...conversationData.messages];
    updatedMessages[messageIndex] = { ...message, reactions: newReactions };
    
    await updateDoc(conversationRef, { messages: updatedMessages });
  };

  const MessageStatus = ({ message }: { message: ChatMessage }) => {
    if (message.sentBy !== 'visitor') return null;
    const hasBeenRead = Object.keys(message.readBy).includes(ADMIN_EMAIL);

    if (hasBeenRead) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground" />;
  };

  const initialWelcomeMessage = userDetails ? [{
        id: 'welcome-message',
        text: `Hi ${userDetails.name}! How can I help you today?`,
        sentAt: new Date(),
        sentBy: 'admin' as const,
        senderName: ADMIN_NAME,
        senderEmail: ADMIN_EMAIL,
        readBy: {},
        reactions: {},
    }] : [];

  const displayedMessages = messages.length > 0 ? messages : initialWelcomeMessage;

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <Card className="w-full shadow-2xl shadow-primary/10">
        <div
          key="chat"
          className="flex flex-col h-[500px]"
        >
          <div className="p-4 border-b flex items-center">
            <div className="relative mr-4">
               <div className='flex-1'>
                    <h3 className="font-semibold text-center">{ADMIN_NAME}</h3>
               </div>
               {isAdminOnline() && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />}
            </div>
            <div className='flex-1'>
               <p className="text-xs text-muted-foreground">{conversationData?.typing?.admin ? 'typing...' : (isAdminOnline() ? 'Online' : 'Offline')}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={showFeatureComingSoon}>
                <Phone className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={showFeatureComingSoon}>
                <Video className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}>
            <div className="space-y-4">
              {(isUserLoading || (user && isHistoryLoading)) && (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Loading Chat...</p>
                </div>
              )}
              {user && displayedMessages.map((msg) => (
                <div key={msg.id} className={cn("flex items-end gap-2.5 group", msg.sentBy === 'visitor' && 'justify-end')}>
                   <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Smile className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1 bg-card shadow-lg border rounded-lg">
                            <div className="flex gap-1">
                                {REACTION_EMOJIS.map(emoji => (
                                    <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="text-xl p-1 rounded-md hover:bg-muted transition-colors">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                   <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.sentBy === 'visitor' && 'items-end')}>
                     <div className={cn("leading-1.5 p-2 border-gray-200 relative", msg.sentBy === 'visitor' ? 'bg-primary text-primary-foreground rounded-s-xl rounded-ee-xl' : 'bg-card rounded-e-xl rounded-es-xl shadow-sm')}>
                        {msg.imageUrl && (
                            <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-md mb-2" />
                        )}
                        {msg.text && <p className="text-sm font-normal px-1">{msg.text}</p>}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="absolute -bottom-3 left-2 bg-card border rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
                                {Object.values(msg.reactions).map((emoji, i) => <span key={i}>{emoji}</span>)}
                            </div>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-normal text-muted-foreground">{msg.sentAt ? formatMessageTimestamp(getSentAtDate(msg.sentAt)) : ''}</span>
                        <MessageStatus message={msg} />
                     </div>
                   </div>
                </div>
              ))}
              {!user && !isUserLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-muted-foreground mb-4">You must be logged in to start a conversation.</p>
                  <Button asChild>
                    <Link href="/login">Login to Chat</Link>
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <Form {...messageForm}>
              <form
                onSubmit={messageForm.handleSubmit(handleMessageSubmit)}
                className="flex gap-2"
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!user} className="hidden md:inline-flex">
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
                 <Button variant="ghost" size="icon" type="button" disabled={!user} onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                </Button>
                <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => messageForm.setValue('attachment', e.target.files?.[0])} />
                <FormField
                  control={messageForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input
                          placeholder="Type your message..."
                          {...field}
                          autoComplete="off"
                          disabled={!user || isUserLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            handleTypingChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting || !user || isUserLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
}
