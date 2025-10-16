
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
}

declare const window: Window;

interface UseRecognitionProps {
    onResult: (transcript: string) => void;
}

export const useRecognition = ({ onResult }: UseRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const onEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }
    
    const recognition = new Recognition();
    recognition.continuous = false; // Stop after first result
    recognition.interimResults = false; // We only want final results
    recognition.lang = 'en-IN'; // Set to Indian English

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript.trim());
      }
      stopRecognition();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      stopRecognition();
    };

    recognition.onend = () => {
      onEnd();
    };

    recognitionRef.current = recognition;
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, onResult]);
  
  const startRecognition = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);


  return {
    isListening,
    startRecognition,
    stopRecognition,
    isSupported,
  };
};

    
