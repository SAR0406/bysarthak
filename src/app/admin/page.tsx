
'use client';

import { useEffect, useState } from 'react';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Send, ArrowLeft } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
} from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Reply cannot be empty.'),
});

type Message = {
  text: string;
  sentAt: { seconds: number; nanoseconds: number } | null;
  sentBy: 'admin' | 'visitor';
  senderName: string;
  senderEmail: string;
};

type Conversation = {
  id: string;
  senderName: string;
  senderEmail: string;
  lastMessageAt: { seconds: number; nanoseconds: number } | null;
  messages: Message[];
};

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'conversations'), orderBy('lastMessageAt', 'desc'));
  }, [firestore, user]);

  const { data: conversations, isLoading } = useCollection<Conversation>(conversationsQuery);

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !selectedConversation) return;
    const conversationRef = doc(firestore, 'conversations', selectedConversation.id);

    const replyData = {
      text: values.replyMessage,
      sentAt: serverTimestamp(),
      sentBy: 'admin',
      senderName: user.displayName || 'Admin',
      senderEmail: user.email || '',
    };

    try {
      await updateDoc(conversationRef, {
        messages: arrayUnion(replyData),
        lastMessageAt: serverTimestamp(),
      });
      replyForm.reset();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Reply Failed',
        description: e.message,
      });
    }
  }
  
  const lastMessage = (convo: Conversation) => {
    if (!convo.messages || convo.messages.length === 0) return { text: "No messages yet", sentAt: convo.lastMessageAt };
    return convo.messages[convo.messages.length - 1];
  }


  if (isUserLoading || !user) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <section id="admin" className="h-screen w-full p-4 md:p-8">
      <div className="h-full rounded-lg border bg-card text-card-foreground shadow-sm flex overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div
          className={cn(
            'w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out flex flex-col',
            selectedConversation && 'hidden md:flex'
          )}
        >
          <div className="p-4 border-b">
            <h2 className="font-headline text-xl font-bold">Messages</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {isLoading && <p className="p-4">Loading messages...</p>}
              {!isLoading && (!conversations || conversations.length === 0) && (
                <p className="p-4 text-muted-foreground">No messages yet.</p>
              )}
              {conversations?.map(convo => {
                const latestMsg = lastMessage(convo);
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo)}
                    className={cn(
                      'w-full text-left p-4 border-b hover:bg-muted/50 transition-colors',
                      selectedConversation?.id === convo.id && 'bg-muted'
                    )}
                  >
                    <div className="font-semibold">{convo.senderName}</div>
                    <p className="text-sm text-muted-foreground truncate">{latestMsg.text}</p>
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {latestMsg.sentAt ? format(new Date(latestMsg.sentAt.seconds * 1000), 'P') : ''}
                    </p>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Chat View */}
        <div className={cn('w-full md:w-2/3 flex flex-col', !selectedConversation && 'hidden md:flex')}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center gap-4">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar>
                  <AvatarFallback>{selectedConversation.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.senderName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedConversation.senderEmail}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages?.map((msg, index) => (
                    <div key={index} className={cn("flex items-start gap-2.5", msg.sentBy === 'admin' && 'justify-end')}>
                       <div className="flex flex-col gap-1 w-full max-w-[320px]">
                         <div className={cn("flex items-center space-x-2 rtl:space-x-reverse", msg.sentBy === 'admin' && 'justify-end')}>
                             <span className="text-sm font-semibold text-card-foreground">{msg.sentBy === 'admin' ? 'Admin' : msg.senderName}</span>
                             <span className="text-xs font-normal text-muted-foreground">{msg.sentAt ? format(new Date(msg.sentAt.seconds * 1000), 'p') : ''}</span>
                         </div>
                         <div className={cn("leading-1.5 p-4 border-gray-200 rounded-e-xl rounded-es-xl", msg.sentBy === 'admin' ? 'bg-primary text-primary-foreground rounded-ss-xl rounded-se-none' : 'bg-muted rounded-es-xl dark:bg-zinc-700')}>
                             <p className="text-sm font-normal">{msg.text}</p>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <Form {...replyForm}>
                  <form
                    onSubmit={replyForm.handleSubmit(handleReply)}
                    className="flex gap-2"
                  >
                    <FormField
                      control={replyForm.control}
                      name="replyMessage"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input placeholder="Type your reply..." {...field} autoComplete="off" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a message to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
