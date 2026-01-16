import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Power, Zap, Mic, Activity, RefreshCw } from 'lucide-react';

const VoiceAssistant = () => {
  // --- UI STATE ---
  // "offline", "sentry", "listening", "processing", "speaking"
  const [mode, setMode] = useState("offline"); 
  const [transcript, setTranscript] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [isMicAlive, setIsMicAlive] = useState(false); 

  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const adaVoiceRef = useRef(null);
  
  // --- LOGIC REFS (The Fix for Stale Closures) ---
  const isSystemActive = useRef(false);   // Is the big "Enable" button on?
  const modeRef = useRef("offline");      // FRESH copy of 'mode' for the timer
  const heartbeatTimer = useRef(null);

  // --- 1. SETUP ---
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      adaVoiceRef.current = voices.find(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Zira") || 
        v.name.includes("Samantha")
      ) || voices[0];
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Start the Watchdog Timer (Runs every 1 second)
    heartbeatTimer.current = setInterval(checkPulse, 1000);

    return () => {
      clearInterval(heartbeatTimer.current);
      safeStop();
    };
  }, []);

  // Sync state to ref so the timer can see it
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // --- 2. THE WATCHDOG (Phoenix Protocol) ---
  const checkPulse = () => {
    // Only act if the system is supposed to be ON
    if (!isSystemActive.current) return;

    // If we are in "Sentry" mode (waiting for wake word)
    // AND the mic is supposedly dead...
    if (modeRef.current === "sentry" && !recognitionRef.current) {
        console.log("❤ Heartbeat: Reviving Sentry...");
        startSentryMode();
    }
    
    // Check if the browser silently killed the process
    // (If we have a ref, but isMicAlive is false for > 2 seconds, kill and restart)
    // For now, we rely on the 'onend' clearing the ref.
  };

  // --- 3. CONTROLS ---
  const toggleSystem = () => {
    if (mode === "offline") {
      isSystemActive.current = true;
      speak("System online.", () => startSentryMode());
    } else {
      isSystemActive.current = false;
      safeStop();
    }
  };

  const safeStop = () => {
    setMode("offline");
    setIsMicAlive(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent zombie callbacks
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    synthRef.current.cancel();
  };

  // --- 4. SENTRY MODE ---
  const startSentryMode = () => {
    if (!isSystemActive.current) return;
    
    // 1. Clean up any old ghosts
    if (recognitionRef.current) recognitionRef.current.abort();

    // 2. Set State
    setMode("sentry");
    setTranscript("");

    // 3. Build FRESH Instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // We manually restart
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    
    recognition.onend = () => {
      setIsMicAlive(false);
      recognitionRef.current = null; // Mark as dead so Heartbeat knows to revive it
    };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (text.includes("ada") || text.includes("aether")) {
        recognition.onend = null; // Don't let the heartbeat restart it yet
        recognition.stop();
        speak("Yes?", () => startCommandMode());
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) { console.warn("Start error:", e); }
  };

  // --- 5. COMMAND MODE ---
  const startCommandMode = () => {
    if (!isSystemActive.current) return;
    setMode("listening");
    setTranscript("");

    if (recognitionRef.current) recognitionRef.current.abort();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    
    recognition.onend = () => {
      setIsMicAlive(false);
      recognitionRef.current = null;
      // If silenced out, go back to sentry immediately
      if (isSystemActive.current && modeRef.current === "listening" && !transcript) {
         startSentryMode();
      }
    };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setTranscript(text);
      if (event.results[event.results.length - 1].isFinal) {
        handleSmartCommand(text);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) {}
  };

  // --- 6. AI LOGIC ---
  const handleSmartCommand = async (command) => {
    if (!command.trim()) {
      startSentryMode();
      return;
    }

    setMode("processing");
    // Kill mic so it doesn't hear itself
    if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
    }

    try {
      const systemPrompt = `
        You are Ada.
        VALID ROUTES: /dashboard, /builder, /conversations, /analytics.
        USER SAID: "${command}"
        RETURN JSON: { "action": "navigate" | "chat", "route": "/...", "reply": "short answer" }
      `;

      const res = await fetch('/api/ai/system', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', message: systemPrompt })
      });

      const data = await res.json();
      
      let rawJson = data.response?.candidates?.[0]?.content?.parts?.[0]?.text || 
                    data.response?.choices?.[0]?.message?.content || 
                    data.response || "{}";
      
      if (typeof rawJson !== 'string') rawJson = JSON.stringify(rawJson);
      rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();

      let result = {};
      try { result = JSON.parse(rawJson); } catch (e) { result = { reply: rawJson }; }

      const finalReply = result.reply || result.message || "Done.";
      setAssistantReply(finalReply);

      speak(finalReply, () => {
        if (result.action === "navigate" && result.route) {
          navigate(result.route);
        }
        setTimeout(() => startSentryMode(), 500);
      });

    } catch (err) {
      console.error(err);
      speak("Error connecting.", () => startSentryMode());
    }
  };

  const speak = (text, onComplete) => {
    setMode("speaking");
    if (synthRef.current.speaking) synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (adaVoiceRef.current) utterance.voice = adaVoiceRef.current;
    utterance.rate = 1.1;
    utterance.onend = () => { if (onComplete) onComplete(); };
    synthRef.current.speak(utterance);
  };

  // --- RENDER ---
  if (mode === "offline") {
    return (
      <button 
        onClick={toggleSystem}
        className="fixed bottom-6 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-transform animate-bounce font-bold"
      >
        <Power size={20} />
        <span>Enable Ada</span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
        
        {/* Status Badge */}
        <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${isMicAlive ? 'bg-green-500 animate-pulse' : 'bg-orange-500 animate-bounce'}`}></div>
           <span>{isMicAlive ? "Listening" : "Restarting..."}</span>
        </div>

        <button 
          onClick={toggleSystem}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all border-2 ${
            mode === 'sentry' ? "bg-indigo-600 border-indigo-400" : 
            "bg-green-500 border-green-400 animate-pulse"
          }`}
        >
           {mode === 'sentry' ? <Mic size={24} className="text-white" /> : 
            mode === 'speaking' ? <Activity size={24} className="text-white animate-bounce"/> :
            mode === 'offline' ? <Power size={24} /> :
            <Zap size={24} className="text-white fill-current" />}
        </button>
      </div>

      {(mode === "listening" || mode === "processing" || mode === "speaking") && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95 duration-200">
            <div className={`p-4 text-white text-center relative ${
               mode === 'processing' ? 'bg-purple-600' : 'bg-indigo-600'
            }`}>
               <button onClick={() => startSentryMode()} className="absolute top-3 right-3 opacity-70 hover:opacity-100"><X size={18} /></button>
               <h3 className="font-bold tracking-wide text-lg">
                 {mode === 'processing' ? "Thinking..." : "Ada Active"}
               </h3>
            </div>
            <div className="p-8 text-center min-h-[150px] flex flex-col items-center justify-center">
              <p className="text-xl text-slate-800 dark:text-slate-100 font-medium leading-relaxed mb-4">
                "{transcript || assistantReply || "..."}"
              </p>
              {mode === 'listening' && (
                <div className="flex gap-1 h-4 items-end">
                   <div className="w-1 bg-red-500 h-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-1 bg-red-500 h-2/3 animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-1 bg-red-500 h-full animate-bounce"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;