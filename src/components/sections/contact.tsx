"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Github, Linkedin, Send, Twitter } from "lucide-react";
import Link from "next/link";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, doc, updateDoc, arrayUnion, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { format } from "date-fns";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

const replySchema = z.object({
  replyMessage: z.string().min(1, "Reply cannot be empty."),
});

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  sentAt: { seconds: number, nanoseconds: number } | null;
  replies?: { message: string; sentAt: { seconds: number, nanoseconds: number } }[];
}

export function Contact() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "contact_messages"), orderBy("sentAt", "desc"));
  }, [firestore, user]);

  const { data: messages, isLoading } = useCollection<ContactMessage>(messagesQuery);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { replyMessage: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    const contactMessagesRef = collection(firestore, "contact_messages");
    const messageData = { ...values, sentAt: serverTimestamp(), replies: [] };
    addDocumentNonBlocking(contactMessagesRef, messageData);
    toast({
      title: "Message Sent!",
      description: "Thanks for reaching out. I'll get back to you soon.",
    });
    form.reset();
  }

  async function handleReply(messageId: string, replyValues: z.infer<typeof replySchema>) {
    if (!firestore || !user) return;
    const messageRef = doc(firestore, "contact_messages", messageId);
    
    const replyData = {
      message: replyValues.replyMessage,
      sentAt: serverTimestamp(),
      sentBy: "admin",
    };

    try {
      await updateDoc(messageRef, {
        replies: arrayUnion(replyData)
      });
      replyForm.reset();
       toast({
        title: "Reply Sent!",
      });
    } catch(e: any) {
       toast({
        variant: "destructive",
        title: "Reply Failed",
        description: e.message,
      });
    }
  }

  return (
    <section id="contact" className="container mx-auto py-24">
      <div className="text-center mb-12">
        <h3 className="text-xl font-semibold">Connect with me</h3>
        <p className="text-muted-foreground mt-2">Find me on social media</p>
        <div className="flex justify-center gap-6 mt-6">
            <Link href="https://github.com/SAR0406" target="_blank" rel="noopener noreferrer" className="animate-float" style={{animationDelay: '0s'}}>
                <Button variant="outline" size="icon" className="w-16 h-16 rounded-full"><Github className="w-8 h-8"/></Button>
            </Link>
            <Link href="#" className="animate-float" style={{animationDelay: '0.2s'}}>
                <Button variant="outline" size="icon" className="w-16 h-16 rounded-full"><Linkedin className="w-8 h-8"/></Button>
            </Link>
            <Link href="#" className="animate-float" style={{animationDelay: '0.4s'}}>
                <Button variant="outline" size="icon" className="w-16 h-16 rounded-full"><Twitter className="w-8 h-8"/></Button>
            </Link>
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-headline text-3xl md:text-4xl font-bold">Get In Touch</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Have a project in mind or just want to say hi? I'd love to hear from you.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea placeholder="Your message here..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                )}/>
                <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
            </form>
            </Form>
        </div>
        
        <div className="space-y-4">
           {user ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">Messages</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                {isLoading && <p>Loading messages...</p>}
                {messages && messages.map((msg) => (
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
                             {msg.sentAt ? format(new Date(msg.sentAt.seconds * 1000), "PPP p") : 'Just now'}
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
                               - Admin, {reply.sentAt ? format(new Date(reply.sentAt.seconds * 1000), "PPP p") : ''}
                             </p>
                          </div>
                        ))}
                      </div>
                      {user && (
                        <Form {...replyForm}>
                          <form onSubmit={replyForm.handleSubmit((values) => handleReply(msg.id, values))} className="mt-4 flex gap-2">
                             <FormField control={replyForm.control} name="replyMessage" render={({ field }) => (
                                <FormItem className="flex-grow"><FormControl><Input placeholder="Type your reply..." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <Button type="submit" size="icon" disabled={replyForm.formState.isSubmitting}><Send className="h-4 w-4"/></Button>
                          </form>
                        </Form>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
           ) : (
             <div className="flex flex-col items-center justify-center space-y-8 text-center h-full rounded-lg bg-card/50 p-8">
                <div className='text-center'>
                    <h3 className="text-2xl font-bold">Let's Connect</h3>
                    <p className="text-muted-foreground mt-2">I'm always open to new ideas and collaborations.</p>
                </div>
            </div>
           )}
        </div>
      </div>
    </section>
  );
}
    