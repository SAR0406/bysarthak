'use client';

import { useEffect } from 'react';
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
import { Send } from 'lucide-react';
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

const replySchema = z.object({
  replyMessage: z.string().min(1, 'Reply cannot be empty.'),
});

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  sentAt: { seconds: number; nanoseconds: number } | null;
  replies?: { message: string; sentAt: { seconds: number; nanoseconds: number }; sentBy: string }[];
};

export default function AdminPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const messagesQuery = useMemoFirebase(() => {
    // Only fetch if the user is authenticated
    if (!firestore || !user) return null;
    return query(collection(firestore, 'contact_messages'), orderBy('sentAt', 'desc'));
  }, [firestore, user]);

  const { data: messages, isLoading } = useCollection<ContactMessage>(messagesQuery);

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: '' },
  });

  async function handleReply(messageId: string, replyValues: z.infer<typeof replySchema>) {
    if (!firestore || !user) return;
    const messageRef = doc(firestore, 'contact_messages', messageId);

    const replyData = {
      message: replyValues.replyMessage,
      sentAt: serverTimestamp(),
      sentBy: 'admin',
    };

    try {
      await updateDoc(messageRef, {
        replies: arrayUnion(replyData),
      });
      // This reset might need to be more specific if you have multiple forms
      replyForm.reset();
      toast({
        title: 'Reply Sent!',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Reply Failed',
        description: e.message,
      });
    }
  }

  // Render a loading state or nothing while checking for user
  if (isUserLoading || !user) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <section id="admin" className="container mx-auto py-24">
      <div className="text-center">
        <h2 className="font-headline text-3xl md:text-4xl font-bold">Admin Dashboard</h2>
        <p className="mt-4 text-lg text-muted-foreground">Manage incoming messages.</p>
      </div>

      <div className="mt-12 max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">Messages</h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
          {isLoading && <p>Loading messages...</p>}
          {!isLoading && (!messages || messages.length === 0) && (
            <p>No messages yet.</p>
          )}
          {messages &&
            messages.map(msg => (
              <Card key={msg.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{msg.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{msg.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {msg.sentAt ? format(new Date(msg.sentAt.seconds * 1000), 'PPP p') : 'Just now'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{msg.message}</p>
                  <div className="mt-4 space-y-2 pl-6 border-l">
                    {msg.replies?.map((reply, index) => (
                      <div key={index}>
                        <p className="text-sm">{reply.message}</p>
                        <p className="text-xs text-muted-foreground">
                          - Admin,{' '}
                          {reply.sentAt ? format(new Date(reply.sentAt.seconds * 1000), 'PPP p') : ''}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Form {...replyForm}>
                    <form
                      onSubmit={replyForm.handleSubmit(values => handleReply(msg.id, values))}
                      className="mt-4 flex gap-2"
                    >
                      <FormField
                        control={replyForm.control}
                        name="replyMessage"
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormControl>
                              <Input placeholder="Type your reply..." {...field} />
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
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </section>
  );
}
