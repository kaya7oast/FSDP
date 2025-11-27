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
      return data;
    } catch (err) {
      console.error("Error fetching agents:", err);
      // Optional: Show an alert if fetching fails completely
      // setAlertMessage("Error connecting to agent API. Data may be stale.");
      // setShowAlertModal(true);
      setAgents([]);  
      return [];
    }
  };

  // normalize helpers
  const getName = (agent) => (agent?.AgentName ?? "Unnamed Agent");
  const getStatus = (agent) => (agent?.status ?? agent?.Status ?? "active");
  const getCapabilities = (agent) => agent?.Capabilities ?? [];

  // Filtered list (rest of filtering logic remains sound)
  const filteredAgents = agents.filter((agent) => {
    const name = String(getName(agent)).toLowerCase();
    const tags = getCapabilities(agent).map(String);
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      tags.some((t) => t.toLowerCase().includes(search));

    const matchesStatus =
      statusFilter === "All" ||
      String(getStatus(agent)).toLowerCase() === statusFilter.toLowerCase();

    const matchesCapability =
      capabilityFilter === "All" ||
      getCapabilities(agent).some(
        (c) => String(c).toLowerCase() === capabilityFilter.toLowerCase()
      );

    return matchesSearch && matchesStatus && matchesCapability;
  });

  // Top performers (show newest agents)
  const topPerformers = [...filteredAgents]
    .sort((a, b) => {
      const ta = new Date(a?.CreatedAt || a?.UpdatedAt || 0).getTime();
      const tb = new Date(b?.CreatedAt || b?.UpdatedAt || 0).getTime();
      return tb - ta;
    })
    .slice(0, 3);

  
  // ⚡️ DELETE AGENT
  const handleDeleteAgent = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    const nameForConfirm = getName(agent);
    if (!agent) return;

    if (!window.confirm(`Are you sure you want to delete ${nameForConfirm}?`))
      return;

    try {
      // Using relative path for routing
      const res = await fetch(`/agents/${_id}/delete`, {
        method: "POST", // Server expects POST
      });
      
      if (!res.ok) throw new Error(`Failed to delete agent. Status: ${res.status}`);
      
      // 2. FIX: Synchronize state by re-fetching all agents from the database
      await fetchAgents(); 
      setAlertMessage(`Success: Agent "${nameForConfirm}" deleted.`);
      setShowAlertModal(true);
      
    } catch (err) {
      console.error("Error deleting agent (check ID format):", err);
      // This is where you likely see the "Cast to ObjectId failed" error
      setAlertMessage(`Error: Failed to delete agent "${nameForConfirm}". Check console for Mongoose/ID errors.`);
      setShowAlertModal(true);
    }
  };


  // ⚡️ EDIT AGENT
  const handleEditAgent = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent) return;

    const currentName = getName(agent);
    const newName = prompt("Edit agent name:", currentName);
    if (!newName || !newName.trim()) return;

    const updatePayload = {
      AgentName: newName.trim(),
      UpdatedAt: new Date().toISOString(),
    };

    try {
      // Using relative path for routing
      const res = await fetch(`/agents/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      
      // 2. FIX: Synchronize state by re-fetching all agents
      await fetchAgents();
      setAlertMessage(`Success: Agent "${newName.trim()}" updated.`);
      setShowAlertModal(true);
      
    } catch (err) {
      console.error("Error updating agent:", err);
      setAlertMessage("Failed to update agent. Ensure your server has a PUT /agents/:agentId route.");
      setShowAlertModal(true);
    }
  };

  // ⚡️ TOGGLE STATUS
  const handleToggleStatus = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent) return;

    const current = String(getStatus(agent)).toLowerCase();
    const newStatus = current === "active" ? "archived" : "active";

    try {
      // Using relative path for routing
      const res = await fetch(`/agents/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: newStatus, UpdatedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      
      // 2. FIX: Synchronize state by re-fetching all agents
      await fetchAgents(); 
      setAlertMessage(`Success: Agent status changed to "${newStatus}".`);
      setShowAlertModal(true);
      
    } catch (err) {
      console.error("Error toggling status:", err);
      setAlertMessage("Failed to toggle status. Ensure your server has a PUT /agents/:agentId route.");
      setShowAlertModal(true);
    }
  };

  // ⚡️ CREATE AGENT (Missing Implementation)
  const handleCreateAgent = async (formData) => {
    try {
      // POST to base route to create a new agent
      const res = await fetch(`/agents`, { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Creation failed: ${res.status}`);
      
      const newAgent = await res.json();
      
      // 2. FIX: Synchronize state by re-fetching all agents
      await fetchAgents(); 
      
      setAlertMessage(`Success: Agent "${getName(newAgent)}" created.`);
      setShowAlertModal(true);
      
    } catch (err) {
      console.error("Error creating agent:", err);
      setAlertMessage(`Error: Failed to create agent.`);
      setShowAlertModal(true);
    }
  };
  
  // ⚡️ DUPLICATE AGENT (Missing Implementation)
  const handleDuplicateAgent = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent) return;

    // Create a new payload without unique database IDs/timestamps
    const { _id: originalId, CreatedAt, UpdatedAt, ...dataToDuplicate } = agent;
    const newName = `Copy of ${getName(agent)}`;

    try {
        // POST to base route to create a new agent (duplicate)
        const res = await fetch(`/agents`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...dataToDuplicate, AgentName: newName }),
        });
        if (!res.ok) throw new Error(`Duplication failed: ${res.status}`);
        
        // 2. FIX: Synchronize state by re-fetching all agents
        await fetchAgents(); 
        
        setAlertMessage(`Success: Agent "${newName}" duplicated successfully!`);
        setShowAlertModal(true);
        
    } catch (err) {
        console.error("Error duplicating agent:", err);
        setAlertMessage(`Error: Failed to duplicate agent "${getName(agent)}".`);
        setShowAlertModal(true);
    }
  };
  
  return (
    <div className={rootClassName}>
      <div className="bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark min-h-screen flex flex-col">
        {/* ... (JSX body remains the same) ... */}
        
        <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">hub</span>
              <h2 className="text-xl font-bold">
                <Link to="/" className="hover:text-primary transition-colors">
                  AI Agent Platform
                </Link>
              </h2>
            </div>

            <nav className="hidden md:flex items-center gap-9">
              <Link className="text-sm font-semibold text-primary transition-colors" to="#">
                Dashboard
              </Link>
              <Link 
                className="text-sm text-text-light dark:text-text-dark hover:text-primary transition-colors" 
                to="/builder"
                onClick={(e) => {
                    e.preventDefault();
                    setShowCreateModal(true); // Direct action to modal
                }}
              >
                Create new agent
              </Link>
              <Link className="text-sm text-text-light dark:text-text-dark hover:text-primary transition-colors" to="/agents">
                Agents
              </Link>
              <Link className="text-sm text-text-light dark:text-text-dark hover:text-primary transition-colors" to="/conversations">
                Conversations
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <HeaderButton icon="help_outline" onClick={() => alert("Help documentation coming soon!")} />
              <HeaderButton
                icon="notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                badge={3}
              />
              <HeaderButton icon={darkMode ? "light_mode" : "dark_mode"} onClick={() => setDarkMode(!darkMode)} />
              <button
                onClick={() => alert("Profile settings")}
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 hover:ring-2 hover:ring-primary transition-all"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5mfB8ZF2ZNMlBhmxmZq6UJfT5JoykPuBTrgVIML-6u-H8snZ-WITA1mGeoB4DdGwzHGnDkAPIudEMno19-wUsQaIVlu_IEJIygjJWse0v5GIPyPMDcvidPY8SPCP-Gtyrr5c72ZXhWmGNe2CHhgxcUiioAF8mkCa_nKMk5XWORJoG6OnZj2qJqPjWcYT2mkVMJReVFwyGgjdJXR01CjBp6aBSyoF7AC4qgH7JM8gKA8u07eZ_rGkI_x1CRlRFYq0qk4cC9fK07yM")',
                }}
              ></button>
            </div>

            {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} onRefresh={fetchAgents} />}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-4xl font-black tracking-tight">Agent Management</p>
                <p className="text-sm text-inactive mt-1">
                  {agents.length} total agents •{" "}
                  {agents.filter((a) => String(getStatus(a)).toLowerCase() === "active").length} active
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <SearchBar value={searchTerm} onChange={setSearchTerm} resultCount={filteredAgents.length} />
              <FilterBar
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                capabilityFilter={capabilityFilter}
                setCapabilityFilter={setCapabilityFilter}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8">
                <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                  {filteredAgents.map((agent) => (
                    <AgentCard
                      key={agent._id}
                      agent={agent}
                      onEdit={() => handleEditAgent(agent.AgentID)}
                      onDuplicate={() => handleDuplicateAgent(agent.AgentID)}
                      onDelete={() => handleDeleteAgent(agent.AgentID)}
                      onToggleStatus={() => handleToggleStatus(agent.AgentID)}
                    />
                  ))}

                  {filteredAgents.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <span className="material-symbols-outlined text-6xl text-inactive mb-4 block">search_off</span>
                      <p className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">No agents found</p>
                      <p className="text-inactive">Try adjusting your filters or search terms</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-4">
                <UsageStats topPerformers={topPerformers} agentCount={filteredAgents.length} />
              </div>
            </div>
          </div>
        </main>

        {showCreateModal && (
          <CreateAgentModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={(data) => {
              handleCreateAgent(data);
              setShowCreateModal(false);
            }}
          />
        )}

        {showAlertModal && (
          <AlertModal
            message={alertMessage}
            onClose={() => setShowAlertModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// ... (Rest of the helper components: HeaderButton, NotificationDropdown, etc. remain the same) ...
function HeaderButton({ icon, onClick, badge }) {
  return (
    <button onClick={onClick} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors relative">
      <span className="material-symbols-outlined text-text-light dark:text-text-dark">{icon}</span>
      {badge && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function NotificationDropdown({ onClose, onRefresh }) {
  return (
    <div className="absolute top-16 right-4 w-80 bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-2 z-50">
      <div className="px-4 py-2 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <h3 className="font-bold">Notifications</h3>
        <div className="flex gap-2">
          <button onClick={() => { onRefresh?.(); onClose?.(); }} className="text-xs text-primary">Refresh</button>
          <button onClick={onClose} className="text-xs text-inactive">Close</button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <NotificationItem icon="check_circle" color="text-success" title="Agent deployed successfully" time="2 minutes ago" />
        <NotificationItem icon="warning" color="text-yellow-500" title="High API usage detected" time="1 hour ago" />
        <NotificationItem icon="info" color="text-primary" title="New feature available" time="3 hours ago" />
      </div>
    </div>
  );
}

function NotificationItem({ icon, color, title, time }) {
  return (
    <div className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
      <div className="flex items-start gap-3">
        <span className={`material-symbols-outlined ${color}`}>{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-light dark:text-text-dark">{title}</p>
          <p className="text-xs text-inactive mt-1">{time}</p>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className="flex-1">
      <label className="flex flex-col w-full h-12">
        <div className="flex w-full items-stretch rounded-lg h-full bg-white dark:bg-background-dark border border-border-light dark:border-border-dark transition-all">
          <div className="text-inactive flex items-center justify-center pl-4">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input className="form-input flex-1 bg-transparent text-text-light dark:text-text-dark px-2 focus:outline-none" placeholder="Search agents..." value={value} onChange={(e) => onChange(e.target.value)} />
          {value && (
            <button onClick={() => onChange("")} className="px-3 text-inactive hover:text-text-light dark:hover:text-text-dark">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
      </label>
      {value && (
        <p className="text-xs text-inactive mt-1 ml-1">
          Found {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
      )}
    </div>
  );
}

function FilterBar({ statusFilter, setStatusFilter, capabilityFilter, setCapabilityFilter, viewMode, setViewMode }) {
  const capabilityOptions = ["All", "NLP", "Customer Support", "Data Analysis", "Reporting", "Image Generation", "Code Generation", "Creative", "Developer Tool"];

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      <FilterDropdown label={`Status: ${statusFilter}`} options={["All", "active", "archived"]} onSelect={setStatusFilter} />
      <FilterDropdown label={`Capabilities: ${capabilityFilter}`} options={capabilityOptions} onSelect={setCapabilityFilter} />
      <div className="flex items-center rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark h-12">
        <button onClick={() => setViewMode("grid")} className={`w-12 h-12 flex items-center justify-center rounded-l-lg transition-all ${viewMode === "grid" ? "text-primary bg-primary/10 dark:bg-primary/20" : "text-inactive hover:bg-gray-50 dark:hover:bg-gray-800"}`} title="Grid view">
          <span className="material-symbols-outlined">grid_view</span>
        </button>
        <button onClick={() => setViewMode("list")} className={`w-12 h-12 flex items-center justify-center rounded-r-lg transition-all ${viewMode === "list" ? "text-primary bg-primary/10 dark:bg-primary/20" : "text-inactive hover:bg-gray-50 dark:hover:bg-gray-800"}`} title="List view">
          <span className="material-symbols-outlined">table_rows</span>
        </button>
      </div>
    </div>
  );
}

function FilterDropdown({ label, options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close on click outside
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