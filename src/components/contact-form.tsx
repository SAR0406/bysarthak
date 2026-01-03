
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
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirestore, errorEmitter, FirestorePermissionError, useUser, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  setDoc,
  arrayUnion,
  type DocumentReference,
  Timestamp,
} from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Send, User, Mail, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

const userDetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
});

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type UserDetails = z.infer<typeof userDetailsSchema>;
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

export function ContactForm() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !userDetails?.email) return null;
    return doc(firestore, 'conversations', userDetails.email);
  }, [firestore, userDetails?.email]);
  
  const { data: conversationData, isLoading: isHistoryLoading } = useDoc<Conversation>(conversationRef);

  useEffect(() => {
    if (user && !isUserLoading) {
        setUserDetails({
            name: user.displayName || 'Authenticated User',
            email: user.email || '',
        });
    }
  }, [user, isUserLoading]);

  useEffect(() => {
    if (conversationData) {
        // When history loads, merge it with any messages sent before it loaded.
        setMessages(prevMessages => {
            const historyMessages = conversationData.messages || [];
            // Create a Set of existing message texts to avoid duplicates
            const existingTexts = new Set(prevMessages.map(m => m.text));
            const uniqueHistory = historyMessages.filter(h => !existingTexts.has(h.text));
            return [...uniqueHistory, ...prevMessages];
        });
    } else if (userDetails && messages.length === 0) {
        setMessages([{
            text: `Hi ${userDetails.name}! How can I help you today?`,
            sentAt: new Date(),
            sentBy: 'admin',
            senderName: 'Sarthak',
            senderEmail: 'sarthak040624@gmail.com',
        }]);
    }
  }, [conversationData, userDetails]);


  const userDetailsForm = useForm<UserDetails>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: { name: '', email: '' },
  });

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
  });

  const handleUserDetailsSubmit = (values: UserDetails) => {
    setUserDetails(values);
  };

  const handleMessageSubmit = async (values: z.infer<typeof messageSchema>) => {
    if (!firestore || !userDetails) return;

    const newMessagePayload: ChatMessage = {
        senderName: userDetails.name,
        senderEmail: userDetails.email,
        text: values.message,
        sentAt: new Date(),
        sentBy: 'visitor' as const,
    };
    
    // Optimistic UI update
    setMessages(prev => [...prev, newMessagePayload]);
    messageForm.reset();
    
    const conversationRef = doc(firestore, 'conversations', userDetails.email);
    
    const conversationData = {
        senderName: userDetails.name,
        senderEmail: userDetails.email,
        lastMessageAt: serverTimestamp(),
        messages: arrayUnion(newMessagePayload),
    };

    setDoc(conversationRef, conversationData, { merge: true })
      .catch(error => {
          setMessages(prev => prev.slice(0, -1)); // Revert optimistic UI on failure
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: conversationRef.path,
              operation: 'write', // set with merge can be create or update
              requestResourceData: conversationData,
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

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages]);

  const showUserDetailsForm = !userDetails && !isUserLoading;

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <Card className="w-full shadow-2xl shadow-primary/10">
        <AnimatePresence mode="wait">
          {showUserDetailsForm ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="p-6">
                <div className='text-center mb-4'>
                    <MessageSquare className="mx-auto h-8 w-8 text-primary" />
                    <h3 className="text-lg font-medium mt-2">Let's chat!</h3>
                    <p className="text-sm text-muted-foreground">Introduce yourself to start the conversation.</p>
                </div>
                <Form {...userDetailsForm}>
                  <form onSubmit={userDetailsForm.handleSubmit(handleUserDetailsSubmit)} className="space-y-4">
                    <FormField
                      control={userDetailsForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input placeholder="Your Name" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input placeholder="your.email@example.com" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Start Chat
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-[500px]"
            >
              <div className="p-4 border-b text-center">
                  <h3 className="font-semibold">Chat with Sarthak</h3>
                  {userDetails && <p className="text-xs text-muted-foreground">{userDetails.email}</p>}
              </div>
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                 <div className="space-y-4">
                    {isHistoryLoading && messages.length <= 1 && (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-muted-foreground">Loading history...</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2.5 ${msg.sentBy !== 'admin' ? 'justify-end' : ''}`}>
                           <div className={`flex flex-col gap-1 w-full max-w-[320px] ${msg.sentBy !== 'admin' ? 'items-end' : ''}`}>
                             <div className={`leading-1.5 p-3 border-gray-200 ${msg.sentBy !== 'admin' ? 'bg-primary text-primary-foreground rounded-s-xl rounded-ee-xl' : 'bg-muted rounded-e-xl rounded-es-xl'}`}>
                                 <p className="text-sm font-normal">{msg.text}</p>
                             </div>
                             <span className="text-xs font-normal text-muted-foreground">{new Date(getSentAtDate(msg.sentAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                    <FormField
                      control={messageForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input placeholder="Type your message..." {...field} autoComplete="off" disabled={!userDetails} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting || !userDetails}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

    