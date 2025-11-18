import { useState, useRef, useEffect } from "react";
// const API_BASE = "/api/agents";
const API_BASE = "http://localhost:3000/api/agents";

function AgentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [capabilityFilter, setCapabilityFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [agents, setAgents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Apply dark mode class to root div
  const rootClassName = darkMode ? "dark" : "";

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch(API_BASE);
      
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();
      
      setAgents(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error(err);
      setAgents([]);  
      return [];
    }
  };

  // normalize helpers
  const getName = (agent) => (agent?.AgentName ?? "Unnamed Agent");
  const getStatus = (agent) => (agent?.status ?? agent?.Status ?? "active");
  const getCapabilities = (agent) => agent?.Capabilities ?? [];

  // Filtered list
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

  // Top performers (no interactions field in DB). We'll show newest agents as "top"
  const topPerformers = [...filteredAgents]
    .sort((a, b) => {
      const ta = new Date(a?.CreatedAt || a?.UpdatedAt || 0).getTime();
      const tb = new Date(b?.CreatedAt || b?.UpdatedAt || 0).getTime();
      return tb - ta;
    })
    .slice(0, 3);

  // CREATE
  const handleCreateAgent = async (formData) => {
    const AgentID = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newAgentPayload = {
      AgentID,
      AgentName: formData.AgentName.trim(),
      Description: formData.Description || "",
      Specialization: formData.Specialization || "",
      Capabilities: formData.Capabilities || [],
      Personality: {
        Tone: formData.Tone || undefined,
        LanguageStyle: formData.LanguageStyle || undefined,
        Emotion: formData.Emotion || undefined,
      },
      KnowledgeBase: {
        Type: "General",
      },
      status: "active",
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgentPayload),
      });

      if (!res.ok) throw new Error("Failed to create agent");

      const createdAgent = await res.json();
      setAgents((prev) => [...prev, createdAgent]);
      setAlertMessage("Agent created successfully!");
      setShowAlertModal(true);
      return createdAgent;
    } catch (err) {
      console.error("Error creating agent:", err);
      setAlertMessage("Failed to create agent.");
      setShowAlertModal(true);
      return null;
    }
  };


  // DELETE (your server offers POST /api/agents/:agentId/delete)
  const handleDeleteAgent = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    const nameForConfirm = getName(agent);
    if (!agent) return;

    if (!window.confirm(`Are you sure you want to delete ${nameForConfirm}?`))
      return;

    try {
      const res = await fetch(`${API_BASE}/${_id}/delete`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to delete agent");
      const deleted = await res.json();
      setAgents((prev) => prev.filter((a) => a._id !== _id));
      return deleted;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // DUPLICATE (client-side + POST to create)
  const handleDuplicateAgent = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent) return;

    const dupPayload = {
      AgentID: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      AgentName: `${getName(agent)} (Copy)`,
      status: getStatus(agent),
      Capabilities: getCapabilities(agent),
      Description: agent?.Description ?? "",
      Specialization: agent?.Specialization ?? "",
      Personality: agent?.Personality ?? { Tone: "", LanguageStyle: "", Emotion: "" },
      KnowledgeBase: agent?.KnowledgeBase ?? { Type: "General" },
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dupPayload),
      });
      if (!res.ok) throw new Error(`Duplicate failed: ${res.status}`);
      const created = await res.json();
      setAgents((prev) => [...prev, created]);
    } catch (err) {
      console.error("Error duplicating agent:", err);
      alert("Failed to duplicate agent. Check console for details.");
    }
  };

  // EDIT (attempt a PUT to conventional route; add route server-side if missing)
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
      const res = await fetch(`${API_BASE}/${_id}`, {
        method: "PUT", // ensure server supports this route
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const updated = await res.json();
      setAgents((prev) => prev.map((a) => (a._id === _id ? updated : a)));
    } catch (err) {
      console.error("Error updating agent:", err);
      alert(
        "Failed to update agent. If this persists, ensure your server has a PUT /api/agents/:agentId route."
      );
    }
  };

  // TOGGLE STATUS (Active <-> Archived). Uses conventional PUT route.
  const handleToggleStatus = async (_id) => {
    const agent = agents.find((a) => a._id === _id);
    if (!agent) return;

    const current = String(getStatus(agent)).toLowerCase();
    const newStatus = current === "active" ? "archived" : "active";

    try {
      const res = await fetch(`${API_BASE}/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, UpdatedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      const updated = await res.json();
      setAgents((prev) => prev.map((a) => (a._id === _id ? updated : a)));
    } catch (err) {
      console.error("Error toggling status:", err);
      alert(
        "Failed to toggle status. If this persists, ensure your server has a PUT /api/agents/:agentId route."
      );
    }
  };

  return (
    <div className={rootClassName}>
      <div className="bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">hub</span>
              <h2 className="text-xl font-bold">
                <a href="#" className="hover:text-primary transition-colors">
                  AI Agent Platform
                </a>
              </h2>
            </div>

            <nav className="hidden md:flex items-center gap-9">
              <a className="text-sm font-semibold text-primary transition-colors" href="#">
                Dashboard
              </a>
              <a className="text-sm text-text-light dark:text-text-dark hover:text-primary transition-colors" href="#">
                Agents
              </a>
              <a className="text-sm text-text-light dark:text-text-dark hover:text-primary transition-colors" href="#">
                Conversations
              </a>
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined mr-2">add</span>
                <span className="truncate">Create New Agent</span>
              </button>
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
                      onEdit={() => handleEditAgent(agent._id)}
                      onDuplicate={() => handleDuplicateAgent(agent._id)}
                      onDelete={() => handleDeleteAgent(agent._id)}
                      onToggleStatus={() => handleToggleStatus(agent._id)}
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
  // no local fetch here — use onRefresh provided by parent when needed
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
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Position dropdown dynamically when open
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const anchor = buttonRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const dropdownHeight = dropdown.offsetHeight;
      const spaceBelow = window.innerHeight - anchor.bottom;

      const style = {
        position: "fixed",
        left: `${anchor.left}px`,
        minWidth: `${anchor.width}px`,
        maxHeight: "300px",
        overflowY: "auto",
        zIndex: 1000,
      };

      if (spaceBelow < dropdownHeight && anchor.top > dropdownHeight) {
        // open upward
        style.bottom = `${window.innerHeight - anchor.top}px`;
      } else {
        // open downward
        style.top = `${anchor.bottom}px`;
      }

      setDropdownStyle(style);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)} className="flex h-12 items-center gap-x-2 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark pl-4 pr-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <p className="text-sm font-medium text-text-light dark:text-text-dark whitespace-nowrap">{label}</p>
        <span className={`material-symbols-outlined text-inactive transition-transform ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {isOpen && (
        <div ref={dropdownRef} style={dropdownStyle} className="absolute bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl py-1 mt-2 min-w-full animate-fadeIn">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateAgentModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    AgentName: "",
    Description: "",
    Specialization: "",
    Capabilities: [],
    Tone: "",
    LanguageStyle: "",
    Emotion: "",
  });
  const [capabilityInput, setCapabilityInput] = useState("");

  const handleAddCapability = () => {
    if (capabilityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        Capabilities: [...prev.Capabilities, capabilityInput.trim()]
      }));
      setCapabilityInput("");
    }
  };

  const handleRemoveCapability = (index) => {
    setFormData(prev => ({
      ...prev,
      Capabilities: prev.Capabilities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.AgentName.trim()) {
      alert("Agent name is required.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-light dark:border-border-dark">
        <div className="sticky top-0 bg-white dark:bg-background-dark border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">smart_toy</span>
            </div>
            <h2 className="text-2xl font-bold">Create New Agent</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-inactive">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-light dark:text-text-dark">
              Agent Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.AgentName}
              onChange={(e) => setFormData({ ...formData, AgentName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="e.g., Customer Support Assistant"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-light dark:text-text-dark">Description</label>
            <textarea
              value={formData.Description}
              onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              placeholder="Brief description of the agent's purpose"
              rows="3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-light dark:text-text-dark">Specialization</label>
            <input
              type="text"
              value={formData.Specialization}
              onChange={(e) => setFormData({ ...formData, Specialization: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="e.g., Technical Support, Sales, Data Analysis"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-light dark:text-text-dark">Capabilities</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCapability())}
                className="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="e.g., Diagnose issues, Install software"
              />
              <button
                type="button"
                onClick={handleAddCapability}
                className="px-4 py-3 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary font-semibold hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.Capabilities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.Capabilities.map((cap, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-sm font-medium flex items-center gap-2">
                    {cap}
                    <button type="button" onClick={() => handleRemoveCapability(idx)} className="hover:text-danger transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-light dark:border-border-dark pt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              Personality (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-light dark:text-text-dark">Tone</label>
                <input
                  type="text"
                  value={formData.Tone}
                  onChange={(e) => setFormData({ ...formData, Tone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g., Professional"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-light dark:text-text-dark">Language Style</label>
                <input
                  type="text"
                  value={formData.LanguageStyle}
                  onChange={(e) => setFormData({ ...formData, LanguageStyle: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g., Formal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-light dark:text-text-dark">Emotion</label>
                <input
                  type="text"
                  value={formData.Emotion}
                  onChange={(e) => setFormData({ ...formData, Emotion: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g., Empathetic"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined">check</span>
              Create Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AlertModal({ message, onClose }) {
  const isSuccess = message.toLowerCase().includes("success");
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-md w-full border border-border-light dark:border-border-dark overflow-hidden">
        <div className={`px-6 py-4 ${isSuccess ? 'bg-success/10' : 'bg-danger/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSuccess ? 'bg-success text-white' : 'bg-danger text-white'}`}>
              <span className="material-symbols-outlined">
                {isSuccess ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-lg font-bold">{isSuccess ? 'Success' : 'Error'}</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-text-light dark:text-text-dark">{message}</p>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isSuccess 
                ? 'bg-success text-white hover:bg-success/90' 
                : 'bg-danger text-white hover:bg-danger/90'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, onEdit, onDuplicate, onDelete, onToggleStatus }) {
  const isActive = String(agent?.status || agent?.Status || "").toLowerCase() === "active";
  const isArchived = String(agent?.status || agent?.Status || "").toLowerCase() === "archived";
  const caps = agent?.Capabilities ?? [];

  const formattedUpdated = agent?.UpdatedAt ? new Date(agent.UpdatedAt).toLocaleString() : agent?.CreatedAt ? new Date(agent.CreatedAt).toLocaleString() : "—";

  return (
    <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-primary/10 dark:bg-primary/20" : "bg-gray-200 dark:bg-gray-700"}`}>
            <span className={`material-symbols-outlined text-2xl ${isActive ? "text-primary" : "text-inactive"}`}>smart_toy</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">{agent?.AgentName ?? "Unnamed Agent"}</h3>
            <button onClick={onToggleStatus} className={`text-sm font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity ${isActive ? "text-success" : "text-inactive"}`} title={`Click to ${isActive ? "archive" : "activate"}`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-success" : "bg-inactive"}`}></span>
              {agent?.status ?? agent?.Status ?? "unknown"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <CardButton icon="edit" onClick={onEdit} title="Edit agent" />
          <CardButton icon="content_copy" onClick={onDuplicate} title="Duplicate agent" />
          <CardButton icon="delete" danger onClick={onDelete} title="Delete agent" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {caps.length > 0 ? (
          caps.map((tag, idx) => (
            <span key={idx} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${isArchived ? "bg-gray-200 dark:bg-gray-700 text-inactive" : "bg-primary/10 dark:bg-primary/20 text-primary"}`}>
              {tag}
            </span>
          ))
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-inactive">No capabilities</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-inactive">Last updated: {formattedUpdated}</p>
        <p className="text-inactive font-medium">{agent?.AgentID ? `ID: ${agent.AgentID}` : ""}</p>
      </div>
    </div>
  );
}

function CardButton({ icon, danger, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${danger ? "text-inactive hover:text-danger" : "text-inactive hover:text-primary"}`}>
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  );
}

function UsageStats({ topPerformers, agentCount }) {
  return (
    <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 sticky top-24">
      <h2 className="text-xl font-bold mb-6">Usage Statistics</h2>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-inactive font-medium mb-1">Agents</p>
          <p className="text-3xl font-bold">{agentCount}</p>
          <p className="text-xs text-inactive mt-1">Total agents</p>
        </div>

        <div>
          <p className="text-sm text-inactive font-medium mb-3">Newest Agents</p>
          {topPerformers.length > 0 ? (
            <ul className="space-y-3">
              {topPerformers.map((agent, idx) => (
                <li key={agent._id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-inactive">#{idx + 1}</span>
                    <p className="text-sm font-medium">{agent?.AgentName}</p>
                  </div>
                  <p className="text-sm text-inactive">{new Date(agent?.CreatedAt || agent?.UpdatedAt || Date.now()).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-inactive text-center py-4">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard;