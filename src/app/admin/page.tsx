'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  EllipsisVertical, 
  ChevronLeft, 
  Phone, 
  Video, 
  Info, 
  Smile, 
  Paperclip, 
  Mic, 
  Send, 
  Check, 
  CheckCheck,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MOCK DATA - Production ready shape
 */
const mockConversations = [
  { id: '1', name: 'Sarthak Upadhyay', avatar: 'https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg', initials: 'SU', avatarColor: 'bg-indigo-500', lastMessage: 'Check out the new designs!', timestamp: new Date(), unreadCount: 2, isOnline: true, isPinned: true, isTyping: false },
  { id: '2', name: 'Product Team', avatar: null, initials: 'PT', avatarColor: 'bg-emerald-500', lastMessage: 'The sprint starts tomorrow.', timestamp: new Date(Date.now() - 3600000), unreadCount: 0, isOnline: false, isPinned: true, isTyping: true },
  { id: '3', name: 'Alex Rivera', avatar: 'https://picsum.photos/seed/alex/100/100', initials: 'AR', avatarColor: 'bg-amber-500', lastMessage: 'Can you send the PDF?', timestamp: new Date(Date.now() - 86400000), unreadCount: 0, isOnline: true, isPinned: false, isTyping: false },
  { id: '4', name: 'Marketing HQ', avatar: null, initials: 'MH', avatarColor: 'bg-rose-500', lastMessage: 'Campaign live in 5 mins!', timestamp: new Date(Date.now() - 172800000), unreadCount: 5, isOnline: false, isPinned: false, isTyping: false },
];

const mockMessages: Record<string, any[]> = {
  '1': [
    { id: 'm1', senderId: 'visitor', text: 'Hey Sarthak! Hope you are doing well.', timestamp: new Date(Date.now() - 7200000), status: 'seen' },
    { id: 'm2', senderId: 'admin', text: 'I am doing great! How can I help you today?', timestamp: new Date(Date.now() - 7100000), status: 'seen' },
    { id: 'm3', senderId: 'visitor', text: 'I saw your latest portfolio updates.', timestamp: new Date(Date.now() - 7000000), status: 'seen' },
    { id: 'm4', senderId: 'visitor', text: 'The new LightPillar component is amazing!', timestamp: new Date(Date.now() - 6950000), status: 'seen' },
    { id: 'm5', senderId: 'admin', text: 'Thank you! It took a while to perfect.', timestamp: new Date(Date.now() - 6800000), status: 'seen', quotedMessage: { senderId: 'visitor', text: 'The new LightPillar component is amazing!' } },
    { id: 'm6', senderId: 'visitor', text: 'Are you available for a quick project?', timestamp: new Date(Date.now() - 3600000), status: 'delivered' },
    { id: 'm7', senderId: 'visitor', text: 'Need some custom 3D visuals.', timestamp: new Date(Date.now() - 3550000), status: 'delivered' },
    { id: 'm8', senderId: 'admin', text: 'Absolutely. What did you have in mind?', timestamp: new Date(Date.now() - 3400000), status: 'delivered' },
    { id: 'm9', senderId: 'visitor', text: 'Check out the new designs!', timestamp: new Date(Date.now() - 3000000), status: 'sent' },
    { id: 'm10', senderId: 'visitor', text: 'I sent them over via email as well.', timestamp: new Date(Date.now() - 2950000), status: 'sent' },
    { id: 'm12', senderId: 'admin', text: 'Perfect. I will review them right now.', timestamp: new Date(), status: 'sent' },
  ],
  '2': [
    { id: 't1', senderId: 'admin', text: 'Ready for the sync?', timestamp: new Date(Date.now() - 3600000), status: 'seen' },
  ]
};

/**
 * COMPONENTS
 */

const DateDivider = ({ date }: { date: Date }) => {
  let label = format(date, 'MMMM d, yyyy');
  if (isToday(date)) label = 'Today';
  else if (isYesterday(date)) label = 'Yesterday';

  return (
    <div className="flex justify-center my-6">
      <time className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[11px] font-black uppercase tracking-wider border border-slate-200">
        {label}
      </time>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start mb-4 animate-in slide-in-from-left-2">
    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex gap-1">
      {[0, 150, 300].map((delay) => (
        <motion.div
          key={delay}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000 }}
          className="w-1.5 h-1.5 bg-slate-300 rounded-full"
        />
      ))}
    </div>
  </div>
);

