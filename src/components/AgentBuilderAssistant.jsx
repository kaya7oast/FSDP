import React, { useState, useEffect, useRef } from 'react';

// Initialize Web Speech API
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
      +
        "AgentName": "Name",
        "Description": "Description",
        "Specialization": "Specialization",
        "Capabilities": "Cap1, Cap2", 
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Text-to-Speech
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak new assistant messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && messages.length > 2) {
      speak(lastMessage.content);
    }
  }, [messages]);

  const handleSend = async (messageToSend) => {
    const message = messageToSend || input;
    if (!message.trim()) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const userMsg = { role: 'user', content: message };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', messages: newHistory })
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
      } catch (e) { /* Not JSON, continue */ }

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I can't reach the AI service right now." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (!recognition) return alert("Browser not supported");
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.start();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600">smart_toy</span>
            <h3 className="font-bold">AI Architect</h3>
            {isSpeaking && <span className="flex gap-1 ml-2"><span className="w-1 h-3 bg-purple-500 animate-pulse"/></span>}
        </div>
        <button onClick={() => {window.speechSynthesis.cancel(); setIsSpeaking(false)}} className="text-slate-400 hover:text-red-500">
           <span className="material-symbols-outlined">volume_off</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 rounded-bl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && <div className="text-slate-400 text-sm px-4">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          {canUseVoice && (
            <button onClick={isListening ? () => recognition.stop() : startListening} className={`p-3 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}>
                <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
            </button>
          )}
          <input 
            className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={() => handleSend()} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentBuilderAssistant;