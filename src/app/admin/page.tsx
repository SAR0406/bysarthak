'use client';

/**
 * @fileOverview Production-grade Chat Panel UI (2025 Design Brief).
 * 
 * DESIGN DECISIONS:
 * 1. Directional Bubbles: Features "tails" and clustered radii to mirror high-end messaging apps (WhatsApp/iMessage).
 * 2. Solid Surface UI: Replaced messy transparency with solid white/slate surfaces for maximum legibility.
 * 3. Pro Componentization: Uses a three-zone layout (Sidebar / Chat / Info) optimized for power users.
 * 4. Hydration Safety: All time-sensitive formatting is deferred until mount to prevent SSR mismatches.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
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
  Image as ImageIcon,
  Pin,
  X,
  User,
  Files,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MOCK DATA (As requested in brief)
 */
const mockConversations = [
  { id: '1', name: 'Sarthak Upadhyay', avatar: 'https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg', initials: 'SU', avatarColor: 'bg-indigo-500', lastMessage: 'Check out the new designs!', timestamp: new Date(), unreadCount: 2, isOnline: true, isPinned: true, isTyping: false },
  { id: '2', name: 'Product Team', avatar: null, initials: 'PT', avatarColor: 'bg-emerald-500', lastMessage: 'The sprint starts tomorrow.', timestamp: new Date(Date.now() - 3600000), unreadCount: 0, isOnline: false, isPinned: true, isTyping: true },
  { id: '3', name: 'Alex Rivera', avatar: 'https://picsum.photos/seed/alex/100/100', initials: 'AR', avatarColor: 'bg-amber-500', lastMessage: 'Can you send the PDF?', timestamp: new Date(Date.now() - 86400000), unreadCount: 0, isOnline: true, isPinned: false, isTyping: false },
  { id: '4', name: 'Marketing HQ', avatar: null, initials: 'MH', avatarColor: 'bg-rose-500', lastMessage: 'Campaign live in 5 mins!', timestamp: new Date(Date.now() - 172800000), unreadCount: 5, isOnline: false, isPinned: false, isTyping: false },
  { id: '5', name: 'James Wilson', avatar: 'https://picsum.photos/seed/james/100/100', initials: 'JW', avatarColor: 'bg-blue-500', lastMessage: 'Sounds good to me.', timestamp: new Date(Date.now() - 259200000), unreadCount: 0, isOnline: true, isPinned: false, isTyping: false },
  { id: '6', name: 'Dev Squad', avatar: null, initials: 'DS', avatarColor: 'bg-slate-700', lastMessage: 'Bug fixed in production.', timestamp: new Date(Date.now() - 345600000), unreadCount: 0, isOnline: false, isPinned: false, isTyping: false },
  { id: '7', name: 'Sarah Chen', avatar: 'https://picsum.photos/seed/sarah/100/100', initials: 'SC', avatarColor: 'bg-orange-500', lastMessage: 'Did you see the mail?', timestamp: new Date(Date.now() - 432000000), unreadCount: 1, isOnline: true, isPinned: false, isTyping: false },
  { id: '8', name: 'Client X', avatar: null, initials: 'CX', avatarColor: 'bg-purple-500', lastMessage: 'Invoice paid, thanks!', timestamp: new Date(Date.now() - 518400000), unreadCount: 0, isOnline: false, isPinned: false, isTyping: false },
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
    { id: 'm11', senderId: 'visitor', text: 'Let me know what you think.', timestamp: new Date(Date.now() - 2900000), status: 'sent' },
    { id: 'm12', senderId: 'admin', text: 'Perfect. I will review them right now.', timestamp: new Date(), status: 'sent' },
  ],
  '2': [
    { id: 't1', senderId: 'admin', text: 'Ready for the sprint sync?', timestamp: new Date(Date.now() - 3600000), status: 'seen' },
    { id: 't2', senderId: 'visitor', text: 'Almost, just finishing the docs.', timestamp: new Date(Date.now() - 3500000), status: 'seen' },
  ]
};

/**
 * SUB-COMPONENTS
 */

