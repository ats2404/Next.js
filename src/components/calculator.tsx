
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Moon, Sun, User, Pencil, Share2, Divide, Book, Mic } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUser, useDatabase } from '@/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import QRCode from "react-qr-code";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AddTransactionDialog } from './add-transaction-dialog';
import { CustomerHistoryDialog } from './customer-history-dialog';
import { generateQrCodeImage } from '@/lib/qr-code-generator';


type Operator = '+' | '-' | '×' | '÷';

const Calculator = () => {
  const { theme, setTheme } = useTheme();
  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState('');
  const { user } = useUser();
  const db = useDatabase();
  const router = useRouter();
  const { toast } = useToast();
  const [shopName, setShopName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [isQrCodeVisible, setIsQrCodeVisible] = useState(false);
  const [isSubscriptionDialogVisible, setIsSubscriptionDialogVisible] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('0');
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('inactive');
  
  const [isKhataBookOpen, setIsKhataBookOpen] = useState(false);


  useEffect(() => {
    if (user && db) {
      const userRef = ref(db, 'users/' + user.uid);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.mobileNumber) {
          const userMobileNumber = data.mobileNumber;
          setMobileNumber(userMobileNumber);
          const mobileUserRef = ref(db, 'mobileUsers/' + userMobileNumber);
          const mobileUnsubscribe = onValue(mobileUserRef, (mobileSnapshot) => {
            const mobileData = mobileSnapshot.val();
            if (mobileData) {
              setShopName(mobileData.shopName || '');
              setUpiId(mobileData.upiId || '');
              setNewUpiId(mobileData.upiId || '');
              setStatus(mobileData.status || 'inactive');
            }
          });
          return () => mobileUnsubscribe();
        } else {
          setShopName('');
          setUpiId('');
          setStatus('inactive');
          setMobileNumber('');
        }
      });
      return () => unsubscribe();
    }
  }, [user, db]);

  const handleUpiUpdate = () => {
    if (mobileNumber && db && newUpiId) {
      const userRef = ref(db, `mobileUsers/${mobileNumber}/upiId`);
      set(userRef, newUpiId)
        .then(() => {
          toast({ title: "Success", description: "UPI ID updated successfully." });
          setIsEditingUpi(false);
        })
        .catch((error) => {
          toast({ variant: "destructive", title: "Error", description: "Failed to update UPI ID." });
        });
    }
  };

  const handleNumberClick = (num: string) => {
    if (displayValue === '0') {
      setDisplayValue(num);
    } else {
      setDisplayValue(displayValue + num);
    }
    setExpression(prev => prev + num);
  };

  const handleOperatorClick = (op: Operator) => {
    if (displayValue === '0' && expression === '') return;

    const lastChar = expression.slice(-1);
    if (['+', '-', '×', '÷'].includes(lastChar)) {
        setExpression(prev => prev.slice(0, -1) + op);
    } else {
        setExpression(prev => prev + op);
    }
    setDisplayValue('0');
  };

  const handleEqualsClick = () => {
    if (expression === '') return;

    try {
      const evalExpression = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      
      if (/[^0-9+\-*/.()]/.test(evalExpression)) {
          throw new Error("Invalid expression");
      }

      if (/\/0/.test(evalExpression)) {
        setDisplayValue('Error');
        setExpression('');
        return;
      }
      
      // eslint-disable-next-line no-eval
      const result = eval(evalExpression);
      
      if (!isFinite(result)) {
        setDisplayValue('Error');
        setExpression('');
        return;
      }
      
      const resultString = String(Number(result.toFixed(2)));
      setExpression(resultString);
      setDisplayValue(resultString);

      if (status === 'inactive') {
        setIsSubscriptionDialogVisible(true);
        return;
      }

      if (upiId && parseFloat(resultString) > 0 && status === 'active') {
        setPaymentAmount(resultString);
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName.trim())}&am=${resultString}&cu=INR`;
        setQrCodeValue(upiUrl);
        setIsQrCodeVisible(true);
      }

    } catch (e) {
      setDisplayValue('Error');
      setExpression('');
    }
  };


  const handleClearClick = () => {
    setDisplayValue('0');
    setExpression('');
  };

  const handleToggleSignClick = () => {
    if (displayValue !== '0') {
      const currentValue = parseFloat(displayValue);
      const newValue = String(currentValue * -1);

      const len = displayValue.length;
      setExpression(prev => prev.substring(0, prev.length - len) + `(${newValue})`);
      setDisplayValue(newValue);
    }
  };

  const handlePercentClick = () => {
    if (displayValue !== '0') {
        const currentValue = parseFloat(displayValue);
        const newValue = String(currentValue / 100);

        const len = displayValue.length;
        setExpression(prev => prev.substring(0, prev.length - len) + newValue);
        setDisplayValue(newValue);
    }
  };

  const handleDecimalClick = () => {
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
      setExpression(prev => prev + '.');
    }
  };

  const handleShare = async () => {
    if (!upiId || !shopName || !paymentAmount) return;

    const qrImageFile = await generateQrCodeImage(shopName, paymentAmount, upiId);
    
    if (!qrImageFile) {
        toast({
            variant: "destructive",
            title: "QR Generation Failed",
            description: "Could not create the QR code image for sharing.",
        });
        return;
    }

    try {
        const shareData = {
            files: [qrImageFile],
            title: 'Payment Request',
            text: `Here is the QR code to pay ${shopName}.`,
        };

        if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
            toast({
                variant: "destructive",
                title: "Sharing Not Supported",
                description: "Your browser does not support sharing files.",
            });
        }
    } catch (error) {
        console.error('Sharing failed', error);
        toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: "Could not share the QR code.",
        });
    }
  };


  const buttonClass = 'h-20 w-20 rounded-full text-3xl font-medium';
  const opButtonClass = `${buttonClass} bg-[hsl(var(--btn-operator-bg))] text-[hsl(var(--btn-operator-fg))] hover:bg-[hsl(var(--btn-operator-bg))]`;
  const greyButtonClass = `${buttonClass} bg-[hsl(var(--btn-grey-bg))] text-[hsl(var(--btn-grey-fg))] hover:bg-[hsl(var(--btn-grey-bg))]`;
  const defaultButtonClass = `${buttonClass} bg-[hsl(var(--btn-default-bg))] text-[hsl(var(--btn-default-fg))] hover:bg-[hsl(var(--btn-default-bg))]`;
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const openKhataBook = () => {
    router.push('/khata');
  };

  return (
    <div className="bg-background p-4 rounded-3xl shadow-2xl w-full max-w-sm">
      <div className="mb-4 flex justify-between items-center px-2">
        <div className="w-14">
          <Button onClick={toggleTheme} variant="ghost" size="icon" className="rounded-full">
            <Sun className="h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        <div className="text-center">
            <h1 className="text-xl font-semibold">{shopName}</h1>
            {status === 'active' ? (
              <div className="flex items-center gap-2 justify-center">
                <p className="text-sm text-muted-foreground">{upiId}</p>
                  <AlertDialog open={isEditingUpi} onOpenChange={setIsEditingUpi}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Edit UPI ID</AlertDialogTitle>
                        <AlertDialogDescription>
                          Update your UPI ID below. This will be displayed on your calculator.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Input 
                        value={newUpiId}
                        onChange={(e) => setNewUpiId(e.target.value)}
                        placeholder="Enter new UPI ID"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpiUpdate}>Save</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
            ) : (
                <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setIsSubscriptionDialogVisible(true)}>
                    Get Subscription
                </Button>
            )}
        </div>
        <div className="w-14 flex justify-end">
           <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="relative w-full text-right pr-6 h-28 flex flex-col justify-end">
        <div className="text-muted-foreground text-4xl h-12 truncate">{expression}</div>
        <div className="text-foreground text-5xl font-light truncate">{parseFloat(displayValue).toLocaleString()}</div>
      </div>
      <div className="grid grid-cols-4 gap-4 p-2">
        <Button onClick={handleClearClick} className={greyButtonClass}>AC</Button>
        <Button onClick={handleToggleSignClick} className={greyButtonClass}>+/-</Button>
        <Button onClick={handlePercentClick} className={greyButtonClass}>%</Button>
        <Button onClick={() => handleOperatorClick('÷')} className={opButtonClass}><Divide /></Button>
        
        <Button onClick={() => handleNumberClick('7')} className={defaultButtonClass}>7</Button>
        <Button onClick={() => handleNumberClick('8')} className={defaultButtonClass}>8</Button>
        <Button onClick={() => handleNumberClick('9')} className={defaultButtonClass}>9</Button>
        <Button onClick={() => handleOperatorClick('×')} className={`${opButtonClass}`}>×</Button>

        <Button onClick={() => handleNumberClick('4')} className={defaultButtonClass}>4</Button>
        <Button onClick={() => handleNumberClick('5')} className={defaultButtonClass}>5</Button>
        <Button onClick={() => handleNumberClick('6')} className={defaultButtonClass}>6</Button>
        <Button onClick={() => handleOperatorClick('-')} className={`${opButtonClass}`}>-</Button>

        <Button onClick={() => handleNumberClick('1')} className={defaultButtonClass}>1</Button>
        <Button onClick={() => handleNumberClick('2')} className={defaultButtonClass}>2</Button>
        <Button onClick={() => handleNumberClick('3')} className={defaultButtonClass}>3</Button>
        <Button onClick={() => handleOperatorClick('+')} className={`${opButtonClass}`}>+</Button>
        
        <Button onClick={() => handleNumberClick('0')} className={defaultButtonClass}>0</Button>
        <Button onClick={handleDecimalClick} className={defaultButtonClass}>.</Button>
        <Button onClick={openKhataBook} className={`${opButtonClass} w-auto`}><Book /></Button>
        <Button onClick={handleEqualsClick} className={opButtonClass}>=</Button>
      </div>

      <Dialog open={isQrCodeVisible} onOpenChange={setIsQrCodeVisible}>
        <DialogContent className="sm:max-w-xs p-0">
          <div className="p-6">
              <div className="text-center mb-4">
                  <p className="text-muted-foreground text-sm">Paying to</p>
                  <p className="font-bold text-lg">{shopName}</p>
              </div>
              <div ref={qrCodeRef} className="p-4 bg-white rounded-lg flex items-center justify-center border">
                  {qrCodeValue && (
                      <QRCode
                          size={256}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          value={qrCodeValue}
                          viewBox={`0 0 256 256`}
                      />
                  )}
              </div>
              <div className="text-center my-6">
                  <span className="text-5xl font-bold">₹{paymentAmount}</span>
              </div>
              <p className="text-center text-muted-foreground text-xs mt-2">
                UPI ID: {upiId}
              </p>
          </div>
          <DialogFooter className="bg-muted p-4">
              <Button onClick={handleShare} className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Payment Request
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isSubscriptionDialogVisible} onOpenChange={setIsSubscriptionDialogVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Subscription Required</AlertDialogTitle>
            <AlertDialogDescription>
              To generate QR codes, a subscription of ₹30 per month is required. Please scan the QR code to pay and activate your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <QRCode
                value={`upi://pay?pa=9860856702@okbizaxis&pn=Subscription&am=30&cu=INR&tn=${encodeURIComponent(`Subscription for ${mobileNumber}`)}`}
                size={200}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pay to:</p>
              <p className="text-lg font-bold">9860856702@okbizaxis</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your mobile number <span className="font-semibold">{mobileNumber}</span> will be included in the payment note.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsSubscriptionDialogVisible(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddTransactionDialog 
        isOpen={isKhataBookOpen}
        onOpenChange={setIsKhataBookOpen}
        onTransactionSave={openKhataBook}
      />
    </div>
  );
};

export default Calculator;

    