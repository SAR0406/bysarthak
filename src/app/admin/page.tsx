
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
import { Send, ArrowLeft, Smile, Paperclip, Check, CheckCheck, Loader2, Search } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Types based on Screenshot ---
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
  id: string; // The email
  senderName: string;
  senderEmail: string;
  lastMessageAt: Timestamp;
  messages: Message[];
  typing?: { [key: string]: boolean };
  presence?: { [key: string]: 'online' | Timestamp };
  groupId?: string;
};

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.').optional(),
  attachment: z.instanceof(File).optional(),
});

const EMOJIS = ['😀', '👍', '❤️', '😂', '😯', '😢', '😡', '🔥', '🚀', '✨'];
const ADMIN_EMAIL = 'sarthak040624@gmail.com';
const ADMIN_NAME = 'Sarthak';

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auth Check ---
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) router.push('/login');
  }, [user, isUserLoading, router]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // --- Data Fetching ---
  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Admin sees everything, others see only their own (rules will enforce this)
    return query(collection(firestore, 'conversations'), orderBy('lastMessageAt', 'desc'));
  }, [firestore, user?.uid]);
  
  const { data: conversations, isLoading: isConvsLoading } = useCollection<Conversation>(conversationsQuery);

  const selectedConv = conversations?.find(c => c.id === selectedConvId);
  const messages = selectedConv?.messages?.sort((a, b) => {
      const dateA = a.sentAt instanceof Timestamp ? a.sentAt.toDate() : new Date(a.sentAt as any);
      const dateB = b.sentAt instanceof Timestamp ? b.sentAt.toDate() : new Date(b.sentAt as any);
      return dateA.getTime() - dateB.getTime();
  }) || [];

  // --- Read Receipts ---
  useEffect(() => {
    if (!firestore || !selectedConv || !user || !isAdmin) return;
    
    const unreadMessages = selectedConv.messages.filter(msg => 
      msg.sentBy === 'visitor' && (!msg.readBy || !msg.readBy[ADMIN_EMAIL])
    );

    if (unreadMessages.length > 0) {
      const convRef = doc(firestore, 'conversations', selectedConv.id);
      const updatedMessages = selectedConv.messages.map(msg => {
        if (unreadMessages.some(u => u.id === msg.id)) {
          return { ...msg, readBy: { ...msg.readBy, [ADMIN_EMAIL]: Timestamp.now() } };
        }
        return msg;
      });
      updateDoc(convRef, { messages: updatedMessages });
    }
  }, [selectedConv, user, isAdmin, firestore]);

  // --- Forms ---
  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  // --- Actions ---
  async function handleSendMessage(values: z.infer<typeof messageSchema>) {
    if (!firestore || !user || !selectedConvId || !selectedConv) return;
    if (!values.content && !values.attachment) return;

    const newMessage: Message = {
      id: uuidv4(),
      sentBy: isAdmin ? 'admin' : 'visitor',
      senderName: isAdmin ? ADMIN_NAME : (user.displayName || user.email!),
      senderEmail: user.email!,
      sentAt: new Date(),
      readBy: { [user.email!]: Timestamp.now() },
      reactions: {},
    };

    if (values.content) newMessage.text = values.content;

    if (values.attachment) {
      const storage = getStorage();
      const filePath = `attachments/${selectedConvId}/${Date.now()}_${values.attachment.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, values.attachment);
      newMessage.imageUrl = await getDownloadURL(fileRef);
    }
    
    messageForm.reset();

    const convRef = doc(firestore, 'conversations', selectedConvId);
    updateDoc(convRef, {
        messages: [...selectedConv.messages, newMessage],
        lastMessageAt: serverTimestamp(),
    }).catch(e => toast({ variant: 'destructive', title: 'Error', description: e.message }));
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!firestore || !selectedConv || !user) return;
    const convRef = doc(firestore, 'conversations', selectedConv.id);
    const updatedMessages = selectedConv.messages.map(msg => {
        if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (reactions[user.email!] === emoji) delete reactions[user.email!];
            else reactions[user.email!] = emoji;
            return { ...msg, reactions };
        }
        return msg;
    });
    updateDoc(convRef, { messages: updatedMessages });
  };

  const getSentAtDate = (sentAt: any) => {
    if (!sentAt) return new Date();
    return sentAt instanceof Timestamp ? sentAt.toDate() : new Date(sentAt);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]')?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  }, [messages.length]);

  const filteredConversations = useMemo(() => {
    return conversations?.filter(c => 
      c.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.senderEmail.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [conversations, searchQuery]);

  if (isUserLoading || !user) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <section id="admin" className="h-screen w-full p-4 md:p-8 pt-20">
      <div className="h-full rounded-2xl border bg-card/50 backdrop-blur-md text-card-foreground shadow-2xl flex overflow-hidden">
        {/* Sidebar */}
        <div className={cn('w-full md:w-1/3 border-r flex flex-col', selectedConvId && 'hidden md:flex')}>
          <div className="p-4 border-b space-y-4">
            <h2 className="font-headline text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Conversations</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search messages..." 
                    className="pl-9 bg-background/50" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isConvsLoading ? (
               <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></div>
            ) : filteredConversations.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground">No conversations found.</div>
            ) : (
                filteredConversations.map(conv => {
                    const lastMsg = conv.messages[conv.messages.length - 1];
                    const hasUnread = isAdmin && conv.messages.some(m => m.sentBy === 'visitor' && (!m.readBy || !m.readBy[ADMIN_EMAIL]));
                    
                    return (
                        <button 
                            key={conv.id} 
                            onClick={() => setSelectedConvId(conv.id)} 
                            className={cn('w-full text-left p-4 border-b hover:bg-primary/5 transition-all relative group', selectedConvId === conv.id && 'bg-primary/10')}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{conv.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold truncate">{conv.senderName}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{format(getSentAtDate(conv.lastMessageAt), 'MMM d')}</span>
                                    </div>
                                    <p className={cn("text-xs truncate mt-0.5", hasUnread ? "text-foreground font-bold" : "text-muted-foreground")}>
                                        {lastMsg?.text || (lastMsg?.imageUrl ? 'Sent an image' : 'No messages')}
                                    </p>
                                </div>
                                {hasUnread && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm shadow-primary/50 animate-pulse" />}
                            </div>
                        </button>
                    )
                })
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn('w-full md:w-2/3 flex flex-col', !selectedConvId && 'hidden md:flex')}>
          {selectedConv ? (
            <>
              <div className="p-4 border-b flex items-center gap-4 bg-background/40 backdrop-blur-sm z-10">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConvId(null)}><ArrowLeft className="w-4 h-4" /></Button>
                 <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{selectedConv.senderName.charAt(0)}</AvatarFallback>
                 </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold leading-tight">{selectedConv.senderName}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">{selectedConv.senderEmail}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6 bg-muted/5" ref={scrollAreaRef}>
                 <div className="space-y-6 max-w-2xl mx-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-end gap-3 group", msg.sentBy === (isAdmin ? 'admin' : 'visitor') ? 'flex-row-reverse' : 'flex-row')}>
                       <div className={cn("flex flex-col gap-1 w-full max-w-[85%]", msg.sentBy === (isAdmin ? 'admin' : 'visitor') ? 'items-end' : 'items-start')}>
                         <div className={cn("relative leading-relaxed p-4 rounded-2xl shadow-sm transition-all hover:shadow-md", 
                            msg.sentBy === (isAdmin ? 'admin' : 'visitor') 
                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                : 'bg-card border rounded-bl-none'
                            )}>
                            {msg.imageUrl && (
                                <div className="relative aspect-video w-full mb-3 rounded-xl overflow-hidden border border-black/10">
                                    <Image src={msg.imageUrl} alt="attachment" fill className="object-cover" />
                                </div>
                            )}
                            {msg.text && <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>}
                            
                            <div className="flex items-center justify-end gap-2 mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] uppercase tracking-wider">{format(getSentAtDate(msg.sentAt), 'p')}</span>
                                {msg.sentBy === (isAdmin ? 'admin' : 'visitor') && (
                                    Object.keys(msg.readBy || {}).some(e => e !== msg.senderEmail) 
                                        ? <CheckCheck className="h-3 w-3 text-blue-400" /> 
                                        : <Check className="h-3 w-3" />
                                )}
                            </div>

                            {/* Reactions */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className="absolute -bottom-4 right-2 flex gap-1 bg-background/80 backdrop-blur-sm border rounded-full px-1.5 py-0.5 shadow-sm">
                                    <TooltipProvider>
                                        {Object.entries(msg.reactions).map(([email, emoji]) => (
                                            <Tooltip key={email}>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-default text-xs hover:scale-125 transition-transform">{emoji}</span>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-[10px]">{email === user.email ? 'You' : email}</TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </TooltipProvider>
                                </div>
                            )}
                         </div>
                       </div>
                       
                       {/* Quick Reaction Popover */}
                       <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 rounded-full">
                                    <Smile className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-fit p-1 flex gap-1" side="top">
                                {EMOJIS.map(e => (
                                    <Button key={e} variant="ghost" size="sm" className="h-8 w-8 p-0 text-lg hover:bg-primary/10" onClick={() => handleReaction(msg.id, e)}>{e}</Button>
                                ))}
                            </PopoverContent>
                       </Popover>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t bg-background/40 backdrop-blur-sm">
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex items-end gap-2 max-w-4xl mx-auto">
                    <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 shrink-0 hover:bg-primary/10"><Paperclip className="h-5 w-5" /></Button>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => messageForm.setValue('attachment', e.target.files?.[0])} />
                    
                    <FormField control={messageForm.control} name="content" render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                              <Input 
                                placeholder="Write a message..." 
                                {...field} 
                                autoComplete="off" 
                                className="h-10 bg-background/50 border-none shadow-inner focus-visible:ring-1 ring-primary/20" 
                              />
                          </FormControl>
                        </FormItem>
                    )}/>
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting} className="h-10 w-10 shrink-0 rounded-full shadow-lg shadow-primary/20"><Send className="h-4 w-4" /></Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <Avatar className="h-24 w-24 relative border-4 border-background shadow-2xl">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-3xl font-black">💬</AvatarFallback>
                    </Avatar>
                </div>
                <div className="max-w-xs space-y-2">
                    <h3 className="text-2xl font-black tracking-tight">Select a Thread</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">Choose a visitor conversation from the left to start responding and providing support.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
