'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

// This is a simplified and safe evaluation function.
// It avoids using eval() directly for security reasons.
const safeEvaluate = (expression: string): number | null => {
  // Replace visual multiplication and division signs with standard operators
  const sanitizedExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');

  // Basic validation: only allow numbers, operators, and dots.
  if (!/^[0-9+\-*/. ]+$/.test(sanitizedExpression)) {
    return null;
  }

  try {
    // Using Function constructor is a bit safer than eval, but still needs caution.
    // It creates a function in the global scope, not the local scope of the caller.
    return new Function(`return ${sanitizedExpression}`)();
  } catch (error) {
    console.error('Calculation error:', error);
    return null;
  }
};


export function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const handleButtonClick = (value: string) => {
    switch (value) {
      case 'AC':
        setExpression('');
        setResult('');
        break;
      case 'backspace':
        setExpression((prev) => prev.slice(0, -1));
        break;
      case '=':
        if (expression) {
          const evalResult = safeEvaluate(expression);
          if (evalResult !== null) {
            setResult(String(evalResult));
          } else {
            setResult('Error');
          }
        }
        break;
      case '+/-':
        setExpression((prev) => {
          if (prev.startsWith('-')) {
            return prev.substring(1);
          }
          return `-${prev}`;
        });
        break;
      default:
        setExpression((prev) => prev + value);
    }
  };

  const buttons = [
    { label: 'AC', type: 'special' },
    { label: 'backspace', type: 'special', icon: <X className="h-6 w-6" /> },
    { label: '+/-', type: 'special' },
    { label: '÷', type: 'operator' },
    { label: '7', type: 'number' },
    { label: '8', type: 'number' },
    { label: '9', type: 'number' },
    { label: '×', type: 'operator' },
    { label: '4', type: 'number' },
    { label: '5', type: 'number' },
    { label: '6', type: 'number' },
    { label: '-', type: 'operator' },
    { label: '1', type: 'number' },
    { label: '2', type: 'number' },
    { label: '3', type: 'number' },
    { label: '+', type: 'operator' },
    { label: '%', type: 'number' },
    { label: '0', type: 'number' },
    { label: '.', type: 'number' },
    { label: '=', type: 'equals' },
  ];
  
  const getButtonClass = (type: string) => {
    switch (type) {
      case 'number':
        return 'bg-[#333333] hover:bg-[#444444] text-white';
      case 'operator':
        return 'bg-[#505050] hover:bg-[#666666] text-white';
      case 'special':
        return 'bg-[#505050] hover:bg-[#666666] text-[#A5A5A5]';
      case 'equals':
        return 'bg-[#005DB2] hover:bg-[#006FCE] text-white';
      default:
        return '';
    }
  };


  return (
    <div className="w-full max-w-sm bg-black rounded-xl p-4 space-y-4">
      <div className="text-right h-24 flex flex-col justify-end p-4">
        <div className="text-white text-4xl truncate">{expression || '0'}</div>
        <div className="text-gray-400 text-2xl truncate">{result}</div>
      </div>
      
      <div className="flex justify-between items-center text-gray-400 px-2">
         {/* These are placeholder icons from the image */}
        <History className="h-6 w-6" />
        <span className="text-lg">[FX]</span>
        <Settings className="h-6 w-6" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {buttons.map((btn) => (
          <Button
            key={btn.label}
            onClick={() => handleButtonClick(btn.label)}
            className={cn(
              'h-20 w-20 text-3xl rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white',
              getButtonClass(btn.type)
            )}
            aria-label={btn.label}
          >
            {btn.icon || btn.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
