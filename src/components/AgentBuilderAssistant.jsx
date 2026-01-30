import React, { useState, useEffect, useRef } from 'react';

const AgentBuilderAssistant = ({ onUpdateForm, onComplete }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am the Architect. Describe the agent you want to build (e.g., 'a coding buddy'), and I'll draft the configuration for you." }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    try {
      // 1. IMPROVED PROMPT: Iterative Design
      const systemPrompt = `
        You are an AI Architect designed to configure other AI agents.
        
        YOUR GOAL: 
        Draft a JSON configuration based on the user's request. 
        If the request is vague, make reasonable assumptions but mention them in your 'reply'.
        Allowed to ask clarifying questions in 'reply'.

        USER REQUEST: "${input}"
        
        STRICT JSON RESPONSE FORMAT:
        {
          "AgentName": "Creative Name",
          "Description": "Short purpose",
          "Personality": { 
             "ToneValue": 0-100 (integer), 
             "SystemPrompt": "You are a..." 
          },
          "Capabilities": ["Python", "Web Search"], 
          "reply": "Conversational response to the user. Explain what you changed or ask for details."
        }
      `;

      const res = await fetch('/ai/generate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai', message: systemPrompt })
      });

      const data = await res.json();
      
      // Universal JSON Extractor
      let rawText = data.response || "{}";
      if (typeof rawText === 'object') rawText = JSON.stringify(rawText);
      let cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "");
      const first = cleanJson.indexOf('{');
      const last = cleanJson.lastIndexOf('}');
      if (first !== -1 && last !== -1) cleanJson = cleanJson.substring(first, last + 1);

      const config = JSON.parse(cleanJson);

      // 2. Update the Form (Live Draft)
      // We update the parent form silently so the user can see it if they switch tabs,
      // but we DO NOT switch tabs for them.
      onUpdateForm(config);

      // 3. Reply to User
      setMessages(prev => [...prev, { role: 'assistant', content: config.reply || "Configuration updated." }]);

      // 4. NO AUTO-COMPLETE. User must click "Finalize".

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't quite catch that. Could you rephrase your requirement?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px] transition-colors duration-300">
      
      {/* Header with Control */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <span className="material-symbols-outlined text-lg">smart_toy</span>
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Architect</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Drafting Mode</p>
            </div>
        </div>
        
        {/* THE MANUAL TRIGGER */}
        <button 
            onClick={() => onComplete({})} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold shadow-md hover:scale-105 transition-transform"
        >
            Finalize & Review <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-black/20">
        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-bl-none'
                }`}>
                    {m.content}
                </div>
            </div>
        ))}
        {isProcessing && (
            <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex gap-1 items-center shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2 relative">
            <input 
                className="flex-1 w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 border-2 border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
                placeholder="Describe your agent..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
                onClick={handleSend} 
                disabled={!input.trim() || isProcessing} 
                className="absolute right-2 top-2 bottom-2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-400 aspect-square flex items-center justify-center shadow-sm"
            >
                <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentBuilderAssistant;