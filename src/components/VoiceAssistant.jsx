import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, X, MessageSquare, Activity, LayoutDashboard, Bot, Sparkles } from 'lucide-react';

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [assistantReply, setAssistantReply] = useState("How can I help you?");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for speech recognition
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      
      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Process the final command when silence is detected
        // We use a timeout to let the state update with the full transcript
        setTimeout(() => handleCommand(), 100);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setAssistantReply("Sorry, I didn't catch that.");
      };
    } else {
      setAssistantReply("Voice features are not supported in this browser.");
    }
  }, []);

  // Ensure we use the latest transcript for processing
  const transcriptRef = useRef(transcript);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  const speak = (text) => {
    if (synthRef.current.speaking) synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    synthRef.current.speak(utterance);
    setAssistantReply(text);
  };

  const handleCommand = () => {
    const command = transcriptRef.current.toLowerCase();
    if (!command.trim()) return;

    // --- NAVIGATION LOGIC ---
    
    // 1. Agent Builder
    if (command.includes('build') || command.includes('create') || command.includes('make') || command.includes('new agent')) {
      speak("Sure! Taking you to the Agent Builder.");
      navigate('/builder');
      closeAfterDelay();
    } 
    // 2. Dashboard
    else if (command.includes('dashboard') || command.includes('home') || command.includes('overview')) {
      speak("Going to your Dashboard!");
      navigate('/dashboard');
      closeAfterDelay();
    }
    // 3. Conversations
    else if (command.includes('chat') || command.includes('talk') || command.includes('conversation') || command.includes('messages')) {
      speak("Opening your conversations!");
      navigate('/conversations');
      closeAfterDelay();
    }
    // 4. Analytics
    else if (command.includes('analytics') || command.includes('stats') || command.includes('performance')) {
      speak("Checking the analytics!");
      navigate('/analytics');
      closeAfterDelay();
    }
    // Fallback
    else {
      speak("I'm not sure how to do that yet, but I can help you navigate the app.");
    }
  };

  const closeAfterDelay = () => {
    setTimeout(() => {
      setIsOpen(false);
      setTranscript("");
    }, 2500);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setAssistantReply("Listening...");
      recognitionRef.current.start();
    }
  };

  // Render nothing if closed, just the floating button
  if (!isOpen) {
    return (
      <button 
        onClick={() => { setIsOpen(true); speak("Hello! Where would you like to go?"); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all flex items-center justify-center z-50 group"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-sm">
          AI Assistant
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Assistant Card */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
          <button 
            onClick={() => { setIsOpen(false); recognitionRef.current?.stop(); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <div className="mb-2 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md shadow-inner">
             <Bot size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold">How can I help?</h3>
          <p className="text-blue-100 text-sm mt-1">Try "Take me to the builder"</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-6">
          
          {/* Transcript Display */}
          <div className="min-h-[3rem] flex items-center justify-center">
            {transcript ? (
              <p className="text-xl text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                "{transcript}"
              </p>
            ) : (
              <p className="text-slate-500 italic">{assistantReply}</p>
            )}
          </div>

          {/* Visualizer / Button */}
          <div className="flex justify-center">
             <button
                onClick={toggleListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening 
                    ? "bg-red-500 shadow-red-500/50 shadow-lg scale-110" 
                    : "bg-blue-600 shadow-blue-500/50 shadow-lg hover:bg-blue-700"
                }`}
             >
                <Mic size={32} className="text-white z-10" />
                
                {/* Ping Animation when listening */}
                {isListening && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                    <span className="absolute inline-flex h-3/4 w-3/4 rounded-full bg-red-400 opacity-75 animate-ping [animation-delay:0.2s]"></span>
                  </>
                )}
             </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
             <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 col-span-2">Suggested Commands</div>
             <SuggestionPill icon={<LayoutDashboard size={14}/>} text="Go to Dashboard" onClick={() => { setTranscript("Go to Dashboard"); handleCommand(); }} />
             <SuggestionPill icon={<Activity size={14}/>} text="Show Analytics" onClick={() => { setTranscript("Show Analytics"); handleCommand(); }} />
             <SuggestionPill icon={<Bot size={14}/>} text="Create Agent" onClick={() => { setTranscript("Create New Agent"); handleCommand(); }} />
             <SuggestionPill icon={<MessageSquare size={14}/>} text="Chat with Agent" onClick={() => { setTranscript("Open Conversations"); handleCommand(); }} />
          </div>

        </div>
      </div>
    </div>
  );
};

const SuggestionPill = ({ icon, text, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm text-slate-600 dark:text-slate-300"
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default VoiceAssistant;