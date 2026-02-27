
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Pin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MOCK DATA
 * Production-ready data shape as requested.
 */
const mockConversations = [
  { id: '1', name: 'Sarthak Upadhyay', avatar: 'https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg', initials: 'SU', avatarColor: 'bg-indigo-500', lastMessage: 'Check out the new designs!', timestamp: new Date(), unreadCount: 2, isOnline: true, isPinned: true, isTyping: false },
  { id: '2', name: 'Design Team', avatar: null, initials: 'DT', avatarColor: 'bg-emerald-500', lastMessage: 'Weekly sync at 10 AM', timestamp: new Date(Date.now() - 3600000), unreadCount: 0, isOnline: false, isPinned: true, isTyping: true },
  { id: '3', name: 'Alex Rivera', avatar: 'https://picsum.photos/seed/alex/100/100', initials: 'AR', avatarColor: 'bg-amber-500', lastMessage: 'Can you send the PDF?', timestamp: new Date(Date.now() - 86400000), unreadCount: 0, isOnline: true, isPinned: false, isTyping: false },
  { id: '4', name: 'Marketing HQ', avatar: null, initials: 'MQ', avatarColor: 'bg-rose-500', lastMessage: 'Campaign live in 5 mins!', timestamp: new Date(Date.now() - 172800000), unreadCount: 5, isOnline: false, isPinned: false, isTyping: false },
  { id: '5', name: 'Jordan Smith', avatar: 'https://picsum.photos/seed/jordan/100/100', initials: 'JS', avatarColor: 'bg-violet-500', lastMessage: 'See you there', timestamp: new Date(Date.now() - 259200000), unreadCount: 0, isOnline: true, isPinned: false, isTyping: false },
  { id: '6', name: 'Freelance Client', avatar: null, initials: 'FC', avatarColor: 'bg-slate-500', lastMessage: 'Invoice approved', timestamp: new Date(Date.now() - 604800000), unreadCount: 0, isOnline: false, isPinned: false, isTyping: false },
  { id: '7', name: 'Project Alpha', avatar: null, initials: 'PA', avatarColor: 'bg-cyan-500', lastMessage: 'New PR submitted', timestamp: new Date(Date.now() - 1209600000), unreadCount: 0, isOnline: true, isPinned: false, isTyping: false },
  { id: '8', name: 'Support Bot', avatar: null, initials: 'SB', avatarColor: 'bg-orange-500', lastMessage: 'How can I help you today?', timestamp: new Date(Date.now() - 2592000000), unreadCount: 1, isOnline: true, isPinned: false, isTyping: false },
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
    { id: 'm11', senderId: 'visitor', text: 'Looking forward to your thoughts.', timestamp: new Date(Date.now() - 2900000), status: 'sent' },
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
      <time className="px-3 py-1 bg-muted/50 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/50">
        {label}
      </time>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start mb-4 animate-in slide-in-from-left-2 duration-200">
    <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-bl-sm max-w-[72%] shadow-sm">
      <div className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <motion.div
            key={delay}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000 }}
            className="w-1.5 h-1.5 bg-foreground/30 rounded-full"
          />
        ))}
      </div>
    </div>
  </div>
);

