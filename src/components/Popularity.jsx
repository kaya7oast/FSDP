import React, { useState, useEffect } from 'react';
import AgentCard from "./AgentCard"; 
import AgentCard2 from "./AgentCard2";

const API_BASE = "/agents";

const PopularityPage = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [agents, setAgents] = useState([]); 
  const [feed, setFeed] = useState([]);     
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Ensure we have a valid User ID. If not found, use a temporary one for testing.
  const userId = localStorage.getItem('userId') || "U123"; 

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'discover') {
        const res = await fetch(`${API_BASE}/published`);
        const data = await res.json();
        setFeed(Array.isArray(data) ? data : []);
      } else {
        const res = await fetch(`${API_BASE}?userId=${userId}`);
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- LIKE HANDLER ---
  const handleLike = async (id) => {
    if (!userId) {
      alert("Please log in to like agents.");
      return;
    }
    try {
      // Use the ID passed to this function
      const res = await fetch(`${API_BASE}/toggleLike/${id}`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }) 
      });
      if (res.ok) fetchData(); 
    } catch (err) { console.error("Like failed:", err); }
  };

  const handleAddAgent = async (originalAgent) => {
    if (!confirm(`Add "${originalAgent.AgentName}" to your dashboard?`)) return;

    try {
      const payload = {
        ...originalAgent,
        _id: undefined, 
        AgentID: undefined, 
        AgentName: `${originalAgent.AgentName} (Copy)`,
        Owner: { UserID: userId, UserName: "Me" }, 
        isPublished: false, 
        Status: "Active",
        Likes: [], 
        Views: 0   
      };

      const res = await fetch(API_BASE, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("✅ Agent successfully added to your dashboard!");
      } else {
        alert("Failed to add agent.");
      }
    } catch (err) {
      console.error("Add failed:", err);
      alert("Error adding agent.");
    }
  };

  const handlePublish = async (agentId, mongoId) => {
    const description = prompt("Enter a description for your published agent:");
    if (!description) return;

    try {
      await fetch(`${API_BASE}/publish/${mongoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filteredItems = (activeTab === 'discover' ? feed : agents).filter((agent) => {
    if (agent.Status?.toLowerCase() === "deleted") return false;
    const name = (agent.AgentName || "Unnamed").toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search);
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-screen transition-colors duration-300">
      <header className="sticky top-0 z-30 px-8 py-4 flex justify-between items-center backdrop-blur-md border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <h2 className="text-xl font-bold">Popularity Hub</h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setActiveTab('discover')} className={`px-6 py-2 rounded-lg text-sm font-medium ${activeTab === 'discover' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>Discover</button>
          <button onClick={() => setActiveTab('publish')} className={`px-6 py-2 rounded-lg text-sm font-medium ${activeTab === 'publish' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>My Agents</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder={activeTab === 'discover' ? "Search global feed..." : "Search your agents to publish..."} 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Syncing with neural link...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((agent) => (
              <div key={agent._id} className="relative group">
                
                {activeTab === 'discover' ? (
                  <AgentCard2 
                agent={agent} 
                currentUserId={userId}
                isOwner={false} 
                onLike={() => handleLike(agent._id)} 
                onAdd={() => handleAddAgent(agent)}
              />
                ) : (
                  <AgentCard 
                    agent={agent}
                    onEdit={() => handlePublish(agent.AgentID, agent._id)}
                    onToggleStatus={null} 
                  />
                )}
                
                {activeTab === 'publish' && !agent.isPublished && (
                   <div className="absolute bottom-6 left-28 z-20"> 
                      <button 
                        onClick={() => handlePublish(agent.AgentID, agent._id)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">upload</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Publish</span>
                      </button>
                   </div>
                )}

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PopularityPage;