
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
import { 
  Send, 
  ArrowLeft, 
  Smile, 
  Paperclip, 
  Check, 
  CheckCheck, 
  Loader2, 
  Search, 
  MoreVertical, 
  User, 
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
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
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <section id="chat-panel" className="h-screen w-full p-0 md:p-4 lg:p-6 pt-16 md:pt-20 bg-background/50">
      <div className="h-full max-w-7xl mx-auto rounded-none md:rounded-2xl border border-white/5 bg-card/20 backdrop-blur-2xl text-card-foreground shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex overflow-hidden">
        
        {/* Sidebar: Threads List */}
        <div className={cn(
          'w-full md:w-[320px] lg:w-[380px] border-r border-white/5 flex flex-col bg-black/10',
          selectedConvId && 'hidden md:flex'
        )}>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between px-1">
                <h2 className="font-headline text-2xl font-black tracking-tight text-white drop-shadow-sm">Messages</h2>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/60">
                  <MoreVertical className="w-5 h-5" />
                </Button>
            </div>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search people..." 
                    className="pl-10 h-10 bg-white/5 border-white/5 rounded-xl focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="px-2 pb-5 space-y-1">
                {isConvsLoading ? (
                  <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary/30" /></div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground/50 text-sm italic">No conversations found.</div>
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
                                    'w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-center gap-3.5 relative group',
                                    isActive ? 'bg-primary/10 shadow-inner' : 'hover:bg-white/[0.03]'
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="h-12 w-12 border border-white/10 shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary font-bold text-lg">{conv.senderName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {conv.presence?.[conv.id] === 'online' && (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#1a1a1a] shadow-lg" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className={cn("font-bold truncate text-[15px] tracking-tight", isActive ? "text-white" : "text-white/80")}>
                                          {conv.senderName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tighter shrink-0">
                                          {formatDate(getSentAtDate(conv.lastMessageAt))}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={cn("text-[13px] truncate flex-1", hasUnread ? "text-primary font-bold" : "text-muted-foreground/60")}>
                                            {lastMsg?.sentBy === 'admin' ? 'You: ' : ''}
                                            {lastMsg?.text || (lastMsg?.imageUrl ? '📎 Attached photo' : 'New conversation')}
                                        </p>
                                        {hasUnread && <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />}
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
        <div className={cn('flex-1 flex flex-col bg-black/5', !selectedConvId && 'hidden md:flex')}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3 md:p-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02] backdrop-blur-md z-30">
                 <Button variant="ghost" size="icon" className="md:hidden -ml-1 text-white/50" onClick={() => setSelectedConvId(null)}>
                   <ArrowLeft className="w-5 h-5" />
                 </Button>
                 <div className="relative">
                    <Avatar className="h-10 w-10 border border-white/5">
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">{selectedConv.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {selectedConv.presence?.[selectedConv.id] === 'online' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1a1a]" />
                    )}
                 </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{selectedConv.senderName}</h3>
                  <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1.5 mt-0.5 font-medium">
                    {selectedConv.presence?.[selectedConv.id] === 'online' ? (
                      <span className="text-green-500 flex items-center gap-1 animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-current" /> online
                      </span>
                    ) : (
                      'last seen recently'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                    <Button variant="ghost" size="icon" className="text-white hover:text-primary rounded-full"><User className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:text-primary rounded-full"><MoreVertical className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Messages Content */}
              <ScrollArea className="flex-1 px-4 md:px-8 py-6" ref={scrollAreaRef}>
                 <div className="space-y-6 max-w-4xl mx-auto">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        const isMe = msg.sentBy === (isAdmin ? 'admin' : 'visitor');
                        const showAvatar = idx === 0 || messages[idx-1].sentBy !== msg.sentBy;
                        const isRead = Object.keys(msg.readBy || {}).some(e => e !== msg.senderEmail);

                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                key={msg.id} 
                                className={cn("flex items-end gap-2.5 group", isMe ? 'flex-row-reverse' : 'flex-row')}
                            >
                                <div className={cn("flex flex-col gap-1 w-full max-w-[85%] md:max-w-[75%]", isMe ? 'items-end' : 'items-start')}>
                                    <div className={cn(
                                        "relative px-3.5 py-2.5 rounded-2xl transition-all duration-200 shadow-md", 
                                        isMe 
                                            ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/10' 
                                            : 'bg-white/10 backdrop-blur-md text-white border border-white/5 rounded-tl-none'
                                    )}>
                                        {msg.imageUrl && (
                                            <div className="relative aspect-auto max-w-full mb-2.5 rounded-xl overflow-hidden border border-black/20 group-hover:brightness-110 transition-all">
                                                <Image src={msg.imageUrl} alt="attachment" width={400} height={300} className="object-cover" />
                                            </div>
                                        )}
                                        {msg.text && <p className="text-[14px] leading-snug font-medium whitespace-pre-wrap">{msg.text}</p>}
                                        
                                        <div className={cn(
                                          "flex items-center gap-1.5 mt-1.5 justify-end", 
                                          isMe ? "text-primary-foreground/50" : "text-white/30"
                                        )}>
                                            <span className="text-[9px] font-black uppercase tracking-widest">{format(getSentAtDate(msg.sentAt), 'p')}</span>
                                            {isMe && (
                                                isRead ? <CheckCheck className="h-3 w-3 text-blue-300" /> : <Check className="h-3 w-3" />
                                            )}
                                        </div>

                                        {/* Reaction Display */}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className={cn(
                                              "absolute -bottom-3 flex gap-1 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-1.5 py-0.5 shadow-lg", 
                                              isMe ? "right-1" : "left-1"
                                            )}>
                                                {Object.entries(msg.reactions).map(([email, emoji]) => (
                                                    <span key={email} className="text-[11px] drop-shadow-sm cursor-help" title={email}>{emoji}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Quick Reaction Popover */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-full text-white/30">
                                            <Smile className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-fit p-1 flex gap-1 bg-black/80 backdrop-blur-2xl border-white/5 rounded-full shadow-2xl" side="top" align={isMe ? 'end' : 'start'}>
                                        {EMOJIS.map(e => (
                                            <Button key={e} variant="ghost" size="sm" className="h-8 w-8 p-0 text-base hover:bg-white/10 rounded-full" onClick={() => handleReaction(msg.id, e)}>{e}</Button>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            </motion.div>
                        )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
              
              {/* Chat Input Bar */}
              <div className="p-4 md:p-6 bg-white/[0.01] backdrop-blur-xl border-t border-white/5">
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex items-center gap-3 max-w-4xl mx-auto">
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-full hover:bg-white/5 text-white/40 hover:text-primary transition-colors">
                          <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" type="button" className="h-10 w-10 rounded-full hover:bg-white/5 text-white/40 hover:text-primary transition-colors">
                          <ImageIcon className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => messageForm.setValue('attachment', e.target.files?.[0])} />
                    
                    <FormField control={messageForm.control} name="content" render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                              <Input 
                                placeholder="Message..." 
                                {...field} 
                                autoComplete="off" 
                                className="h-11 bg-white/5 border-white/5 rounded-2xl px-5 focus:ring-0 focus:border-white/10 placeholder:text-muted-foreground/30 transition-all text-sm font-medium" 
                              />
                          </FormControl>
                        </FormItem>
                    )}/>
                    
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting} className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95">
                        {messageForm.formState.isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            /* Empty Selection State */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative mb-8"
                >
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                        <MessageSquare className="w-10 h-10 text-primary/40" />
                    </div>
                </motion.div>
                <h3 className="text-2xl font-black tracking-tight text-white/90 mb-2 font-headline">Select a conversation</h3>
                <p className="text-muted-foreground/60 text-sm max-w-[280px] leading-relaxed">
                  Choose a chat from the left to start viewing messages and providing real-time support.
                </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
