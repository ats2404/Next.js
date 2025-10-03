'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon, LinkedinIcon, Loader2, Lock, TwitterIcon } from 'lucide-react';
import { AuthHeader } from './auth-header';

const formSchema = z.object({
  username: z.string().min(2, { message: 'Username must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
});

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      terms: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log(values);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Account Created',
        description: "We've created your account for you.",
      });
    }, 2000);
  }

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-lg">
      <AuthHeader>
        <h1 className="text-sm font-light uppercase tracking-widest">Hello,</h1>
        <h2 className="text-4xl font-bold">Sign Up!</h2>
      </AuthHeader>
      <div className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">User Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jacob josef" {...field} />
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
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Jacob@gmail.com" {...field} />
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
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <Input type="password" placeholder="Enter password" {...field} className="pr-10" />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormLabel className="font-normal text-muted-foreground">
                            I accept the policy and terms
                        </FormLabel>
                    </FormItem>
                )}
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full">
                <TwitterIcon className="h-4 w-4 text-blue-400" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
                <GoogleIcon className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
                <LinkedinIcon className="h-4 w-4 text-blue-700" />
            </Button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
