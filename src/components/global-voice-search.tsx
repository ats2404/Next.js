
'use client';

import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Mic } from 'lucide-react';
import { useUser, useDatabase } from '@/firebase';
import { get } from 'firebase/database';
import { ref } from 'firebase/database';
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

    const formattedName = text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

    const customersRef = ref(db, `khata/${user.uid}/customers`);
    try {
        const snapshot = await get(customersRef);
        if (snapshot.exists()) {
            const customers = snapshot.val();
            const customerNames = Object.keys(customers);
            const foundCustomer = customerNames.find(name => name.toLowerCase() === formattedName.toLowerCase());
            
            if (foundCustomer) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (audioContext) {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                }
                setHistoryCustomerName(foundCustomer);
                setIsHistoryDialogOpen(true);
            } else {
                toast({
                    variant: "destructive",
                    title: "Customer Not Found",
                    description: `Could not find a customer named "${formattedName}".`,
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

  if (!user) {
    return null; // Don't show if user is not logged in
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleCustomerLookup}
          variant={isListening ? 'destructive' : 'primary'}
          size="icon"
          className="rounded-full h-16 w-16 shadow-lg"
          aria-label="Customer Voice Search"
        >
          <Mic className="h-8 w-8" />
        </Button>
      </div>

      {historyCustomerName && (
        <CustomerHistoryDialog
          isOpen={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
          customerName={historyCustomerName}
        />
      )}
    </>
  );
}

    