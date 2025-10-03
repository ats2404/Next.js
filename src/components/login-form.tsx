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
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useDatabase, initiateEmailSignIn } from '@/firebase';
import { Loader2, Lock, Phone } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { Checkbox } from './ui/checkbox';
import { get, query, ref, orderByChild, equalTo } from 'firebase/database';


const formSchema = z.object({
  mobileNumber: z.string().min(10, { message: 'Please enter a valid 10-digit mobile number.' }).max(10, {message: 'Please enter a valid 10-digit mobile number.'}),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  rememberMe: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const AuthHeader = ({ title, subtitle }: { title: React.ReactNode, subtitle: string }) => (
    <div className="relative -mb-12 overflow-hidden rounded-t-xl bg-[#415BFF] p-8 text-white">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20"></div>
        <div className="absolute -right-8 -bottom-24 h-40 w-40 rounded-full bg-white/20"></div>
        <p className="text-lg">{subtitle}</p>
        <h1 className="text-4xl font-bold">{title}</h1>
    </div>
);


export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const db = useDatabase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobileNumber: '',
      password: '',
      rememberMe: false
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    const usersRef = ref(db, 'users');
    const userQuery = query(usersRef, orderByChild('mobileNumber'), equalTo(data.mobileNumber));
    
    try {
        const snapshot = await get(userQuery);
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const userId = Object.keys(usersData)[0];
            const userData = usersData[userId];
            const email = userData.email;

            if (email) {
                initiateEmailSignIn(auth, email, data.password);
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                  unsubscribe();
                  setIsLoading(false);
                  if (user) {
                    toast({
                      title: 'Login Successful',
                      description: 'Welcome back!',
                    });
                    router.push('/calculator');
                  }
                }, (error) => {
                    unsubscribe();
                    setIsLoading(false);
                    toast({
                        variant: 'destructive',
                        title: 'Login Failed',
                        description: 'Invalid credentials. Please try again.',
                    });
                });
            } else {
                 throw new Error("Email not found for this mobile number.");
            }
        } else {
            throw new Error("No user found with this mobile number.");
        }
    } catch (error: any) {
        setIsLoading(false);
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message || 'An unknown error occurred.',
        });
    }
  };

  return (
    <Card className="w-full max-w-sm overflow-hidden border-0 shadow-2xl">
      <AuthHeader subtitle="Welcome Back," title="Log In!" />
      <CardContent className="p-8 pt-16">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase text-muted-foreground">Mobile Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="tel" placeholder="Enter your mobile number" {...field} className="h-12 rounded-lg border-2 focus-visible:ring-primary" />
                       <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      <Input type="password" placeholder="••••••••••" {...field} className="h-12 rounded-lg border-2 focus-visible:ring-primary" />
                      <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between text-sm">
                <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormLabel className="font-normal text-muted-foreground">
                            Remember me
                        </FormLabel>
                        </FormItem>
                    )}
                />
                <Link href="#" className="font-medium text-primary hover:underline">
                    Forgot password?
                </Link>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full bg-[#415BFF] text-base font-bold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log in
            </Button>
             <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                    href="/signup"
                    className="font-medium text-primary hover:underline"
                >
                    Sign up
                </Link>
             </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
