'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDatabase } from '@/firebase';
import { onValue, ref, query, orderByChild, equalTo } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Bell, Search, Filter, FileText, UserPlus, Users, Landmark, IndianRupee, Languages } from 'lucide-react';
import { KhataBookList } from '@/components/khata-book-list';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddTransactionDialog } from '@/components/add-transaction-dialog';


export default function KhataPage() {
  const { user, isUserLoading } = useUser();
  const db = useDatabase();
  const router = useRouter();

  const [shopName, setShopName] = useState('');
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);


  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (db) {
        // Fetch shop name
        const userRef = ref(db, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.mobileNumber) {
                const mobileUserRef = ref(db, 'mobileUsers/' + userData.mobileNumber);
                onValue(mobileUserRef, (mobileSnapshot) => {
                    const mobileData = mobileSnapshot.val();
                    if(mobileData) {
                        setShopName(mobileData.shopName || '');
                    }
                });
            }
        });

        // Fetch transactions and calculate totals
        const transactionsRef = ref(db, `khata/${user.uid}`);
        onValue(transactionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const allTransactions = Object.values(data);
                setTransactions(allTransactions);
                let credit = 0;
                let debit = 0;
                allTransactions.forEach((tx: any) => {
                    if (tx.type === 'credit') {
                        credit += tx.amount;
                    } else {
                        debit += tx.amount;
                    }
                });
                setTotalCredit(credit);
                setTotalDebit(debit);
            }
        });
    }
  }, [user, isUserLoading, router, db]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold truncate">{shopName}</h1>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Languages className="h-6 w-6" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => alert('Language set to English')}>English</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => alert('Language set to Hindi')}>हिन्दी</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative">
                <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6" />
                </Button>
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-black text-xs font-bold">51</span>
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-primary text-primary-foreground/70 rounded-none">
            <TabsTrigger value="customer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-none">ग्राहक</TabsTrigger>
            <TabsTrigger value="supplier" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-none">सप्लायर</TabsTrigger>
          </TabsList>
          <TabsContent value="customer">
            <div className="p-4 bg-white dark:bg-card shadow-md">
              <div className="grid grid-cols-3 divide-x dark:divide-gray-700 text-center">
                <div className="px-2">
                  <p className="text-sm text-muted-foreground">आप देंगे</p>
                  <p className="font-bold text-lg text-red-500">₹{totalDebit.toLocaleString()}</p>
                </div>
                <div className="px-2">
                  <p className="text-sm text-muted-foreground">आपको मिलेंगे</p>
                  <p className="font-bold text-lg text-green-500">₹{totalCredit.toLocaleString()}</p>
                </div>
                <div className="px-2 flex flex-col items-center justify-center">
                   <p className="text-sm text-muted-foreground">QR कलेक्शन</p>
                   <p className="font-bold text-lg">₹0</p>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="link" className="text-primary gap-2">
                  <FileText className="h-4 w-4" />
                  रिपोर्ट देखें
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="ग्राहक खोजें" className="pl-10 h-12" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button variant="ghost" className="text-muted-foreground gap-1">
                    <Filter className="h-4 w-4" />
                    फिल्टर करें
                  </Button>
                   <Button variant="ghost" className="text-muted-foreground gap-1">
                    <IndianRupee className="h-4 w-4" />
                    कैशबुक
                  </Button>
                </div>
              </div>
            </div>

            <KhataBookList transactions={transactions} />

          </TabsContent>
          <TabsContent value="supplier" className="p-4 text-center">
             <p>Supplier information will be shown here.</p>
          </TabsContent>
        </Tabs>
      </main>

       <div className="fixed bottom-20 right-6">
        <Button 
          className="rounded-full h-16 w-auto px-6 bg-red-600 hover:bg-red-700 text-white shadow-lg"
          onClick={() => setIsAddTransactionOpen(true)}
        >
          <UserPlus className="h-6 w-6 mr-2" />
          ग्राहक जोड़ें
        </Button>
      </div>


      <footer className="bg-white dark:bg-card border-t dark:border-gray-700 grid grid-cols-2 text-center p-2 fixed bottom-0 left-0 right-0">
          <Button variant="ghost" className="flex flex-col items-center h-auto text-primary">
            <Users className="h-6 w-6" />
            <span className="text-xs">पार्टीज़</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center h-auto text-muted-foreground">
            <Landmark className="h-6 w-6" />
            <span className="text-xs">लान</span>
          </Button>
      </footer>

      <AddTransactionDialog 
        isOpen={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
      />
    </div>
  );
}
