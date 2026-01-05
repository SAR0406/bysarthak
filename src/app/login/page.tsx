
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
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Stepper, { Step } from '@/components/ui/stepper';
import { Github, ToyBrick, LogIn, UserPlus } from 'lucide-react';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  name: z.string().min(2, "Name must be at least 2 characters."),
  age: z.coerce.number().min(1, "Age is required."),
  username: z.string().min(3, "Username must be at least 3 characters."),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const ADMIN_EMAIL = 'sarthak040624@gmail.com';

export default function LoginPage() {
  const [flow, setFlow] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', name: '', username: '', age: undefined },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const ensureAdminRole = async (user: User) => {
    if (user.email === ADMIN_EMAIL && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data()?.isAdmin) {
        return; // Admin role already set
      }
      // Set the admin flag
      await setDoc(userRef, { isAdmin: true }, { merge: true });
    }
  };

  const handleSuccessfulLogin = async (user: User) => {
    if(!firestore) return;
    
    // Ensure the user document exists and has the admin role if applicable
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            name: user.displayName,
            createdAt: serverTimestamp(),
        }, { merge: true });
    }

    await ensureAdminRole(user);

    toast({
      title: 'Login Successful',
      description: "You're now logged in.",
    });
    router.push('/');
  }

  const handleOAuth = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    if(!auth || !firestore) return;
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  }

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    if(!auth || !firestore) return;
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
        age: values.age,
        username: values.username,
        createdAt: serverTimestamp(),
      });
      
      await handleSuccessfulLogin(user);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    }
  };

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    if(!auth) return;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    }
  };
  
  const renderWelcome = () => (
    <Card className='w-full max-w-md animate-fade-in-up'>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome</CardTitle>
        <CardDescription>Sign in or create an account to continue</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button size="lg" onClick={() => setFlow('login')}>
            <LogIn className="mr-2 h-4 w-4" /> Login
        </Button>
        <Button size="lg" variant="outline" onClick={() => setFlow('signup')}>
            <UserPlus className="mr-2 h-4 w-4" /> Sign Up
        </Button>
      </CardContent>
    </Card>
  );

  const renderLogin = () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
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
            <CardTitle>Create Account</CardTitle>
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
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>A few more details to complete your profile.</CardDescription>
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
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Your Age" {...field} />
                      </FormControl>
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
            <p>Press the "Done" button to complete your registration and log in.</p>
          </CardContent>
        </Step>
      </Stepper>
    </Card>
  );

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      {flow === 'welcome' && renderWelcome()}
      {flow === 'login' && (
        <div className="relative w-full max-w-md">
            <Button variant="ghost" size="sm" className="absolute -top-10 left-0" onClick={() => setFlow('welcome')}>Back</Button>
            {renderLogin()}
        </div>
      )}
      {flow === 'signup' && (
         <div className="relative w-full max-w-md">
            <Button variant="ghost" size="sm" className="absolute -top-10 left-0" onClick={() => setFlow('welcome')}>Back</Button>
            {renderSignup()}
        </div>
      )}
    </div>
  );
}
