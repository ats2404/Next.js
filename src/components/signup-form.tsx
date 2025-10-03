'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useDatabase, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase';
import { Loader2, Lock, Mail, User, Phone, Banknote } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, set } from "firebase/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AuthHeader } from './auth-header';


const formSchema = z.object({
  shopName: z.string().min(2, { message: 'Shop name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid 10-digit mobile number.' }).max(10, {message: 'Please enter a valid 10-digit mobile number.'}),
  upiId: z.string().min(3, { message: 'Please enter a valid UPI ID.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  terms: z.boolean().refine(val => val === true, { message: 'You must accept the policy and terms.' }),
});

type FormValues = z.infer<typeof formSchema>;

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.658-3.301-11.303-7.802l-6.573,4.817C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.447-2.275,4.481-4.244,5.918l6.19,5.238C39.99,35.15,44,29.89,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
        <path fill="#03A9F4" d="M42,12.429c-1.323,0.586-2.746,0.981-4.23,1.159c1.526-0.916,2.698-2.366,3.252-4.076c-1.428,0.845-3.004,1.46-4.671,1.787c-1.348-1.437-3.27-2.335-5.375-2.335c-4.068,0-7.366,3.298-7.366,7.366c0,0.578,0.065,1.14,0.192,1.684C19.894,17.77,15.251,15.1,12.04,11.23c-0.628,1.076-0.988,2.324-0.988,3.652c0,2.556,1.301,4.81,3.281,6.13c-1.208-0.038-2.344-0.37-3.338-0.922c-0.001,0.03-0.001,0.061-0.001,0.092c0,3.57,2.54,6.548,5.91,7.227c-0.618,0.169-1.269,0.259-1.941,0.259c-0.475,0-0.936-0.046-1.386-0.132c0.938,2.926,3.659,5.056,6.884,5.116c-2.522,1.976-5.703,3.154-9.157,3.154c-0.596,0-1.183-0.035-1.761-0.104C9.268,36.786,13.385,38,17.805,38c12.21,0,18.883-10.12,18.883-18.883c0-0.288-0.007-0.575-0.02-0.86C39.95,15.2,41.114,13.9,42,12.429"/>
    </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
        <path fill="#0288D1" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"/>
        <path fill="#FFF" d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36z"/>
    </svg>
);


export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const db = useDatabase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shopName: '',
      email: '',
      mobileNumber: '',
      upiId: '',
      password: '',
      terms: false,
    },
  });

  const writeUserData = (user: FirebaseUser, data: FormValues) => {
    const status = 'active'; 

    set(ref(db, 'users/' + user.uid), {
      shopName: data.shopName,
      email: data.email,
      mobileNumber: data.mobileNumber,
      upiId: data.upiId,
      status: status,
    }).then(() => {
      setIsLoading(false);
      toast({
          title: 'Account Created',
          description: "You've successfully signed up!",
      });

      if (status === 'active') {
        router.push('/calculator');
      } else {
        setShowSubscriptionDialog(true);
      }
    }).catch((error) => {
      setIsLoading(false);
      toast({
          variant: 'destructive',
          title: 'Sign-up Failed',
          description: `Could not save user data: ${error.message}`,
      });
    });
  }

  const handleAuthChange = (user: FirebaseUser | null, data?: FormValues) => {
    if (user) {
        if (data) {
          writeUserData(user, data);
        } else {
          // Handle social login
          const socialData: FormValues = {
            shopName: user.displayName || 'New Shop',
            email: user.email || '',
            mobileNumber: user.phoneNumber || '',
            upiId: '', 
            password: '',
            terms: true,
          }
          writeUserData(user, socialData);
        }
    } else {
        setIsLoading(false);
    }
  }

  const handleAuthError = (error: any) => {
    setIsLoading(false);
    toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: error.message || 'An unknown error occurred.',
    });
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    initiateEmailSignUp(auth, data.email, data.password);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe(); 
        handleAuthChange(user, data);
    }, handleAuthError);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    initiateGoogleSignIn(auth);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      handleAuthChange(user);
    }, handleAuthError);
  };

  return (
    <>
      <Card className="w-full max-w-sm overflow-hidden border-0 shadow-2xl">
        <AuthHeader title="Sign Up!" description="Create an account to get started." />
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">Shop Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Enter your shop name" {...field} className="h-12 rounded-lg border-2 pl-10 focus-visible:ring-primary" />
                      </div>
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
                    <FormLabel className="text-xs uppercase text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="email" placeholder="Enter your email address" {...field} className="h-12 rounded-lg border-2 pl-10 focus-visible:ring-primary" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">Mobile number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="tel" placeholder="Enter your mobile number" {...field} className="h-12 rounded-lg border-2 pl-10 focus-visible:ring-primary" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">UPI ID</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Enter your UPI ID" {...field} className="h-12 rounded-lg border-2 pl-10 focus-visible:ring-primary" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="password" placeholder="Enter password" {...field} className="h-12 rounded-lg border-2 pl-10 focus-visible:ring-primary" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md py-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal text-muted-foreground">
                        I accept the policy and terms
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 rounded-full bg-primary text-base font-bold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign up
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4 pb-8">
            <p className="text-sm text-muted-foreground">Or sign up with</p>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="rounded-full border-2 h-12 w-12">
                    <TwitterIcon className="h-6 w-6" />
                </Button>
                <Button onClick={handleGoogleSignIn} variant="outline" size="icon" className="rounded-full border-2 h-12 w-12">
                    <GoogleIcon className="h-6 w-6" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-2 h-12 w-12">
                    <LinkedinIcon className="h-6 w-6" />
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                Login
                </Link>
            </p>
        </CardFooter>
      </Card>

      <AlertDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Subscription Required</AlertDialogTitle>
            <AlertDialogDescription>
              Your account is currently inactive. Please subscribe to access the calculator and other features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>Cancel</Button>
            <AlertDialogAction onClick={() => {
              // Handle subscription logic here
              setShowSubscriptionDialog(false);
              toast({ title: 'Redirecting to subscription...' });
            }}>
              Subscribe Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
