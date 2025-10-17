
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useDatabase } from '@/firebase';
import { onValue, ref, query, orderByChild, equalTo } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, Phone, Calendar as CalendarIcon, FileText, IndianRupee, MessageSquare, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { generateQrCodeImage } from '@/lib/qr-code-generator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';


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
  const { toast } = useToast();
  const customerName = decodeURIComponent(params.customerName as string);
  const reportRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [mobileNumber, setMobileNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [collectionDate, setCollectionDate] = useState<Date | undefined>();


  const handleOpenTransactionPage = (type: 'credit' | 'debit') => {
    router.push(`/khata/add-transaction?customerName=${encodeURIComponent(customerName)}&type=${type}`);
  };


  useEffect(() => {
    if (isUserLoading || !db || !user) return;
    
    // Fetch user details like shop name and upi id
    const userRef = ref(db, 'users/' + user.uid);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.mobileNumber) {
            const mobileUserRef = ref(db, 'mobileUsers/' + userData.mobileNumber);
            onValue(mobileUserRef, (mobileSnapshot) => {
                const mobileData = mobileSnapshot.val();
                if(mobileData) {
                    setShopName(mobileData.shopName || '');
                    setUpiId(mobileData.upiId || '');
                }
            });
        }
    });

    // Fetch customer's transactions
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

    // Fetch customer's mobile number
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
        return tx.type === 'credit' ? acc + tx.amount : tx.type === 'debit' ? acc - tx.amount : acc;
    }, balance - transactions.reduce((acc, tx) => (tx.type === 'credit' ? acc + tx.amount : acc - tx.amount), 0) );
  }

  const handleDownloadReport = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) {
        toast({ variant: "destructive", title: "Error", description: "Could not find the report content to capture." });
        return;
    }
     if (transactions.length === 0) {
      toast({ variant: "destructive", title: "No Transactions", description: "There is no data to generate a report." });
      return;
    }

    try {
        const canvas = await html2canvas(reportElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`report-${customerName}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ variant: "destructive", title: "PDF Generation Failed", description: "An error occurred while creating the PDF." });
    }
  };
  
  const handleReminder = async (via: 'whatsapp' | 'sms') => {
    if (!mobileNumber) {
        toast({ variant: "destructive", title: "Error", description: "Customer mobile number not available." });
        return;
    }
     if (balance >= 0) {
        toast({ title: "No Dues", description: "This customer has no outstanding balance." });
        return;
    }
    if (!upiId) {
        toast({ variant: "destructive", title: "Error", description: "Your UPI ID is not set. Please set it in the calculator." });
        return;
    }

    const amountToPay = Math.abs(balance).toString();
    const reminderText = `Hello ${customerName}, this is a friendly reminder from ${shopName}. Your outstanding balance is ₹${amountToPay}. Please make a payment at your earliest convenience. Thank you!`;

    const qrImageFile = await generateQrCodeImage(shopName, amountToPay, upiId);

    if (!qrImageFile) {
        toast({
            variant: "destructive",
            title: "QR Generation Failed",
            description: "Could not create the QR code image for sharing.",
        });
        return;
    }
    
    if (via === 'sms') {
        const smsLink = `sms:${mobileNumber}?body=${encodeURIComponent(reminderText)}`;
        window.location.href = smsLink;
        return;
    }

    try {
        if (navigator.share && navigator.canShare({ files: [qrImageFile] })) {
            await navigator.share({
                files: [qrImageFile],
                title: 'Payment Reminder',
                text: reminderText,
            });
        } else {
             const whatsappLink = `https://wa.me/91${mobileNumber}?text=${encodeURIComponent(reminderText)}`;
             window.open(whatsappLink, '_blank');
        }
    } catch (error) {
        console.error('Sharing failed', error);
        toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: "Could not share the reminder.",
        });
    }
  };


  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      <div ref={reportRef} className="bg-gray-100 dark:bg-gray-950">
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
                    </h1>
                    {mobileNumber && mobileNumber !== '0000000000' && (
                        <p className="text-xs opacity-80 flex items-center gap-1">
                            {mobileNumber}
                        </p>
                    )}
                </div>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/khata/add-transaction?customerName=${encodeURIComponent(customerName)}`)}>
                    <Pencil className="h-5 w-5" />
                </Button>
                <a href={`tel:${mobileNumber}`}>
                    <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                    </Button>
                </a>
            </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="rounded-lg bg-white/10 p-4">
             <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm opacity-80">{balance >= 0 ? t('advance') : t('youWillGet')}</p>
                    <p className={`text-2xl font-bold ${balance < 0 ? 'text-red-300' : 'text-green-300'}`}>₹ {Math.abs(balance).toLocaleString()}</p>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal bg-transparent text-white border-white/50 hover:bg-white/20 hover:text-white",
                                !collectionDate && "text-white/80"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {collectionDate ? format(collectionDate, "PPP") : <span>{t('setCollectionReminder')}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={collectionDate}
                            onSelect={(date) => {
                                setCollectionDate(date);
                                if (date) {
                                    toast({
                                        title: "Reminder Set",
                                        description: `Collection reminder set for ${format(date, "PPP")}.`,
                                    });
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card p-2">
            <div className="grid grid-cols-4 gap-2 text-center">
                <Button onClick={handleDownloadReport} variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <FileText className="h-6 w-6 mb-1" />
                    <span className="text-xs">{t('report')}</span>
                </Button>
                 <Button onClick={() => toast({ title: 'Coming Soon!', description: 'This feature will be available shortly.' })} variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <IndianRupee className="h-6 w-6 mb-1" />
                    <span className="text-xs">{t('payment')}</span>
                </Button>
                 <Button onClick={() => handleReminder('whatsapp')} variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <WhatsAppIcon className="h-6 w-6 mb-1" />
                    <span className="text-xs">{t('reminder')}</span>
                </Button>
                 <Button onClick={() => handleReminder('sms')} variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground">
                    <MessageSquare className="h-6 w-6 mb-1" />
                    <span className="text-xs">SMS</span>
                </Button>
            </div>
        </div>
        
        <div className="p-4">
            <div className="flex justify-between text-xs text-muted-foreground px-2 py-1">
                <span>{t('entries')}</span>
                <div className="flex gap-12">
                    <span>{t('youGave')}</span>
                    <span>{t('youGot')}</span>
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
                                    {t('balance')} ₹{getBalanceAfterTransaction(index).toLocaleString()}
                                </p>
                            </div>
                            <div className={`col-span-1 text-center font-bold text-red-500 ${tx.type === 'debit' ? 'visible animate-slide-in-fade' : 'invisible'}`}>
                                ₹{tx.amount.toLocaleString()}
                            </div>
                             <div className={`col-span-1 text-center font-bold text-green-500 ${tx.type === 'credit' ? 'visible animate-slide-in-fade' : 'invisible'}`}>
                                ₹{tx.amount.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                 ))}
            </div>
        </div>
      </main>
      </div>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t dark:border-gray-700 grid grid-cols-2 gap-4 p-4">
          <Button onClick={() => handleOpenTransactionPage('debit')} className="h-12 bg-red-600 hover:bg-red-700 text-white text-base">
            {t('youGave')} ₹
          </Button>
          <Button onClick={() => handleOpenTransactionPage('credit')} className="h-12 bg-green-600 hover:bg-green-700 text-white text-base">
            {t('youGot')} ₹
          </Button>
      </footer>
    </div>
  );
}
