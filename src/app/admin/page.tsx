
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
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft, Phone, Video, Smile, Paperclip, Check, CheckCheck, PlusCircle, Users, UserPlus } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  where,
  getDoc,
  query,
  orderBy,
  Timestamp,
  collectionGroup,
  getDocs
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- New Data Model Types ---
type UserProfile = {
    id: string; // UID
    username: string;
    email: string;
    displayName: string;
    profilePictureUrl?: string;
    lastOnlineAt: Timestamp;
}

type Chat = {
    id: string;
    createdAt: Timestamp;
    type: 'private' | 'group';
    name?: string;
    description?: string;
    lastMessageId?: string;
    // For UI purposes
    otherMember?: UserProfile; 
    lastMessage?: Message;
    unreadCount?: number;
}

type Message = {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    createdAt: Timestamp | Date;
    type: 'text' | 'image' | 'video';
    imageUrl?: string;
    replyToMessageId?: string;
    // For UI
    sender?: UserProfile;
    reactions?: Reaction[];
}

type ChatMembership = {
    id: string; // {chatId}_{userId}
    chatId: string;
    userId: string;
    joinedAt: Timestamp;
    role: 'member' | 'admin';
    lastReadMessageId?: string;
}

type Reaction = {
    id: string;
    messageId: string;
    chatId: string;
    userId: string;
    emoji: string;
    createdAt: Timestamp;
}


const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.').optional(),
  attachment: z.instanceof(File).optional(),
});

const createChatSchema = z.object({
  name: z.string().min(1, 'Group name cannot be empty.').optional(),
  type: z.enum(['private', 'group']),
  members: z.array(z.string()).min(1, 'Select at least one member.'),
});

const EMOJIS = ['😀', '👍', '❤️', '😂', '😯', '😢', '😡'];

