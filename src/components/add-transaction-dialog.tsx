'use client';

import { useState, useEffect } from 'react';
import { useUser, useDatabase } from '@/firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRecognition } from '@/hooks/use-recognition';
import { Mic } from 'lucide-react';

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTransactionSave?: () => void;
  defaultCustomerName?: string;
  defaultTransactionType?: 'credit' | 'debit';
}

export function AddTransactionDialog({ 
    isOpen, 
    onOpenChange, 
    onTransactionSave,
    defaultCustomerName = '',
    defaultTransactionType = 'credit'
}: AddTransactionDialogProps) {
  const { user } = useUser();
  const db = useDatabase();
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [productName, setProductName] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>(defaultTransactionType);

  useEffect(() => {
    if (isOpen) {
      setCustomerName(defaultCustomerName);
      setTransactionType(defaultTransactionType);
      // Reset other fields
      setProductName('');
      setTransactionAmount('');
    }
  }, [isOpen, defaultCustomerName, defaultTransactionType]);

  const {
    isListening,
    startRecognition,
    stopRecognition,
    isSupported,
  } = useRecognition({
    onResult: (text: string) => {
      const numbers = text.match(/\d+/g);
      if (numbers) {
        setTransactionAmount(numbers.join(''));
      }
    },
  });

  const handleSaveTransaction = () => {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save transactions.' });
      return;
    }

    if (!customerName || !productName || !transactionAmount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
      return;
    }

    const transactionsRef = ref(db, `khata/${user.uid}`);
    const newTransactionRef = push(transactionsRef);

    set(newTransactionRef, {
      customerName,
      productName,
      amount: parseFloat(transactionAmount),
      type: transactionType,
      timestamp: serverTimestamp(),
    })
      .then(() => {
        toast({ title: 'Success', description: 'Transaction saved successfully.' });
        onOpenChange(false);
        if (onTransactionSave) {
            onTransactionSave();
        }
      })
      .catch((error) => {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to save transaction: ${error.message}` });
      });
  };

  const handleMicClick = () => {
    if (!isSupported) {
      toast({
        variant: 'destructive',
        title: 'Voice Recognition Not Supported',
        description: 'Your browser does not support voice recognition.',
      });
      return;
    }
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Khata Book</DialogTitle>
          <DialogDescription>
            Manually record a transaction for your customer. {isListening && 'Listening...'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer-name" className="text-right">
              Customer
            </Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="col-span-3"
              placeholder="Customer Name"
              readOnly={!!defaultCustomerName}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product-name" className="text-right">
              Product
            </Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="col-span-3"
              placeholder="Product Name/Details"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="w-full"
                placeholder="₹"
              />
              <Button variant={isListening ? 'destructive' : 'outline'} size="icon" onClick={handleMicClick}>
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <RadioGroup
              className="col-span-3 flex gap-4"
              value={transactionType}
              onValueChange={(value: 'credit' | 'debit') => setTransactionType(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="r1" />
                <Label htmlFor="r1">Credit (Jama)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debit" id="r2" />
                <Label htmlFor="r2">Debit (Udhar)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveTransaction}>Save Transaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}