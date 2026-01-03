
'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import { Send, ArrowLeft, Phone, Video, Smile } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, isToday, isThisYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Reply cannot be empty.'),
});

type Message = {
  text: string;
  sentAt: Timestamp | Date;
  sentBy: 'admin' | 'visitor';
  senderName: string;
  senderEmail: string;
};

type Conversation = {
  id: string;
  senderName: string;
  senderEmail: string;
  lastMessageAt: Timestamp;
  messages: Message[];
};

const ADMIN_EMAIL = 'sarthak040624@gmail.com';

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

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.email !== ADMIN_EMAIL) {
        toast({
          variant: 'destructive',
          title: 'Unauthorized',
          description: 'You do not have permission to access this page.',
        });
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isUserLoading, router, toast]);

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, 'conversations'), orderBy('lastMessageAt', 'desc'));
  }, [firestore, isAuthorized]);

  const { data: conversations, isLoading } = useCollection<Conversation>(conversationsQuery);

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !selectedConversation || user.email !== ADMIN_EMAIL) return;
    
    const conversationRef = doc(firestore, 'conversations', selectedConversation.id);

    const replyData = {
      text: values.replyMessage,
      sentAt: new Date(),
      sentBy: 'admin' as const,
      senderName: 'Sarthak', // Hardcoded admin name
      senderEmail: user.email,
    };

    // Optimistic UI update
    const updatedMessages = [...(selectedConversation.messages || []), replyData] as Message[];
    const previousConversationState = selectedConversation;

    setSelectedConversation({
      ...selectedConversation,
      messages: updatedMessages,
      lastMessageAt: Timestamp.now(), // Visually update timestamp
    });
    replyForm.reset();

    try {
      // Asynchronously update Firestore
      await updateDoc(conversationRef, {
        messages: arrayUnion(replyData),
        lastMessageAt: serverTimestamp(),
      });
    } catch (e: any) {
      // Revert UI on failure
      setSelectedConversation(previousConversationState);
      toast({
        variant: 'destructive',
        title: 'Reply Failed',
        description: e.message || "Could not send reply. Please try again.",
      });
    }
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      // Allow the DOM to update before scrolling
      setTimeout(scrollToBottom, 0);
    }
  }, [selectedConversation?.messages, selectedConversation]);
  
  const lastMessage = (convo: Conversation) => {
    if (!convo.messages || convo.messages.length === 0) return { text: "No messages yet", sentAt: convo.lastMessageAt };
    return convo.messages[convo.messages.length - 1];
  }

  const getSentAtDate = (sentAt: Message['sentAt']) => {
    if (!sentAt) return new Date();
    if (sentAt instanceof Timestamp) {
      return sentAt.toDate();
    }
    return sentAt;
  }
  
  const formatListTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'p'); // e.g., 4:30 PM
    }
    return format(date, 'P'); // e.g., 06/28/2024
  }

  const formatMessageTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'p'); // e.g., 4:30 PM
    }
    if (isThisYear(date)) {
      return format(date, 'MMM d, p'); // e.g., Jun 28, 4:30 PM
    }
    return format(date, 'P, p'); // e.g., 06/28/2023, 4:30 PM
  };


  if (isUserLoading || !isAuthorized) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const showFeatureComingSoon = () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Voice and video call functionality will be added in a future update.',
    });
  };
  
  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = replyForm.getValues('replyMessage');
    replyForm.setValue('replyMessage', currentMessage + emoji);
  }

  return (
    <section id="admin" className="h-screen w-full p-4 md:p-8">
      <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm flex overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div
          className={cn(
            'w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out flex flex-col',
            selectedConversation && 'hidden md:flex'
          )}
        >
          <div className="p-4 border-b">
            <h2 className="font-headline text-xl font-bold">Messages</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {isLoading && <p className="p-4">Loading messages...</p>}
              {!isLoading && (!conversations || conversations.length === 0) && (
                <p className="p-4 text-muted-foreground">No messages yet.</p>
              )}
              {conversations?.map(convo => {
                const latestMsg = lastMessage(convo);
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo)}
                    className={cn(
                      'w-full text-left p-4 border-b hover:bg-muted/50 transition-colors duration-200',
                      selectedConversation?.id === convo.id && 'bg-muted'
                    )}
                  >
                    <div className="flex justify-between items-start">
                        <div className="flex-1 overflow-hidden">
                            <span className="font-semibold block truncate">{convo.senderName}</span>
                            <span className="text-xs text-muted-foreground block truncate">{convo.senderEmail}</span>
                        </div>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {latestMsg.sentAt ? formatListTimestamp(getSentAtDate(latestMsg.sentAt)) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">{latestMsg.text}</p>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Chat View */}
        <div className={cn('w-full md:w-2/3 flex flex-col', !selectedConversation && 'hidden md:flex')}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center gap-4">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar>
                  <AvatarFallback>{selectedConversation.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedConversation.senderName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedConversation.senderEmail}</p>
                </div>
                <div className="flex items-center gap-2">
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
                  {selectedConversation.messages?.map((msg, index) => (
                    <div key={index} className={cn("flex items-end gap-2.5", msg.sentBy === 'admin' && 'justify-end')}>
                       <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.sentBy === 'admin' && 'items-end')}>
                         <div className="flex items-center space-x-2 rtl:space-x-reverse">
                             <span className="text-sm font-semibold text-card-foreground">{msg.senderName}</span>
                         </div>
                         <div className={cn("leading-1.5 p-3 border-gray-200", msg.sentBy === 'admin' ? 'bg-primary text-primary-foreground rounded-s-xl rounded-ee-xl' : 'bg-muted rounded-e-xl rounded-es-xl')}>
                             <p className="text-sm font-normal">{msg.text}</p>
                         </div>
                         <span className="text-xs font-normal text-muted-foreground">{msg.sentAt ? formatMessageTimestamp(getSentAtDate(msg.sentAt)) : ''}</span>
                       </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
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
                        <PopoverContent className="w-auto p-1 border-none shadow-none bg-transparent">
                            <div className="grid grid-cols-10 gap-0.5">
                                {EMOJIS.map(emoji => (
                                    <button key={emoji} type="button" onClick={() => handleEmojiSelect(emoji)} className="text-xl p-0.5 rounded-md hover:bg-muted transition-colors">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <FormField
                      control={replyForm.control}
                      name="replyMessage"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input placeholder="Type your reply..." {...field} autoComplete="off" />
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a message to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
