'use client';

import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { CardHeader, CardTitle, CardDescription } from './ui/card';
import { Moon, Sun, Calculator } from 'lucide-react';
import Link from 'next/link';

interface AuthHeaderProps {
    title: string;
    description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
    const { theme, setTheme } = useTheme();
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <CardHeader className="relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                 <Link href="/calculator">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Calculator className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">Calculator</span>
                    </Button>
                </Link>
                <Button onClick={toggleTheme} variant="ghost" size="icon" className="rounded-full">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
            <div className="flex flex-col items-center text-center pt-8">
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
        </CardHeader>
    );
}
