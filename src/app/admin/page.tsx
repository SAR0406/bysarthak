
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft, Smile, Paperclip, Check, CheckCheck, Loader2, Search, MoreVertical, User, MessageSquare } from 'lucide-react';
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
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
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
};

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.').optional(),
  attachment: z.instanceof(File).optional(),
});

const EMOJIS = ['😀', '👍', '❤️', '😂', '😯', '😢', '🔥', '✨'];
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
    return query(collection(firestore, 'conversations'), orderBy('lastMessageAt', 'desc'));
  }, [firestore, user?.uid]);
  
  const { data: conversations, isLoading: isConvsLoading } = useCollection<Conversation>(conversationsQuery);

  const selectedConv = conversations?.find(c => c.id === selectedConvId);
  const messages = useMemo(() => {
    return selectedConv?.messages?.sort((a, b) => {
        const dateA = a.sentAt instanceof Timestamp ? a.sentAt.toDate() : new Date(a.sentAt as any);
        const dateB = b.sentAt instanceof Timestamp ? b.sentAt.toDate() : new Date(b.sentAt as any);
        return dateA.getTime() - dateB.getTime();
    }) || [];
  }, [selectedConv]);

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

  const formatDate = (date: Date) => {
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages.length]);

  const filteredConversations = useMemo(() => {
    return conversations?.filter(c => 
      c.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.senderEmail.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [conversations, searchQuery]);

  if (isUserLoading || !user) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  }

  return (
    <section id="admin" className="h-screen w-full p-0 md:p-6 lg:p-10 pt-20 md:pt-24 bg-background/20">
      <div className="h-full max-w-7xl mx-auto rounded-none md:rounded-3xl border border-white/10 bg-card/30 backdrop-blur-xl text-card-foreground shadow-2xl flex overflow-hidden">
        
        {/* Sidebar */}
        <div className={cn('w-full md:w-[350px] lg:w-[400px] border-r border-white/5 flex flex-col bg-black/20', selectedConvId && 'hidden md:flex')}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-headline text-2xl font-black tracking-tight text-white">Inbox</h2>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5"><MoreVertical className="w-5 h-5" /></Button>
            </div>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search conversations..." 
                    className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20 transition-all" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-3 pb-6 space-y-1">
                {isConvsLoading ? (
                <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary/50" /></div>
                ) : filteredConversations.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic">No conversations found.</div>
                ) : (
                    filteredConversations.map(conv => {
                        const lastMsg = conv.messages[conv.messages.length - 1];
                        const hasUnread = isAdmin && conv.messages.some(m => m.sentBy === 'visitor' && (!m.readBy || !m.readBy[ADMIN_EMAIL]));
                        const isActive = selectedConvId === conv.id;
                        
                        return (
                            <button 
                                key={conv.id} 
                                onClick={() => setSelectedConvId(conv.id)} 
                                className={cn(
                                    'w-full text-left p-4 rounded-2xl transition-all duration-300 relative group flex items-center gap-4',
                                    isActive ? 'bg-primary/20 shadow-lg shadow-primary/5' : 'hover:bg-white/5'
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="h-14 w-14 border-2 border-white/10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-xl">{conv.senderName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {conv.presence?.[conv.id] === 'online' && (
                                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-4 border-card ring-1 ring-green-500/50" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={cn("font-bold truncate text-sm tracking-tight", isActive ? "text-white" : "text-white/80")}>{conv.senderName}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter shrink-0">{formatDate(getSentAtDate(conv.lastMessageAt))}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={cn("text-xs truncate flex-1", hasUnread ? "text-primary font-bold" : "text-muted-foreground/80")}>
                                            {lastMsg?.text || (lastMsg?.imageUrl ? '📎 Image attached' : 'Start chatting')}
                                        </p>
                                        {hasUnread && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-glow animate-pulse" />}
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn('flex-1 flex flex-col bg-white/[0.02]', !selectedConvId && 'hidden md:flex')}>
          {selectedConv ? (
            <>
              <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.03] backdrop-blur-md z-20">
                 <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-white/50" onClick={() => setSelectedConvId(null)}><ArrowLeft className="w-5 h-5" /></Button>
                 <div className="relative">
                    <Avatar className="h-12 w-12 border border-white/10">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{selectedConv.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {selectedConv.presence?.[selectedConv.id] === 'online' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-[3px] border-card" />
                    )}
                 </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{selectedConv.senderName}</h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40" />
                    {selectedConv.senderEmail}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-white/40 hover:text-white rounded-full"><User className="w-5 h-5" /></Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6 md:p-10" ref={scrollAreaRef}>
                 <div className="space-y-8 max-w-3xl mx-auto">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        const isMe = msg.sentBy === (isAdmin ? 'admin' : 'visitor');
                        const showAvatar = idx === 0 || messages[idx-1].sentBy !== msg.sentBy;

                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                key={msg.id} 
                                className={cn("flex items-end gap-3 group", isMe ? 'flex-row-reverse' : 'flex-row')}
                            >
                                {!isMe && showAvatar ? (
                                    <Avatar className="h-8 w-8 mb-1 border border-white/10">
                                        <AvatarFallback className="text-[10px] font-bold">{msg.senderName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                ) : <div className="w-8" />}

                                <div className={cn("flex flex-col gap-1.5 w-full max-w-[80%]", isMe ? 'items-end' : 'items-start')}>
                                    <div className={cn(
                                        "relative p-4 rounded-3xl shadow-xl transition-all duration-300", 
                                        isMe 
                                            ? 'bg-primary text-primary-foreground rounded-br-none shadow-primary/10' 
                                            : 'bg-white/10 backdrop-blur-md text-white border border-white/5 rounded-bl-none'
                                    )}>
                                        {msg.imageUrl && (
                                            <div className="relative aspect-video w-full mb-3 rounded-2xl overflow-hidden border border-black/20 shadow-inner">
                                                <Image src={msg.imageUrl} alt="attachment" fill className="object-cover" />
                                            </div>
                                        )}
                                        {msg.text && <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                        
                                        <div className={cn("flex items-center gap-2 mt-2 transition-opacity", isMe ? "justify-end opacity-70" : "opacity-50")}>
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{format(getSentAtDate(msg.sentAt), 'p')}</span>
                                            {isMe && (
                                                Object.keys(msg.readBy || {}).some(e => e !== msg.senderEmail) 
                                                    ? <CheckCheck className="h-3 w-3 text-blue-300" /> 
                                                    : <Check className="h-3 w-3" />
                                            )}
                                        </div>

                                        {/* Reactions */}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className={cn("absolute -bottom-4 flex gap-1 bg-white/10 backdrop-blur-lg border border-white/10 rounded-full px-2 py-1 shadow-lg", isMe ? "right-2" : "left-2")}>
                                                <TooltipProvider>
                                                    {Object.entries(msg.reactions).map(([email, emoji]) => (
                                                        <Tooltip key={email}>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-default text-xs hover:scale-150 transition-transform duration-300">{emoji}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="text-[10px] bg-black/80 backdrop-blur-md border-white/10">{email === user.email ? 'You' : email}</TooltipContent>
                                                        </Tooltip>
                                                    ))}
                                                </TooltipProvider>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-full text-white/40">
                                            <Smile className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-fit p-1 flex gap-1 bg-black/90 backdrop-blur-xl border-white/10 rounded-full shadow-2xl" side="top">
                                        {EMOJIS.map(e => (
                                            <Button key={e} variant="ghost" size="sm" className="h-9 w-9 p-0 text-lg hover:bg-white/10 rounded-full" onClick={() => handleReaction(msg.id, e)}>{e}</Button>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            </motion.div>
                        )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
              
              <div className="p-6 md:p-8 bg-white/[0.03] backdrop-blur-xl border-t border-white/5">
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex items-end gap-3 max-w-4xl mx-auto">
                    <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 shrink-0 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => messageForm.setValue('attachment', e.target.files?.[0])} />
                    
                    <FormField control={messageForm.control} name="content" render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                              <Input 
                                placeholder="Type a message..." 
                                {...field} 
                                autoComplete="off" 
                                className="h-12 bg-white/5 border-white/10 rounded-2xl px-6 focus:ring-primary/40 placeholder:text-muted-foreground/50 transition-all text-[15px]" 
                              />
                          </FormControl>
                        </FormItem>
                    )}/>
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting} className="h-12 w-12 shrink-0 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                        {messageForm.formState.isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-10">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group">
                        <MessageSquare className="w-12 h-12 text-primary/40 group-hover:text-primary/60 transition-colors duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                </motion.div>
                <div className="max-w-sm space-y-3">
                    <h3 className="text-3xl font-black tracking-tight text-white font-headline">Select a Thread</h3>
                    <p className="text-muted-foreground text-[15px] leading-relaxed font-medium px-4">Choose a conversation from your inbox to start chatting and providing real-time support.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
