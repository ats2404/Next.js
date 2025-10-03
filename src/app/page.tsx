import AtsCalculator from '@/components/ats-calculator';
import { AtsLogo } from '@/components/icons';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <AtsLogo className="h-6 w-6 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight">
              ATS Calculator
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <AtsCalculator />
      </main>
    </div>
  );
}
