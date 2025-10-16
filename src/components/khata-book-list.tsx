'use client';

import { useMemo } from 'react';
import { formatDistanceToNow, fromUnixTime } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface KhataBookListProps {
  transactions: any[];
}

interface CustomerSummary {
  name: string;
  balance: number;
  lastActivity: string;
}

export function KhataBookList({ transactions }: KhataBookListProps) {
  
  const customerData = useMemo(() => {
    const customerMap = new Map<string, { balance: number; lastTimestamp: number }>();

    transactions.forEach(tx => {
      const { customerName, amount, type, timestamp } = tx;
      
      const current = customerMap.get(customerName) || { balance: 0, lastTimestamp: 0 };
      
      const transactionAmount = type === 'credit' ? amount : -amount;
      
      customerMap.set(customerName, {
        balance: current.balance + transactionAmount,
        lastTimestamp: Math.max(current.lastTimestamp, timestamp / 1000),
      });
    });

    const sortedCustomers: CustomerSummary[] = Array.from(customerMap.entries()).map(([name, data]) => {
      return {
        name,
        balance: data.balance,
        lastActivity: data.lastTimestamp ? formatDistanceToNow(fromUnixTime(data.lastTimestamp), { addSuffix: true }) : 'No activity',
      };
    }).sort((a, b) => {
        // Find latest timestamp for each customer to sort by recent activity
        const lastTimestampA = Math.max(...transactions.filter(t => t.customerName === a.name).map(t => t.timestamp));
        const lastTimestampB = Math.max(...transactions.filter(t => t.customerName === b.name).map(t => t.timestamp));
        return lastTimestampB - lastTimestampA;
    });

    return sortedCustomers;

  }, [transactions]);


  if (customerData.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No customers found.</p>;
  }

  return (
    <div className="px-2 space-y-2 pb-24">
      {customerData.map((customer, index) => (
        <Card key={index} className="rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                 <Button variant="link" className="p-0 h-auto text-xs text-red-500">रिमाइंड कराएँ ></Button>
              )}
               {customer.balance > 0 && (
                 <p className="text-xs text-green-500">Advance</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
