'use client';

import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Stepper, { Step } from '@/components/ui/stepper';
import { Github, ToyBrick } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  name: z.string().min(2, "Name must be at least 2 characters."),
  dob: z.date({
    required_error: "A date of birth is required.",
  }),
  username: z.string().min(3, "Username must be at least 3 characters."),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const [flow, setFlow] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', name: '', username: '' },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleOAuth = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Ensure a Firestore document is created or merged for OAuth users
      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        name: user.displayName,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: 'Login Successful',
        description: "You're now logged in.",
      });
      router.push('/');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  }

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        name: values.name,
        dob: values.dob,
        username: values.username,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Account Created',
        description: 'You have been successfully signed up.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    }
  };

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: "You're now logged in.",
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  };

  const renderWelcome = () => (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>Welcome to Sarthak's Portfolio</CardTitle>
        <CardDescription>Check out the next step!</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end gap-4">
        <Button onClick={() => setFlow('login')}>Login</Button>
        <Button variant="secondary" onClick={() => setFlow('signup')}>Sign Up</Button>
      </CardContent>
    </Card>
  );

  const renderLogin = () => (
    <Card className="w-full max-w-md">
      <Stepper
        initialStep={1}
        onFinalStepCompleted={loginForm.handleSubmit(handleLogin)}
        backButtonText='Back'
        nextButtonText='Done'
      >
        <Step>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials or sign in with a provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="your.email@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleOAuth(new GoogleAuthProvider())}>
                <ToyBrick className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuth(new GithubAuthProvider())}>
                <Github className="mr-2 h-4 w-4" /> GitHub
              </Button>
            </div>
          </CardContent>
        </Step>
        <Step>
          <CardHeader>
            <CardTitle>Complete Login</CardTitle>
            <CardDescription>You're one click away from logging in.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Press the "Done" button to complete the login process.</p>
          </CardContent>
        </Step>
      </Stepper>
    </Card>
  );

  const renderSignup = () => (
    <Card className="w-full max-w-md">
      <Stepper
        initialStep={1}
        onFinalStepCompleted={signUpForm.handleSubmit(handleSignUp)}
        backButtonText='Back'
        nextButtonText='Next'
      >
        <Step>
          <CardHeader>
            <CardTitle>Sign Up - Step 1</CardTitle>
            <CardDescription>Enter your email and password or sign up with a provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signUpForm}>
              <form className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="your.email@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
             <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleOAuth(new GoogleAuthProvider())}>
                <ToyBrick className="mr-2 h-4 w-4" /> Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuth(new GithubAuthProvider())}>
                <Github className="mr-2 h-4 w-4" /> GitHub
              </Button>
            </div>
          </CardContent>
        </Step>
        <Step>
          <CardHeader>
            <CardTitle>Sign Up - Step 2</CardTitle>
            <CardDescription>Let's get to know you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signUpForm}>
              <form className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Step>
        <Step>
           <CardHeader>
            <CardTitle>Sign Up - Step 3</CardTitle>
            <CardDescription>A few more details.</CardDescription>
          </CardHeader>
          <CardContent>
             <Form {...signUpForm}>
              <form className="space-y-4">
                 <FormField
                  control={signUpForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl><Input placeholder="your_username" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={signUpForm.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Step>
         <Step>
          <CardHeader>
            <CardTitle>Sign Up Complete</CardTitle>
            <CardDescription>You're all set!</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Press the "Done" button to complete your registration.</p>
          </CardContent>
        </Step>
      </Stepper>
    </Card>
  );

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center">
      {flow === 'welcome' && renderWelcome()}
      {flow === 'login' && renderLogin()}
      {flow === 'signup' && renderSignup()}
    </div>
  );
}
