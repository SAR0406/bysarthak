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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Reply cannot be empty.'),
});

type Reply = {
  message: string;
  sentAt: { seconds: number; nanoseconds: number };
  sentBy: 'admin' | string;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  sentAt: { seconds: number; nanoseconds: number } | null;
  replies?: Reply[];
};

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'contact_messages'), orderBy('sentAt', 'desc'));
  }, [firestore, user]);

  const { data: messages, isLoading } = useCollection<ContactMessage>(messagesQuery);

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  async function handleReply(values: z.infer<typeof replySchema>) {
    if (!firestore || !user || !selectedMessage) return;
    const messageRef = doc(firestore, 'contact_messages', selectedMessage.id);

    const replyData = {
      message: values.replyMessage,
      sentAt: serverTimestamp(),
      sentBy: 'admin',
    };

    try {
      await updateDoc(messageRef, {
        replies: arrayUnion(replyData),
      });
      replyForm.reset();
      // No toast needed for a chat interface, the message will appear instantly
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Reply Failed',
        description: e.message,
      });
    }
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
            'w-full md:w-1/3 border-r transition-transform duration-300 ease-in-out',
            selectedMessage && 'hidden md:flex flex-col'
          )}
        >
          <div className="p-4 border-b">
            <h2 className="font-headline text-xl font-bold">Messages</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {isLoading && <p className="p-4">Loading messages...</p>}
              {!isLoading && (!messages || messages.length === 0) && (
                <p className="p-4 text-muted-foreground">No messages yet.</p>
              )}
              {messages?.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={cn(
                    'w-full text-left p-4 border-b hover:bg-muted/50 transition-colors',
                    selectedMessage?.id === msg.id && 'bg-muted'
                  )}
                >
                  <div className="font-semibold">{msg.name}</div>
                  <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {msg.sentAt ? format(new Date(msg.sentAt.seconds * 1000), 'P') : ''}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Chat View */}
        <div className={cn('w-full md:w-2/3 flex flex-col', !selectedMessage && 'hidden md:flex')}>
          {selectedMessage ? (
            <>
              <div className="p-4 border-b flex items-center gap-4">
                 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedMessage(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar>
                  <AvatarFallback>{selectedMessage.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedMessage.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedMessage.email}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Original Message */}
                  <div className="flex gap-2.5">
                    <div className="flex flex-col gap-1 w-full max-w-[320px]">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                         <span className="text-sm font-semibold text-card-foreground">{selectedMessage.name}</span>
                         <span className="text-xs font-normal text-muted-foreground">{selectedMessage.sentAt ? format(new Date(selectedMessage.sentAt.seconds * 1000), 'p') : ''}</span>
                      </div>
                      <div className="leading-1.5 p-4 border-gray-200 bg-muted rounded-e-xl rounded-es-xl dark:bg-zinc-700">
                         <p className="text-sm font-normal text-card-foreground">{selectedMessage.message}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Replies */}
                  {selectedMessage.replies?.map((reply, index) => (
                    <div key={index} className={cn("flex items-start gap-2.5", reply.sentBy === 'admin' && 'justify-end')}>
                       <div className="flex flex-col gap-1 w-full max-w-[320px]">
                         <div className={cn("flex items-center space-x-2 rtl:space-x-reverse", reply.sentBy === 'admin' && 'justify-end')}>
                             <span className="text-sm font-semibold text-card-foreground">{reply.sentBy === 'admin' ? 'Admin' : selectedMessage.name}</span>
                             <span className="text-xs font-normal text-muted-foreground">{reply.sentAt ? format(new Date(reply.sentAt.seconds * 1000), 'p') : ''}</span>
                         </div>
                         <div className={cn("leading-1.5 p-4 border-gray-200 rounded-e-xl rounded-es-xl", reply.sentBy === 'admin' ? 'bg-primary text-primary-foreground rounded-ss-xl rounded-se-none' : 'bg-muted rounded-es-xl')}>
                             <p className="text-sm font-normal">{reply.message}</p>
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