const MessageBubble = ({ 
  msg, 
  isMe, 
  isLastInGroup, 
  showAvatar 
}: { 
  msg: any; 
  isMe: boolean; 
  isLastInGroup: boolean; 
  showAvatar: boolean 
}) => {
  return (
    <div className={cn("flex flex-col mb-1 group", isMe ? "items-end" : "items-start")}>
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "max-w-[72%] relative px-4 py-2.5 shadow-sm transition-all",
          isMe 
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm" 
            : "bg-white text-foreground border border-border/50 rounded-2xl rounded-bl-sm"
        )}
      >
        {msg.quotedMessage && (
          <div className={cn(
            "mb-2 p-2 rounded-lg border-l-4 bg-black/5 text-[12px] opacity-80",
            isMe ? "border-primary-foreground/50" : "border-primary/50"
          )}>
            <div className="font-bold mb-1">
              {msg.quotedMessage.senderId === 'admin' ? 'You' : 'Visitor'}
            </div>
            <div className="truncate">{msg.quotedMessage.text}</div>
          </div>
        )}
        <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
        
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1 opacity-60",
          isMe ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          <span className="text-[10px] font-bold">{format(msg.timestamp, 'p')}</span>
          {isMe && (
            msg.status === 'seen' ? <CheckCheck className="w-3 h-3 text-sky-400" /> :
            msg.status === 'delivered' ? <CheckCheck className="w-3 h-3" /> :
            <Check className="w-3 h-3" />
          )}
        </div>

        {/* Action Bar on Hover */}
        <div className={cn(
          "absolute -top-8 bg-background border border-border rounded-full px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10",
          isMe ? "right-0" : "left-0"
        )}>
           <Smile className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
           <MessageSquare className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminChatPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedConv = mockConversations.find(c => c.id === selectedId);
  const messages = selectedId ? (mockMessages[selectedId] || []) : [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedId]);

  // Textarea auto-height
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
    <div className="h-screen w-full bg-slate-100 flex items-center justify-center overflow-hidden p-0 md:p-4">
      <div className="bg-background w-full h-full max-w-[1400px] flex shadow-2xl md:rounded-3xl border border-border overflow-hidden relative">
        
        {/* SIDEBAR */}
        <aside className={cn(
          "w-full md:w-[320px] lg:w-[380px] border-r border-border flex flex-col bg-white z-40",
          selectedId && "hidden md:flex"
        )}>
          {/* Sidebar Header */}
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-primary/10">
                <AvatarFallback className="bg-primary text-primary-foreground font-black text-xs">SU</AvatarFallback>
              </Avatar>
              <h1 className="font-black text-lg tracking-tight font-headline">Messages</h1>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:bg-muted"><Plus className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:bg-muted"><EllipsisVertical className="w-5 h-5" /></Button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search conversations..." 
                className="w-full bg-muted/50 border-none rounded-2xl h-10 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                    "w-full p-4 rounded-2xl transition-all flex gap-4 items-center group relative",
                    selectedId === conv.id ? "bg-primary/5 ring-1 ring-primary/10 shadow-sm" : "hover:bg-muted/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="w-14 h-14 shadow-sm">
                      {conv.avatar && <AvatarImage src={conv.avatar} />}
                      <AvatarFallback className={cn("font-black text-white", conv.avatarColor)}>{conv.initials}</AvatarFallback>
                    </Avatar>
                    {conv.isOnline && <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-black text-sm tracking-tight truncate font-headline">{conv.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(conv.timestamp, 'p')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[13px] truncate flex-1 font-medium", conv.unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>
                        {conv.isTyping ? <span className="text-primary animate-pulse">Typing...</span> : conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-black h-5 min-w-5 px-1 rounded-full flex items-center justify-center shadow-md shadow-primary/20 animate-in zoom-in-50">
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
              <header className="h-20 px-6 border-b border-border/50 bg-white flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground" onClick={() => setSelectedId(null)}>
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <div className="relative">
                    <Avatar className="w-11 h-11 ring-1 ring-border shadow-sm">
                      {selectedConv.avatar && <AvatarImage src={selectedConv.avatar} />}
                      <AvatarFallback className={cn("font-black text-white", selectedConv.avatarColor)}>{selectedConv.initials}</AvatarFallback>
                    </Avatar>
                    {selectedConv.isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />}
                  </div>
                  <div>
                    <h2 className="font-black text-sm tracking-tight font-headline">{selectedConv.name}</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {selectedConv.isOnline ? "Active now" : "Last seen 2 min ago"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors"><Phone className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors"><Video className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors"><Info className="w-5 h-5" /></Button>
                </div>
              </header>

              {/* Message Thread */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-1 pb-10">
                   {messages.map((msg, idx) => {
                      const isMe = msg.senderId === 'admin';
                      const prevMsg = messages[idx-1];
                      const showDate = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);
                      const isLastInGroup = !messages[idx+1] || messages[idx+1].senderId !== msg.senderId;

                      return (
                        <div key={msg.id}>
                          {showDate && <DateDivider date={msg.timestamp} />}
                          <MessageBubble 
                            msg={msg} 
                            isMe={isMe} 
                            isLastInGroup={isLastInGroup}
                            showAvatar={isLastInGroup && !isMe}
                          />
                        </div>
                      );
                   })}
                   {selectedConv.isTyping && <TypingIndicator />}
                </div>
              </ScrollArea>

              {/* Input Bar */}
              <footer className="p-6 bg-white border-t border-border/50">
                <div className="max-w-4xl mx-auto flex items-end gap-3">
                  <div className="flex gap-1 mb-1">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:bg-muted"><Plus className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:bg-muted"><Paperclip className="w-5 h-5" /></Button>
                  </div>

                  <div className="flex-1 relative flex items-center">
                    <textarea 
                      ref={textareaRef}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full bg-muted/50 border-none rounded-[24px] py-3 pl-6 pr-12 text-[14px] font-medium resize-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="absolute right-3 flex items-center">
                       <Smile className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: inputText.trim() ? 1.05 : 1 }}
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 shrink-0 mb-0.5",
                      inputText.trim() 
                        ? "bg-primary text-primary-foreground shadow-primary/20" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {inputText.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                  <MessageSquare className="w-16 h-16 text-primary/30 relative z-10" />
               </div>
               <h3 className="font-black text-2xl tracking-tight mb-3 font-headline">Your Messages</h3>
               <p className="text-muted-foreground text-[15px] font-medium max-w-sm leading-relaxed">
                 Select a conversation from the sidebar to start chatting or manage your support requests.
               </p>
               <Button className="mt-8 rounded-full h-12 px-8 bg-primary-gradient border-none shadow-xl shadow-primary/20 font-bold">New Chat</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

