
'use client';

import { useState, useEffect } from 'react';
import { useUser, useDatabase } from '@/firebase';
import { onValue, ref, query, orderByChild, equalTo } from 'firebase/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { useRouter } from 'next/navigation';

interface CustomerHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customerName: string;
}

export function CustomerHistoryDialog({
  isOpen,
  onOpenChange,
  customerName,
}: CustomerHistoryDialogProps) {
  const { user, db } = useUser() && useDatabase() ? { user: useUser().user, db: useDatabase() } : { user: null, db: null };
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen || !db || !user || !customerName) {
        setTransactions([]);
        setBalance(0);
        return;
    };

    const transactionsRef = ref(db, `khata/${user.uid}/transactions`);
    const customerTransactionsQuery = query(
      transactionsRef,
      orderByChild('customerName'),
      equalTo(customerName)
    );

    const unsubscribe = onValue(customerTransactionsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customerTransactions = Object.values(data).sort(
          (a: any, b: any) => b.timestamp - a.timestamp
        );
        setTransactions(customerTransactions as any[]);

        let currentBalance = 0;
        customerTransactions.forEach((tx: any) => {
          if (tx.type === 'credit') {
            currentBalance += tx.amount;
          } else {
            currentBalance -= tx.amount;
          }
        });
        setBalance(currentBalance);

        // Play sound if balance is negative (customer owes money)
        if (currentBalance < 0) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContext) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1); // Beep for 100ms
            }
        }

      } else {
        setTransactions([]);
        setBalance(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, user, db, customerName]);

  const handleGoToEntry = () => {
    if (customerName) {
      router.push(`/khata/add-transaction?customerName=${encodeURIComponent(customerName)}`);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{customerName}</DialogTitle>
          <DialogDescription>Transaction History</DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="mb-4 rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">
                    {balance >= 0 ? 'Advance' : 'Balance Due'}
                </p>
                <p className={`text-3xl font-bold ${balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ₹{Math.abs(balance).toLocaleString()}
                </p>
            </div>

            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Entries</h4>
            <ScrollArea className="h-[300px] w-full">
                <div className="space-y-2 pr-4">
                    {transactions.length > 0 ? (
                        transactions.map((tx, index) => (
                            <Card key={index} className="rounded-lg shadow-sm">
                                <CardContent className="p-3 grid grid-cols-3 items-center">
                                    <div className="col-span-1">
                                        <p className="text-xs text-muted-foreground">
                                            {tx.timestamp ? format(new Date(tx.timestamp), 'dd MMM yy') : 'Date missing'}
                                        </p>
                                        <p className="font-semibold text-foreground truncate">{tx.productName}</p>
                                    </div>
                                    <div className={`col-span-1 text-center font-bold text-red-500 ${tx.type === 'debit' ? 'visible' : 'invisible'}`}>
                                        ₹{tx.amount.toLocaleString()}
                                    </div>
                                    <div className={`col-span-1 text-center font-bold text-green-500 ${tx.type === 'credit' ? 'visible' : 'invisible'}`}>
                                        ₹{tx.amount.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground">No transactions found.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleGoToEntry}>Go to Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
