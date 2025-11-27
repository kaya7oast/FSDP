import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

// Mock Data for UI
const AGENTS_LIST = [
  { id: "1", name: "Marketing Genius", status: "online", role: "Creative", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=marketing" },
  { id: "2", name: "Tech Support", status: "busy", role: "Technical", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=support" },
  { id: "3", name: "Data Analyst", status: "offline", role: "Analytics", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=data" },
];

const INITIAL_MESSAGES = [
  { id: 1, role: "agent", content: "Hello! I'm your Marketing Genius. How can I help boost your reach today?", time: "10:30 AM" },
  { id: 2, role: "user", content: "I need ideas for a Q3 product launch campaign.", time: "10:32 AM" },
];

export default function AgentConversation() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS_LIST[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      setTimeout(() => {
        const agentMsg = {
          id: Date.now() + 1,
          role: "agent",
          content: `I can certainly help with that. Let's analyze the target demographics first.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, agentMsg]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 rounded-tl-3xl shadow-inner overflow-hidden animate-fade-in">
      
      {/* Secondary Sidebar: Chat List */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {AGENTS_LIST.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                selectedAgent.id === agent.id 
                  ? "bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700" 
                  : "hover:bg-white/60 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10 bg-slate-200">
                  <AvatarImage src={agent.avatar} />
                  <AvatarFallback>{agent.name[0]}</AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                  agent.status === 'online' ? 'bg-green-500' : 
                  agent.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                }`}></span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{agent.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{agent.role} Agent</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col h-full relative">
        
        {/* Chat Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
              <AvatarImage src={selectedAgent.avatar} />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{selectedAgent.name}</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-slate-500 font-medium">Active now</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="w-8 h-8 mt-1 shrink-0">
                    <AvatarImage src={isUser ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" : selectedAgent.avatar} />
                    <AvatarFallback>{isUser ? "U" : "A"}</AvatarFallback>
                  </Avatar>
                  
                  <div className={`group relative p-4 rounded-2xl shadow-sm ${
                    isUser 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <span className={`text-[10px] absolute -bottom-5 ${isUser ? "right-0" : "left-0"} text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={selectedAgent.avatar} />
                </Avatar>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center h-12">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
            <button type="button" className="p-2 text-slate-400 hover:text-blue-500 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined">add_circle</span>
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 max-h-32 min-h-[44px] py-3 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-400 resize-none"
              rows={1}
            />
            
            <button 
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-2">AI can make mistakes. Please verify important information.</p>
        </div>
      </section>
    </div>
  );
}