'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
          <h2 className="text-2xl font-semibold">Something went wrong!</h2>
          <p className="text-muted-foreground">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => reset()}>Try again</Button>
          <pre className="mt-4 max-w-2xl overflow-auto rounded-lg bg-secondary p-4 text-secondary-foreground">
            {error.stack}
          </pre>
        </div>
      </body>
    </html>
  );
}
