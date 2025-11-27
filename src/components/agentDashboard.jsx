import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AgentCard from "./AgentCard";

const API_BASE = "http://localhost:3000/agents";

function AgentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAgents();
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const name = (agent.AgentName || "Unnamed").toLowerCase();
    const status = String(agent.status || agent.Status || "active").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Agent Management</h2>
          
          <div className="flex items-center gap-4">
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
               <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
                 {darkMode ? 'light_mode' : 'dark_mode'}
               </span>
             </button>
             <Link to="/builder" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:translate-y-[-2px] transition-all">
               <span className="material-symbols-outlined text-[20px]">add</span>
               Create Agent
             </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          
          {/* Hero Section */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">Welcome Back, Admin</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              Manage your fleet of AI agents. Monitor their status, update configurations, or deploy new instances from this control center.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Search by name or capability..." 
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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

          {/* Agents Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent._id}
                  agent={agent}
                  // Pass placeholder handlers or real ones if you implement them in this file
                  onEdit={() => console.log('Edit', agent._id)}
                  onDuplicate={() => console.log('Duplicate', agent._id)}
                  onDelete={() => console.log('Delete', agent._id)}
                  onToggleStatus={() => console.log('Toggle', agent._id)}
                />
              ))}
              
              {/* Add New Card Shortcut */}
              <Link to="/builder" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer h-full min-h-[250px]">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center mb-4 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">add</span>
                </div>
                <h3 className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Deploy New Agent</h3>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AgentDashboard;