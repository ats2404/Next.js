
'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Mic } from 'lucide-react';
import { useUser, useDatabase } from '@/firebase';
import { get, ref } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { useRecognition } from '@/hooks/use-recognition';
import { CustomerHistoryDialog } from './customer-history-dialog';

export function GlobalVoiceSearch() {
  const { user, db } = useDatabase ? { user: useUser().user, db: useDatabase() } : { user: null, db: null };
  const { toast } = useToast();
  const [historyCustomerName, setHistoryCustomerName] = useState<string | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const onRecognitionResult = useCallback(async (text: string) => {
    if (!user || !db) return;

    const formattedName = text.toLowerCase().trim();

    const customersRef = ref(db, `khata/${user.uid}/customers`);
    try {
        const snapshot = await get(customersRef);
        if (snapshot.exists()) {
            const customers = snapshot.val();
            const customerNames = Object.keys(customers);
            // Fuzzy search: find a customer whose name includes the spoken text
            const foundCustomer = customerNames.find(name => name.toLowerCase().includes(formattedName));
            
            if (foundCustomer) {
                setHistoryCustomerName(foundCustomer);
                setIsHistoryDialogOpen(true);
            } else {
                toast({
                    variant: "destructive",
                    title: "Customer Not Found",
                    description: `Could not find a customer matching "${text}".`,
                });
            }
        } else {
            toast({
                variant: "destructive",
                title: "No Customers",
                description: "You have not added any customers to your Khata book yet.",
            });
        }
    } catch (error) {
        console.error("Error fetching customers:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not perform customer lookup.",
        });
    }
  }, [user, db, toast]);

  const {
    isListening,
    startRecognition,
    stopRecognition,
    isSupported,
  } = useRecognition({ onResult: onRecognitionResult });

  const handleCustomerLookup = () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You need to be logged in to search for customers.',
        });
        return;
    }
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

  const onDialogClose = () => {
    setIsHistoryDialogOpen(false);
    setHistoryCustomerName(null);
  }

  if (!user) {
    return null; // Don't show if user is not logged in
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1">
        <Button
          onClick={handleCustomerLookup}
          size="icon"
          className={`rounded-full h-20 w-20 shadow-lg text-white ${
            isListening ? 'animate-pulse-listen bg-red-600' : 'animate-pulse-wait bg-blue-600'
          }`}
          aria-label="Customer Voice Search"
        >
          <Mic className="h-10 w-10" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground">
          Search Customer
        </span>
      </div>

      {historyCustomerName && (
        <CustomerHistoryDialog
          isOpen={isHistoryDialogOpen}
          onOpenChange={onDialogClose}
          customerName={historyCustomerName}
        />
      )}
    </>
  );
}
