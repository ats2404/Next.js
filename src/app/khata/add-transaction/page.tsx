
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useDatabase } from '@/firebase';
import { ref, push, set, serverTimestamp, get, child, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRecognition } from '@/hooks/use-recognition';
import { Mic, Phone, Contact, ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';

export default function AddTransactionPage() {
  const { user } = useUser();
  const db = useDatabase();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const defaultCustomerName = searchParams.get('customerName') || '';
  const defaultTransactionType = (searchParams.get('type') as 'credit' | 'debit') || 'debit';

  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [mobileNumber, setMobileNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>(defaultTransactionType);
  const [fieldToUpdate, setFieldToUpdate] = useState<'amount' | 'productName' | 'customerName' | null>(null);

  useEffect(() => {
    setCustomerName(defaultCustomerName);
    setTransactionType(defaultTransactionType);
    if (defaultCustomerName && user && db) {
      const customerRef = ref(db, `khata/${user.uid}/customers/${defaultCustomerName}`);
      get(customerRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setMobileNumber(data.mobileNumber || '');
        }
      });
    }
  }, [defaultCustomerName, defaultTransactionType, user, db]);
  
  const onRecognitionResult = useCallback((text: string) => {
    if (fieldToUpdate === 'amount') {
      const numbers = text.match(/\d+/g);
      if (numbers) {
        setTransactionAmount(numbers.join(''));
      }
    } else if (fieldToUpdate === 'productName') {
        setProductName(text);
    } else if (fieldToUpdate === 'customerName') {
        setCustomerName(text);
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

  const handleContactPick = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        if (contacts.length > 0) {
          const contact = contacts[0];
          if (contact.name && contact.name.length > 0) {
            setCustomerName(contact.name[0]);
          }
          if (contact.tel && contact.tel.length > 0) {
            const formattedNumber = contact.tel[0].replace(/[\s-()]/g, '').slice(-10);
            setMobileNumber(formattedNumber);
          }
        }
      } catch (ex) {
        toast({
            variant: 'destructive',
            title: 'Contact Picker Failed',
            description: 'Could not pick a contact. Please enter details manually.',
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Unsupported Feature',
        description: 'The Contact Picker API is not supported on your browser.',
      });
    }
  };

  const handleSaveTransaction = async () => {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save transactions.' });
      return;
    }

    if (!customerName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Customer name is required.' });
      return;
    }

    const finalMobileNumber = mobileNumber.trim() === '' ? '0000000000' : mobileNumber;
    const finalProductName = productName.trim() === '' ? 'No Product' : productName;
    const finalAmount = transactionAmount.trim() === '' ? 0 : parseFloat(transactionAmount);

    const transactionsRef = ref(db, `khata/${user.uid}/transactions`);
    const customersRef = ref(db, `khata/${user.uid}/customers`);
    const customerRef = child(customersRef, customerName);
    
    try {
        const snapshot = await get(customerRef);
        if (!snapshot.exists()) {
            await set(customerRef, {
                name: customerName,
                mobileNumber: finalMobileNumber,
            });
        } else {
             await update(customerRef, {
                mobileNumber: finalMobileNumber,
            });
        }
        
        // Only add transaction if there is a product or amount
        if (productName.trim() !== '' || transactionAmount.trim() !== '') {
            const newTransactionRef = push(transactionsRef);
            await set(newTransactionRef, {
              customerName,
              productName: finalProductName,
              amount: finalAmount,
              type: transactionType,
              timestamp: serverTimestamp(),
            });
        }

        toast({ title: 'Success', description: 'Entry saved successfully.' });
        if (defaultCustomerName) {
           router.push(`/khata/${encodeURIComponent(defaultCustomerName)}`);
        } else {
           router.push('/khata');
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to save transaction: ${error.message}` });
    }
  };


  const handleMicClick = (field: 'amount' | 'productName' | 'customerName') => {
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
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-primary text-primary-foreground p-4 flex items-center shadow-md">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold ml-4">{t('addTransaction')}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <Card>
            <CardHeader>
                <CardTitle>{t('recordTransaction')}</CardTitle>
                <CardDescription>
                    {t('recordTransactionDescription')} {isListening && `${t('listeningFor')} ${t(fieldToUpdate || '')}...`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customer-name" className="text-right">
                    {t('customer')}
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full"
                        placeholder={t('customerName')}
                        readOnly={!!defaultCustomerName}
                        />
                        {!defaultCustomerName && (
                            <Button variant={isListening && fieldToUpdate === 'customerName' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('customerName')}>
                                <Mic className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobile-number" className="text-right">
                        {t('mobile')}
                    </Label>
                    <div className="relative col-span-3 flex items-center gap-2">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="mobile-number"
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder={t('mobileNumber')}
                            className="pl-10"
                        />
                        <Button variant='outline' size="icon" onClick={handleContactPick}>
                            <Contact className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="product-name" className="text-right">
                    {t('product')}
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <Input
                        id="product-name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full"
                        placeholder={t('productNameDetails')}
                        />
                        <Button variant={isListening && fieldToUpdate === 'productName' ? 'destructive' : 'outline'} size="icon" onClick={() => handleMicClick('productName')}>
                            <Mic className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                    {t('amount')}
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
                    <Label className="text-right">{t('type')}</Label>
                    <RadioGroup
                    className="col-span-3 flex gap-4"
                    value={transactionType}
                    onValueChange={(value: 'credit' | 'debit') => setTransactionType(value)}
                    >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debit" id="r2" />
                        <Label htmlFor="r2" className="text-red-500">{t('debit')} ({t('udhar')})</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit" id="r1" />
                        <Label htmlFor="r1" className="text-green-500">{t('credit')} ({t('jama')})</Label>
                    </div>
                    </RadioGroup>
                </div>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" onClick={() => router.back()}>{t('cancel')}</Button>
                    <Button onClick={handleSaveTransaction}>{t('saveTransaction')}</Button>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
