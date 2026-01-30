import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./avatar";
// import { MarkdownMessage } from "./MarkdownMessage"; // UNCOMMENT THIS if using your friend's component

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

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    const userText = input;
    setInput("");

    const userMsg = {
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const agentId = String(selectedAgent.AgentID || selectedAgent._id);
      
      const res = await fetch(`/conversations/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          message: userText,
          conversationId: conversationId,
          chatname: `Chat with ${selectedAgent.AgentName}`,
          docIds: selectedDocIds,
          provider: "openai"
        })
      });

      if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
      const data = await res.json();
      
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.reply && data.reply.content) {
        const botMessage = {
          role: "agent",
          content: data.reply.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
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

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
           {!selectedAgent && (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-10">
                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                   <span className="material-symbols-outlined text-4xl text-slate-400">smart_toy</span>
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Select an Agent</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                  Choose an AI agent from the sidebar to start a new conversation context.
                </p>
             </div>
           )}

           {messages.map((msg, idx) => {
             const isUser = msg.role === "user";
             return (
               <div key={idx} className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isUser && (
                         <div className="flex-shrink-0 mt-1">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 text-xs">
                                   {selectedAgent?.AgentName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                         </div>
                      )}

                      <div className={`
                        relative px-5 py-3.5 text-sm leading-relaxed shadow-sm
                        ${isUser 
                          ? "bg-violet-600 text-white rounded-2xl rounded-tr-sm" 
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm"
                        }
                      `}>
                         <div className="whitespace-pre-wrap">
                            {/* REVERTED TO STANDARD TEXT */}
                            {/* If you want to use your friend's markdown component, replace this line: */}
                            {msg.content} 
                            {/* <MarkdownMessage content={msg.content} /> */}
                         </div>
                         <div className={`text-[10px] mt-1.5 opacity-70 ${isUser ? 'text-violet-100' : 'text-slate-400'} text-right`}>
                            {msg.time}
                         </div>
                      </div>
                  </div>
               </div>
             );
           })}

           {isTyping && (
             <div className="flex justify-start w-full animate-in fade-in duration-300">
               <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 mt-1">
                     <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-sm h-[46px]">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} className="h-4" />
        </div>

        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950 flex-shrink-0 z-20">
          <form 
            onSubmit={handleSendMessage} 
            className={`
              max-w-4xl mx-auto flex items-end gap-2 p-2 
              bg-white dark:bg-slate-900 rounded-2xl 
              border border-slate-200 dark:border-slate-800 
              shadow-lg shadow-violet-200/20 dark:shadow-none 
              transition-all duration-300
              ${selectedAgent ? 'focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500' : 'opacity-60 cursor-not-allowed'}
            `}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSendMessage(e);
                }
              }}
              placeholder={selectedAgent ? `Message ${selectedAgent.AgentName}...` : "Select an agent to start..."}
              className="flex-1 max-h-32 min-h-[44px] py-2.5 px-3 bg-transparent border-none outline-none text-slate-800 dark:text-white text-sm resize-none placeholder:text-slate-400"
              rows={1}
              disabled={!selectedAgent}
            />
            
            <button 
              type="submit"
              disabled={!input.trim() || !selectedAgent || isTyping}
              className={`
                p-2.5 rounded-xl flex items-center justify-center transition-all duration-200
                ${input.trim() && !isTyping && selectedAgent
                   ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg active:scale-95' 
                   : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}
              `}
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </section>
    </div>
  );
}