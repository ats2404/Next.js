'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

type Operator = '+' | '-' | '×' | '÷';

const Calculator = () => {
  const { theme, setTheme } = useTheme();
  const [displayValue, setDisplayValue] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [expression, setExpression] = useState('');

  const handleNumberClick = (num: string) => {
    if (waitingForSecondOperand) {
      setDisplayValue(num);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? num : displayValue + num);
    }
  };

  const handleOperatorClick = (op: Operator) => {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondOperand) {
      setOperator(op);
      setExpression(prev => prev.slice(0, -1) + op);
      return;
    }

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      setDisplayValue(String(result));
      setFirstOperand(result);
    }

    setWaitingForSecondOperand(true);
    setOperator(op);
    setExpression(prev => (firstOperand !== null && operator) ? `${calculate(firstOperand, inputValue, operator)} ${op}`: `${inputValue} ${op}`);
  };

  const handleEqualsClick = () => {
    if (operator && firstOperand !== null) {
      const secondOperand = parseFloat(displayValue);
      const result = calculate(firstOperand, secondOperand, operator);
      setDisplayValue(String(result));
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
      setExpression(`${firstOperand} ${operator} ${secondOperand} =`);
    }
  };

  const calculate = (first: number, second: number, op: Operator): number => {
    switch (op) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '×':
        return first * second;
      case '÷':
        return first / second;
      default:
        return second;
    }
  };

  const handleClearClick = () => {
    setDisplayValue('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
    setExpression('');
  };

  const handleToggleSignClick = () => {
    setDisplayValue(String(parseFloat(displayValue) * -1));
  };

  const handlePercentClick = () => {
    setDisplayValue(String(parseFloat(displayValue) / 100));
  };

  const handleDecimalClick = () => {
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const buttonClass = 'h-20 w-20 rounded-full text-3xl font-medium';
  const opButtonClass = `${buttonClass} bg-[hsl(var(--btn-operator-bg))] text-[hsl(var(--btn-operator-fg))] hover:bg-[hsl(var(--btn-operator-bg))]`;
  const opActiveClass = `bg-[hsl(var(--btn-operator-active-bg))] text-[hsl(var(--btn-operator-active-fg))] hover:bg-[hsl(var(--btn-operator-active-bg))]`;
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
      </div>
      <div className="w-full text-right pr-6 h-28 flex flex-col justify-end">
        <div className="text-muted-foreground text-2xl h-8 truncate">{expression}</div>
        <div className="text-foreground text-7xl font-light truncate">{parseFloat(displayValue).toLocaleString()}</div>
      </div>
      <div className="grid grid-cols-4 gap-4 p-2">
        <Button onClick={handleClearClick} className={greyButtonClass}>{displayValue === '0' && expression === '' ? 'AC' : 'C'}</Button>
        <Button onClick={handleToggleSignClick} className={greyButtonClass}>+/-</Button>
        <Button onClick={handlePercentClick} className={greyButtonClass}>%</Button>
        <Button onClick={() => handleOperatorClick('÷')} className={`${opButtonClass} ${operator === '÷' && waitingForSecondOperand ? opActiveClass : ''}`}>÷</Button>
        
        <Button onClick={() => handleNumberClick('7')} className={defaultButtonClass}>7</Button>
        <Button onClick={() => handleNumberClick('8')} className={defaultButtonClass}>8</Button>
        <Button onClick={() => handleNumberClick('9')} className={defaultButtonClass}>9</Button>
        <Button onClick={() => handleOperatorClick('×')} className={`${opButtonClass} ${operator === '×' && waitingForSecondOperand ? opActiveClass : ''}`}>×</Button>

        <Button onClick={() => handleNumberClick('4')} className={defaultButtonClass}>4</Button>
        <Button onClick={() => handleNumberClick('5')} className={defaultButtonClass}>5</Button>
        <Button onClick={() => handleNumberClick('6')} className={defaultButtonClass}>6</Button>
        <Button onClick={() => handleOperatorClick('-')} className={`${opButtonClass} ${operator === '-' && waitingForSecondOperand ? opActiveClass : ''}`}>-</Button>

        <Button onClick={() => handleNumberClick('1')} className={defaultButtonClass}>1</Button>
        <Button onClick={() => handleNumberClick('2')} className={defaultButtonClass}>2</Button>
        <Button onClick={() => handleNumberClick('3')} className={defaultButtonClass}>3</Button>
        <Button onClick={() => handleOperatorClick('+')} className={`${opButtonClass} ${operator === '+' && waitingForSecondOperand ? opActiveClass : ''}`}>+</Button>
        
        <Button onClick={() => handleNumberClick('0')} className={`${defaultButtonClass} col-span-2 w-auto`}>0</Button>
        <Button onClick={handleDecimalClick} className={defaultButtonClass}>.</Button>
        <Button onClick={handleEqualsClick} className={opButtonClass}>=</Button>
      </div>
    </div>
  );
};

export default Calculator;
