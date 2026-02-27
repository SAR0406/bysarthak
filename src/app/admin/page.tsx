
'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
  Image as ImageIcon,
  Circle
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
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
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
  const [isUploading, setIsUploading] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // --- Typing Logic ---
  const handleTyping = useCallback(() => {
    if (!firestore || !selectedConvId || !user?.email) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    const convRef = doc(firestore, 'conversations', selectedConvId);
    updateDoc(convRef, { [`typing.${user.email}`]: true });
    
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(convRef, { [`typing.${user.email}`]: false });
    }, 2000);
  }, [firestore, selectedConvId, user?.email]);

  // --- Read Receipts ---
  useEffect(() => {
    if (!firestore || !selectedConv || !user?.email || !isAdmin) return;
    
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
  }, [selectedConv, user?.email, isAdmin, firestore]);

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
      setIsUploading(true);
      try {
        const storage = getStorage();
        const filePath = `attachments/${selectedConvId}/${Date.now()}_${values.attachment.name}`;
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, values.attachment);
        newMessage.imageUrl = await getDownloadURL(fileRef);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload attachment.' });
      } finally {
        setIsUploading(false);
      }
    }
    
    messageForm.reset();

    const convRef = doc(firestore, 'conversations', selectedConvId);
    updateDoc(convRef, {
        messages: [...selectedConv.messages, newMessage],
        lastMessageAt: serverTimestamp(),
        [`typing.${user.email!}`]: false
    }).catch(e => toast({ variant: 'destructive', title: 'Error', description: e.message }));
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!firestore || !selectedConv || !user?.email) return;
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
    <section id="chat-panel" className="h-screen w-full p-0 md:p-4 lg:p-6 pt-16 md:pt-20 bg-background/50 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto rounded-none md:rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl text-card-foreground shadow-[0_32px_128px_-12px_rgba(0,0,0,0.8)] flex overflow-hidden ring-1 ring-white/5">
        
        {/* Sidebar: Threads List */}
        <div className={cn(
          'w-full md:w-[320px] lg:w-[400px] border-r border-white/5 flex flex-col bg-white/[0.02]',
          selectedConvId && 'hidden md:flex'
        )}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between px-1">
                <h2 className="font-headline text-3xl font-black tracking-tight text-white drop-shadow-lg">Inbox</h2>
                <div className="flex gap-1">
                   <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/40">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                   </Button>
                   <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/60">
                      <MoreVertical className="w-5 h-5" />
                   </Button>
                </div>
            </div>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search messages..." 
                    className="pl-12 h-12 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-medium" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="px-3 pb-8 space-y-1.5">
                {isConvsLoading ? (
                  <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary/30" /></div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <MessageSquare className="w-12 h-12 text-white/5" />
                    <p className="text-muted-foreground/40 text-sm font-medium italic">Your inbox is quiet</p>
                  </div>
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
                                    'w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 relative group',
                                    isActive ? 'bg-primary/20 shadow-xl ring-1 ring-white/10' : 'hover:bg-white/[0.04]'
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="h-14 w-14 border-2 border-white/5 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-black text-xl">{conv.senderName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {conv.presence?.[conv.id] === 'online' && (
                                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-4 border-[#0a0a0a] shadow-lg animate-pulse" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={cn("font-bold truncate text-[16px] tracking-tight", isActive ? "text-white" : "text-white/80")}>
                                          {conv.senderName}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground/50 font-black uppercase tracking-widest shrink-0">
                                          {formatDate(getSentAtDate(conv.lastMessageAt))}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={cn("text-[14px] truncate flex-1 font-medium", hasUnread ? "text-primary font-black" : "text-muted-foreground/40")}>
                                            {lastMsg?.sentBy === 'admin' ? (
                                              <span className="opacity-50">You: </span>
                                            ) : ''}
                                            {lastMsg?.text || (lastMsg?.imageUrl ? '📎 Attachment' : 'New interaction')}
                                        </p>
                                        {hasUnread && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />}
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
        <div className={cn('flex-1 flex flex-col bg-white/[0.01]', !selectedConvId && 'hidden md:flex')}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-5 bg-black/20 backdrop-blur-3xl z-30 shadow-2xl">
                 <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-white/40 hover:text-white" onClick={() => setSelectedConvId(null)}>
                   <ArrowLeft className="w-6 h-6" />
                 </Button>
                 <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white/10 shadow-2xl">
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{selectedConv.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {selectedConv.presence?.[selectedConv.id] === 'online' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-4 border-[#0a0a0a]" />
                    )}
                 </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-white text-lg tracking-tight truncate">{selectedConv.senderName}</h3>
                  <div className="text-[12px] text-muted-foreground/60 flex items-center gap-2 mt-0.5 font-bold uppercase tracking-widest">
                    {selectedConv.presence?.[selectedConv.id] === 'online' ? (
                      <span className="text-green-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> active now
                      </span>
                    ) : (
                      'away'
                    )}
                    {selectedConv.typing?.[selectedConv.id] && (
                       <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-primary animate-pulse">typing...</span>
                       </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-80">
                    <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-primary/10 rounded-full transition-all"><User className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:text-primary hover:bg-primary/10 rounded-full transition-all"><MoreVertical className="w-5 h-5" /></Button>
                </div>
              </div>

              {/* Messages Content */}
              <ScrollArea className="flex-1 px-4 md:px-12 py-8 bg-gradient-to-b from-transparent to-black/30" ref={scrollAreaRef}>
                 <div className="space-y-10 max-w-5xl mx-auto pb-8">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        const isMe = msg.sentBy === (isAdmin ? 'admin' : 'visitor');
                        const isRead = Object.keys(msg.readBy || {}).some(e => e !== msg.senderEmail);
                        const msgDate = getSentAtDate(msg.sentAt);
                        const prevMsgDate = idx > 0 ? getSentAtDate(messages[idx-1].sentAt) : null;
                        const showDateHeader = !prevMsgDate || !isSameDay(msgDate, prevMsgDate);

                        return (
                            <div key={msg.id} className="space-y-10">
                                {showDateHeader && (
                                    <div className="flex justify-center my-12">
                                        <span className="px-5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 shadow-sm backdrop-blur-xl">
                                            {isToday(msgDate) ? 'Today' : isYesterday(msgDate) ? 'Yesterday' : format(msgDate, 'MMMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                                <motion.div 
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn("flex items-end gap-3.5 group", isMe ? 'flex-row-reverse' : 'flex-row')}
                                >
                                    <div className={cn("flex flex-col gap-2 w-full max-w-[85%] md:max-w-[70%]", isMe ? 'items-end' : 'items-start')}>
                                        <div className={cn(
                                            "relative px-5 py-4 rounded-[2rem] transition-all duration-500 shadow-2xl group-hover:shadow-primary/5", 
                                            isMe 
                                                ? 'bg-primary text-primary-foreground rounded-br-none shadow-primary/20' 
                                                : 'bg-white/10 backdrop-blur-2xl text-white border border-white/5 rounded-bl-none shadow-black/40'
                                        )}>
                                            {msg.imageUrl && (
                                                <div className="relative aspect-auto max-w-full mb-4 rounded-3xl overflow-hidden border border-black/20 group-hover:brightness-110 transition-all duration-500 cursor-zoom-in">
                                                    <Image src={msg.imageUrl} alt="attachment" width={500} height={350} className="object-cover" />
                                                </div>
                                            )}
                                            {msg.text && <p className="text-[15px] leading-relaxed font-semibold whitespace-pre-wrap tracking-tight">{msg.text}</p>}
                                            
                                            <div className={cn(
                                              "flex items-center gap-2 mt-3 justify-end", 
                                              isMe ? "text-primary-foreground/40" : "text-white/30"
                                            )}>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{format(msgDate, 'p')}</span>
                                                {isMe && (
                                                    isRead ? <CheckCheck className="h-4 w-4 text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]" /> : <Check className="h-4 w-4" />
                                                )}
                                            </div>

                                            {/* Reaction Display */}
                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                <div className={cn(
                                                  "absolute -bottom-5 flex gap-1.5 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-full px-2.5 py-1 shadow-2xl ring-1 ring-white/5", 
                                                  isMe ? "right-2" : "left-2"
                                                )}>
                                                    {Object.entries(msg.reactions).map(([email, emoji]) => (
                                                        <span key={email} className="text-[13px] hover:scale-150 transition-transform cursor-help drop-shadow-md" title={email}>{emoji}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Quick Reaction Popover */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/10 rounded-full text-white/20">
                                                <Smile className="h-5 w-5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-fit p-1.5 flex gap-1.5 bg-black/90 backdrop-blur-3xl border-white/10 rounded-full shadow-[0_16px_48px_rgba(0,0,0,0.9)] ring-1 ring-white/10" side="top" align={isMe ? 'end' : 'start'}>
                                            {EMOJIS.map(e => (
                                                <Button key={e} variant="ghost" size="sm" className="h-9 w-9 p-0 text-lg hover:bg-white/15 rounded-full hover:scale-125 transition-all" onClick={() => handleReaction(msg.id, e)}>{e}</Button>
                                            ))}
                                        </PopoverContent>
                                    </Popover>
                                </motion.div>
                            </div>
                        )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
              
              {/* Chat Input Bar */}
              <div className="p-6 md:p-10 bg-white/[0.01] backdrop-blur-3xl border-t border-white/5 relative z-40">
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex items-center gap-4 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-2xl hover:bg-white/10 text-white/30 hover:text-primary transition-all duration-300">
                          <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" type="button" className="h-12 w-12 rounded-2xl hover:bg-white/10 text-white/30 hover:text-primary transition-all duration-300">
                          <ImageIcon className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => messageForm.setValue('attachment', e.target.files?.[0])} />
                    
                    <FormField control={messageForm.control} name="content" render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                              <Input 
                                placeholder="Write your message..." 
                                {...field} 
                                autoComplete="off" 
                                onInput={handleTyping}
                                className="h-14 bg-white/5 border-white/10 rounded-[1.5rem] px-8 focus:ring-primary/20 focus:border-white/20 placeholder:text-muted-foreground/20 transition-all text-[15px] font-bold shadow-inner" 
                              />
                          </FormControl>
                        </FormItem>
                    )}/>
                    
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting || isUploading} className="h-14 w-14 shrink-0 rounded-[1.5rem] bg-primary hover:bg-primary/80 text-white shadow-2xl shadow-primary/30 transition-all duration-300 active:scale-90 disabled:opacity-50">
                        {messageForm.formState.isSubmitting || isUploading ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            /* Empty Selection State */
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-gradient-to-br from-transparent to-primary/5">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="relative mb-12"
                >
                    <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                    <div className="relative w-32 h-32 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden">
                        <MessageSquare className="w-12 h-12 text-primary/40" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                    </div>
                </motion.div>
                <h3 className="text-4xl font-black tracking-tight text-white mb-4 font-headline drop-shadow-2xl">Your Inbox</h3>
                <p className="text-muted-foreground/50 text-base max-w-[320px] leading-relaxed font-bold">
                  Select a visitor conversation from the left to start providing professional real-time support.
                </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
