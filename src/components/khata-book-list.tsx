
'use client';

import { useMemo } from 'react';
import { formatDistanceToNow, fromUnixTime } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';

interface KhataBookListProps {
  customers: Record<string, {name: string, mobileNumber: string}>;
  transactions: any[];
}

interface CustomerSummary {
  name: string;
  balance: number;
  lastActivity: string;
}

export function KhataBookList({ customers, transactions }: KhataBookListProps) {
  const { t } = useLanguage();
  
  const customerData = useMemo(() => {
    const customerMap = new Map<string, { balance: number; lastTimestamp: number }>();

    // Initialize all customers from the customers object
    Object.keys(customers).forEach(customerName => {
        customerMap.set(customerName, { balance: 0, lastTimestamp: 0 });
    });

    transactions.forEach(tx => {
      const { customerName, amount, type, timestamp } = tx;
      
      const current = customerMap.get(customerName) || { balance: 0, lastTimestamp: 0 };
      
      const transactionAmount = type === 'credit' ? amount : -amount;
      
      customerMap.set(customerName, {
        balance: current.balance + transactionAmount,
        lastTimestamp: Math.max(current.lastTimestamp, timestamp),
      });
    });

    const sortedCustomers: CustomerSummary[] = Array.from(customerMap.entries()).map(([name, data]) => {
      return {
        name,
        balance: data.balance,
        lastActivity: data.lastTimestamp ? formatDistanceToNow(new Date(data.lastTimestamp), { addSuffix: true }) : t('noActivity'),
      };
    }).sort((a, b) => {
        const lastTimestampA = customerMap.get(a.name)?.lastTimestamp || 0;
        const lastTimestampB = customerMap.get(b.name)?.lastTimestamp || 0;
        return lastTimestampB - lastTimestampA;
    });

    return sortedCustomers;

  }, [customers, transactions, t]);


  if (customerData.length === 0) {
    return <p className="text-center text-muted-foreground p-8">{t('noCustomersFound')}</p>;
  }

  return (
    <div className="px-2 space-y-2 pb-24">
      {customerData.map((customer, index) => (
        <Link href={`/khata/${encodeURIComponent(customer.name)}`} key={index} passHref>
            <Card className="rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
            <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.lastActivity}</p>
                </div>
                </div>
                <div className="text-right">
                <p className={`font-bold ${customer.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ₹{Math.abs(customer.balance).toLocaleString()}
                </p>
                {customer.balance < 0 && (
                    <Button variant="link" className="p-0 h-auto text-xs text-red-500">{t('remind')} ></Button>
                )}
                {customer.balance > 0 && (
                    <p className="text-xs text-green-500">{t('advance')}</p>
                )}
                 {customer.balance === 0 && (
                    <p className="text-xs text-muted-foreground">Settled</p>
                )}
                </div>
            </CardContent>
            </Card>
        </Link>
      ))}
    </div>
  );
}
