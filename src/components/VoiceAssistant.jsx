import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mic, Activity, Trash2, Moon, Zap, MessageSquare } from 'lucide-react';

const VoiceAssistant = () => {
  // --- STATE ---
  const [mode, setMode] = useState("offline");
  const [transcript, setTranscript] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [isMicAlive, setIsMicAlive] = useState(false); 

  const navigate = useNavigate();
  
  // --- REFS ---
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const adaVoiceRef = useRef(null);
  
  const isSystemActive = useRef(localStorage.getItem('ada_active') === 'true');
  const isProcessingWakeWord = useRef(false);
  const watchdogTimer = useRef(null);

  // --- 1. SETUP & EVENT LISTENER ---
  useEffect(() => {
    // A. Load Voice
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

    // B. Auto-wake
    if (isSystemActive.current) startSentryMode();

    // C. SUPERVISOR LISTENER
    const handleSupervisorSignal = (event) => {
      const { message, type } = event.detail;
      console.log(`⚡ Signal: [${type}] ${message}`);

      if (type === 'CRITICAL' || type === 'WARNING') {
        if (recognitionRef.current) recognitionRef.current.abort();
        synthRef.current.cancel();
        
        setMode("speaking");
        setAssistantReply(message); // Show the warning text
        speak(message, () => {
           if (isSystemActive.current) startSentryMode();
        });
      } else {
        speak(message);
      }
    };

    window.addEventListener('ada:supervisor', handleSupervisorSignal);

    return () => {
      fullStop();
      window.removeEventListener('ada:supervisor', handleSupervisorSignal);
    };
  }, []);

  // --- 2. CONTROLS ---
  const toggleSystem = () => {
    if (mode === "offline") {
      isSystemActive.current = true;
      localStorage.setItem('ada_active', 'true');
      speak("System online.", () => startSentryMode());
    } else {
      isSystemActive.current = false;
      localStorage.setItem('ada_active', 'false');
      fullStop();
      setMode("offline");
    }
  };

  const fullStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent loop
      recognitionRef.current.abort();
    }
    synthRef.current.cancel();
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    setIsMicAlive(false);
  };

  // --- 3. MODES ---
  const startSentryMode = () => {
    if (!isSystemActive.current) return;
    fullStop(); 
    isProcessingWakeWord.current = false;
    setMode("sentry");
    setTranscript("");
    setAssistantReply(""); // Clear old text

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    recognition.onend = () => {
      setIsMicAlive(false);
      if (isSystemActive.current && mode === "sentry") setTimeout(() => startSentryMode(), 500);
    };

    recognition.onresult = (event) => {
      if (isProcessingWakeWord.current) return;
      const results = Array.from(event.results);
      const text = results[results.length - 1][0].transcript.toLowerCase();
      
      if (text.includes("ada") || text.includes("hey data") || text.includes("beta")) {
        isProcessingWakeWord.current = true; 
        recognition.stop(); 
        speak("Yes?", () => startCommandMode());
      }
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) {}
  };

  const startCommandMode = () => {
    if (!isSystemActive.current) return;
    fullStop(); 
    setMode("listening");
    setTranscript("");

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    recognition.onend = () => {
      setIsMicAlive(false);
      // If we didn't hear anything, go back to sentry
      if (isSystemActive.current && mode === "listening") startSentryMode();
    };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setTranscript(text);
      if (event.results[event.results.length - 1].isFinal) handleSmartCommand(text);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) {}
  };

  // --- 4. INTELLIGENCE ---
  const handleSmartCommand = async (command) => {
    if (!command.trim()) { startSentryMode(); return; }
    fullStop();
    setMode("processing");

    try {
      // 1. GET TOKEN
      const token = localStorage.getItem("token"); 

      const systemPrompt = `
        You are Ada, the System Interface.
        YOUR JOB: Execute user commands. Return strict JSON.
        
        KNOWN ROUTES:
        - "Home" -> "/dashboard"
        - "Builder" -> "/builder"
        - "Chats" -> "/chats"
        - "Settings" -> "/settings"

        CAPABILITIES:
        1. NAVIGATE: Switch screens.
        2. THEME: Switch "dark" or "light".
        3. DELETE: Remove an agent by name.

        STRICT RESPONSE FORMAT (JSON ONLY):
        {
          "action": "navigate" | "theme" | "delete" | "chat",
          "route": "/path",
          "theme": "dark" | "light",
          "target": "Agent Name",
          "reply": "Short confirmation."
        }
        USER SAID: "${command}"
      `;

      const res = await fetch('/ai/generate', { 
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ provider: 'openai', message: systemPrompt })
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      
      let rawText = data.response || data.reply || data.text || "{}";
      if (typeof rawText === 'object') rawText = JSON.stringify(rawText);
      let cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "");
      const first = cleanJson.indexOf('{');
      const last = cleanJson.lastIndexOf('}');
      if (first !== -1 && last !== -1) cleanJson = cleanJson.substring(first, last + 1);

      let result = {};
      try { result = JSON.parse(cleanJson); } catch (e) { result = { reply: "Command unrecognized." }; }

      let action = (result.action || "chat").toLowerCase();
      if (action === "navigation") action = "navigate";

      let route = result.route || result.destination || result.path;
      if (route && !route.startsWith('/')) route = '/' + route;

      const reply = result.reply || "Done.";
      setAssistantReply(reply);

      // Execution
      if (action === "theme") {
        const root = document.documentElement;
        if (result.theme === "dark" || command.toLowerCase().includes("dark")) {
           root.classList.add("dark");
           localStorage.setItem("theme", "dark");
        } else {
           root.classList.remove("dark");
           localStorage.setItem("theme", "light");
        }
        window.dispatchEvent(new Event("storage"));
        speak(reply, () => setTimeout(startSentryMode, 500));
      } 
      else if (action === "navigate" && route) {
        navigate(route);
        speak(reply, () => setTimeout(startSentryMode, 500));
      } 
      else if (action === "delete" && result.target) {
        await performVoiceDelete(result.target);
      } 
      else {
        speak(reply, () => setTimeout(startSentryMode, 500));
      }

    } catch (err) {
      console.error(err);
      speak("System error.", () => startSentryMode());
    }
  };

  const performVoiceDelete = async (targetName) => {
     try {
        const token = localStorage.getItem("token");
        const listRes = await fetch('/agents', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const rawData = await listRes.json();
        const agents = Array.isArray(rawData) ? rawData : (rawData.agents || []);
        
        const match = agents.find(a => (a.AgentName || "").toLowerCase().includes(targetName.toLowerCase()));

        if (match) {
           await fetch(`/agents/${match._id}/delete`, { 
               method: 'POST',
               headers: token ? { Authorization: `Bearer ${token}` } : {}
           });
           speak(`Deleted ${match.AgentName}.`, () => window.location.reload());
        } else {
           speak(`I couldn't find ${targetName}.`, () => startSentryMode());
        }
     } catch(e) {
        speak("Delete failed.", () => startSentryMode());
     }
  };

  const speak = (text, onComplete) => {
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    synthRef.current.cancel();

    setMode("speaking");
    const utterance = new SpeechSynthesisUtterance(text || "Done.");
    if (adaVoiceRef.current) utterance.voice = adaVoiceRef.current;
    utterance.rate = 1.1;

    const safetyTime = (text.length * 100) + 2000; // Extra safety buffer
    
    const handleComplete = () => {
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
      if (onComplete) onComplete();
    };

    utterance.onend = handleComplete;
    // Fallback if browser speech engine hangs
    watchdogTimer.current = setTimeout(handleComplete, safetyTime);

    synthRef.current.speak(utterance);
  };

  // --- RENDER (UPDATED: Non-Blocking "Toast") ---
  if (mode === "offline") {
    return (
      <button onClick={toggleSystem} className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform"><Mic size={24} /></button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
        {/* STATUS BADGE */}
        <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded flex items-center gap-2 pointer-events-auto">
           <div className={`w-2 h-2 rounded-full ${isMicAlive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
           <span>{mode.toUpperCase()}</span>
        </div>
        
        {/* MAIN BUTTON */}
        <button onClick={toggleSystem} className={`pointer-events-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all border-2 ${mode === 'sentry' ? "bg-indigo-600 border-indigo-400" : "bg-green-500 border-green-400 animate-pulse"}`}>
           {mode === 'sentry' ? <Mic size={24} className="text-white" /> : <Activity size={24} className="text-white animate-bounce"/>}
        </button>
      </div>

      {/* NON-BLOCKING UI OVERLAY (Floating above the button) */}
      {(mode === "listening" || mode === "processing" || mode === "speaking") && (
        <div className="fixed bottom-24 right-6 z-40 w-80 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300 relative">
             
             {/* MANUAL CLOSE BUTTON (Fixes "Does not go away" issue) */}
             <button 
                onClick={() => { synthRef.current.cancel(); startSentryMode(); }} 
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Dismiss"
             >
                <X size={16} />
             </button>

             <div className="text-center flex flex-col items-center justify-center gap-3">
                {mode === "processing" && <Zap className="text-yellow-500 animate-pulse" size={24} />}
                {assistantReply.toLowerCase().includes("delet") && <Trash2 className="text-red-500" size={24} />}
                {mode === "listening" && <MessageSquare className="text-blue-500 animate-bounce" size={24} />}
                
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    "{transcript || assistantReply || "..."}"
                </p>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;