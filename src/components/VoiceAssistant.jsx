import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mic, Activity, Trash2, Moon, Zap } from 'lucide-react';

const VoiceAssistant = () => {
  // --- STATE ---
  const [mode, setMode] = useState("offline"); // offline | sentry | listening | processing | speaking
  const [transcript, setTranscript] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [isMicAlive, setIsMicAlive] = useState(false); 

  const navigate = useNavigate();
  
  // --- REFS (The "Brain" that survives reloads) ---
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const adaVoiceRef = useRef(null);
  
  // Logic Flags
  const isSystemActive = useRef(localStorage.getItem('ada_active') === 'true');
  const isProcessingWakeWord = useRef(false); // Prevents "Double Yes"
  const watchdogTimer = useRef(null);

  // --- 1. INITIAL SETUP ---
  useEffect(() => {
    // Load Voice
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

    // Auto-Start if active
    if (isSystemActive.current) {
        startSentryMode();
    }

    // CLEANUP: The most important part!
    return () => {
      fullStop();
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
    // Kill Mic
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent triggers
      recognitionRef.current.onresult = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    // Kill Speech
    synthRef.current.cancel();
    // Kill Timers
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    setIsMicAlive(false);
  };

  // --- 3. SENTRY MODE (Listening for "Ada") ---
  const startSentryMode = () => {
    if (!isSystemActive.current) return;
    
    // 1. Clean slate
    fullStop(); 
    isProcessingWakeWord.current = false;
    setMode("sentry");
    setTranscript("");

    // 2. Setup Mic
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true; // Sentry needs continuous
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    
    // Auto-restart if it dies silently (Common Chrome behavior)
    recognition.onend = () => {
      setIsMicAlive(false);
      if (isSystemActive.current && mode === "sentry") {
        setTimeout(() => startSentryMode(), 500);
      }
    };

    recognition.onresult = (event) => {
      // LOCK: If we are already waking up, ignore everything else
      if (isProcessingWakeWord.current) return;

      const results = Array.from(event.results);
      const text = results[results.length - 1][0].transcript.toLowerCase();
      
      if (text.includes("ada") || text.includes("hey data") || text.includes("beta")) {
        isProcessingWakeWord.current = true; // Engage Lock
        recognition.stop(); // Stop listening immediately
        speak("Yes?", () => startCommandMode());
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) {}
  };

  // --- 4. COMMAND MODE (Listening for Orders) ---
  const startCommandMode = () => {
    if (!isSystemActive.current) return;
    fullStop(); // Kill previous mic

    setMode("listening");
    setTranscript("");

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = false; // Command needs single-shot
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    
    recognition.onend = () => {
      setIsMicAlive(false);
      // If we stopped listening but didn't process anything, go back to sleep
      if (isSystemActive.current && mode === "listening" && !transcript) {
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

  // --- 5. INTELLIGENCE ---
  const handleSmartCommand = async (command) => {
    if (!command.trim()) { startSentryMode(); return; }

    fullStop(); // Stop listening while thinking
    setMode("processing");

    try {
      console.log("🎤 Processing:", command);

      const systemPrompt = `
        You are Ada. USER SAID: "${command}"
        RETURN JSON ONLY.
        MANDATORY FIELDS: "action", "reply".
        ACTIONS: "theme", "navigate", "delete", "chat".
        Example: { "action": "navigate", "route": "/dashboard", "reply": "On it." }
      `;

      const res = await fetch('/api/ai/system', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', message: systemPrompt })
      });

      const data = await res.json();
      
      // Universal Extraction
      let rawText = data.response || data.reply || data.text || "{}";
      if (typeof rawText === 'object') rawText = JSON.stringify(rawText);

      // Cleanup
      let cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "");
      const first = cleanJson.indexOf('{');
      const last = cleanJson.lastIndexOf('}');
      if (first !== -1 && last !== -1) cleanJson = cleanJson.substring(first, last + 1);

      let result = {};
      try { result = JSON.parse(cleanJson); } catch (e) { result = { reply: "I'm confused." }; }

      // Logic Mapping
      let action = (result.action || "chat").toLowerCase();
      if (action === "navigation") action = "navigate";
      
      const target = result.target || result.agent || result.name || result.item; 
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
      else if (action === "delete" && target) {
        await performVoiceDelete(target);
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
        const listRes = await fetch('/agents');
        const rawData = await listRes.json();
        const agents = Array.isArray(rawData) ? rawData : (rawData.agents || []);
        
        const match = agents.find(a => (a.AgentName || "").toLowerCase().includes(targetName.toLowerCase()));

        if (match) {
           await fetch(`/agents/${match._id}/delete`, { method: 'POST' });
           speak(`Deleted ${match.AgentName}. Reloading.`, () => {
              window.location.reload(); 
           });
        } else {
           speak(`I couldn't find ${targetName}.`, () => startSentryMode());
        }
     } catch(e) {
        speak("Delete failed.", () => startSentryMode());
     }
  };

  // --- 6. SPEECH SYNTHESIS (Stabilized) ---
  const speak = (text, onComplete) => {
    // Kill any existing timer or speech
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    synthRef.current.cancel();

    setMode("speaking");
    const utterance = new SpeechSynthesisUtterance(text || "Done.");
    if (adaVoiceRef.current) utterance.voice = adaVoiceRef.current;
    utterance.rate = 1.1;

    // The Safety Net: Force completion after X seconds
    const safetyTime = (text.length * 100) + 1000; // 100ms per character + 1s buffer
    
    // Define the "Finish Line"
    const handleComplete = () => {
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
      if (onComplete) onComplete();
    };

    utterance.onend = handleComplete;
    
    // If browser doesn't fire onend, we force it
    watchdogTimer.current = setTimeout(() => {
        console.warn("⚠️ Watchdog: Forcing speech end.");
        handleComplete();
    }, safetyTime);

    synthRef.current.speak(utterance);
  };

  // --- RENDER ---
  if (mode === "offline") {
    return (
      <button onClick={toggleSystem} className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform">
        <Mic size={24} />
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${isMicAlive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
           <span>{mode.toUpperCase()}</span>
        </div>
        <button onClick={toggleSystem} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all border-2 ${mode === 'sentry' ? "bg-indigo-600 border-indigo-400" : "bg-green-500 border-green-400 animate-pulse"}`}>
           {mode === 'sentry' ? <Mic size={24} className="text-white" /> : <Activity size={24} className="text-white animate-bounce"/>}
        </button>
      </div>
      
      {(mode === "listening" || mode === "processing" || mode === "speaking") && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95">
             <div className="p-8 text-center min-h-[150px] flex flex-col items-center justify-center">
              <p className="text-xl text-slate-800 dark:text-slate-100 font-medium mb-4">"{transcript || assistantReply}"</p>
              {assistantReply.toLowerCase().includes("delet") && <Trash2 className="text-red-500 mb-2" size={32} />}
              {mode === "processing" && <Zap className="text-yellow-500 mb-2 animate-pulse" size={32} />}
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;