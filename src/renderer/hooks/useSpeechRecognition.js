import { useState, useRef, useCallback, useEffect } from "react";

const isSpeechSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export function useSpeechRecognition(lang = "it-IT") {
  const [listeningField, setListeningField] = useState(null);
  const recognitionRef = useRef(null);
  const callbackRef = useRef(null);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListeningField(null);
  }, []);

  const start = useCallback((fieldName, onResult) => {
    if (!isSpeechSupported) return;
    recognitionRef.current?.stop();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    callbackRef.current = onResult;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join(" ");
      if (transcript) callbackRef.current?.(transcript);
    };
    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);

    recognition.start();
    recognitionRef.current = recognition;
    setListeningField(fieldName);
  }, [lang]);

  const toggle = useCallback((fieldName, onResult) => {
    if (listeningField === fieldName) stop();
    else start(fieldName, onResult);
  }, [listeningField, start, stop]);

  return { listeningField, isSpeechSupported, toggle };
}