const MessageBubble = ({ 
  msg, 
  isMe, 
  isGroupStart,
  isGroupEnd,
  mounted 
}: { 
  msg: any; 
  isMe: boolean; 
  isGroupStart: boolean;
  isGroupEnd: boolean;
  mounted: boolean;
}) => {
  return (
    <div className={cn(
      "flex flex-col group transition-all duration-200", 
      isMe ? "items-end" : "items-start",
      isGroupEnd ? "mb-4" : "mb-1"
    )}>
      <motion.div 
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={cn(
          "max-w-[75%] relative px-4 py-3 shadow-sm",
          isMe 
            ? "bg-primary text-primary-foreground rounded-2xl" 
            : "bg-white text-slate-900 border border-slate-200 rounded-2xl",
          isMe && isGroupEnd && "rounded-br-none",
          !isMe && isGroupEnd && "rounded-bl-none"
        )}
      >
        {msg.quotedMessage && (
          <div className={cn(
            "mb-3 p-2 rounded-xl border-l-4 text-[12px] overflow-hidden",
            isMe ? "bg-black/10 border-white/30" : "bg-slate-50 border-primary/30"
          )}>
            <div className="font-bold mb-1 opacity-60">
              {msg.quotedMessage.senderId === 'admin' ? 'You' : 'Visitor'}
            </div>
            <div className="truncate font-medium">{msg.quotedMessage.text}</div>
          </div>
        )}
        
        <p className="text-[14.5px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
        
        <div className={cn(
          "flex items-center justify-end gap-1.5 mt-2",
          isMe ? "text-primary-foreground/60" : "text-slate-400"
        )}>
          {mounted && <span className="text-[10px] font-bold uppercase tracking-tighter">{format(msg.timestamp, 'p')}</span>}
          {isMe && (
            msg.status === 'seen' ? <CheckCheck className="w-3.5 h-3.5 text-sky-200" /> :
            msg.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> :
            <Check className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Hover Actions Bar */}
        <div className={cn(
          "absolute -top-10 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all flex gap-3 z-10",
          isMe ? "right-0" : "left-0"
        )}>
           <Smile className="w-4 h-4 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
           <MessageSquare className="w-4 h-4 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminChatPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedConv = useMemo(() => 
    mockConversations.find(c => c.id === selectedId), [selectedId]
  );
  
  const messages = useMemo(() => 
    selectedId ? (mockMessages[selectedId] || []) : [], [selectedId]
  );

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, selectedId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const filteredConvs = mockConversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-[#F1F5F9] flex items-center justify-center p-0 md:p-6 lg:p-10">
      <div className="bg-white w-full h-full max-w-[1400px] flex shadow-2xl md:rounded-[32px] border border-slate-200 overflow-hidden relative">
        
        {/* SIDEBAR (INBOX) */}
        <aside className={cn(
          "w-full md:w-[360px] lg:w-[400px] border-r border-slate-100 flex flex-col bg-white z-40 transition-all",
          selectedId && "hidden md:flex"
        )}>
          {/* Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <h1 className="font-black text-2xl tracking-tight font-headline text-slate-900">Inbox</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-50"><Plus className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-50"><EllipsisVertical className="w-5 h-5" /></Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-8 py-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search messages..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 pl-11 pr-4 text-sm font-semibold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="px-4 pb-8 space-y-1">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl transition-all flex gap-4 items-center group relative",
                    selectedId === conv.id ? "bg-primary/5" : "hover:bg-slate-50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                      {conv.avatar && <AvatarImage src={conv.avatar} />}
                      <AvatarFallback className={cn("font-bold text-white", conv.avatarColor)}>{conv.initials}</AvatarFallback>
                    </Avatar>
                    {conv.isOnline && <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-[15px] truncate text-slate-900">{conv.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {mounted ? format(conv.timestamp, 'p') : '--:--'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[13px] truncate flex-1", conv.unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-500")}>
                        {conv.isTyping ? <span className="text-primary animate-pulse">Typing...</span> : conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-black h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* CHAT WINDOW */}
        <main className={cn(
          "flex-1 flex flex-col bg-[#F8FAFC] relative",
          !selectedId && "hidden md:flex"
        )}>
          {selectedConv ? (
            <>
              {/* Header */}
              <header className="h-20 px-10 border-b border-slate-100 bg-white flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-4 text-slate-400" onClick={() => setSelectedId(null)}>
                    <ChevronLeft className="w-7 h-7" />
                  </Button>
                  <Avatar className="w-12 h-12 shadow-sm">
                    {selectedConv.avatar && <AvatarImage src={selectedConv.avatar} />}
                    <AvatarFallback className={cn("font-bold text-white", selectedConv.avatarColor)}>{selectedConv.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 leading-tight">{selectedConv.name}</h2>
                    <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wide">
                      {selectedConv.isOnline ? "Online" : "Away"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary"><Phone className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary"><Video className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary"><Info className="w-5 h-5" /></Button>
                </div>
              </header>

              {/* Message Thread */}
              <ScrollArea className="flex-1 p-8" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-1">
                   {messages.map((msg, idx) => {
                      const isMe = msg.senderId === 'admin';
                      const prevMsg = messages[idx-1];
                      const nextMsg = messages[idx+1];
                      const showDate = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);
                      const isGroupStart = !prevMsg || prevMsg.senderId !== msg.senderId;
                      const isGroupEnd = !nextMsg || nextMsg.senderId !== msg.senderId;

                      return (
                        <div key={msg.id}>
                          {showDate && <DateDivider date={msg.timestamp} />}
                          <MessageBubble 
                            msg={msg} 
                            isMe={isMe} 
                            isGroupStart={isGroupStart}
                            isGroupEnd={isGroupEnd}
                            mounted={mounted}
                          />
                        </div>
                      );
                   })}
                   {selectedConv.isTyping && <TypingIndicator />}
                </div>
              </ScrollArea>

              {/* Composer */}
              <footer className="p-6 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto flex items-end gap-4">
                  <div className="flex gap-1 mb-1">
                    <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 text-slate-400 hover:bg-slate-50"><Plus className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 text-slate-400 hover:bg-slate-50"><ImageIcon className="w-5 h-5" /></Button>
                  </div>

                  <div className="flex-1 relative flex items-center">
                    <textarea 
                      ref={textareaRef}
                      placeholder="Message..."
                      rows={1}
                      className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-6 pr-14 text-[15px] font-medium resize-none focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="absolute right-4 flex items-center">
                       <Smile className="w-5 h-5 text-slate-300 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 shrink-0 mb-0.5",
                      inputText.trim() 
                        ? "bg-primary text-white shadow-primary/20" 
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {inputText.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
               <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-primary/40" />
               </div>
               <h3 className="font-black text-2xl tracking-tight mb-2 font-headline text-slate-900">Your Conversations</h3>
               <p className="text-slate-500 text-sm max-w-[280px] leading-relaxed font-medium">
                 Select a visitor thread from the inbox to manage support requests or collaborate.
               </p>
               <Button className="mt-8 rounded-full h-11 px-8 font-bold shadow-xl shadow-primary/20">New Thread</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