const DateDivider = ({ date }: { date: Date }) => {
  let label = format(date, 'MMMM d, yyyy');
  if (isToday(date)) label = 'Today';
  else if (isYesterday(date)) label = 'Yesterday';

  return (
    <div className="flex justify-center my-6">
      <time className="px-4 py-1 bg-slate-100 text-slate-500 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm">
        {label}
      </time>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start mb-4 animate-fade-in-up">
    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex gap-1 items-center">
      {[0, 150, 300].map((delay) => (
        <motion.div
          key={delay}
          animate={{ y: [0, -3, 0] }}
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
  isGroupEnd,
  mounted 
}: { 
  msg: any; 
  isMe: boolean; 
  isGroupEnd: boolean;
  mounted: boolean;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col group relative", 
        isMe ? "items-end" : "items-start",
        isGroupEnd ? "mb-6" : "mb-1"
      )}
    >
      <div className={cn(
        "max-w-[72%] relative px-4 py-2.5 shadow-sm transition-all",
        isMe 
          ? "bg-primary text-primary-foreground rounded-[18px] rounded-br-[4px]" 
          : "bg-white text-slate-900 border border-slate-200 rounded-[18px] rounded-bl-[4px]",
        !isGroupEnd && (isMe ? "rounded-br-[18px]" : "rounded-bl-[18px]")
      )}>
        {msg.quotedMessage && (
          <div className={cn(
            "mb-2 p-2 rounded-lg border-l-4 text-[12px] overflow-hidden bg-black/5",
            isMe ? "border-white/30" : "border-primary/30"
          )}>
            <div className="font-bold mb-1 opacity-60">
              {msg.quotedMessage.senderId === 'admin' ? 'You' : 'Visitor'}
            </div>
            <div className="truncate font-medium">{msg.quotedMessage.text}</div>
          </div>
        )}
        
        <p className="text-[14.5px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
        
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isMe ? "text-primary-foreground/60" : "text-slate-400"
        )}>
          {mounted && <span className="text-[10px] font-bold">{format(msg.timestamp, 'p')}</span>}
          {isMe && (
            msg.status === 'seen' ? <CheckCheck className="w-3 h-3 text-sky-200" /> :
            msg.status === 'delivered' ? <CheckCheck className="w-3 h-3" /> :
            <Check className="w-3 h-3" />
          )}
        </div>

        {/* Action Bar on Hover */}
        <div className={cn(
          "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20",
          isMe ? "-left-12" : "-right-12"
        )}>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-md border border-slate-100">
              <Smile className="w-4 h-4 text-slate-500" />
           </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function AdminChatPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
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
    <div className="h-screen w-full bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
      <div className="w-full h-full max-w-[1440px] flex bg-white md:shadow-2xl overflow-hidden relative">
        
        {/* SIDEBAR (300px Fixed) */}
        <aside className={cn(
          "w-full md:w-[320px] lg:w-[360px] border-r border-slate-100 flex flex-col bg-white z-40 transition-all",
          selectedId && "hidden md:flex"
        )}>
          {/* Sidebar Header */}
          <div className="p-6 flex items-center justify-between">
            <h1 className="font-black text-2xl tracking-tight text-slate-900 font-headline">Inbox</h1>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-slate-400 hover:bg-slate-50"><Plus className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-slate-400 hover:bg-slate-50"><Settings className="w-5 h-5" /></Button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 pb-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
              <input 
                placeholder="Search..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl h-10 pl-10 pr-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conv List */}
          <ScrollArea className="flex-1">
            <div className="px-3 pb-8 space-y-1">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl transition-all flex gap-3 items-center group relative",
                    selectedId === conv.id ? "bg-primary/5" : "hover:bg-slate-50"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                      {conv.avatar && <AvatarImage src={conv.avatar} />}
                      <AvatarFallback className={cn("font-bold text-white", conv.avatarColor)}>{conv.initials}</AvatarFallback>
                    </Avatar>
                    {conv.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-black text-sm tracking-tight truncate font-headline text-slate-900">{conv.name}</span>
                      {mounted && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {format(conv.timestamp, 'p')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[13px] truncate flex-1 font-medium", conv.unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-500")}>
                        {conv.isTyping ? <span className="text-primary animate-pulse">Typing...</span> : conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-black h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                      {conv.isPinned && <Pin className="w-3 h-3 text-slate-300 fill-slate-300" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* CHAT AREA (Flexible) */}
        <main className={cn(
          "flex-1 flex flex-col bg-[#F8FAFC] relative",
          !selectedId && "hidden md:flex"
        )}>
          {selectedConv ? (
            <>
              {/* Header */}
              <header className="h-20 px-6 border-b border-slate-100 bg-white flex items-center justify-between z-30">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-400" onClick={() => setSelectedId(null)}>
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Avatar className="w-10 h-10 shadow-sm border border-slate-50">
                    {selectedConv.avatar && <AvatarImage src={selectedConv.avatar} />}
                    <AvatarFallback className={cn("font-bold text-white", selectedConv.avatarColor)}>{selectedConv.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 leading-tight">{selectedConv.name}</h2>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                      {selectedConv.isOnline ? "Active now" : "Last seen 2m ago"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary"><Phone className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary"><Video className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className={cn("rounded-full h-10 w-10 text-slate-400 transition-colors", showInfo && "text-primary bg-primary/5")} onClick={() => setShowInfo(!showInfo)}>
                    <Info className="w-5 h-5" />
                  </Button>
                </div>
              </header>

              {/* Thread */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="max-w-3xl mx-auto">
                   {messages.map((msg, idx) => {
                      const isMe = msg.senderId === 'admin';
                      const prevMsg = messages[idx-1];
                      const nextMsg = messages[idx+1];
                      const showDate = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);
                      const isGroupEnd = !nextMsg || nextMsg.senderId !== msg.senderId;

                      return (
                        <div key={msg.id}>
                          {showDate && <DateDivider date={msg.timestamp} />}
                          <MessageBubble 
                            msg={msg} 
                            isMe={isMe} 
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
              <footer className="p-4 bg-white border-t border-slate-100 z-20">
                <div className="max-w-3xl mx-auto flex items-end gap-3">
                  <div className="flex gap-1 mb-1">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:bg-slate-50"><Plus className="w-5 h-5" /></Button>
                  </div>

                  <div className="flex-1 relative flex items-center bg-slate-50 rounded-2xl border border-slate-100 p-1">
                    <textarea 
                      ref={textareaRef}
                      placeholder="Message..."
                      rows={1}
                      className="w-full bg-transparent border-none py-2.5 pl-4 pr-12 text-[14.5px] font-medium resize-none focus:ring-0 outline-none placeholder:text-slate-400"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="absolute right-2 flex items-center">
                       <Smile className="w-5 h-5 text-slate-300 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 shrink-0 mb-0.5",
                      inputText.trim() 
                        ? "bg-primary text-white" 
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
               <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-primary/40" />
               </div>
               <h3 className="font-black text-2xl tracking-tight mb-2 font-headline text-slate-900">Your Messages</h3>
               <p className="text-slate-500 text-sm max-w-[280px] leading-relaxed font-medium">
                 Select a thread from the inbox to manage conversations or support requests.
               </p>
            </div>
          )}
        </main>

        {/* INFO PANEL (Collapsible) */}
        <AnimatePresence>
          {showInfo && selectedConv && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-100 bg-white flex flex-col overflow-hidden hidden lg:flex"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Details</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowInfo(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6 text-center">
                   <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-xl">
                      {selectedConv.avatar && <AvatarImage src={selectedConv.avatar} />}
                      <AvatarFallback className={cn("text-2xl font-bold text-white", selectedConv.avatarColor)}>{selectedConv.initials}</AvatarFallback>
                   </Avatar>
                   <h4 className="font-black text-xl text-slate-900 font-headline">{selectedConv.name}</h4>
                   <p className="text-sm text-slate-500 font-medium">Customer Support Thread</p>
                   
                   <div className="grid grid-cols-3 gap-2 mt-8">
                      <Button variant="outline" className="flex flex-col h-16 rounded-xl border-slate-100 bg-slate-50 hover:bg-slate-100">
                        <User className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Profile</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col h-16 rounded-xl border-slate-100 bg-slate-50 hover:bg-slate-100">
                        <Search className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Find</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col h-16 rounded-xl border-slate-100 bg-slate-50 hover:bg-slate-100">
                        <Files className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Shared</span>
                      </Button>
                   </div>
                </div>

                <div className="p-6 space-y-6 border-t border-slate-50">
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Settings</h5>
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-sm font-semibold rounded-xl text-slate-700">Notifications</Button>
                      <Button variant="ghost" className="w-full justify-start text-sm font-semibold rounded-xl text-slate-700">Block User</Button>
                      <Button variant="ghost" className="w-full justify-start text-sm font-semibold rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5">Delete Chat</Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
