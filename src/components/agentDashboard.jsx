// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import AgentCard from "./AgentCard";

// const API_BASE = "http://localhost:3000/agents";

// function AgentDashboard() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [darkMode, setDarkMode] = useState(false);
//   const [agents, setAgents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // ------------------------------------------
//   // 1. Data Fetching & Handlers
//   // ------------------------------------------
//   const fetchAgents = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(API_BASE);
//       const data = await res.json();
//       setAgents(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAgents();
//     // Sync dark mode with system or local preference if needed
//     if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//       setDarkMode(true);
//     }
//   }, []);

//   // Helper to safely get agent properties
//   const getName = (agent) => (agent?.AgentName ?? "Unnamed Agent");
//   const getStatus = (agent) => (agent?.status ?? agent?.Status ?? "active");

//   // Handler: Delete Agent
//   const handleDeleteAgent = async (_id) => {
//     const agent = agents.find((a) => a._id === _id);
//     if (!agent || !window.confirm(`Delete ${getName(agent)}?`)) return;

//     try {
//       const res = await fetch(`${API_BASE}/${_id}/delete`, { method: "POST" });
//       if (!res.ok) throw new Error("Failed to delete agent");
//       setAgents((prev) => prev.filter((a) => a._id !== _id));
//     } catch (err) {
//       console.error(err);
//       alert("Failed to delete agent.");
//     }
//   };

//   // Handler: Toggle Status
//   const handleToggleStatus = async (_id) => {
//     const agent = agents.find((a) => a._id === _id);
//     if (!agent) return;

//     const current = String(getStatus(agent)).toLowerCase();
//     const newStatus = current === "active" ? "archived" : "active";

//     try {
//       const res = await fetch(`${API_BASE}/${_id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ Status: newStatus, UpdatedAt: new Date().toISOString() }),
//       });
//       if (!res.ok) throw new Error("Status toggle failed");
      
//       // Optimistic update or re-fetch could work here; currently trusting the backend response
//       const updated = await res.json();
//       setAgents((prev) => prev.map((a) => (a._id === _id ? updated : a)));
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update status.");
//     }
//   };

//   // Handler: Edit (Placeholder - links to builder could be implemented)
//   const handleEditAgent = (_id) => {
//     console.log("Edit agent", _id);
//     // Future: navigate(`/builder/${_id}`);
//   };

//   // Handler: Duplicate (Simple client-side logic + POST)
//   const handleDuplicateAgent = async (_id) => {
//     const agent = agents.find((a) => a._id === _id);
//     if (!agent) return;

//     const dupPayload = {
//       ...agent,
//       _id: undefined, // remove DB ID
//       AgentID: `agent_${Date.now()}`,
//       AgentName: `${getName(agent)} (Copy)`,
//       Status: "active",
//       CreatedAt: new Date().toISOString(),
//       UpdatedAt: new Date().toISOString(),
//     };

//     try {
//       const res = await fetch(API_BASE, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(dupPayload),
//       });
//       if (!res.ok) throw new Error("Duplicate failed");
//       const created = await res.json();
//       setAgents((prev) => [...prev, created]);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // ------------------------------------------
//   // 2. Filtering Logic
//   // ------------------------------------------
//   const filteredAgents = agents.filter((agent) => {
//     const name = getName(agent).toLowerCase();
//     const status = String(getStatus(agent)).toLowerCase();
//     const capabilities = (agent.Capabilities || []).join(" ").toLowerCase();
//     const search = searchTerm.toLowerCase();

//     const matchesSearch = name.includes(search) || capabilities.includes(search);
//     const matchesStatus = statusFilter === "All" || status === statusFilter.toLowerCase();

//     return matchesSearch && matchesStatus;
//   });

//   // ------------------------------------------
//   // 3. Render (New "Landing Page" Layout)
//   // ------------------------------------------
//   return (
//     <div className={darkMode ? "dark" : ""}>
//       <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
        
//         {/* Header */}
//         <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center">
//           <h2 className="text-xl font-bold text-slate-800 dark:text-white">Agent Management</h2>
          
//           <div className="flex items-center gap-4">
//              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
//                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
//                  {darkMode ? 'light_mode' : 'dark_mode'}
//                </span>
//              </button>
//              <Link to="/builder" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:translate-y-[-2px] transition-all">
//                <span className="material-symbols-outlined text-[20px]">add</span>
//                Create Agent
//              </Link>
//           </div>
//         </header>

//         <main className="max-w-7xl mx-auto px-8 py-8">
          
