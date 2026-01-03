'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useFirestore } from '@/firebase';
import {
  collection,
  serverTimestamp,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export function ContactForm() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      const conversationsRef = collection(firestore, 'conversations');
      const q = query(conversationsRef, where('senderEmail', '==', values.email));
      
      const querySnapshot = await getDocs(q);

      const newMessage = {
        senderName: values.name,
        senderEmail: values.email,
        text: values.message,
        sentAt: new Date(),
        sentBy: 'visitor',
      };

      if (querySnapshot.empty) {
        // No existing conversation, create a new one
        await addDoc(conversationsRef, {
          senderName: values.name,
          senderEmail: values.email,
          lastMessageAt: serverTimestamp(),
          messages: [newMessage],
        });
      } else {
        // Existing conversation found, update it
        const conversationDoc = querySnapshot.docs[0];
        await updateDoc(conversationDoc.ref, {
          messages: arrayUnion(newMessage),
          lastMessageAt: serverTimestamp(),
        });
      }

      toast({
        title: 'Message Sent!',
        description: "Thanks for reaching out. I'll get back to you soon.",
      });
      form.reset();
    } catch (e: any) {
        toast({
        variant: 'destructive',
        title: 'Oh no!',
        description: e.message || "There was an error sending your message.",
      });
    }
  }

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea placeholder="Your message here..." {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
