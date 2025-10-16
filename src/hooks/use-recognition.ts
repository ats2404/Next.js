
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
    continuous?: boolean;
}

export const useRecognition = ({ onResult, continuous = false }: UseRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // A ref to track if the user intentionally stopped the recognition
  const stoppedManuallyRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  
  const startRecognition = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        stoppedManuallyRef.current = false;
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        console.error("Could not start recognition", e);
        if (isListening) {
            setIsListening(false);
        }
      }
    }
  }, [isListening]);

  const stopRecognition = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    if (recognitionRef.current && isListening) {
      stoppedManuallyRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  useEffect(() => {
    if (!isSupported) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      console.warn("Speech recognition is not available.");
      return;
    }
    
    const recognition = new Recognition();
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

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
       if (!continuous) {
         stopRecognition();
       }
    };

    recognition.onerror = (event) => {
      // Errors like 'no-speech' or 'network' can stop the service.
      // We'll let the onend handler deal with restarting.
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Only update listening state if it wasn't manually stopped
      if (!stoppedManuallyRef.current) {
        setIsListening(false);
      }

      if (continuous && !stoppedManuallyRef.current) {
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
        }
        // Don't restart immediately
      }
    };

    recognitionRef.current = recognition;

    // Cleanup: stop recognition when the component unmounts.
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        stoppedManuallyRef.current = true; // Prevent restart on unmount
        recognitionRef.current.stop();
      }
    }
    
  }, [isSupported, onResult, continuous, stopRecognition]);
  

  return {
    isListening,
    startRecognition,
    stopRecognition,
    isSupported,
  };
};

    