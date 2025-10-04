'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { LogOut, Moon, Sun, User, Pencil, Share2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUser, useDatabase, useAuth } from '@/firebase';
import { ref, onValue, set } from 'firebase/database';
import QRCode from "react-qr-code";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


type Operator = '+' | '-' | '×' | '÷';

const Calculator = () => {
  const { theme, setTheme } = useTheme();
  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState('');
  const { user } = useUser();
  const db = useDatabase();
  const auth = useAuth();
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

  const handleLogout = () => {
    signOut(auth);
    router.push('/login');
  };

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

      // eslint-disable-next-line no-eval
      const result = eval(evalExpression);
      
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

  const dataUrlToBlob = (dataUrl: string) => {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mimeType });
  }

  const handleShare = async () => {
    if (!qrCodeRef.current) return;

    const svgElement = qrCodeRef.current.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create an image from the SVG
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    img.onload = async () => {
        // Set canvas dimensions
        const qrSize = img.width;
        const padding = 20;
        const topMargin = 80;
        canvas.width = qrSize + (padding * 2);
        canvas.height = qrSize + topMargin + padding;

        // Fill background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Shop Name
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(shopName, canvas.width / 2, 40);

        // Draw Amount
        ctx.font = 'bold 32px Poppins, sans-serif';
        ctx.fillText(`₹${paymentAmount}`, canvas.width / 2, 80);

        // Draw QR Code
        ctx.drawImage(img, padding, topMargin);
        
        // Get data URL and share
        const pngDataUrl = canvas.toDataURL('image/png');
        const text = `Please pay ₹${paymentAmount} to ${shopName}.`;
        
        try {
            const blob = dataUrlToBlob(pngDataUrl);
            const file = new File([blob], 'payment-qr.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Payment Request',
                    text: text,
                });
            } else {
              // Fallback for browsers that don't support file sharing
              const a = document.createElement('a');
              a.href = pngDataUrl;
              a.download = 'payment-qr.png';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast({
                title: "QR Code Downloaded",
                description: "You can now share the image from your gallery.",
              });
            }
        } catch (error) {
            console.error('Sharing failed', error);
            toast({
              variant: "destructive",
              title: "Sharing Failed",
              description: "Could not share the payment request.",
            });
        }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  };

  const buttonClass = 'h-20 w-20 rounded-full text-3xl font-medium';
  const opButtonClass = `${buttonClass} bg-[hsl(var(--btn-operator-bg))] text-[hsl(var(--btn-operator-fg))] hover:bg-[hsl(var(--btn-operator-bg))]`;
  const greyButtonClass = `${buttonClass} bg-[hsl(var(--btn-grey-bg))] text-[hsl(var(--btn-grey-fg))] hover:bg-[hsl(var(--btn-grey-bg))]`;
  const defaultButtonClass = `${buttonClass} bg-[hsl(var(--btn-default-bg))] text-[hsl(var(--btn-default-fg))] hover:bg-[hsl(var(--btn-default-bg))]`;
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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
          {user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-[1.5rem] w-[1.5rem]" />
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="w-full text-right pr-6 h-28 flex flex-col justify-end">
        <div className="text-muted-foreground text-4xl h-12 truncate">{expression}</div>
        <div className="text-foreground text-5xl font-light truncate">{parseFloat(displayValue).toLocaleString()}</div>
      </div>
      <div className="grid grid-cols-4 gap-4 p-2">
        <Button onClick={handleClearClick} className={greyButtonClass}>AC</Button>
        <Button onClick={handleToggleSignClick} className={greyButtonClass}>+/-</Button>
        <Button onClick={handlePercentClick} className={greyButtonClass}>%</Button>
        <Button onClick={() => handleOperatorClick('÷')} className={`${opButtonClass}`}>÷</Button>
        
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
        
        <Button onClick={() => handleNumberClick('0')} className={`${defaultButtonClass} col-span-2 w-auto`}>0</Button>
        <Button onClick={handleDecimalClick} className={defaultButtonClass}>.</Button>
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
              To generate QR codes, a subscription of ₹30 per month is required. Please pay to the UPI ID below to activate your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 text-center bg-secondary p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Pay to:</p>
            <p className="text-lg font-bold">9860856702@okbizaxis</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsSubscriptionDialogVisible(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calculator;

    