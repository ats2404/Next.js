
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

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const onEnd = useCallback(() => {
    setIsListening(false);
    if (continuous && recognitionRef.current) {
        // If continuous is true, restart recognition after it ends.
        // This handles cases where the browser might time it out.
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Could not restart recognition", e);
        }
    }
  }, [continuous]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
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
      if (event.error === 'no-speech') {
        // Ignore no-speech errors in continuous mode to allow restart
        if (continuous) return;
      }
      console.error('Speech recognition error', event.error);
      stopRecognition();
    };

    recognition.onend = () => {
      onEnd();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    }
    
  }, [isSupported, onResult, continuous, stopRecognition, onEnd]);
  
  const startRecognition = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        // This can happen if start() is called while it's already starting
        console.error("Could not start recognition", e);
      }
    }
  }, [isListening]);


  return {
    isListening,
    startRecognition,
    stopRecognition,
    isSupported,
  };
};
