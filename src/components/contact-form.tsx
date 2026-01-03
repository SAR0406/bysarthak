
'use client';

import { useState, useRef, useEffect } from 'react';
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
import {
  serverTimestamp,
  doc,
  setDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Phone, Video, Smile } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isThisYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';


const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type UserDetails = {
    name: string;
    email: string;
}

type ChatMessage = {
    text: string;
    sentAt: Date | Timestamp;
    sentBy: 'visitor' | 'admin';
    senderName: string;
    senderEmail: string;
};

type Conversation = {
    messages: ChatMessage[];
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳',
  '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
  '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '❤️'
];


export function ContactForm() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
  });
  
  // Effect to initialize user details for both logged-in and guest users
  useEffect(() => {
    if (isUserLoading || hasInitialized.current) return;

    let sessionDetails: UserDetails;
    if (user) {
        // User is logged in
        sessionDetails = {
            name: user.displayName || 'Authenticated User',
            email: user.email!,
        };
    } else {
        // User is a guest, create a guest identity
        const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
        sessionDetails = {
            name: `Visitor ${guestId.slice(-3)}`,
            email: `${guestId}@guest.com`,
        };
    }
    setUserDetails(sessionDetails);
    hasInitialized.current = true;
    
  }, [user, isUserLoading]);


  const conversationRef = useMemoFirebase(() => {
    // Only create a ref if we have userDetails (from either a logged-in user or guest)
    if (!firestore || !userDetails?.email) return null;
    return doc(firestore, 'conversations', userDetails.email);
  }, [firestore, userDetails?.email]);
  
  const { data: conversationData, isLoading: isHistoryLoading } = useDoc<Conversation>(conversationRef);

  useEffect(() => {
    // This effect now runs whenever conversation history loads or when userDetails are set for the first time
    if (userDetails && messages.length === 0) {
        const historyMessages = conversationData?.messages || [];
        const initialMessages = historyMessages.length > 0 ? historyMessages : [{
            text: `Hi ${userDetails.name}! How can I help you today?`,
            sentAt: new Date(),
            sentBy: 'admin' as const,
            senderName: 'Sarthak',
            senderEmail: 'sarthak040624@gmail.com',
        }];

        setMessages(initialMessages.sort((a, b) => getSentAtDate(a.sentAt).getTime() - getSentAtDate(b.sentAt).getTime()));
    }
  }, [conversationData, userDetails, messages.length]);


  const handleMessageSubmit = async (values: z.infer<typeof messageSchema>) => {
    if (!firestore || !userDetails) return;

    const newMessagePayload: ChatMessage = {
        senderName: userDetails.name,
        senderEmail: userDetails.email,
        text: values.message,
        sentAt: new Date(),
        sentBy: 'visitor' as const,
    };
    
    setMessages(prev => [...prev, newMessagePayload]);
    messageForm.reset();
    
    const convRef = doc(firestore, 'conversations', userDetails.email);
    
    const conversationPayload = {
        senderName: userDetails.name,
        senderEmail: userDetails.email,
        lastMessageAt: serverTimestamp(),
        messages: arrayUnion(newMessagePayload),
    };

    setDoc(convRef, conversationPayload, { merge: true })
      .catch(error => {
          setMessages(prev => prev.slice(0, -1));
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: convRef.path,
              operation: 'write',
              requestResourceData: conversationPayload,
          }));
      });
  };

  const getSentAtDate = (sentAt: ChatMessage['sentAt']) => {
    if (!sentAt) return new Date();
    if (sentAt instanceof Timestamp) {
      return sentAt.toDate();
    }
    return sentAt;
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
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages]);

  const showChat = !!userDetails;

  const showFeatureComingSoon = () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Voice and video call functionality will be added in a future update.',
    });
  };
  
  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = messageForm.getValues('message');
    messageForm.setValue('message', currentMessage + emoji);
  }

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <Card className="w-full shadow-2xl shadow-primary/10">
        <AnimatePresence mode="wait">
           <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-[500px]"
            >
              <div className="p-4 border-b flex items-center">
                  <div className='flex-1'>
                    <h3 className="font-semibold text-center">Chat with Sarthak</h3>
                    {userDetails && <p className="text-xs text-muted-foreground text-center">{userDetails.name}</p>}
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
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                 <div className="space-y-4">
                    {(isHistoryLoading || isUserLoading || !showChat) && messages.length === 0 && (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-muted-foreground">Loading...</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-end gap-2.5", msg.sentBy === 'visitor' && 'justify-end')}>
                           <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.sentBy === 'visitor' && 'items-end')}>
                             <div className={cn("leading-1.5 p-3 border-gray-200", msg.sentBy === 'visitor' ? 'bg-primary text-primary-foreground rounded-s-xl rounded-ee-xl' : 'bg-muted rounded-e-xl rounded-es-xl')}>
                                 <p className="text-sm font-normal">{msg.text}</p>
                             </div>
                             <span className="text-xs font-normal text-muted-foreground">{msg.sentAt ? formatMessageTimestamp(getSentAtDate(msg.sentAt)) : ''}</span>
                           </div>
                        </div>
                    ))}
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
                           <Button variant="ghost" size="icon">
                             <Smile className="h-5 w-5" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 border-none">
                            <div className="grid grid-cols-8 gap-1">
                                {EMOJIS.map(emoji => (
                                    <button key={emoji} type="button" onClick={() => handleEmojiSelect(emoji)} className="text-xl p-1 rounded-md hover:bg-muted transition-colors">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <FormField
                      control={messageForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input placeholder="Type your message..." {...field} autoComplete="off" disabled={!showChat} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting || !showChat}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </div>
            </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
