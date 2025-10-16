'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useDatabase } from '@/firebase';
import { ref, push, set, serverTimestamp, get, child } from 'firebase/database';
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
import { Mic, Phone } from 'lucide-react';

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
  const [mobileNumber, setMobileNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>(defaultTransactionType);
  const [fieldToUpdate, setFieldToUpdate] = useState<'customerName' | 'amount' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomerName(defaultCustomerName);
      setTransactionType(defaultTransactionType);
      // Reset other fields
      setProductName('');
      setTransactionAmount('');
      setMobileNumber('');
    }
  }, [isOpen, defaultCustomerName, defaultTransactionType]);
  
  const onRecognitionResult = useCallback((text: string) => {
    if (fieldToUpdate === 'amount') {
      const numbers = text.match(/\d+/g);
      if (numbers) {
        setTransactionAmount(numbers.join(''));
      }
    } else if (fieldToUpdate === 'customerName') {
        // Capitalize first letter of each word
        const formattedName = text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        setCustomerName(formattedName);
    }
    setFieldToUpdate(null);
  }, [fieldToUpdate]);

  const {
    isListening,
    startRecognition,
    stopRecognition,
    isSupported,
  } = useRecognition({
    onResult: onRecognitionResult,
  });

  const handleSaveTransaction = async () => {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save transactions.' });
      return;
    }

    if (!customerName || !productName || !transactionAmount || (!defaultCustomerName && !mobileNumber)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
      return;
    }

    const transactionsRef = ref(db, `khata/${user.uid}/transactions`);
    const customersRef = ref(db, `khata/${user.uid}/customers`);
    
    try {
        if (!defaultCustomerName) {
            // New customer, check if they exist
            const snapshot = await get(child(customersRef, customerName));
            if (!snapshot.exists()) {
                await set(child(customersRef, customerName), {
                    name: customerName,
                    mobileNumber: mobileNumber,
                });
            }
        }
        
        const newTransactionRef = push(transactionsRef);
        await set(newTransactionRef, {
          customerName,
          productName,
          amount: parseFloat(transactionAmount),
          type: transactionType,
          timestamp: serverTimestamp(),
        });

        toast({ title: 'Success', description: 'Transaction saved successfully.' });
        onOpenChange(false);
        if (onTransactionSave) {
            onTransactionSave();
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to save transaction: ${error.message}` });
    }
  };


  const handleMicClick = (field: 'customerName' | 'amount') => {
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
      setFieldToUpdate(null);
    } else {
      setFieldToUpdate(field);
      startRecognition();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Khata Book</DialogTitle>
          <DialogDescription>
            Manually record a transaction for your customer. {isListening && `Listening for ${fieldToUpdate === 'customerName' ? 'customer name' : 'amount'}...`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer-name" className="text-right">
              Customer
            </Label>
            <div className="col-span-3 flex items-center gap-2">
                <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full"
                placeholder="Customer Name"
                readOnly={!!defaultCustomerName}
                />
                {!defaultCustomerName && (
                    <Button variant={isListening && fieldToUpdate === 'customerName' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('customerName')}>
                        <Mic className="h-4 w-4" />
                    </Button>
                )}
            </div>
          </div>
          {!defaultCustomerName && (
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile-number" className="text-right">
                    Mobile
                </Label>
                <div className="relative col-span-3">
                     <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="mobile-number"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="Mobile Number"
                        className="pl-10"
                    />
                </div>
            </div>
          )}
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
              <Button variant={isListening && fieldToUpdate === 'amount' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('amount')}>
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
