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
import { Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export function Contact() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", message: "" },
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

      <div className="mt-12 max-w-lg mx-auto">
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
    </section>
  );
}
    