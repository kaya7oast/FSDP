import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./avatar";
import ChatInput from "./input"; // Your Component
import { MarkdownMessage } from "./MarkdownMessage"; // Teammate's Component

// Hardcoded user ID to match ingestion and conversation service defaults
const USER_ID = "U002"; 

// --- TEAMMATE'S HELPER: Cleans up JSON artifacts from Bot ---
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
    // If parsing fails, it's likely just a normal text message, which is fine
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

  // 1. Fetch Agents and Docs
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const agentRes = await fetch("/agents");
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          setAgents(Array.isArray(agentData) ? agentData : []);
          if (agentData.length > 0) setSelectedAgent(agentData[0]);
        }

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

  // 2. Load History (Merged Logic: Teammate's filtering + Your State)
  useEffect(() => {
    if (!selectedAgent) return;

    const loadConversationHistory = async () => {
      setMessages([]); 
      setConversationId(null);
      setSelectedDocIds([]); 

      try {
        const res = await fetch(`/conversations/user/${USER_ID}`);
        if (res.ok) {
          const conversations = await res.json();
          
          // Teammate's fix: Ensure string comparison for IDs
          const activeAgentId = String(selectedAgent.AgentID || selectedAgent._id);
          
          const match = conversations.find(
            c => String(c.agentId) === activeAgentId && c.status === "active"
          );

          if (match) {
            setConversationId(match.conversationId);
            
            // Teammate's fix: Filter out system messages
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
  }, [selectedAgent]);

  const handleAgentSelection = (agent) => setSelectedAgent(agent);

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
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Send Message (Merged: Your Input Logic + Teammate's Parsing)
  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedAgent) return;

    const userMsg = {
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`/conversations/${selectedAgent.AgentID}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          message: text,
          conversationId: conversationId,
          docIds: selectedDocIds,
          provider: "openai"
        })
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const data = await res.json();
      
      if (data.conversationId) setConversationId(data.conversationId);
      
      if (data.reply) {
        // Teammate's fix: Clean up the response before showing
        const cleanContent = parseBotResponse(data.reply.content);

        setMessages(prev => [...prev, {
          role: "assistant",
          content: cleanContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
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

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 rounded-tl-3xl shadow-inner overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your Agents</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.AgentID}
              onClick={() => handleAgentSelection(agent)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedAgent?.AgentID === agent.AgentID 
                  ? "bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-200" 
                  : "hover:bg-white/60 dark:hover:bg-slate-800/60"
              }`}
            >
              <Avatar className="w-10 h-10 bg-blue-100 text-blue-600">
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Knowledge Base</h3>
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-2">
            {documents.map((doc) => (
              <div 
                key={doc.docId} 
                onClick={() => toggleDocSelection(doc.docId)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  selectedDocIds.includes(doc.docId) 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {selectedDocIds.includes(doc.docId) ? "check_circle" : "description"}
                </span>
                <span className="truncate flex-1">{doc.docName || "Untitled Document"}</span>
              </div>
            ))}
          </div>
          <label className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group">
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-500 text-lg">
              {isUploading ? "sync" : "upload_file"}
            </span>
            <span className="text-xs font-medium text-slate-500 group-hover:text-blue-500">
              {isUploading ? "Uploading..." : "Upload Knowledge"}
            </span>
          </label>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <section className="flex-1 flex flex-col h-full relative">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
              <AvatarFallback>{selectedAgent?.AgentName?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-slate-800 dark:text-white">
              {selectedAgent ? selectedAgent.AgentName : "Select an Agent"}
            </h3>
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
    try {
      // SEND FILE TO BACKEND - PLACE HERE
      const res = await fetch("/ingestion/upload", { 
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      
      const newDoc = await res.json();
      
      // Update the UI list immediately
      setDocuments(prev => [...prev, { docId: newDoc.docId, docName: newDoc.docName }]);
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

    // 3. Send Message (Merged: Retrieval + Chatname + Parsing)
  const handleSendMessage = async (text) => {
    // 1. Validation (Adapted for ChatInput which passes text directly)
    if (!text.trim() || !selectedAgent) return;

    const userText = text;

    // 2. Optimistic UI Update
    const userMsg = {
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    console.log("Sending message with docs:", selectedDocIds);

    try {
      // 3. Robust ID Handling (From Main)
      const agentId = String(selectedAgent.AgentID || selectedAgent._id);

      const res = await fetch(`/conversations/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          message: userText,
          conversationId: conversationId,
          // Merge: Keep your Docs AND Teammate's Chatname
          docIds: selectedDocIds, 
          chatname: `Chat with ${selectedAgent.AgentName}`, 
          provider: "openai"
        })
      });

      // 4. Robust Error Handling (From Main)
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error:", res.status, errorData);
        throw new Error(`Failed to send message: ${res.status} - ${errorData.error || errorData.message}`);
      }

      const data = await res.json();
      console.log("Response from server:", data);

      // 5. Update Conversation ID
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // 6. Handle Reply (From Main: Uses parseBotResponse)
      if (data.reply && data.reply.content) {
        // Ensure parseBotResponse is defined at the top of your file!
        const cleanContent = parseBotResponse(data.reply.content);

        const botMessage = {
          role: "assistant", // Standardized to 'assistant' for UI
          content: cleanContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }

    } catch (error) {
      console.error("Chat error:", error);
      // Optional: Add a visible error message to the chat
      setMessages(prev => [...prev, {
        role: "system",
        content: "⚠️ Error sending message. Check console.",
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 rounded-tl-3xl shadow-inner overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your Agents</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.AgentID}
              onClick={() => handleAgentSelection(agent)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedAgent?.AgentID === agent.AgentID 
                  ? "bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-200" 
                  : "hover:bg-white/60 dark:hover:bg-slate-800/60"
              }`}
            >
              <Avatar className="w-10 h-10 bg-blue-100 text-blue-600">
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Knowledge Base</h3>
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-2">
            {documents.map((doc) => (
              <div 
                key={doc.docId} 
                onClick={() => toggleDocSelection(doc.docId)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  selectedDocIds.includes(doc.docId) 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {selectedDocIds.includes(doc.docId) ? "check_circle" : "description"}
                </span>
                <span className="truncate flex-1">{doc.docName || "Untitled Document"}</span>
              </div>
            ))}
          </div>

          {/* KNOWLEDGE BASE SECTION */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Knowledge Base</h3>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-2">
              {documents.map((doc) => (
                <div 
                  key={doc.docId} // Ensure this is unique!
                  onClick={() => toggleDocSelection(doc.docId)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    selectedDocIds.includes(doc.docId) 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {selectedDocIds.includes(doc.docId) ? "check_circle" : "description"}
                  </span>
                  {/* Use a fallback to debug if it's still empty */}
                  <span className="truncate flex-1">{doc.docName || "Untitled Document"}</span>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group">
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-500 text-lg">
                {isUploading ? "sync" : "upload_file"}
              </span>
              <span className="text-xs font-medium text-slate-500 group-hover:text-blue-500">
                {isUploading ? "Uploading..." : "Upload Knowledge"}
              </span>
            </label>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <section className="flex-1 flex flex-col h-full relative">
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
                <AvatarFallback>{selectedAgent?.AgentName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-slate-800 dark:text-white">
                {selectedAgent ? selectedAgent.AgentName : "Select an Agent"}
              </h3>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm overflow-hidden ${
                  msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
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
