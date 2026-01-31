import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./avatar";
import { MarkdownMessage } from "./MarkdownMessage";

// Hardcoded user ID to match ingestion and conversation service defaults
const USER_ID = "U002"; 

export default function AgentConversation() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  
  // Knowledge Base / Retrieval State
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Fetch Agents and Knowledge Base Docs
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch Agents
        const agentRes = await fetch("/agents");
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          setAgents(Array.isArray(agentData) ? agentData : []);
          if (agentData.length > 0) setSelectedAgent(agentData[0]);
        }

        // Fetch Documents
        const docRes = await fetch(`/ingestion/docs/${USER_ID}`); 
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocuments(Array.isArray(docData) ? docData : []);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Load History when Agent Changes
  useEffect(() => {
    if (!selectedAgent) return;

    const loadConversationHistory = async () => {
      setSelectedDocIds([]); // Clear selected docs
      try {
        const res = await fetch(`/conversations/user/${USER_ID}`);
        if (res.ok) {
          const conversations = await res.json();
          const activeAgentId = String(selectedAgent.AgentID || selectedAgent._id);
          
          const match = conversations.find(
            c => String(c.agentId) === activeAgentId && c.status === "active"
          );

          if (match) {
            setConversationId(match.conversationId);
            const formattedMessages = match.messages
              .filter(m => m.role !== "system") 
              .filter(m => m.visibility === "user")
              .map(m => ({
                role: m.role === "assistant" ? "agent" : m.role,
                content: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));
            setMessages(formattedMessages);
          } else {
            setMessages([]);
            setConversationId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err);
        setMessages([]);
      }
    };

    loadConversationHistory();
  }, [selectedAgent]);

  // 3. Handlers
  const handleAgentSelection = (agent) => {
    setSelectedAgent(agent);
    setMessages([]);
    setConversationId(null);
    setSelectedDocIds([]);
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", USER_ID);

    setIsUploading(true);
    try {
      const res = await fetch("/ingestion/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const newDoc = await res.json();
      setDocuments(prev => [...prev, { docId: newDoc.docId, docName: newDoc.docName }]);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to clean bot response
  const parseBotResponse = (content) => {
    // Remove markdown code blocks if present
    return content.replace(/```[\s\S]*?```/g, '').trim();
  };

  const handleSendMessage = async (text) => {
    // Validation
    if (!text.trim() || !selectedAgent) return;

    const userMsg = {
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    console.log("Sending message with docs:", selectedDocIds);

    try {
      // 2. Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      // 3. Robust ID Handling (From Main)
      const agentId = String(selectedAgent.AgentID || selectedAgent._id);

      const res = await fetch(`/conversations/${agentId}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: USER_ID,
          message: text,
          conversationId: conversationId,
          // Merge: Keep your Docs AND Teammate's Chatname
          docIds: selectedDocIds, 
          chatname: `Chat with ${selectedAgent.AgentName}`, 
          provider: "openai"
        })
      });

      // 4. Robust Error Handling
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API Error:", res.status, errorData);
        throw new Error(`Failed to send message: ${res.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
      }

      const data = await res.json();
      console.log("Response from server:", data);

      // 5. Update Conversation ID
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // 6. Handle Reply (Uses parseBotResponse)
      if (data.reply && data.reply.content) {
        const cleanContent = parseBotResponse(data.reply.content);

        setMessages(prev => [...prev, {
          role: "assistant",
          content: cleanContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }

    } catch (error) {
      console.error("Chat error:", error);
      // Optional: Add a visible error message to the chat
      setMessages(prev => [...prev, {
        role: "system",
        content: `⚠️ Error: ${error.message}`,
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 4. Render
  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* ─── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 hidden md:flex">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-600">forum</span>
            Chats
          </h2>
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {agents.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {agents.map((agent) => {
             const isActive = selectedAgent?.AgentID === agent.AgentID;
             return (
              <button
                key={agent.AgentID}
                onClick={() => handleAgentSelection(agent)}
                className={`group w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? "bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800 shadow-sm"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                   <Avatar className={`w-10 h-10 border-2 ${isActive ? 'border-violet-200 dark:border-violet-700' : 'border-transparent'}`}>
                    <AvatarFallback className={isActive ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}>
                      {agent.AgentName?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                  {isActive && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>}
                </div>
                
                <div className="overflow-hidden flex-1">
                  <p className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {agent.AgentName}
                  </p>
                  <p className="text-xs text-slate-500 truncate group-hover:text-slate-600 dark:group-hover:text-slate-400">
                    {agent.Specialization || "General Assistant"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                Context Files
             </h3>
             <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded">
               {selectedDocIds.length} active
             </span>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1 mb-3 pr-1 custom-scrollbar">
            {documents.map((doc) => (
              <div 
                key={doc.docId}
                onClick={() => toggleDocSelection(doc.docId)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                  selectedDocIds.includes(doc.docId) 
                    ? "bg-white dark:bg-slate-800 border-violet-400 text-violet-700 dark:text-violet-300 shadow-sm" 
                    : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${selectedDocIds.includes(doc.docId) ? 'text-violet-500' : 'text-slate-400'}`}>
                  {selectedDocIds.includes(doc.docId) ? "check_box" : "check_box_outline_blank"}
                </span>
                <span className="truncate flex-1 font-medium">{doc.docName || "Untitled"}</span>
              </div>
            ))}
          </div>

          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer bg-white dark:bg-slate-900 hover:border-violet-500 hover:text-violet-600 transition-all group shadow-sm">
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-inherit">cloud_upload</span>
            )}
            <span className="text-xs font-bold text-slate-500 group-hover:text-inherit">
              {isUploading ? "Uploading..." : "Add Context"}
            </span>
          </label>
        </div>
      </aside>

      {/* ─── MAIN CHAT AREA ──────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col h-full relative bg-slate-50 dark:bg-slate-950">
        
        <header className="h-16 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm/50">
          <div className="flex items-center gap-3">
             {selectedAgent ? (
               <>
                 <Avatar className="w-9 h-9 ring-2 ring-slate-100 dark:ring-slate-800">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                      {selectedAgent.AgentName?.[0]}
                    </AvatarFallback>
                 </Avatar>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight">
                      {selectedAgent.AgentName}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Online</span>
                    </div>
                 </div>
               </>
             ) : (
               <div className="flex items-center gap-2 text-slate-500">
                 <span className="material-symbols-outlined">radio_button_unchecked</span>
                 <span className="font-medium">No Agent Selected</span>
               </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
              }`}>
                {/* Use MarkdownMessage for agents if possible, otherwise plain text */}
                {msg.role === "user" ? msg.content : <MarkdownMessage content={msg.content} />}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border p-4 rounded-2xl rounded-tl-none flex gap-1 items-center h-12">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={!selectedAgent || isTyping} 
        />
      </section>
    </div>
  );
}

// ChatInput Component
function ChatInput({ onSendMessage, disabled }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Select an agent to start chatting..." : "Type your message..."}
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </form>
  );
}
