  import React, { useState, useEffect, useRef } from "react";
  import { Avatar, AvatarFallback } from "./avatar";

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
  // Inside src/components/agentConversation.jsx/page.jsx

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Fetch Agents
        const agentRes = await fetch("/agents");
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          setAgents(Array.isArray(agentData) ? agentData : []);
          if (agentData.length > 0) setSelectedAgent(agentData[0]);
        }

        // 2. FETCH DOCUMENTS ON REFRESH - PLACE HERE
        const docRes = await fetch(`/ingestion/docs/${USER_ID}`); 
        if (docRes.ok) {
          const docData = await docRes.json();
          console.log("Docs received:", docData);
          setDocuments(Array.isArray(docData) ? docData : []);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;

    const loadConversationHistory = async () => {
      // Clear selected docs when switching agents
      setSelectedDocIds([]);

      try {
        // Fetch conversations for this user
        const res = await fetch(`/conversations/user/${USER_ID}`);
        
        if (res.ok) {
          const conversations = await res.json();
          
          // Find the active conversation for this specific agent
          // Compare agent IDs as strings to handle any format differences
          const activeAgentId = String(selectedAgent.AgentID || selectedAgent._id);
          
          const match = conversations.find(
            c => String(c.agentId) === activeAgentId && c.status === "active"
          );

          if (match) {
            setConversationId(match.conversationId);
            
            // Format messages for the UI - exclude system prompts and internal messages
            const formattedMessages = match.messages
              .filter(m => m.role !== "system") // Hide system prompts
              .filter(m => m.visibility === "user") // Only show user-visible messages
              .map(m => ({
                role: m.role === "assistant" ? "agent" : m.role,
                content: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));

            setMessages(formattedMessages);
          } else {
            // No existing conversation for this agent - start fresh
            setMessages([]);
            setConversationId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load conversation history:", err);
        setMessages([]);
        setConversationId(null);
      }
    };

    loadConversationHistory();
  }, [selectedAgent]);

    // 2. Handle Agent Selection - Reset conversation and messages
    const handleAgentSelection = (agent) => {
      setSelectedAgent(agent);
      setMessages([]); // Clear messages when switching agents
      setConversationId(null); // Reset conversation ID for new agent
      setSelectedDocIds([]); // Clear selected docs
    };

    // 3. Document Selection Toggle
    const toggleDocSelection = (docId) => {
      setSelectedDocIds(prev => 
        prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
      );
    };

    // 3. File Upload
    // Inside src/components/agentConversation.jsx/page.jsx

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", USER_ID);

    setIsUploading(true);
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

    // 4. Send Message with Retrieval Doc IDs
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
      console.log("Sending message with docs:", selectedDocIds);
      console.log ("Current conversationId:", conversationId);
      console.log ("To agent:", selectedAgent.AgentID);
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
            docIds: selectedDocIds, // Pass selected docs for retrieval
            provider: "openai"
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("API Error:", res.status, errorData);
          throw new Error(`Failed to send message: ${res.status} - ${errorData.error || errorData.message}`);
        }
        const data = await res.json();
        console.log("Response from server:", data);
        
        if (data.conversationId) {
          console.log("Setting conversation ID:", data.conversationId);
          setConversationId(data.conversationId);
        }
        if (data.reply && data.reply.content) {
          const botMessage = {
            role: "agent",
            content: data.reply.content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMessage]);
          console.log("Agent message added to conversation");
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setIsTyping(false);
      }
    };

    // Auto-scroll logic
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
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
                }`}>
                  {msg.content}
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

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedAgent ? `Message ${selectedAgent.AgentName}...` : "Select an agent..."}
                className="flex-1 max-h-32 min-h-[44px] py-3 px-2 bg-transparent border-none outline-none text-slate-800 dark:text-white text-sm resize-none"
                rows={1}
                disabled={!selectedAgent}
              />
              <button 
                type="submit"
                disabled={!input.trim() || !selectedAgent || isTyping}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    );
  }
