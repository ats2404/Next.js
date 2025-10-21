
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic } from 'lucide-react';
import { useUser, useDatabase } from '@/firebase';
import { get, ref, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { useRecognition } from '@/hooks/use-recognition';
import { CustomerHistoryDialog } from './customer-history-dialog';

// Levenshtein distance function for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}


export function GlobalVoiceSearch() {
  const { user, db } = useDatabase ? { user: useUser().user, db: useDatabase() } : { user: null, db: null };
  const { toast } = useToast();
  const [historyCustomerName, setHistoryCustomerName] = useState<string | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [status, setStatus] = useState('inactive');

  useEffect(() => {
    if (user && db) {
      const userRef = ref(db, 'users/' + user.uid);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.mobileNumber) {
          const mobileUserRef = ref(db, 'mobileUsers/' + data.mobileNumber);
          const mobileUnsubscribe = onValue(mobileUserRef, (mobileSnapshot) => {
            const mobileData = mobileSnapshot.val();
            if (mobileData) {
              setStatus(mobileData.status || 'inactive');
            } else {
              setStatus('inactive');
            }
          });
          return () => mobileUnsubscribe();
        } else {
          setStatus('inactive');
        }
      });
      return () => unsubscribe();
    } else {
        setStatus('inactive');
    }
  }, [user, db]);

  const onRecognitionResult = useCallback(async (text: string) => {
    if (!user || !db) return;

    const formattedName = text.toLowerCase().trim();

    const customersRef = ref(db, `khata/${user.uid}/customers`);
    try {
        const snapshot = await get(customersRef);
        if (snapshot.exists()) {
            const customers = snapshot.val();
            const customerNames = Object.keys(customers);
            
            let bestMatch: string | null = null;
            let minDistance = Infinity;

            for (const name of customerNames) {
                const distance = levenshteinDistance(formattedName, name.toLowerCase());
                const similarity = 1 - (distance / Math.max(formattedName.length, name.length));

                // Find the best match with at least 10% similarity
                if (similarity >= 0.1 && distance < minDistance) {
                    minDistance = distance;
                    bestMatch = name;
                }
            }
            
            if (bestMatch) {
                setHistoryCustomerName(bestMatch);
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

  if (!user || status !== 'active') {
    return null; // Don't show if user is not logged in or has no active subscription
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1">
        <Button
          onClick={handleCustomerLookup}
          size="icon"
          className={`rounded-full h-20 w-20 shadow-lg text-white ${
            isListening 
            ? 'animate-pulse-listen bg-red-600' 
            : 'animate-gradient bg-gradient-to-r from-cyan-500 to-blue-500'
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
