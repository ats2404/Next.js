'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUser, useDatabase, useAuth } from '@/firebase';
import { ref, onValue } from 'firebase/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const [shopName, setShopName] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (user && db) {
      const userRef = ref(db, 'users/' + user.uid);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setShopName(data.shopName || '');
          setUpiId(data.upiId || '');
        } else {
          setShopName('');
          setUpiId('');
        }
      });
      return () => unsubscribe();
    }
  }, [user, db]);

  const handleLogout = () => {
    signOut(auth);
    router.push('/login');
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
      
      const resultString = String(Number(result.toFixed(6)));
      setExpression(resultString);
      setDisplayValue(resultString);
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
            <p className="text-sm text-muted-foreground">{upiId}</p>
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
    </div>
  );
};

export default Calculator;