//           {/* Hero Section */}
//           <div className="mb-10 text-center md:text-left">
//             <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">Welcome Back, Admin</h1>
//             <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
//               Manage your fleet of AI agents. Monitor their status, update configurations, or deploy new instances from this control center.
//             </p>
//           </div>

//           {/* Controls Bar */}
//           <div className="flex flex-col md:flex-row gap-4 mb-8">
//             {/* Search */}
//             <div className="relative flex-1">
//               <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
//               <input 
//                 type="text" 
//                 placeholder="Search by name or capability..." 
//                 className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
            
//             {/* Filters */}
//             <div className="flex gap-2">
//               {['All', 'Active', 'Archived'].map((filter) => (
//                 <button
//                   key={filter}
//                   onClick={() => setStatusFilter(filter)}
//                   className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors border ${
//                     statusFilter === filter 
//                       ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' 
//                       : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
//                   }`}
//                 >
//                   {filter}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Full Width Grid (No Stats Sidebar) */}
//           {loading ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
//               {[1,2,3,4,5,6].map(i => (
//                 <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
//               ))}
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
//               {/* Agent Cards */}
//               {filteredAgents.map((agent) => (
//                 <AgentCard
//                   key={agent._id}
//                   agent={agent}
//                   onEdit={() => handleEditAgent(agent._id)}
//                   onDuplicate={() => handleDuplicateAgent(agent._id)}
//                   onDelete={() => handleDeleteAgent(agent._id)}
//                   onToggleStatus={() => handleToggleStatus(agent._id)}
//                 />
//               ))}
              
//               {/* Add New Card Shortcut */}
//               <Link to="/builder" className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer h-full min-h-[250px]">
//                 <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center mb-4 transition-colors">
//                   <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">add</span>
//                 </div>
//                 <h3 className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Deploy New Agent</h3>
//               </Link>
//             </div>
//           )}
          
//           {!loading && filteredAgents.length === 0 && (
//              <div className="text-center py-20">
//                 <p className="text-slate-500 text-lg">No agents found matching your filters.</p>
//              </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default AgentDashboard;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AgentCard from "./AgentCard";

const API_BASE = "http://localhost:3000/agents";

function AgentDashboard() {
  // ------------------------------------------
  // 1. State Definitions
  // ------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New State for Personalization
  const [username, setUsername] = useState("Agent");

  // ------------------------------------------
  // 2. Data Fetching & Personalization Sync
  // ------------------------------------------
  const fetchAgents = async () => {
  setLoading(true);
  try {
    const userId = localStorage.getItem('userId');
    
    // DEBUG: Check if the ID is being sent correctly
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

  useEffect(() => {
    // 1. Fetch User data from LocalStorage
    const storedName = localStorage.getItem('username');
    if (storedName) {
      setUsername(storedName);
    }

    // 2. Fetch Agents linked to this user
    fetchAgents();

    // 3. Sync dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // ------------------------------------------
  // 3. Handlers
  // ------------------------------------------
  const getName = (agent) => (agent?.AgentName ?? "Unnamed Agent");
  const getStatus = (agent) => (agent?.status ?? agent?.Status ?? "active");

  const handleDeleteAgent = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent || !window.confirm(`Delete ${getName(agent)}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/${_id}/delete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to delete agent");
      setAgents((prev) => prev.filter((a) => a._id !== _id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete agent.");
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
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  
  const handleDuplicateAgent = async (_id) => {
  const agent = agents.find((a) => a._id === _id);
  if (!agent) return;

  const dupPayload = {
    ...agent,
    _id: undefined, // Remove DB ID so Mongo generates a new one
    AgentID: undefined, // The pre-save hook will generate a new sequential ID
    AgentName: `${getName(agent)} (Copy)`,
    Status: "Active",
    // Match the nested Owner structure in your model
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
  // 4. Filtering Logic
  // ------------------------------------------
  const filteredAgents = agents.filter((agent) => {
    const name = getName(agent).toLowerCase();
    const status = String(getStatus(agent)).toLowerCase();
    const capabilities = (agent.Capabilities || []).join(" ").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = name.includes(search) || capabilities.includes(search);
    const matchesStatus = statusFilter === "All" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // ------------------------------------------
  // 5. Render
  // ------------------------------------------
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
          
          {/* Hero Section - Personalized */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
              Welcome Back, {username}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              Manage your fleet of AI agents. Your neural link is active, and your configurations are synced.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Search by name or capability..." 
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

          {/* Agent Grid */}
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
    </div>
  );
}

export default AgentDashboard;