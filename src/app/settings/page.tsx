'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Languages } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-primary text-primary-foreground p-4 flex items-center shadow-md">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold ml-4">Settings</h1>
      </header>

      <main className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Choose your preferred language.
            </p>
            <div className="flex gap-4">
              <Button
                variant={'outline'}
                onClick={() => alert('Language set to English')}
              >
                English
              </Button>
              <Button
                variant={'outline'}
                onClick={() => alert('Language set to Hindi')}
              >
                हिन्दी
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
