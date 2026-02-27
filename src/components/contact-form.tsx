'use client';

/**
 * @fileOverview Minimalist Visitor Chat Component.
 * High-fidelity aesthetic with Indigo accents and solid surfaces.
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Send, CheckCheck, Loader2, MessageCircle, X } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { serverTimestamp, doc, updateDoc, arrayUnion, Timestamp, setDoc } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Message cannot be empty.')
});

const ADMIN_NAME = 'Sarthak';

export function ContactForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const conversationRef = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return doc(firestore, 'conversations', user.email);
  }, [firestore, user?.email]);
  
  const { data: conversationData, isLoading: isHistoryLoading } = useDoc(conversationRef);
  
  const messages = useMemo(() => {
    return conversationData?.messages || [];
  }, [conversationData]);

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, []);

  useEffect(() => { if (isOpen) setTimeout(scrollToBottom, 100); }, [messages, isOpen, scrollToBottom]);

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !conversationRef) return;
    
    const text = values.replyMessage;
    replyForm.reset();

    const replyData = {
      id: uuidv4(),
      sentBy: 'visitor',
      senderName: user.displayName || user.email!,
      senderEmail: user.email!,
      text: text,
      sentAt: Timestamp.now(),
      readBy: { [user.email!]: Timestamp.now() },
      reactions: {},
    };

    if (conversationData) {
      updateDoc(conversationRef, {
        messages: arrayUnion(replyData),
        lastMessageAt: serverTimestamp(),
      });
    } else {
      setDoc(conversationRef, {
        id: user.email!,
        senderName: user.displayName || user.email!,
        senderEmail: user.email!,
        lastMessageAt: serverTimestamp(),
        messages: [replyData],
      });
    }
  }

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-body">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[360px] sm:w-[400px] h-[580px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-slate-100">
                  <AvatarFallback className="bg-primary text-white font-black text-xs italic">S</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ADMIN_NAME}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Message Thread */}
            <ScrollArea className="flex-1 p-6 bg-[#FBFDFF]" ref={scrollAreaRef}>
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
              ) : !user ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-lg font-headline uppercase italic">Secure Chat</h4>
                    <p className="text-slate-400 text-xs font-medium">Login to start a professional conversation.</p>
                  </div>
                  <Button asChild className="rounded-full h-11 px-8 bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    <Link href="/login">LOG IN</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg: any, idx: number) => {
                    const isMe = msg.sentBy === 'visitor';
                    const prevMsg = messages[idx-1];
                    const showDate = !prevMsg || !isSameDay(msg.sentAt?.toDate() || new Date(), prevMsg.sentAt?.toDate() || new Date());

                    return (
                      <div key={msg.id || idx} className="flex flex-col">
                        {showDate && (
                          <div className="flex justify-center my-6">
                            <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-widest rounded-full">{format(msg.sentAt?.toDate() || new Date(), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        <div className={cn("flex w-full mb-0.5", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[85%] px-4 py-2.5 rounded-[22px] shadow-sm text-[14px] font-medium transition-all",
                            isMe 
                              ? "bg-primary text-white rounded-tr-none shadow-primary/5" 
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                          )}>
                            {msg.text}
                            <div className={cn("text-[9px] flex items-center justify-end gap-1 mt-1 font-bold uppercase opacity-50", isMe ? "text-white" : "text-slate-400")}>
                                {msg.sentAt ? format(msg.sentAt.toDate(), 'p') : ''}
                                {isMe && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input Bar */}
            {user && (
              <div className="p-6 bg-white border-t border-slate-50">
                <Form {...replyForm}>
                  <form onSubmit={replyForm.handleSubmit(handleReply)} className="flex items-center gap-2">
                    <FormField
                      control={replyForm.control}
                      name="replyMessage"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input 
                              placeholder="Message..." 
                              {...field} 
                              autoComplete="off"
                              className="bg-slate-50 border border-transparent rounded-full h-11 px-6 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:border-primary/20 transition-all"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting || !replyForm.watch('replyMessage')} className="rounded-full h-11 w-11 shrink-0 bg-primary shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-20 transition-all">
                      <Send className="h-4 w-4 text-white" />
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className={cn(
          "h-16 w-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center p-0",
          isOpen ? "bg-slate-900 text-white rotate-90" : "bg-primary text-white shadow-primary/40"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-8 w-8" />}
      </Button>
    </div>
  );
}
