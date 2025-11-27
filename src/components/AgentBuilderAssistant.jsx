import React, { useState, useEffect, useRef } from 'react';

// 1. Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const canUseVoice = !!SpeechRecognition;
const recognition = canUseVoice ? new SpeechRecognition() : null;

const AgentBuilderAssistant = ({ onUpdateForm, onComplete }) => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: `You are an expert AI Agent Architect. Your goal is to help the user configure a new AI Agent. 
      Ask questions to gather: Agent Name, Description, Specialization, and Capabilities.
      
      CRITICAL OUTPUT RULE:
      If you have enough information to define the agent, output ONLY a valid JSON object in this format:
      {
        "AgentName": "Name",
        "Description": "Description",
        "Specialization": "Specialization",
        "Capabilities": ["Cap1", "Cap2"],
        "Personality": { "Tone": "Professional", "ToneValue": 80 }
      }
      Do not add markdown formatting or extra text when outputting JSON.
      If you need more info, just ask the user naturally.`
    },
    {
      role: 'assistant',
      content: "Hello! I'm here to help you build your AI Agent. Tell me, what kind of agent would you like to create today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // NEW: State for TTS
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // NEW: Text-to-Speech Function
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // NEW: Auto-speak when AI responds
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    // Only speak if the last message is from the assistant and wasn't there on mount
    if (lastMessage?.role === 'assistant' && messages.length > 2) {
      speak(lastMessage.content);
    }
  }, [messages]);

  const handleSend = async (messageToSend) => {
    const message = messageToSend || input;
    if (!message.trim()) return;

    // Stop speaking if user interrupts
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const userMsg = { role: 'user', content: message };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput(''); 
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:3000/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openai', 
          messages: newHistory
        })
      });

      const data = await response.json();
      let aiContent = data.response || "I'm having trouble connecting. Please try again.";

      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const config = JSON.parse(jsonMatch[0]);
          onUpdateForm(config);
          aiContent = `I've updated the form for ${config.AgentName || 'your agent'}. Is there anything else you'd like to tweak?`;
        }
      } catch (parseError) {
        // Not JSON, continue as chat
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error communicating with the server." }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const startListening = () => {
    if (!recognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
    }

    // Stop speaking before listening
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    recognition.continuous = false; 
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript); 
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // --- YOUR INSERTED UI CODE STARTS HERE ---
  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            <h3 className="font-bold text-slate-800 dark:text-white">Agent Architect</h3>
            
            {/* Visual Indicator for Speaking */}
            {isSpeaking && (
               <span className="flex items-center gap-1 ml-2">
                 <span className="w-1 h-3 bg-primary animate-pulse"></span>
                 <span className="w-1 h-4 bg-primary animate-pulse delay-75"></span>
                 <span className="w-1 h-2 bg-primary animate-pulse delay-150"></span>
               </span>
            )}
        </div>
        <div className="flex items-center gap-3">
            {/* Mute/Stop Button */}
            <button 
                onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }} 
                className={`text-slate-400 hover:text-red-500 transition-colors ${isSpeaking ? 'text-red-500' : ''}`}
                title="Stop Speaking"
            >
                <span className="material-symbols-outlined text-lg">volume_off</span>
            </button>
            <button onClick={onComplete} className="text-xs text-primary hover:underline font-medium">
                Done / Switch to Form
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && (
             <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 rounded-bl-none">
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-full px-2 py-1 border border-slate-200 dark:border-slate-700">
          
          {canUseVoice && (
            <button 
                onClick={isListening ? () => recognition.stop() : startListening}
                className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
                title={isListening ? "Stop Listening" : "Start Voice Input"}
            >
                <span className="material-symbols-outlined text-lg">
                    {isListening ? 'mic_off' : 'mic'}
                </span>
            </button>
          )}

          <input 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 ml-3"
            placeholder={isListening ? "Speak now..." : "Type or speak your agent idea..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isListening}
          />
          
          <button 
            onClick={() => handleSend()} 
            className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center"
            disabled={isProcessing || isListening}
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentBuilderAssistant;