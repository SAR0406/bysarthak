
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { Send, ArrowLeft, Phone, Video, Smile, Paperclip, Check, CheckCheck } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, isToday } from 'date-fns';
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

const ADMIN_EMAIL = 'sarthak040624@gmail.com';
const ADMIN_NAME = 'Sarthak';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳',
  '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭',
  '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '❤️', '😂', '😮', '😢', '🙏'
];


export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !selectedConversationId) return null;
    return doc(firestore, 'conversations', selectedConversationId);
  }, [firestore, selectedConversationId]);
  
  const { data: selectedConversation } = useDoc<Conversation>(conversationRef);

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
    if (!firestore || !user || !selectedConversationId) return;

    const conversationRef = doc(firestore, 'conversations', selectedConversationId);
    let imageUrl: string | undefined = undefined;

    if (values.attachment) {
      const storage = getStorage();
      const filePath = `attachments/${selectedConversationId}/${Date.now()}_${values.attachment.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, values.attachment);
      imageUrl = await getDownloadURL(fileRef);
    }

    if (!values.replyMessage && !imageUrl) {
        replyForm.reset();
        return;
    }

    const replyData = {
      id: uuidv4(),
      text: values.replyMessage,
      imageUrl,
      sentAt: new Date(),
      sentBy: 'admin' as const,
      senderName: ADMIN_NAME,
      senderEmail: user.email!,
      readBy: {},
    };

    replyForm.reset();

    try {
      await updateDoc(conversationRef, {
        messages: arrayUnion(replyData),
        lastMessageAt: serverTimestamp(),
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Reply Failed',
        description: e.message || "Could not send reply. Please try again.",
      });
    }
  }

  const markMessagesAsRead = useCallback(async () => {
    if (!firestore || !selectedConversation || !user) return;

    const unreadMessages = selectedConversation.messages.filter(
      (msg) => msg.sentBy === 'visitor' && (!msg.readBy || !msg.readBy[user.email!])
    );

    if (unreadMessages.length === 0) return;

    const batch = writeBatch(firestore);
    const conversationRef = doc(firestore, 'conversations', selectedConversation.id);
    const updatedMessages = selectedConversation.messages.map((msg) => {
        if (unreadMessages.some(unread => unread.id === msg.id)) {
            return { ...msg, readBy: { ...msg.readBy, [user.email!]: Timestamp.now() } };
        }
        return msg;
    });

    batch.update(conversationRef, { messages: updatedMessages });
    await batch.commit();
  }, [firestore, selectedConversation, user]);

  useEffect(() => {
    if (selectedConversation) {
      markMessagesAsRead();
    }
  }, [selectedConversation, markMessagesAsRead]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  };

  useEffect(() => {
    // Scroll to bottom when a new message is added or conversation changes
    if (selectedConversation) {
      setTimeout(scrollToBottom, 50);
    }
  }, [selectedConversation?.messages]);

  const getSentAtDate = (sentAt: Message['sentAt']) => {
    if (!sentAt) return new Date();
    if (sentAt instanceof Timestamp) {
      return sentAt.toDate();
    }
    return sentAt;
  };
  
  const formatListTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'p');
    }
    return format(date, 'P');
  };

  const formatMessageTimestamp = (date: Date) => {
      return format(date, 'p');
  };
  
  const lastMessage = (convo: Conversation) => {
    if (!convo.messages || convo.messages.length === 0) return { text: "No messages yet", sentAt: convo.lastMessageAt };
    return convo.messages[convo.messages.length - 1];
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
    const currentMessage = replyForm.getValues('replyMessage') || '';
    replyForm.setValue('replyMessage', currentMessage + emoji);
  };

  const MessageStatus = ({ message }: { message: Message }) => {
    if (message.sentBy !== 'admin' || !selectedConversation) return null;
    const hasBeenRead = Object.keys(message.readBy || {}).includes(selectedConversation.senderEmail);

    if (hasBeenRead) {
      return <CheckCheck className="h-4 w-4 text-blue-500 inline" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground inline" />;
  };

  return (
    <section id="admin" className="h-screen w-full p-4 md:p-8">
      <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm flex overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div
          className={cn(
            'w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out flex flex-col',
            selectedConversationId && 'hidden md:flex'
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
                    onClick={() => setSelectedConversationId(convo.id)}
                    className={cn(
                      'w-full text-left p-4 border-b hover:bg-muted/50 transition-colors duration-200',
                      selectedConversationId === convo.id && 'bg-muted'
                    )}
                  >
                    <div className="flex justify-between items-start">
                        <div className="flex-1 overflow-hidden flex items-center gap-2">
                           <Avatar>
                             <AvatarFallback>{convo.senderName.charAt(0)}</AvatarFallback>
                           </Avatar>
                            <div>
                                <span className="font-semibold block truncate">{convo.senderName}</span>
                                <span className="text-xs text-muted-foreground block truncate">{convo.senderEmail}</span>
                            </div>
                        </div>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {latestMsg.sentAt ? formatListTimestamp(getSentAtDate(latestMsg.sentAt)) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1 pl-12">{latestMsg.text || 'Image'}</p>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Chat View */}
        <div className={cn('w-full md:w-2/3 flex flex-col', !selectedConversationId && 'hidden md:flex')}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center gap-4">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversationId(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar>
                  <AvatarFallback>{selectedConversation.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedConversation.senderName}</h3>
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

              <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {selectedConversation.messages?.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-2 group", msg.sentBy === 'admin' && 'justify-end')}>
                       <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.sentBy === 'admin' && 'items-end')}>
                         <div className={cn("relative leading-1.5 p-2 rounded-xl", msg.sentBy === 'admin' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none shadow-sm')}>
                            {msg.imageUrl && (
                                <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-md mb-2" />
                            )}
                            {msg.text && <p className="text-sm font-normal px-1 pb-2">{msg.text}</p>}
                            
                            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground/80 flex items-center gap-1">
                                {msg.sentBy === 'admin' && <MessageStatus message={msg} />}
                                <span>{msg.sentAt ? formatMessageTimestamp(getSentAtDate(msg.sentAt)) : ''}</span>
                            </div>
                         </div>
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

    