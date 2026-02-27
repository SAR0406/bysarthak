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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MOCK DATA
 */
const mockConversations = [
  { id: '1', name: 'Sarthak Upadhyay', avatar: 'https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg', initials: 'SU', avatarColor: 'bg-indigo-500', lastMessage: 'Check out the new designs!', timestamp: new Date(), unreadCount: 2, isOnline: true, isPinned: true, isTyping: false },
  { id: '2', name: 'Design Team', avatar: null, initials: 'DT', avatarColor: 'bg-emerald-500', lastMessage: 'Weekly sync at 10 AM', timestamp: new Date(Date.now() - 3600000), unreadCount: 0, isOnline: false, isPinned: true, isTyping: true },
  { id: '3', name: 'Alex Rivera', avatar: 'https://picsum.photos/seed/alex/100/100', initials: 'AR', avatarColor: 'bg-amber-500', lastMessage: 'Can you send the PDF?', timestamp: new Date(Date.now() - 86400000), unreadCount: 0, isOnline: true, isPinned: false, isTyping: false },
  { id: '4', name: 'Marketing HQ', avatar: null, initials: 'MQ', avatarColor: 'bg-rose-500', lastMessage: 'Campaign live in 5 mins!', timestamp: new Date(Date.now() - 172800000), unreadCount: 5, isOnline: false, isPinned: false, isTyping: false },
];

