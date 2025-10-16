
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useDatabase } from '@/firebase';
import { onValue, ref, query, orderByChild, equalTo, child } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, Phone, Calendar, FileText, IndianRupee, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';


// A simple WhatsApp icon component
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);


export default function CustomerDetailPage() {
  const { user, isUserLoading } = useUser();
  const db = useDatabase();
  const router = useRouter();
  const params = useParams();
  const customerName = decodeURIComponent(params.customerName as string);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [mobileNumber, setMobileNumber] = useState('');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');

  const handleOpenDialog = (type: 'credit' | 'debit') => {
    setTransactionType(type);
    setIsAddTransactionOpen(true);
  };


  useEffect(() => {
    if (isUserLoading || !db || !user) return;
    
    const transactionsRef = ref(db, `khata/${user.uid}/transactions`);
    const customerTransactionsQuery = query(transactionsRef, orderByChild('customerName'), equalTo(customerName));

    const unsubscribeTransactions = onValue(customerTransactionsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const customerTransactions = Object.values(data).sort((a: any, b: any) => b.timestamp - a.timestamp);
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
        } else {
            setTransactions([]);
            setBalance(0);
        }
    });

    const customerRef = ref(db, `khata/${user.uid}/customers/${customerName}`);
    const unsubscribeCustomer = onValue(customerRef, (snapshot) => {
        const data = snapshot.val();
        if(data && data.mobileNumber){
            setMobileNumber(data.mobileNumber);
        }
    });


    return () => {
        unsubscribeTransactions();
        unsubscribeCustomer();
    }

  }, [user, isUserLoading, db, customerName]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p>Loading...</p>
      </div>
    );
  }

  const getBalanceAfterTransaction = (index: number) => {
    return transactions.slice(0, index + 1).reduce((acc, tx) => {
        return tx.type === 'credit' ? acc + tx.amount : acc - tx.amount;
    }, 0);
  }
  
  const handleReminder = () => {
    if (!mobileNumber) {
        alert("Customer mobile number not available.");
        return;
    }
    const message = `Hello ${customerName}, this is a friendly reminder that your outstanding balance is ₹${Math.abs(balance)}. Please make a payment at your earliest convenience. Thank you!`;
    const whatsappUrl = `https://wa.me/${mobileNumber.startsWith('91') ? '' : '91'}${mobileNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push('/khata')}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <Avatar>
                    <AvatarFallback>{customerName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        {customerName}
                        <span className="text-xs bg-blue-200 text-primary rounded-sm px-1.5 py-0.5">ग्राहक</span>
                    </h1>
                    <p className="text-xs opacity-80">सेटिंग्स देखें</p>
                </div>
            </div>
            <a href={`tel:${mobileNumber}`}>
                <Button variant="ghost" size="icon">
                    <Phone className="h-6 w-6" />
                </Button>
            </a>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="rounded-lg bg-white/10 p-4">
             <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm opacity-80">{balance >= 0 ? 'Advance' : 'आपको मिलेंगे'}</p>
                    <p className={`text-2xl font-bold ${balance < 0 ? 'text-red-300' : 'text-green-300'}`}>₹ {Math.abs(balance).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-5 w-5" />
                    <span>कलेक्शन के लिए रिमाइंडर सेट करें</span>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card p-2">
            <div className="grid grid-cols-4 gap-2 text-center">
                <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <FileText className="h-6 w-6 mb-1" />
                    <span className="text-xs">रिपोर्ट</span>
                </Button>
                 <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <IndianRupee className="h-6 w-6 mb-1" />
                    <span className="text-xs">पेमेंट</span>
                </Button>
                 <Button onClick={handleReminder} variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <WhatsAppIcon className="h-6 w-6 mb-1" />
                    <span className="text-xs">रिमाइंडर</span>
                </Button>
                 <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <MessageSquare className="h-6 w-6 mb-1" />
                    <span className="text-xs">SMS</span>
                </Button>
            </div>
        </div>
        
        <div className="p-4">
            <div className="flex justify-between text-xs text-muted-foreground px-2 py-1">
                <span>एंट्रीज़</span>
                <div className="flex gap-12">
                    <span>आपने दिए</span>
                    <span>आपको मिले</span>
                </div>
            </div>
            <div className="space-y-2">
                 {transactions.map((tx, index) => (
                    <Card key={index} className="rounded-lg shadow-sm">
                        <CardContent className="p-3 grid grid-cols-3 items-center">
                            <div className="col-span-1">
                                <p className="text-sm text-muted-foreground">{format(new Date(tx.timestamp), 'dd MMM yy • hh:mm a')}</p>
                                <p className="font-semibold text-foreground truncate">{tx.productName}</p>
                                <p className="text-xs bg-gray-200 dark:bg-gray-700 rounded-sm px-1 py-0.5 inline-block mt-1">
                                    बैलेंस ₹{getBalanceAfterTransaction(index).toLocaleString()}
                                </p>
                            </div>
                            <div className={`col-span-1 text-center font-bold text-red-500 ${tx.type === 'debit' ? 'visible' : 'invisible'}`}>
                                ₹{tx.amount.toLocaleString()}
                            </div>
                             <div className={`col-span-1 text-center font-bold text-green-500 ${tx.type === 'credit' ? 'visible' : 'invisible'}`}>
                                ₹{tx.amount.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                 ))}
            </div>
        </div>

      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t dark:border-gray-700 grid grid-cols-2 gap-4 p-4">
          <Button onClick={() => handleOpenDialog('debit')} className="h-12 bg-red-600 hover:bg-red-700 text-white text-base">
            आपने दिए ₹
          </Button>
          <Button onClick={() => handleOpenDialog('credit')} className="h-12 bg-green-600 hover:bg-green-700 text-white text-base">
            आपको मिले ₹
          </Button>
      </footer>
      <AddTransactionDialog
        isOpen={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
        defaultCustomerName={customerName}
        defaultTransactionType={transactionType}
      />
    </div>
  );
}

    