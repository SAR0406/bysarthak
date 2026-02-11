
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
import { Send, ArrowLeft, Phone, Video, Smile, Paperclip, Check, CheckCheck, PlusCircle, Users } from 'lucide-react';
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
  addDoc,
  where,
  getDoc,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Reply cannot be empty.').optional(),
  attachment: z.instanceof(File).optional(),
});

const createGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name cannot be empty.'),
  members: z.array(z.string()).min(1, 'Select at least one member.'),
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
  reactions?: { [emoji: string]: string }; // emoji: userEmail
};

type Conversation = {
  id: string;
  senderName: string;
  senderEmail: string;
  lastMessageAt: Timestamp;
  messages: Message[];
  typing?: { [key: string]: boolean };
  presence?: { [key: string]: 'online' | 'offline' };
  groupId?: string;
};

type Group = {
    id: string;
    name: string;
    members: string[]; // array of conversationIds
}

type UserProfile = {
    isAdmin?: boolean;
}

const ADMIN_NAME = 'Sarthak';

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

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // Authorize Admin
  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;
    
    if (!user) {
        router.push('/login');
        return;
    }

    if (userProfile?.isAdmin) {
        setIsAuthorized(true);
    } else {
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to access this page.' });
        router.push('/');
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router, toast]);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !selectedConversationId) return null;
    return doc(firestore, 'conversations', selectedConversationId);
  }, [firestore, selectedConversationId]);

  const { data: selectedConversation } = useDoc<Conversation>(conversationRef);
  
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, 'groups'), orderBy('name', 'asc'));
  }, [firestore, isAuthorized]);
  const { data: groups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);


  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    if (selectedGroupId) {
        return query(collection(firestore, 'conversations'), where('groupId', '==', selectedGroupId), orderBy('lastMessageAt', 'desc'));
    }
    return query(collection(firestore, 'conversations'), orderBy('lastMessageAt', 'desc'));
  }, [firestore, isAuthorized, selectedGroupId]);
  const { data: conversations, isLoading: isLoadingConversations } = useCollection<Conversation>(conversationsQuery);
  
  const allConversationsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, 'conversations'), orderBy('lastMessageAt', 'desc'));
  }, [firestore, isAuthorized]);
  const { data: allConversations } = useCollection<Conversation>(allConversationsQuery);


  const getSentAtDate = (sentAt: Message['sentAt']) => {
    if (!sentAt) return new Date();
    return sentAt instanceof Timestamp ? sentAt.toDate() : sentAt;
  };

  const displayedMessages = selectedConversation?.messages?.sort((a, b) => getSentAtDate(a.sentAt).getTime() - getSentAtDate(b.sentAt).getTime()) || [];

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });
  
  const createGroupForm = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { groupName: '', members: [] },
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

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !selectedConversationId) return;
    
    if (!values.replyMessage && !values.attachment) {
      replyForm.reset();
      return;
    }
    
    const conversationRef = doc(firestore, 'conversations', selectedConversationId);

    const replyData: Omit<Message, 'sentAt' | 'id' | 'readBy'> & { sentAt: Date, id: string, readBy: {} } = {
        id: uuidv4(),
        sentBy: 'admin' as const,
        senderName: ADMIN_NAME,
        senderEmail: user.email!,
        sentAt: new Date(),
        readBy: {},
    };

    if (values.replyMessage) {
        replyData.text = values.replyMessage;
    }
    
    if (values.attachment) {
      const storage = getStorage();
      const filePath = `attachments/${selectedConversationId}/${Date.now()}_${values.attachment.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, values.attachment);
      replyData.imageUrl = await getDownloadURL(fileRef);
    }
    
    replyForm.reset();

    try {
      await updateDoc(conversationRef, {
        messages: arrayUnion(replyData),
        lastMessageAt: serverTimestamp(),
        [`typing.${user.email}`]: false,
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reply Failed', description: e.message || "Could not send reply. Please try again." });
    }
  }
  
  async function handleCreateGroup(values: z.infer<typeof createGroupSchema>) {
    if (!firestore) return;
    try {
        const groupRef = await addDoc(collection(firestore, 'groups'), {
            name: values.groupName,
            members: values.members,
        });

        const batch = writeBatch(firestore);
        values.members.forEach(conversationId => {
            const convRef = doc(firestore, 'conversations', conversationId);
            batch.update(convRef, { groupId: groupRef.id });
        });
        await batch.commit();

        toast({ title: "Group Created", description: `Group "${values.groupName}" has been created.` });
        setGroupModalOpen(false);
        createGroupForm.reset();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Group Creation Failed', description: e.message || "Could not create group." });
    }
}

  const handleReaction = async (messageId: string, emoji: string) => {
      if (!conversationRef || !user?.email || !selectedConversation) return;

      const messageIndex = selectedConversation.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const updatedMessages = [...selectedConversation.messages];
      const message = updatedMessages[messageIndex];
      
      if (!message.reactions) {
        message.reactions = {};
      }

      const userReaction = Object.keys(message.reactions).find(key => message.reactions![key] === user.email);

      if (userReaction === emoji) {
          delete message.reactions[emoji];
      } else {
          if(userReaction) delete message.reactions[userReaction];
          message.reactions[emoji] = user.email!;
      }

      await updateDoc(conversationRef, { messages: updatedMessages });
  };


  const markMessagesAsRead = useCallback(async () => {
    if (!firestore || !selectedConversation || !user?.email) return;
    const unreadMessages = selectedConversation.messages.filter(msg => msg.sentBy === 'visitor' && (!msg.readBy || !msg.readBy[user.email!]));
    if (unreadMessages.length === 0) return;

    const batch = writeBatch(firestore);
    const updatedMessages = selectedConversation.messages.map(msg => {
        if (unreadMessages.some(unread => unread.id === msg.id)) {
            return { ...msg, readBy: { ...msg.readBy, [user.email!]: Timestamp.now() } };
        }
        return msg;
    });
    batch.update(doc(firestore, 'conversations', selectedConversation.id), { messages: updatedMessages });
    await batch.commit();
  }, [firestore, selectedConversation, user]);

  // Set presence
  useEffect(() => {
    if (!firestore || !user?.email || !selectedConversationId) return;
    const conversationRef = doc(firestore, 'conversations', selectedConversationId);
    updateDoc(conversationRef, { [`presence.${user.email}`]: 'online' });
    const onUnload = () => updateDoc(conversationRef, { [`presence.${user.email}`]: 'offline' });
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [firestore, user, selectedConversationId]);

  useEffect(() => {
    if (selectedConversation) { markMessagesAsRead(); }
  }, [selectedConversation, markMessagesAsRead]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableView) { scrollableView.scrollTop = scrollableView.scrollHeight; }
    }
  };

  useEffect(() => {
    if (selectedConversation) { setTimeout(scrollToBottom, 50); }
  }, [selectedConversation?.messages]);

  const formatListTimestamp = (date: Date) => isToday(date) ? format(date, 'p') : format(date, 'P');
  const formatMessageTimestamp = (date: Date) => format(date, 'p');
  
  const lastMessage = (convo: Conversation) => {
    if (!convo.messages || convo.messages.length === 0) return { text: "No messages yet", sentAt: convo.lastMessageAt };
    return convo.messages[convo.messages.length - 1];
  };
  
  const handleSelectGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    setSelectedConversationId(null);
  };

  if (isUserLoading || isProfileLoading || !isAuthorized) {
    return <div className="container mx-auto flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  }

  const showFeatureComingSoon = () => toast({ title: 'Feature Coming Soon', description: 'Voice and video call functionality will be added in a future update.' });
  
  const handleEmojiSelect = (emoji: string) => {
    const currentMessage = replyForm.getValues('replyMessage') || '';
    replyForm.setValue('replyMessage', currentMessage + emoji);
  };

  const MessageStatus = ({ message }: { message: Message }) => {
    if (message.sentBy !== 'admin' || !selectedConversation) return null;
    const hasBeenRead = Object.keys(message.readBy || {}).includes(selectedConversation.senderEmail);
    return hasBeenRead ? <CheckCheck className="h-4 w-4 text-blue-500 inline" /> : <Check className="h-4 w-4 text-muted-foreground inline" />;
  };

  const isVisitorTyping = selectedConversation?.typing?.[selectedConversation.senderEmail];
  const isVisitorOnline = selectedConversation?.presence?.[selectedConversation.senderEmail] === 'online';

  return (
    <section id="admin" className="h-screen w-full p-4 md:p-8">
      <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm flex overflow-hidden">
        <div className={cn('w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out flex flex-col', selectedConversationId && 'hidden md:flex')}>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold">Messages</h2>
            <Dialog open={isGroupModalOpen} onOpenChange={setGroupModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Create New Group"><PlusCircle className="w-5 h-5"/></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                     <Form {...createGroupForm}>
                        <form onSubmit={createGroupForm.handleSubmit(handleCreateGroup)} className="space-y-4">
                            <FormField
                                control={createGroupForm.control}
                                name="groupName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Group Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter group name..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createGroupForm.control}
                                name="members"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-4">
                                            <FormLabel className="text-base">Members</FormLabel>
                                        </div>
                                         <ScrollArea className="h-48">
                                            {allConversations?.map((convo) => (
                                                <FormField
                                                    key={convo.id}
                                                    control={createGroupForm.control}
                                                    name="members"
                                                    render={({ field }) => {
                                                        return (
                                                        <FormItem
                                                            key={convo.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted rounded-md"
                                                        >
                                                            <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(convo.id)}
                                                                onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), convo.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                        (value) => value !== convo.id
                                                                        )
                                                                    )
                                                                }}
                                                            />
                                                            </FormControl>
                                                            <FormLabel className="font-normal w-full cursor-pointer">
                                                                {convo.senderName}
                                                            </FormLabel>
                                                        </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </ScrollArea>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={createGroupForm.formState.isSubmitting}>Create Group</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {isLoadingGroups && <p className="p-4">Loading groups...</p>}
               <button onClick={() => handleSelectGroup(null)} className={cn('w-full text-left p-4 border-b hover:bg-muted/50 transition-colors duration-200 flex items-center gap-3', !selectedGroupId && 'bg-muted')}>
                  <Users className="w-5 h-5"/>
                  <span className="font-semibold">All Conversations</span>
              </button>
              {groups?.map(group => (
                  <button key={group.id} onClick={() => handleSelectGroup(group.id)} className={cn('w-full text-left p-4 border-b hover:bg-muted/50 transition-colors duration-200', selectedGroupId === group.id && 'bg-muted')}>
                      <span className="font-semibold">{group.name}</span>
                  </button>
              ))}
              <div className="p-2 text-xs text-center text-muted-foreground">Conversations</div>

              {isLoadingConversations && <p className="p-4">Loading messages...</p>}
              {!isLoadingConversations && (!conversations || conversations.length === 0) && <p className="p-4 text-muted-foreground">No messages yet.</p>}
              {conversations?.map(convo => {
                const latestMsg = lastMessage(convo);
                const isOnline = convo.presence?.[convo.senderEmail] === 'online';
                return (
                  <button key={convo.id} onClick={() => setSelectedConversationId(convo.id)} className={cn('w-full text-left p-4 border-b hover:bg-muted/50 transition-colors duration-200', selectedConversationId === convo.id && 'bg-muted')}>
                    <div className="flex justify-between items-start">
                        <div className="flex-1 overflow-hidden flex items-center gap-3">
                           <Avatar className="relative">
                             <AvatarFallback>{convo.senderName.charAt(0)}</AvatarFallback>
                             {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />}
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
                    <p className="text-sm text-muted-foreground truncate mt-1 pl-14">{latestMsg.text || 'Image'}</p>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        <div className={cn('w-full md:w-2/3 flex flex-col', !selectedConversationId && 'hidden md:flex')}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center gap-4">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversationId(null)} aria-label="Back to message list"><ArrowLeft className="w-4 h-4" /></Button>
                 <Avatar className="relative">
                    <AvatarFallback>{selectedConversation.senderName.charAt(0)}</AvatarFallback>
                    {isVisitorOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />}
                 </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedConversation.senderName}</h3>
                  <p className="text-xs text-muted-foreground">{isVisitorTyping ? 'typing...' : (isVisitorOnline ? 'Online' : 'Offline')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={showFeatureComingSoon} aria-label="Start voice call"><Phone className="w-5 h-5 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" onClick={showFeatureComingSoon} aria-label="Start video call"><Video className="w-5 h-5 text-muted-foreground" /></Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}>
                 <div className="space-y-1">
                  {displayedMessages.map((msg, index) => (
                    <div key={`${msg.id}-${index}`} className={cn("flex items-end gap-2.5 group", msg.sentBy === 'admin' && 'justify-end')}>
                       <div className={cn("flex flex-col gap-1 w-full max-w-[320px]", msg.sentBy === 'admin' && 'items-end')}>
                         <div className={cn("relative leading-1.5 p-2 rounded-xl", msg.sentBy === 'admin' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none shadow-sm')}>
                            {msg.imageUrl && <Image src={msg.imageUrl} alt="attachment" width={300} height={200} className="rounded-md mb-2" />}
                            {msg.text && <p className="text-sm font-normal px-1">{msg.text}</p>}
                            <div className="text-xs text-muted-foreground/80 flex items-center justify-end gap-1 mt-1">
                                {msg.sentBy === 'admin' && <MessageStatus message={msg} />}
                                <span>{msg.sentAt ? formatMessageTimestamp(getSentAtDate(msg.sentAt)) : ''}</span>
                            </div>
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className="absolute -bottom-3 left-2 bg-card border rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
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
                                        <button key={emoji} type="button" aria-label={`React with ${emoji}`} onClick={() => handleReaction(msg.id, emoji)} className="text-lg p-1 rounded-full hover:bg-muted transition-colors">
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <Form {...replyForm}>
                  <form onSubmit={replyForm.handleSubmit(handleReply)} className="flex gap-2">
                     <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Open emoji picker"><Smile className="h-5 w-5" /></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-1 border-none shadow-none bg-transparent mb-2">
                            <div className="grid grid-cols-10 gap-0.5">
                                {EMOJIS.map((emoji, i) => (
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
                            <Input placeholder="Type your reply..." {...field} autoComplete="off" onInput={handleTyping}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting} aria-label="Send message"><Send className="h-4 w-4" /></Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Select a message to start chatting</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
