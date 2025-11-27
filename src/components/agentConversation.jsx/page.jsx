import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

// Keep this pointing to your Gateway URL
const API_BASE = "http://localhost:3000";
const USER_ID = "user_123"; // Hardcoded for demo

export default function AgentConversation() {
  const [userId] = useState(USER_ID);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Fetch Agents on Mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_BASE}/agents`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        
        const data = await res.json();
        const agentList = Array.isArray(data) ? data : [];
        
        const formattedAgents = agentList.map(agent => ({
          id: agent.AgentID || agent._id, 
          _id: agent._id, // Important: Mongo ID used for linking
          name: agent.AgentName,
          role: agent.Specialization || "Assistant",
          status: agent.Status === "Active" ? "online" : "offline",
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${agent._id}`,
          description: agent.Description
        }));

        setAgents(formattedAgents);
        
        if (formattedAgents.length > 0) {
          setSelectedAgent(formattedAgents[0]);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };

    fetchAgents();
  }, []);

  // 2. Load Conversation when Agent Changes
  useEffect(() => {
    if (!selectedAgent) return;

    const fetchConversation = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversations/user/${userId}`);
        
        if (res.ok) {
          const data = await res.json();
          const allConversations = Array.isArray(data) ? data : (data.conversations || []);
          
          const currentConv = allConversations.find(c => 
            c.agentId === selectedAgent.id || c.agentId === selectedAgent._id
          );

          if (currentConv && currentConv.messages) {
            const uiMessages = currentConv.messages.map(msg => ({
              id: msg._id || Date.now() + Math.random(),
              role: msg.role === 'assistant' ? 'assistant' : msg.role, // Normalize role
              content: msg.content,
              time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setMessages(uiMessages);
          } else {
            setMessages([{
              id: "welcome",
              role: "assistant",
              content: `Hello! I am ${selectedAgent.name}. ${selectedAgent.description || "How can I help you?"}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          }
        } else {
          // Fallback if no conversation exists yet
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: `Hello! I am ${selectedAgent.name}. ${selectedAgent.description || "How can I help you?"}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      }
    };

    fetchConversation();
  }, [selectedAgent, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 3. Handle Sending Messages
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    const currentInput = input;
    setInput(""); 
    
    // Optimistic UI Update
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: currentInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // ✅ FIXED: Changed endpoint to /conversations/.../chat
      const res = await fetch(`${API_BASE}/conversations/${selectedAgent._id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          message: currentInput,
          provider: "openai"
        })
      });

      if (!res.ok) throw new Error(`Status: ${res.status}`);

      const data = await res.json();
      
      const agentMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply?.content || data.response || "I received your message but couldn't generate a reply.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "system",
        content: "⚠️ Error: The conversation service is unreachable. Please check your backend connection.",
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 rounded-tl-3xl shadow-inner overflow-hidden animate-fade-in">
      
      {/* Sidebar: Agent List */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Your Agents</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search agents..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
          {agents.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-slate-400 text-sm">No agents found.</p>
              <p className="text-xs text-slate-500 mt-2">Ensure backend is running on port 3000</p>
            </div>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  selectedAgent?.id === agent.id 
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
                    agent.status === 'online' ? 'bg-green-500' : 'bg-slate-400'
                  }`}></span>
                </div>
                <div className="text-left w-full overflow-hidden">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{agent.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{agent.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col h-full relative">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {selectedAgent && (
              <>
                <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={selectedAgent.avatar} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{selectedAgent.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedAgent.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    <span className="text-xs text-slate-500 font-medium capitalize">{selectedAgent.status}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="w-8 h-8 mt-1 shrink-0">
                    <AvatarImage src={isUser ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}` : selectedAgent?.avatar} />
                    <AvatarFallback>{isUser ? "U" : "A"}</AvatarFallback>
                  </Avatar>
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
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={selectedAgent?.avatar} />
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
              placeholder={selectedAgent ? `Message ${selectedAgent.name}...` : "Select an agent to start chat..."}
              disabled={!selectedAgent}
              className="flex-1 max-h-32 min-h-[44px] py-3 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-400 resize-none disabled:opacity-50"
              rows={1}
            />
            
            <button 
              type="submit"
              disabled={!input.trim() || !selectedAgent}
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