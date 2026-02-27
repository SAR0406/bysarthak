'use client';

/**
 * @fileOverview Production-grade Minimalist Admin Chat Panel.
 * Synchronized with the 'conversations' Firestore collection.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronLeft, 
  Send, 
  CheckCheck,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  Timestamp, 
  collection
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAIL = 'sarthak040624@gmail.com';

export default function AdminChatPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => { setMounted(true); }, []);

  // Fetch all conversations from Firestore
  const convsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'conversations');
  }, [firestore]);
  const { data: conversations, isLoading: isConvsLoading } = useCollection(convsQuery);

  // Fetch selected conversation details in real-time
  const selectedDocRef = useMemoFirebase(() => {
    if (!firestore || !selectedEmail) return null;
    return doc(firestore, 'conversations', selectedEmail);
  }, [firestore, selectedEmail]);
  const { data: conversationData } = useDoc(selectedDocRef);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [conversationData?.messages, selectedEmail]);

  const filteredConvs = conversations?.filter(c => 
    c.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.lastMessageAt?.toMillis() || 0) - (a.lastMessageAt?.toMillis() || 0));

  const handleSendMessage = async () => {
    if (!firestore || !selectedEmail || !inputText.trim() || !user) return;
    
    const text = inputText;
    setInputText('');

    const newMessage = {
      id: uuidv4(),
      text: text,
      senderEmail: ADMIN_EMAIL,
      senderName: user.displayName || 'Admin',
      sentAt: Timestamp.now(),
      sentBy: 'admin',
      readBy: { [ADMIN_EMAIL]: Timestamp.now() },
      reactions: {}
    };
    
    const docRef = doc(firestore, 'conversations', selectedEmail);
    updateDoc(docRef, {
      messages: arrayUnion(newMessage),
      lastMessageAt: Timestamp.now()
    });
  };

  if (!mounted) return null;

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex overflow-hidden font-body">
      {/* Sidebar: Conversation List */}
      <aside className={cn(
        "w-full md:w-[320px] lg:w-[380px] bg-white border-r border-slate-200 flex flex-col z-40 transition-all shrink-0",
        selectedEmail && "hidden md:flex"
      )}>
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-4 font-headline uppercase">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl h-11 pl-10 pr-4 text-sm font-semibold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {isConvsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary/20" /></div>
            ) : filteredConvs?.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedEmail(conv.id)}
                className={cn(
                  "w-full p-4 rounded-3xl transition-all flex gap-3 items-center text-left relative group",
                  selectedEmail === conv.id ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" : "hover:bg-slate-50"
                )}
              >
                <Avatar className="w-12 h-12 shadow-sm border border-slate-100 shrink-0">
                  <AvatarFallback className={cn("font-black text-xs uppercase", selectedEmail === conv.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                    {conv.senderName?.[0] || conv.id[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-sm truncate">{conv.senderName || conv.id}</span>
                    {conv.lastMessageAt && (
                      <span className={cn("text-[10px] font-black uppercase tracking-tighter", selectedEmail === conv.id ? "text-white/60" : "text-slate-400")}>
                        {format(conv.lastMessageAt.toDate(), 'p')}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-[13px] truncate font-medium", selectedEmail === conv.id ? "text-white/80" : "text-slate-500")}>
                    {conv.messages?.[conv.messages.length - 1]?.text || 'No messages'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col bg-white relative",
        !selectedEmail && "hidden md:flex items-center justify-center bg-[#F8FAFC]"
      )}>
        {selectedEmail ? (
          <>
            <header className="h-20 px-6 border-b border-slate-100 flex items-center gap-4 bg-white/90 backdrop-blur-xl z-30 sticky top-0">
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 rounded-full" onClick={() => setSelectedEmail(null)}>
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Avatar className="w-11 h-11 border border-slate-50 shadow-sm shrink-0">
                <AvatarFallback className="bg-primary/5 text-primary font-black text-xs uppercase italic">
                  {selectedEmail[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="font-bold text-base text-slate-900 leading-tight truncate">{selectedEmail}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm" />
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Now</p>
                </div>
              </div>
            </header>

            <ScrollArea className="flex-1 px-6" ref={scrollRef}>
              <div className="max-w-3xl mx-auto py-8 space-y-2">
                {conversationData?.messages?.map((msg: any, idx: number) => {
                  const isMe = msg.sentBy === 'admin';
                  const prevMsg = conversationData.messages[idx - 1];
                  const showDate = !prevMsg || !isSameDay(msg.sentAt?.toDate() || new Date(), prevMsg.sentAt?.toDate() || new Date());
                  
                  return (
                    <div key={msg.id || idx} className="flex flex-col">
                      {showDate && (
                        <div className="flex justify-center my-10">
                          <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                            {format(msg.sentAt?.toDate() || new Date(), 'EEEE, MMMM d')}
                          </span>
                        </div>
                      )}
                      <div className={cn("flex w-full mb-0.5 animate-fade-in-up", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] md:max-w-[70%] px-5 py-3 rounded-[24px] shadow-sm text-[15px] font-medium leading-relaxed tracking-tight",
                          isMe 
                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/10" 
                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                        )}>
                          {msg.text}
                          <div className={cn(
                            "flex items-center justify-end gap-1.5 mt-2 text-[10px] font-black uppercase tracking-tighter",
                            isMe ? "text-white/50" : "text-slate-400"
                          )}>
                            {msg.sentAt && format(msg.sentAt.toDate(), 'p')}
                            {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <footer className="p-6 bg-white border-t border-slate-100 z-40">
              <div className="max-w-3xl mx-auto flex items-end gap-3">
                <div className="flex-1 bg-slate-100 rounded-[28px] border border-slate-200/50 px-6 py-1 transition-all focus-within:ring-4 focus-within:ring-primary/5 focus-within:bg-white focus-within:border-primary/20">
                  <textarea 
                    placeholder="Message..."
                    rows={1}
                    className="w-full bg-transparent border-none py-3 text-[15px] font-semibold resize-none focus:ring-0 outline-none placeholder:text-slate-400 min-h-[48px]"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="rounded-full h-12 w-12 p-0 shrink-0 bg-primary text-white shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <MessageSquare className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="font-black text-2xl text-slate-900 font-headline uppercase tracking-tight">Select Chat</h3>
            <p className="text-slate-400 text-sm max-w-[240px] mt-3 font-semibold leading-relaxed">Choose a visitor conversation from the left to start responding.</p>
          </div>
        )}
      </main>
    </div>
  );
}
