import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AgentCard from "./AgentCard";

// Use relative path for Proxy
const API_BASE = "/agents"; 

function AgentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // 1. Theme State (With LocalStorage memory)
  const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem("theme") === "dark";
  });

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. The Theme Toggle Logic (Targeting HTML tag)
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

  // 3. Fetch Data
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  // Helpers
  const getName = (agent) => (agent?.AgentName ?? "Unnamed Agent");
  const getStatus = (agent) => (agent?.status ?? agent?.Status ?? "active");

  // Actions
  const handleDeleteAgent = async (_id) => {
    // Optimistic Update
    setAgents((prev) => prev.filter((a) => a._id !== _id));
    try {
      // Backend Call
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
      AgentID: `agent_${Date.now()}`,
      AgentName: `${getName(agent)} (Copy)`,
      Status: "active",
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dupPayload),
      });
      const created = await res.json();
      setAgents((prev) => [...prev, created]);
    } catch (err) { console.error(err); }
  };

  // Filter Logic (Hides Deleted Agents)
  const filteredAgents = agents.filter((agent) => {
    const status = String(getStatus(agent)).toLowerCase();
    if (status === "deleted") return false; // Hide deleted

    const name = getName(agent).toLowerCase();
    const search = searchTerm.toLowerCase();
    const capabilities = (agent.Capabilities || []).join(" ").toLowerCase();

    const matchesSearch = name.includes(search) || capabilities.includes(search);
    const matchesStatus = statusFilter === "All" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    // MAIN WRAPPER: This is what controls the background color
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-30 px-8 py-4 flex justify-between items-center backdrop-blur-md border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <h2 className="text-xl font-bold">Agent Management</h2>
        
        <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {/* Simple Icon Toggle */}
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <Link to="/builder" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-transform hover:-translate-y-0.5">
              <span>+</span> Create Agent
            </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Hero */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black mb-3">Welcome Back, Admin</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
            Manage your fleet of AI agents. Monitor their status, update configurations, or deploy new instances.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Search by name..." 
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex gap-2">
            {['All', 'Active', 'Archived'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-6 py-3 rounded-xl font-medium transition-colors border ${
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
            {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                onDuplicate={() => handleDuplicateAgent(agent._id)}
                onDelete={() => handleDeleteAgent(agent._id)}
                onToggleStatus={() => handleToggleStatus(agent._id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AgentDashboard;