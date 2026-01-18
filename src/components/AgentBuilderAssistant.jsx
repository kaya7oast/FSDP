import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Mic, Activity, Trash2, Moon, Sun } from 'lucide-react';

const VoiceAssistant = () => {
  // --- STATE ---
  const [mode, setMode] = useState("offline");
  const [transcript, setTranscript] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [isMicAlive, setIsMicAlive] = useState(false); 

  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const adaVoiceRef = useRef(null);
  
  // Logic Refs
  const isSystemActive = useRef(false);
  const modeRef = useRef("offline"); 
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

    heartbeatTimer.current = setInterval(checkPulse, 1000);

    return () => {
      clearInterval(heartbeatTimer.current);
      safeStop();
    };
  }, []);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const checkPulse = () => {
    if (!isSystemActive.current) return;
    if (modeRef.current === "sentry" && !recognitionRef.current) {
        startSentryMode();
    }
  };

  // --- 2. CORE FUNCTIONS ---
  const toggleSystem = () => {
    if (mode === "offline") {
      isSystemActive.current = true;
      speak("Online.", () => startSentryMode());
    } else {
      isSystemActive.current = false;
      safeStop();
    }
  };

  const safeStop = () => {
    setMode("offline");
    setIsMicAlive(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    synthRef.current.cancel();
  };

  // --- 3. SPEECH RECOGNITION ---
  const startSentryMode = () => {
    if (!isSystemActive.current) return;
    if (recognitionRef.current) recognitionRef.current.abort();

    setMode("sentry");
    setTranscript("");

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    recognition.onend = () => {
      setIsMicAlive(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (text.includes("ada") || text.includes("aether")) {
        recognition.onend = null;
        recognition.stop();
        speak("Yes?", () => startCommandMode());
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch(e) {}
  };

  const startCommandMode = () => {
    if (!isSystemActive.current) return;
    setMode("listening");
    setTranscript("");

    if (recognitionRef.current) recognitionRef.current.abort();

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsMicAlive(true);
    recognition.onend = () => {
      setIsMicAlive(false);
      recognitionRef.current = null;
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

  // --- 4. THE BRAIN (UPDATED PROMPT) ---
  const handleSmartCommand = async (command) => {
    if (!command.trim()) { startSentryMode(); return; }

    setMode("processing");
    if (recognitionRef.current) recognitionRef.current.abort();

    try {
      // 🧠 NEW: Expanded System Prompt
      const systemPrompt = `
        You are Ada, a system controller.
        USER COMMAND: "${command}"
        
        CAPABILITIES:
        1. NAVIGATE: /dashboard, /builder, /conversations.
        2. THEME: Toggle "dark" or "light" mode.
        3. DELETE: Remove an agent by name (e.g. "Delete customer bot").
        4. CHAT: General questions.

        RETURN JSON ONLY:
        { 
          "action": "navigate" | "theme" | "delete" | "chat", 
          "route": "/..." (only for navigate),
          "theme": "dark" | "light" (only for theme),
          "targetName": "name of agent" (only for delete),
          "reply": "short spoken response" 
        }
      `;

      const res = await fetch('/api/ai/system', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', message: systemPrompt })
      });

      const data = await res.json();
      let rawJson = data.response?.candidates?.[0]?.content?.parts?.[0]?.text || 
                    data.response?.choices?.[0]?.message?.content || "{}";
      rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let result = {};
      try { result = JSON.parse(rawJson); } catch (e) { result = { reply: rawJson }; }

      const reply = result.reply || "Done.";
      setAssistantReply(reply);

      // --- EXECUTE ACTIONS ---
      
      // 1. Navigation
      if (result.action === "navigate" && result.route) {
        navigate(result.route);
        speak(reply, () => setTimeout(startSentryMode, 500));
      }
      
      // 2. Theme Control
      else if (result.action === "theme") {
        const root = document.documentElement;
        if (result.theme === "dark") {
           root.classList.add("dark");
           localStorage.setItem("theme", "dark");
        } else {
           root.classList.remove("dark");
           localStorage.setItem("theme", "light");
        }
        speak(reply, () => setTimeout(startSentryMode, 500));
      }

      // 3. Delete Agent (Advanced)
      else if (result.action === "delete" && result.targetName) {
        await performVoiceDelete(result.targetName, reply);
      }

      // 4. Chat
      else {
        speak(reply, () => setTimeout(startSentryMode, 500));
      }

    } catch (err) {
      console.error(err);
      speak("Error connecting.", () => startSentryMode());
    }
  };

  // --- 5. HELPER: VOICE DELETE ---
  const performVoiceDelete = async (targetName, initialReply) => {
     try {
        // A. Fetch all agents to find the ID
        const listRes = await fetch('/agents'); // Uses Proxy
        const agents = await listRes.json();
        
        // B. Fuzzy Match (Find agent that contains the spoken name)
        const match = agents.find(a => 
           a.AgentName?.toLowerCase().includes(targetName.toLowerCase())
        );

        if (match) {
           // C. Perform Delete
           await fetch(`/agents/${match._id}/delete`, { method: 'POST' });
           speak(`Deleted agent ${match.AgentName}.`, () => {
              window.location.reload(); // Refresh to show changes
           });
        } else {
           speak(`I couldn't find an agent named ${targetName}.`, () => startSentryMode());
        }
     } catch(e) {
        speak("I failed to delete that agent.", () => startSentryMode());
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
      <button onClick={toggleSystem} className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform">
        <Mic size={24} />
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
        <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${isMicAlive ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
           <span>{isMicAlive ? "Active" : "..."}</span>
        </div>
        <button onClick={toggleSystem} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all border-2 ${mode === 'sentry' ? "bg-indigo-600 border-indigo-400" : "bg-green-500 border-green-400 animate-pulse"}`}>
           {mode === 'sentry' ? <Mic size={24} className="text-white" /> : <Activity size={24} className="text-white animate-bounce"/>}
        </button>
      </div>

      {(mode === "listening" || mode === "processing" || mode === "speaking") && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95">
            <div className={`p-4 text-white text-center relative ${mode === 'processing' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
               <button onClick={() => startSentryMode()} className="absolute top-3 right-3 opacity-70 hover:opacity-100"><X size={18} /></button>
               <h3 className="font-bold text-lg">{mode === 'processing' ? "Thinking..." : "Ada"}</h3>
            </div>
            <div className="p-8 text-center min-h-[150px] flex flex-col items-center justify-center">
              <p className="text-xl text-slate-800 dark:text-slate-100 font-medium mb-4">"{transcript || assistantReply}"</p>
              {/* Context Icon based on Action */}
              {assistantReply.toLowerCase().includes("delet") && <Trash2 className="text-red-500 mb-2" size={32} />}
              {assistantReply.toLowerCase().includes("mode") && <Moon className="text-blue-500 mb-2" size={32} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;