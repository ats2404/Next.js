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
import { useAuth, initiateEmailSignIn } from '@/firebase';
import { Loader2, Lock, Mail } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { Checkbox } from './ui/checkbox';
import { AuthHeader } from './auth-header';


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  rememberMe: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;


export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
        initiateEmailSignIn(auth, data.email, data.password);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            setIsLoading(false);
            if (user) {
            toast({
                title: 'Login Successful',
                description: 'Welcome back!',
            });
            router.push('/calculator');
            } else {
            // This case handles when onAuthStateChanged is triggered by sign-out or other state changes
            // but after a failed sign-in attempt, the error callback below is the primary handler.
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
      <AuthHeader title="Log In!" description="Welcome back, we missed you!" />
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase text-muted-foreground">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••••" {...field} className="h-12 rounded-lg border-2 pl-10 focus-visible:ring-primary" />
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

            <Button type="submit" className="w-full h-12 rounded-full bg-primary text-base font-bold" disabled={isLoading}>
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