const mockMessages: Record<string, any[]> = {
  '1': [
    { id: 'm1', senderId: 'visitor', text: 'Hey Sarthak! Hope you are doing well.', timestamp: new Date(Date.now() - 7200000), status: 'seen' },
    { id: 'm2', senderId: 'admin', text: 'I am doing great! How can I help you today?', timestamp: new Date(Date.now() - 7100000), status: 'seen' },
    { id: 'm3', senderId: 'visitor', text: 'I saw your latest portfolio updates.', timestamp: new Date(Date.now() - 7000000), status: 'seen' },
    { id: 'm4', senderId: 'visitor', text: 'The new LightPillar component is amazing!', timestamp: new Date(Date.now() - 6950000), status: 'seen' },
    { id: 'm5', senderId: 'admin', text: 'Thank you! It took a while to perfect the shaders.', timestamp: new Date(Date.now() - 6800000), status: 'seen', quotedMessage: { senderId: 'visitor', text: 'The new LightPillar component is amazing!' } },
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
      <time className="px-4 py-1 bg-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-300">
        {label}
      </time>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start mb-4 animate-in slide-in-from-left-2 duration-200">
    <div className="bg-white text-slate-900 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100">
      <div className="flex gap-1">
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
  </div>
);

const MessageBubble = ({ 
  msg, 
  isMe, 
  mounted 
}: { 
  msg: any; 
  isMe: boolean; 
  mounted: boolean;
}) => {
  return (
    <div className={cn("flex flex-col mb-1 group", isMe ? "items-end" : "items-start")}>
      <motion.div 
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={cn(
          "max-w-[75%] relative px-4 py-3 shadow-md transition-all",
          isMe 
            ? "bg-primary-gradient text-white rounded-[24px] rounded-br-none" 
            : "bg-white text-slate-900 border border-slate-200 rounded-[24px] rounded-bl-none"
        )}
      >
        {msg.quotedMessage && (
          <div className={cn(
            "mb-3 p-2 rounded-xl border-l-4 text-[12px] overflow-hidden",
            isMe ? "bg-black/10 border-white/30" : "bg-slate-50 border-primary/30"
          )}>
            <div className="font-black mb-1 opacity-60">
              {msg.quotedMessage.senderId === 'admin' ? 'You' : 'Visitor'}
            </div>
            <div className="truncate font-medium">{msg.quotedMessage.text}</div>
          </div>
        )}
        <p className="text-[14px] leading-relaxed font-semibold whitespace-pre-wrap">{msg.text}</p>
        
        <div className={cn(
          "flex items-center justify-end gap-1.5 mt-2 font-black uppercase tracking-tighter",
          isMe ? "text-white/60" : "text-slate-400"
        )}>
          {mounted && <span className="text-[10px]">{format(msg.timestamp, 'p')}</span>}
          {isMe && (
            msg.status === 'seen' ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" /> :
            msg.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> :
            <Check className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Hover Actions */}
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
      <div className="bg-white w-full h-full max-w-[1440px] flex shadow-2xl md:rounded-[40px] border border-slate-200 overflow-hidden relative">
        
        {/* SIDEBAR */}
        <aside className={cn(
          "w-full md:w-[360px] lg:w-[420px] border-r border-slate-100 flex flex-col bg-white z-40 transition-all",
          selectedId && "hidden md:flex"
        )}>
          {/* Sidebar Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-4 ring-primary/5">
                <AvatarFallback className="bg-primary-gradient text-white font-black text-sm">SU</AvatarFallback>
              </Avatar>
              <h1 className="font-black text-2xl tracking-tight font-headline text-slate-900">Inbox</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:bg-slate-50"><Plus className="w-6 h-6" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:bg-slate-50"><EllipsisVertical className="w-6 h-6" /></Button>
            </div>
          </div>

          {/* Search */}
          <div className="px-8 py-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search messages..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] h-12 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conv List */}
          <ScrollArea className="flex-1">
            <div className="px-4 pb-12 space-y-2">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full p-5 rounded-[30px] transition-all flex gap-4 items-center group relative",
                    selectedId === conv.id ? "bg-primary/5 shadow-inner" : "hover:bg-slate-50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="w-16 h-16 shadow-md border-2 border-white">
                      {conv.avatar && <AvatarImage src={conv.avatar} />}
                      <AvatarFallback className={cn("font-black text-white text-lg", conv.avatarColor)}>{conv.initials}</AvatarFallback>
                    </Avatar>
                    {conv.isOnline && <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-black text-[15px] tracking-tight truncate font-headline text-slate-900">{conv.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {mounted ? format(conv.timestamp, 'p') : '--:--'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[13px] truncate flex-1 font-semibold", conv.unreadCount > 0 ? "text-slate-900" : "text-slate-400")}>
                        {conv.isTyping ? <span className="text-primary animate-pulse">Typing...</span> : conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary-gradient text-white text-[10px] font-black h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 animate-in zoom-in-50">
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
              {/* Chat Header */}
              <header className="h-24 px-10 border-b border-slate-100 bg-white flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-5">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-4 text-slate-400" onClick={() => setSelectedId(null)}>
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <div className="relative">
                    <Avatar className="w-14 h-14 ring-2 ring-slate-100 shadow-md">
                      {selectedConv.avatar && <AvatarImage src={selectedConv.avatar} />}
                      <AvatarFallback className={cn("font-black text-white text-lg", selectedConv.avatarColor)}>{selectedConv.initials}</AvatarFallback>
                    </Avatar>
                    {selectedConv.isOnline && <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />}
                  </div>
                  <div>
                    <h2 className="font-black text-lg tracking-tight font-headline text-slate-900">{selectedConv.name}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">
                      {selectedConv.isOnline ? <span className="text-emerald-500">Active Now</span> : "Last seen recently"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400 hover:text-primary hover:bg-slate-50 transition-all"><Phone className="w-6 h-6" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400 hover:text-primary hover:bg-slate-50 transition-all"><Video className="w-6 h-6" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400 hover:text-primary hover:bg-slate-50 transition-all"><Info className="w-6 h-6" /></Button>
                </div>
              </header>

              {/* Message Thread */}
              <ScrollArea className="flex-1 p-8" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-1.5 pb-12">
                   {messages.map((msg, idx) => {
                      const isMe = msg.senderId === 'admin';
                      const prevMsg = messages[idx-1];
                      const showDate = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);

                      return (
                        <div key={msg.id}>
                          {showDate && <DateDivider date={msg.timestamp} />}
                          <MessageBubble 
                            msg={msg} 
                            isMe={isMe} 
                            mounted={mounted}
                          />
                        </div>
                      );
                   })}
                   {selectedConv.isTyping && <TypingIndicator />}
                </div>
              </ScrollArea>

              {/* Input Bar */}
              <footer className="p-8 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto flex items-end gap-5">
                  <div className="flex gap-2 mb-1.5">
                    <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400 hover:bg-slate-50 transition-colors"><Plus className="w-6 h-6" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400 hover:bg-slate-50 transition-colors"><Paperclip className="w-6 h-6" /></Button>
                  </div>

                  <div className="flex-1 relative flex items-center">
                    <textarea 
                      ref={textareaRef}
                      placeholder="Write your message..."
                      rows={1}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[30px] py-4 pl-8 pr-16 text-[15px] font-bold resize-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="absolute right-5 flex items-center">
                       <Smile className="w-6 h-6 text-slate-300 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    animate={{ scale: inputText.trim() ? 1.05 : 1 }}
                    className={cn(
                      "h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 shrink-0 mb-1",
                      inputText.trim() 
                        ? "bg-primary-gradient text-white shadow-primary/30" 
                        : "bg-slate-100 text-slate-300"
                    )}
                  >
                    {inputText.trim() ? <Send className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </motion.button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-700">
               <div className="w-40 h-40 bg-primary/5 rounded-full flex items-center justify-center mb-10 relative">
                  <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full" />
                  <MessageSquare className="w-20 h-20 text-primary/30 relative z-10" />
               </div>
               <h3 className="font-black text-3xl tracking-tight mb-4 font-headline text-slate-900">Your Conversations</h3>
               <p className="text-slate-500 text-[16px] font-bold max-w-sm leading-relaxed">
                 Select a visitor thread from the inbox to manage support requests or collaborate with your team.
               </p>
               <Button className="mt-10 rounded-full h-14 px-10 bg-primary-gradient border-none shadow-2xl shadow-primary/30 font-black text-lg">New Thread</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
