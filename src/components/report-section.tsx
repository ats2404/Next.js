import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ReportSectionProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

export function ReportSection({ icon: Icon, title, children }: ReportSectionProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-headline text-lg font-semibold">{title}</h3>
      </div>
      <div className="pl-7">
        {children}
      </div>
    </div>
  );
}
