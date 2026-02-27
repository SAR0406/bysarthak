
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
import { Textarea } from '@/components/ui/textarea';
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
  Camera,
  Plus,
  Video,
  Phone,
  Info,
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

const EMOJIS = ['🔥', '❤️', '😂', '👍', '😮', '😢', '🙏', '✨'];
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
    <section className="h-screen w-full flex items-center justify-center bg-[#F1F5F9] overflow-hidden">
      <div className="h-full w-full max-w-[1600px] flex shadow-2xl overflow-hidden bg-white">
        
        {/* Sidebar: Chats List */}
        <div className={cn(
          'w-full md:w-[380px] lg:w-[440px] border-r border-slate-200 flex flex-col bg-white transition-all',
          selectedConvId && 'hidden md:flex'
        )}>
          {/* Sidebar Header */}
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-headline">Messages</h2>
                <div className="flex gap-2">
                   <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                      <Plus className="w-5 h-5 text-slate-600" />
                   </Button>
                </div>
            </div>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search chats..." 
                    className="pl-12 h-12 bg-slate-100 border-none rounded-2xl focus:ring-primary/20 transition-all placeholder:text-slate-400 font-medium" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="px-3 pb-8 space-y-1">
                {isConvsLoading ? (
                  <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary/30" /></div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <MessageSquare className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 text-sm font-medium">No conversations found</p>
                  </div>
                ) : (
                    filteredConversations.map(conv => {
                        const lastMsg = conv.messages[conv.messages.length - 1];
                        const hasUnread = isAdmin && conv.messages.some(m => m.sentBy === 'visitor' && (!m.readBy || !m.readBy[ADMIN_EMAIL]));
                        const isActive = selectedConvId === conv.id;
                        const presence = conv.presence?.[conv.id];
                        
                        return (
                            <button 
                                key={conv.id} 
                                onClick={() => setSelectedConvId(conv.id)} 
                                className={cn(
                                    'w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 relative group',
                                    isActive ? 'bg-[#F1F5F9]' : 'hover:bg-slate-50'
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                        <AvatarFallback className="bg-slate-200 text-slate-600 font-bold text-lg">{conv.senderName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {presence === 'online' && (
                                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#00C2A8] border-2 border-white shadow-sm" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className={cn("font-bold truncate text-[16px] font-headline", isActive ? "text-slate-900" : "text-slate-800")}>
                                          {conv.senderName}
                                        </span>
                                        <span className="text-[12px] text-slate-400 font-bold shrink-0 uppercase tracking-tight">
                                          {formatDate(getSentAtDate(conv.lastMessageAt))}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={cn("text-[14px] truncate flex-1", hasUnread ? "text-slate-900 font-black" : "text-slate-500")}>
                                            {lastMsg?.sentBy === 'admin' ? <span className="text-primary font-bold">You: </span> : ''}
                                            {lastMsg?.text || (lastMsg?.imageUrl ? 'Sent an attachment' : 'No messages yet')}
                                        </p>
                                        {hasUnread && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-lg shadow-primary/30" />}
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation View */}
        <div className={cn('flex-1 flex flex-col bg-[#F8FAFC]', !selectedConvId && 'hidden md:flex')}>
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="h-20 px-6 border-b border-slate-200 flex items-center gap-4 bg-white z-30 shadow-sm">
                 <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-500" onClick={() => setSelectedConvId(null)}>
                   <ArrowLeft className="w-6 h-6" />
                 </Button>
                 <div className="relative">
                    <Avatar className="h-11 w-11 border-2 border-slate-50">
                        <AvatarFallback className="bg-slate-200 text-slate-600 font-black">{selectedConv.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {selectedConv.presence?.[selectedConv.id] === 'online' && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00C2A8] border-2 border-white" />
                    )}
                 </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-[17px] truncate font-headline">{selectedConv.senderName}</h3>
                  <p className="text-[12px] font-bold tracking-tight">
                    {selectedConv.typing?.[selectedConv.id] ? (
                      <span className="text-primary animate-pulse">Typing...</span>
                    ) : (
                      selectedConv.presence?.[selectedConv.id] === 'online' ? <span className="text-[#00C2A8]">Active now</span> : <span className="text-slate-400">Offline</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full h-10 w-10"><Phone className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full h-10 w-10"><Video className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full h-10 w-10"><Info className="w-5 h-5" /></Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 px-4 md:px-8 py-6" ref={scrollAreaRef}>
                 <div className="space-y-8 max-w-5xl mx-auto">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        const isMe = msg.sentBy === (isAdmin ? 'admin' : 'visitor');
                        const isRead = Object.keys(msg.readBy || {}).some(e => e !== msg.senderEmail);
                        const msgDate = getSentAtDate(msg.sentAt);
                        const prevMsgDate = idx > 0 ? getSentAtDate(messages[idx-1].sentAt) : null;
                        const showDateHeader = !prevMsgDate || !isSameDay(msgDate, prevMsgDate);
                        
                        // Consecutive message check for avatar hiding
                        const nextMsg = messages[idx + 1];
                        const isLastInGroup = !nextMsg || nextMsg.sentBy !== msg.sentBy || !isSameDay(getSentAtDate(nextMsg.sentAt), msgDate);

                        return (
                            <div key={msg.id} className="space-y-6">
                                {showDateHeader && (
                                    <div className="flex justify-center my-10">
                                        <span className="px-4 py-1.5 rounded-full bg-slate-200/50 text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-300/30">
                                            {isToday(msgDate) ? 'Today' : isYesterday(msgDate) ? 'Yesterday' : format(msgDate, 'MMMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                                <motion.div 
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={cn("flex items-end gap-3 group", isMe ? 'flex-row-reverse' : 'flex-row')}
                                >
                                    {!isMe && (
                                       <div className="w-8 h-8 flex-shrink-0">
                                          {isLastInGroup ? (
                                             <Avatar className="h-8 w-8 ring-1 ring-slate-100">
                                                <AvatarFallback className="text-[10px] font-black bg-slate-200">{selectedConv.senderName.charAt(0)}</AvatarFallback>
                                             </Avatar>
                                          ) : null}
                                       </div>
                                    )}
                                    <div className={cn("flex flex-col gap-1.5 w-full max-w-[72%]", isMe ? 'items-end' : 'items-start')}>
                                        <div className={cn(
                                            "relative px-5 py-4 transition-all duration-300 group-hover:shadow-lg", 
                                            isMe 
                                                ? 'bg-primary-gradient text-white rounded-[24px] rounded-br-none shadow-md shadow-primary/10' 
                                                : 'bg-white text-slate-900 border border-slate-200 rounded-[24px] rounded-bl-none shadow-sm'
                                        )}>
                                            {msg.imageUrl && (
                                                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100/20">
                                                    <Image src={msg.imageUrl} alt="attachment" width={440} height={330} className="object-cover w-full h-auto" />
                                                </div>
                                            )}
                                            {msg.text && <p className="text-[15px] leading-[1.6] whitespace-pre-wrap font-medium">{msg.text}</p>}
                                            
                                            <div className={cn(
                                              "flex items-center gap-1.5 mt-2 justify-end opacity-70", 
                                              isMe ? "text-white" : "text-slate-400"
                                            )}>
                                                <span className="text-[10px] font-black tracking-tight">{format(msgDate, 'p')}</span>
                                                {isMe && (
                                                    isRead ? <CheckCheck className="h-4 w-4 text-white" /> : <Check className="h-4 w-4" />
                                                )}
                                            </div>

                                            {/* Reactions */}
                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                <div className={cn(
                                                  "absolute -bottom-4 flex gap-1 bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-lg ring-1 ring-slate-900/5", 
                                                  isMe ? "right-2" : "left-2"
                                                )}>
                                                    {Object.entries(msg.reactions).map(([email, emoji]) => (
                                                        <span key={email} className="text-[13px] hover:scale-135 transition-transform cursor-pointer" title={email}>{emoji}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Reaction Trigger */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-200/60 rounded-full text-slate-400">
                                                <Smile className="h-5 w-5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-fit p-1.5 flex gap-1.5 bg-white border-slate-200 rounded-full shadow-2xl animate-in zoom-in-95 duration-150" side="top" align={isMe ? 'end' : 'start'}>
                                            {EMOJIS.map(e => (
                                                <Button key={e} variant="ghost" size="sm" className="h-10 w-10 p-0 text-xl hover:bg-slate-50 rounded-full hover:scale-135 transition-all" onClick={() => handleReaction(msg.id, e)}>{e}</Button>
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
              
              {/* Composer */}
              <div className="p-6 bg-white border-t border-slate-200">
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="flex items-end gap-3 max-w-5xl mx-auto">
                    <div className="flex gap-1 mb-1">
                      <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="h-11 w-11 rounded-full text-slate-400 hover:text-primary hover:bg-slate-50">
                          <Plus className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" type="button" className="h-11 w-11 rounded-full text-slate-400 hover:text-primary hover:bg-slate-50">
                          <Camera className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => messageForm.setValue('attachment', e.target.files?.[0])} />
                    
                    <FormField control={messageForm.control} name="content" render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                              <Textarea 
                                placeholder="Type a message..." 
                                {...field} 
                                onInput={handleTyping}
                                className="min-h-[48px] max-h-[140px] bg-slate-100 border-none rounded-[28px] px-6 py-3.5 focus-visible:ring-primary/20 transition-all text-[15px] resize-none overflow-y-auto font-medium" 
                              />
                          </FormControl>
                        </FormItem>
                    )}/>
                    
                    <Button type="submit" size="icon" disabled={messageForm.formState.isSubmitting || isUploading || !messageForm.watch('content')} className={cn(
                        "h-12 w-12 shrink-0 rounded-full shadow-xl transition-all duration-300",
                        messageForm.watch('content') ? "bg-primary-gradient text-white scale-100" : "bg-slate-100 text-slate-300 scale-95"
                    )}>
                        {messageForm.formState.isSubmitting || isUploading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
                    <div className="relative w-32 h-32 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-2xl">
                        <MessageSquare className="w-14 h-14 text-primary/30" />
                    </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 font-headline">Select a conversation</h3>
                <p className="text-slate-500 text-base max-w-[360px] font-medium leading-relaxed">
                  Choose a visitor thread from the sidebar to start chatting. Your responses will appear in real-time.
                </p>
                <Button className="mt-8 rounded-full px-8 bg-primary-gradient border-none shadow-lg shadow-primary/20">Create New Chat</Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
