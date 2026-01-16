import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AgentCard from "./AgentCard";

// Use relative path for Proxy
const API_BASE = "/agents"; 

function AgentDashboard() {
  // ------------------------------------------
  // 1. State Definitions
  // ------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Agent");

  // ------------------------------------------
  // 2. Helpers (Defined ONCE)
  // ------------------------------------------
  const getName = (agent) => (agent?.AgentName ?? "Unnamed Agent");
  const getStatus = (agent) => (agent?.status ?? agent?.Status ?? "active");

  // ------------------------------------------
  // 3. Effects (Theme & Data)
  // ------------------------------------------
  
  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Data Fetching Effect
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      console.log(`📡 Requesting agents for User ID: ${userId}`);
      
      const res = await fetch(`${API_BASE}?userId=${userId}`); 
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    // 1. Get Username
    const storedName = localStorage.getItem('username');
    if (storedName) setUsername(storedName);

    // 2. Sync System Dark Mode (if no preference saved yet)
    if (!localStorage.getItem("theme") && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    // 3. Fetch Data
    fetchAgents();
  }, []);

  // ------------------------------------------
  // 4. Handlers
  // ------------------------------------------

  const handleDeleteAgent = async (_id) => {
    // Optimistic Update
    setAgents((prev) => prev.filter((a) => a._id !== _id));
    try {
      await fetch(`${API_BASE}/${_id}/delete`, { method: "POST" });
    } catch (err) {
      console.error(err);
      fetchAgents(); // Revert on error
    }
  };

  const handleToggleStatus = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent) return;
    const current = String(getStatus(agent)).toLowerCase();
    const newStatus = current === "active" ? "archived" : "active";

    try {
      const res = await fetch(`${API_BASE}/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: newStatus, UpdatedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Status toggle failed");
      
      const updated = await res.json();
      setAgents((prev) => prev.map((a) => (a._id === _id ? updated : a)));
    } catch (err) { console.error(err); }
  };

  const handleDuplicateAgent = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent) return;

    const dupPayload = {
      ...agent,
      _id: undefined, 
      AgentID: undefined, 
      AgentName: `${getName(agent)} (Copy)`,
      Status: "Active",
      Owner: {
        UserID: localStorage.getItem('userId'),
        UserName: localStorage.getItem('username')
      },
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dupPayload),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Duplicate failed");
      }
      
      const created = await res.json();
      setAgents((prev) => [...prev, created]);
    } catch (err) {
      console.error("Duplicate Error:", err);
      alert(`Could not duplicate: ${err.message}`);
    }
  };

  // ------------------------------------------
  // 5. Filtering Logic
  // ------------------------------------------
  const filteredAgents = agents.filter((agent) => {
    const status = String(getStatus(agent)).toLowerCase();
    if (status === "deleted") return false; 

    const name = getName(agent).toLowerCase();
    const search = searchTerm.toLowerCase();
    const capabilities = (agent.Capabilities || []).join(" ").toLowerCase();

    const matchesSearch = name.includes(search) || capabilities.includes(search);
    const matchesStatus = statusFilter === "All" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // ------------------------------------------
  // 6. Render
  // ------------------------------------------
  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-30 px-8 py-4 flex justify-between items-center backdrop-blur-md border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <h2 className="text-xl font-bold">Agent Management</h2>
        
        <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <Link to="/builder" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-transform hover:-translate-y-0.5">
              <span>+</span> Create Agent
            </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Personalized Welcome */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
            Welcome Back, {username}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
            Manage your fleet of AI agents. Your neural link is active, and your configurations are synced.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search by name..." 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            {['All', 'Active', 'Archived'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors border ${
                  statusFilter === filter 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                onEdit={() => console.log("Edit", agent._id)}
                onDuplicate={() => handleDuplicateAgent(agent._id)}
                onDelete={() => handleDeleteAgent(agent._id)}
                onToggleStatus={() => handleToggleStatus(agent._id)}
              />
            ))}
            
            <Link to="/builder" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer h-full min-h-[250px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center mb-4 transition-colors">
                <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">add</span>
              </div>
              <h3 className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Deploy New Agent</h3>
            </Link>
          </div>
        )}
        
        {!loading && filteredAgents.length === 0 && (
           <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No agents found matching your filters.</p>
           </div>
        )}
      </main>
    </div>
  );
}

export default AgentDashboard;