export default function ChatPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isChatModalOpen, setChatModalOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auth Check ---
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
        router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- Data Fetching ---

  // 1. Fetch user's chat memberships
  const membershipsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatMemberships'), where('userId', '==', user.uid));
  }, [firestore, user]);
  const { data: memberships } = useCollection<ChatMembership>(membershipsQuery);

  // 2. Fetch full chat data based on memberships
  useEffect(() => {
    if (!memberships || !firestore || !user) return;
    setIsChatsLoading(true);

    const fetchChatDetails = async () => {
        const chatPromises = memberships.map(async (membership) => {
            const chatDoc = await getDoc(doc(firestore, 'chats', membership.chatId));
            if (!chatDoc.exists()) return null;

            let chatData: Chat = { id: chatDoc.id, ...chatDoc.data() } as Chat;

            // If it's a private chat, find the other member
            if (chatData.type === 'private') {
                const membersSnapshot = await getDocs(query(collection(firestore, 'chatMemberships'), where('chatId', '==', chatData.id)));
                const otherMemberDoc = membersSnapshot.docs.find(d => d.data().userId !== user.uid);
                if (otherMemberDoc) {
                    const userDoc = await getDoc(doc(firestore, 'users', otherMemberDoc.data().userId));
                    if(userDoc.exists()) {
                       chatData.otherMember = { id: userDoc.id, ...userDoc.data() } as UserProfile;
                    }
                }
            }
            // Fetch last message for display
            if(chatData.lastMessageId) {
                const lastMessageDoc = await getDoc(doc(firestore, `chats/${chatData.id}/messages/${chatData.lastMessageId}`));
                if (lastMessageDoc.exists()) {
                    chatData.lastMessage = { id: lastMessageDoc.id, ...lastMessageDoc.data() } as Message;
                }
            }

            return chatData;
        });

        const resolvedChats = (await Promise.all(chatPromises)).filter(c => c !== null) as Chat[];
        setChats(resolvedChats);
        setIsChatsLoading(false);
    }
    fetchChatDetails();

  }, [memberships, firestore, user]);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  // 3. Fetch messages for the selected chat
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedChatId) return null;
    return query(collection(firestore, `chats/${selectedChatId}/messages`), orderBy('createdAt', 'asc'));
  }, [firestore, selectedChatId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  
  // --- Forms ---
  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });
  
  const createChatForm = useForm<z.infer<typeof createChatSchema>>({
    resolver: zodResolver(createChatSchema),
    defaultValues: { name: '', type: 'group', members: [] },
  });

  // --- Actions ---
  async function handleSendMessage(values: z.infer<typeof messageSchema>) {
    if (!firestore || !user || !selectedChatId) return;
    if (!values.content && !values.attachment) return;

    const messagesColRef = collection(firestore, `chats/${selectedChatId}/messages`);
    const messageDocRef = doc(messagesColRef); // Auto-generate ID

    const messageData: Omit<Message, 'id' | 'createdAt' | 'reactions'> = {
        chatId: selectedChatId,
        senderId: user.uid,
        content: values.content || '',
        type: values.attachment ? 'image' : 'text',
    };

    if (values.attachment) {
      const storage = getStorage();
      const filePath = `attachments/${selectedChatId}/${Date.now()}_${values.attachment.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, values.attachment);
      messageData.imageUrl = await getDownloadURL(fileRef);
    }
    
    messageForm.reset();

    try {
      const batch = writeBatch(firestore);
      batch.set(messageDocRef, { ...messageData, createdAt: serverTimestamp() });
      batch.update(doc(firestore, 'chats', selectedChatId), { lastMessageId: messageDocRef.id });
      await batch.commit();

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Message Failed', description: e.message });
    }
  }
  
  async function handleCreateChat(values: z.infer<typeof createChatSchema>) {
    if (!firestore || !user) return;
    try {
        const batch = writeBatch(firestore);

        // 1. Create the chat document
        const chatRef = doc(collection(firestore, 'chats'));
        batch.set(chatRef, {
            name: values.name,
            type: values.type,
            createdAt: serverTimestamp(),
            description: '',
        });

        // 2. Add current user as a member (and admin)
        const currentUserMembershipRef = doc(firestore, 'chatMemberships', `${chatRef.id}_${user.uid}`);
        batch.set(currentUserMembershipRef, {
            chatId: chatRef.id,
            userId: user.uid,
            role: 'admin',
            joinedAt: serverTimestamp()
        });

        // 3. Add other members
        values.members.forEach(memberId => {
            const memberRef = doc(firestore, 'chatMemberships', `${chatRef.id}_${memberId}`);
            batch.set(memberRef, {
                chatId: chatRef.id,
                userId: memberId,
                role: 'member',
                joinedAt: serverTimestamp()
            });
        });

        await batch.commit();
        toast({ title: "Chat Created", description: `Chat "${values.name}" has been created.` });
        setChatModalOpen(false);
        createChatForm.reset();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Chat Creation Failed', description: e.message });
    }
}

  const handleReaction = async (messageId: string, emoji: string) => {
      // This is more complex with the new model and would require fetching reactions
      // and checking if the user already reacted. For brevity, this is simplified.
      if (!firestore || !user || !selectedChatId) return;

      const reactionData: Omit<Reaction, 'id' | 'createdAt'> = {
          messageId,
          chatId: selectedChatId,
          userId: user.uid,
          emoji,
      };
      
      // In a real app, you'd query to see if a reaction from this user with this emoji exists and delete it,
      // or delete other reactions from the same user on the same message before adding a new one.
      await addDoc(collection(firestore, 'reactions'), { ...reactionData, createdAt: serverTimestamp() });
  };
  
  // All users for the "create chat" modal
  const { data: allUsers } = useCollection<UserProfile>(query(collection(firestore, 'users')));

  // --- UI & Render ---
  const getSentAtDate = (sentAt: Message['createdAt']) => {
    if (!sentAt) return new Date();
    return sentAt instanceof Timestamp ? sentAt.toDate() : sentAt;
  };
  
  useEffect(() => {
    if (messages) {
      setTimeout(() => scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]')?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  }, [messages]);

  if (isUserLoading || !user) {
    return <div className="container mx-auto flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const showFeatureComingSoon = () => toast({ title: 'Feature Coming Soon' });

  return (
    <section id="admin" className="h-screen w-full p-4 md:p-8">
      <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm flex overflow-hidden">
        <div className={cn('w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out flex flex-col', selectedChatId && 'hidden md:flex')}>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Chats</h2>
            <Dialog open={isChatModalOpen} onOpenChange={setChatModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Create New Chat"><PlusCircle className="w-5 h-5"/></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Chat</DialogTitle>
                    </DialogHeader>
                     <Form {...createChatForm}>
                        <form onSubmit={createChatForm.handleSubmit(handleCreateChat)} className="space-y-4">
                            <FormField control={createChatForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group Name</FormLabel>
                                    <FormControl><Input placeholder="Enter group name..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                             )} />
                            <FormField control={createChatForm.control} name="members" render={() => (
                                <FormItem>
                                    <FormLabel>Members</FormLabel>
                                    <ScrollArea className="h-48 border rounded-md p-2">
                                        {allUsers?.filter(u => u.id !== user.uid).map((u) => (
                                            <FormField key={u.id} control={createChatForm.control} name="members" render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted rounded-md">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(u.id)}
                                                            onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), u.id]) : field.onChange(field.value?.filter(v => v !== u.id))}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal w-full cursor-pointer">{u.displayName} ({u.email})</FormLabel>
                                                </FormItem>
                                            )} />
                                        ))}
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={createChatForm.formState.isSubmitting}>Create Chat</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
              {isChatsLoading && <p className="p-4 text-muted-foreground">Loading chats...</p>}
              {!isChatsLoading && chats.length === 0 && <p className="p-4 text-muted-foreground">No chats yet. Create one!</p>}
              {chats.map(chat => {
                const displayName = chat.type === 'private' ? chat.otherMember?.displayName : chat.name;
                const displayImage = chat.type === 'private' ? chat.otherMember?.profilePictureUrl : undefined;
                const lastMsgText = chat.lastMessage?.type === 'image' ? 'Image' : chat.lastMessage?.content;

                return (
                  <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={cn('w-full text-left p-4 border-b hover:bg-muted/50 transition-colors duration-200', selectedChatId === chat.id && 'bg-muted')}>
                    <div className="flex justify-between items-start">
                        <div className="flex-1 overflow-hidden flex items-center gap-3">
                           <Avatar>
                             <AvatarImage src={displayImage} />
                             <AvatarFallback>{displayName?.charAt(0) || '?'}</AvatarFallback>
                           </Avatar>
                            <div>
                                <span className="font-semibold block truncate">{displayName}</span>
                                 <p className="text-sm text-muted-foreground truncate mt-1">{lastMsgText || 'No messages yet'}</p>
                            </div>
                        </div>
                    </div>
                  </button>
                )
              })}
          </ScrollArea>
        </div>

        <div className={cn('w-full md:w-2/3 flex flex-col', !selectedChatId && 'hidden md:flex')}>
          {selectedChat ? (
            <>
              <div className="p-4 border-b flex items-center gap-4">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChatId(null)}><ArrowLeft className="w-4 h-4" /></Button>
                 <Avatar>
                    <AvatarImage src={selectedChat.type === 'private' ? selectedChat.otherMember?.profilePictureUrl : undefined} />
                    <AvatarFallback>{(selectedChat.type === 'private' ? selectedChat.otherMember?.displayName : selectedChat.name)?.charAt(0) || '?'}</AvatarFallback>
                 </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedChat.type === 'private' ? selectedChat.otherMember?.displayName : selectedChat.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={showFeatureComingSoon}><Phone className="w-5 h-5 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" onClick={showFeatureComingSoon}><Video className="w-5 h-5 text-muted-foreground" /></Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}>
                 <div className="space-y-1">
                  {isLoadingMessages && <p>Loading messages...</p>}
                  {messages?.map((msg, index) => (
                    <div key={`${msg.id}-${index}`} className={cn("flex items-end gap-2.5 group", msg.senderId === user.uid && 'justify-end')}>
                       <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.senderId === user.uid && 'items-end')}>
                         <div className={cn("relative leading-1.5 p-2 rounded-xl", msg.senderId === user.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none shadow-sm')}>
                            {msg.imageUrl && <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-md mb-2" />}
                            {msg.content && <p className="text-sm font-normal px-1">{msg.content}</p>}
                            <div className="text-xs text-muted-foreground/80 flex items-center justify-end gap-1 mt-1">
                                <span>{msg.createdAt ? format(getSentAtDate(msg.createdAt), 'p') : ''}</span>
                            </div>
                         </div>
                       </div>
                       <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><Smile className="w-4 h-4" /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" align="end">
                                <div className="grid grid-cols-4 gap-1">
                                    {EMOJIS.map(emoji => <button key={emoji} type="button" onClick={() => handleReaction(msg.id, emoji)} className="text-lg p-1 rounded-md hover:bg-muted">{emoji}</button>)}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex gap-2">
                    <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => messageForm.setValue('attachment', e.target.files?.[0])} />
                    <FormField control={messageForm.control} name="content" render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl><Input placeholder="Type your message..." {...field} autoComplete="off" /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )}/>
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting}><Send className="h-4 w-4" /></Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Select a chat to start messaging</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
