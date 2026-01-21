import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

// Hardcoded user ID for now (matches your builder default)
const USER_ID = "U002"; 

export default function AgentConversation() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null); // To track the current session
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Fetch Real Agents on Mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/agents"); // Goes to Agent Service via Gateway
        if (!res.ok) throw new Error("Failed to load agents");
        const data = await res.json();
        
        // Filter only active agents if needed, or take all
        const activeAgents = Array.isArray(data) ? data : [];
        setAgents(activeAgents);

        // Select the first agent automatically if available
        if (activeAgents.length > 0) {
          setSelectedAgent(activeAgents[0]);
        }
      } catch (err) {
        console.error("Error fetching agents:", err);
      }
    };
    fetchAgents();
  }, []);

  // 2. Load Conversation when Agent Changes (Optional/Advanced)
  // For now, we'll start fresh or you can implement a fetch for history here.
  useEffect(() => {
    if (selectedAgent) {
      setMessages([{
        role: "agent", 
        content: `Hello! I am ${selectedAgent.AgentName}. How can I help you?`,
        time: new Date().toLocaleTimeString()
      }]);
      setConversationId(null); // Reset session for new agent
    }
  }, [selectedAgent]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 3. Send Message to Backend
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    const userText = input;
    setInput(""); // Clear input immediately

    // Optimistic UI Update (Show user message immediately)
    const userMsg = {
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // API Call
      // Note: matches backend route: app.post("/conversations/:agentId/chat", ...)
      const res = await fetch(`/conversations/${selectedAgent.AgentID}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          message: userText,
          conversationId: conversationId, // Pass ID to maintain context
          provider: "openai" // or "gemini" / "perplexity"
        })
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      
      // Update Conversation ID so next message continues this thread
      if (data.conversationId) setConversationId(data.conversationId);

      // Add Agent Reply
      if (data.reply) {
        const agentMsg = {
          role: "agent", // Backend says "assistant", UI expects "agent" or mapped below
          content: data.reply.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, agentMsg]);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: "⚠️ Error: Could not connect to the agent. " + error.message,
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 rounded-tl-3xl shadow-inner overflow-hidden animate-fade-in">
      
      {/* Sidebar: Real Agent List */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Your Agents</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {agents.length === 0 && <p className="text-center text-slate-400 mt-10">No agents found.</p>}
          
          {agents.map((agent) => (
            <button
              key={agent._id || agent.AgentID}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                selectedAgent?.AgentID === agent.AgentID 
                  ? "bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700" 
                  : "hover:bg-white/60 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10 bg-blue-100 text-blue-600">
                  <AvatarFallback>{agent.AgentName?.[0] || "A"}</AvatarFallback>
                </Avatar>
                {/* Visual Status Indicator */}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                  (agent.Status || 'active').toLowerCase() === 'active' ? 'bg-green-500' : 'bg-slate-400'
                }`}></span>
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{agent.AgentName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{agent.Specialization || "General Assistant"}</p>
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
              <AvatarFallback>{selectedAgent?.AgentName?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-tight">
                {selectedAgent ? selectedAgent.AgentName : "Select an Agent"}
              </h3>
              {selectedAgent && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-slate-500 font-medium">Online</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Message Bubble */}
                  <div className={`group relative p-4 rounded-2xl shadow-sm ${
                    isUser 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center h-12">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={selectedAgent ? `Message ${selectedAgent.AgentName}...` : "Select an agent to start..."}
              className="flex-1 max-h-32 min-h-[44px] py-3 px-2 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-400 resize-none"
              rows={1}
              disabled={!selectedAgent}
            />
            
            <button 
              type="submit"
              disabled={!input.trim() || !selectedAgent || isTyping}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}