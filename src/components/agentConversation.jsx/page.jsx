import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./avatar";
import ChatInput from "./input"; 
import { MarkdownMessage } from "./MarkdownMessage"; 

// --- HELPER: Cleans up JSON artifacts from Bot ---
const parseBotResponse = (rawContent) => {
  if (typeof rawContent !== 'string') return rawContent;

  let cleaned = rawContent.trim();

  // 1. Remove markdown code blocks if the bot wrapped the JSON in them
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  // 2. Attempt to parse JSON to find 'final_response'
  try {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonCandidate = cleaned.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonCandidate);
      
      if (parsed.final_response) {
        return parsed.final_response;
      }
    }
  } catch (e) {
    // If parsing fails, it's likely just a normal text message
  }

  return cleaned;
};

export default function AgentConversation() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  
  // Knowledge Base State
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [userId, setUserId] = useState(null);

  // 1. Fetch Agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const token = localStorage.getItem("token"); // Get token for auth headers

        // Fetch Agents
        const agentRes = await fetch("/agents", {
             headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          setAgents(Array.isArray(agentData) ? agentData : []);
          if (agentData.length > 0) setSelectedAgent(agentData[0]);
        }
      } catch (err) {
        console.error("Error fetching agents:", err);
      }
    };
    fetchAgents();
  }, []);

  // Get authenticated user id: prefer /auth/me, fallback to decoding JWT
  useEffect(() => {
    const resolveUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      // Try backend endpoint
      try {
        const res = await fetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.userId || data.id || data._id || (data.user && data.user.id));
          return;
        }
      } catch (e) {
        // ignore and fallback to token decode
      }

      // Fallback: decode JWT payload
      try {
        const base64Payload = token.split('.')[1];
        const jsonPayload = decodeURIComponent(atob(base64Payload).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);
        setUserId(payload.userId || payload.id || payload.sub);
      } catch (err) {
        console.warn('Failed to resolve userId from token', err);
      }
    };
    resolveUser();
  }, []);

  // Fetch documents once we have userId
  useEffect(() => {
    if (!userId) return;
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const docRes = await fetch(`/ingestion/docs/${userId}`, {
             headers: token ? { Authorization: `Bearer ${token}` } : {}
        }); 
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocuments(Array.isArray(docData) ? docData : []);
        }
      } catch (err) {
        console.error("Error fetching docs:", err);
      }
    };
    fetchDocs();
  }, [userId]);

  // 2. Load History
  useEffect(() => {
    if (!selectedAgent || !userId) return;

    const loadConversationHistory = async () => {
      setMessages([]); 
      setConversationId(null);
      setSelectedDocIds([]); 

      try {
           const token = localStorage.getItem("token");
           console.log("[CONVERSATION] Loading history for userId:", userId);
           console.log("[CONVERSATION] Token available:", !!token);
           
           const res = await fetch(`/conversations/user/${userId}`, {
             headers: token ? { Authorization: `Bearer ${token}` } : {}
           });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("[CONVERSATION] Failed to load history:", res.status, errorData);
          return;
        }

        if (res.ok) {
          const conversations = await res.json();
          console.log("[CONVERSATION] Loaded conversations:", conversations);
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
          }
        }
      } catch (err) {
        console.error("Failed to load conversation history:", err);
      }
    };
    loadConversationHistory();
  }, [selectedAgent, userId]);

  const handleAgentSelection = (agent) => setSelectedAgent(agent);

  const toggleDocSelection = (docId) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    
    if (!userId || !docId) return;

    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/ingestion/docs/${userId}/${docId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error("Failed to delete document");

      // Remove from UI
      setDocuments(prev => prev.filter(doc => doc.docId !== docId));
      setSelectedDocIds(prev => prev.filter(id => id !== docId));
      alert("Document deleted successfully");
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Error deleting document: " + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!userId) {
      alert('You must be signed in to upload files.');
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/ingestion/upload", { 
          method: "POST", 
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const newDoc = await res.json();
      setDocuments(prev => [...prev, { docId: newDoc.docId, docName: newDoc.docName }]);
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Send Message
  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedAgent || !userId) return;

    const userMsg = {
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const agentId = String(selectedAgent.AgentID || selectedAgent._id);
      const token = localStorage.getItem("token");

      const res = await fetch(`/conversations/${agentId}/chat`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "" 
        },
        body: JSON.stringify({
          userId: userId,
          message: text,
          conversationId: conversationId,
          docIds: selectedDocIds, 
          chatname: `Chat with ${selectedAgent.AgentName}`, 
          provider: "openai"
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error:", res.status, errorData);
        throw new Error(`Failed to send message: ${res.status} - ${errorData.error || errorData.message}`);
      }

      const data = await res.json();
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.reply && data.reply.content) {
        const cleanContent = parseBotResponse(data.reply.content);

        const botMessage = {
          role: "assistant", 
          content: cleanContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }

    } catch (error) {
      console.error("Chat error:", error);
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

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 rounded-tl-3xl shadow-inner overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your Agents</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 py-4">
          {agents.map((agent) => (
            <button
              key={agent.AgentID}
              onClick={() => handleAgentSelection(agent)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedAgent?.AgentID === agent.AgentID 
                  ? "bg-violet-50 dark:bg-slate-800 ring-1 ring-violet-200 dark:ring-slate-700" 
                  : "hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Avatar className="w-10 h-10 bg-violet-100 text-violet-600">
                <AvatarFallback>{agent.AgentName?.[0] || "A"}</AvatarFallback>
              </Avatar>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{agent.AgentName}</p>
                <p className="text-xs text-slate-500 truncate">{agent.Specialization}</p>
              </div>
            </button>
          ))}
        </div>

        {/* KNOWLEDGE BASE SECTION */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Context Files</h3>
             <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600">{selectedDocIds.length} active</span>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-1 custom-scrollbar">
            {documents.map((doc) => (
              <div 
                key={doc.docId} 
                onClick={() => toggleDocSelection(doc.docId)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors group ${
                  selectedDocIds.includes(doc.docId) 
                    ? "bg-white dark:bg-slate-800 border border-violet-200 text-violet-700 dark:text-violet-300 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${selectedDocIds.includes(doc.docId) ? 'text-violet-500' : 'text-slate-400'}`}>
                  {selectedDocIds.includes(doc.docId) ? "check_box" : "check_box_outline_blank"}
                </span>
                <span className="truncate flex-1">{doc.docName || "Untitled Document"}</span>
                <button 
                  onClick={(e) => handleDeleteDocument(e, doc.docId)}
                  className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 text-red-500 hover:text-red-600"
                  title="Delete document"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
          <label className="flex items-center justify-center gap-2 w-full p-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer bg-white dark:bg-slate-900 hover:border-violet-500 hover:text-violet-600 transition-all group">
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading || !userId} />
            <span className="material-symbols-outlined text-slate-400 group-hover:text-inherit text-lg">
              {isUploading ? "sync" : "cloud_upload"}
            </span>
            <span className="text-xs font-bold text-slate-500 group-hover:text-inherit">
              {isUploading ? "Uploading..." : "Add Context"}
            </span>
          </label>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <section className="flex-1 flex flex-col h-full relative bg-slate-50 dark:bg-slate-950">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
              <AvatarFallback>{selectedAgent?.AgentName?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white">
                {selectedAgent ? selectedAgent.AgentName : "Select an Agent"}
                </h3>
                {selectedAgent && <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[10px] text-slate-500 font-medium uppercase">Online</span></div>}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-2xl max-w-[80%] text-sm overflow-hidden ${
                msg.role === "user" 
                  ? "bg-violet-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
              }`}>
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <MarkdownMessage content={msg.content} />
                )}
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

        {/* --- USE YOUR NEW COMPONENT --- */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={!selectedAgent || isTyping || !userId} 
        />
      </section>
    </div>
  );
}