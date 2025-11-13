import { useState, useRef, useEffect } from 'react';

function AgentDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [capabilityFilter, setCapabilityFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [agents, setAgents] = useState([]);

  // Apply dark mode class to root div
  const rootClassName = darkMode ? 'dark' : '';

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || agent.status === statusFilter;
    
    const matchesCapability = capabilityFilter === 'All' ||
      agent.tags.includes(capabilityFilter);
    
    return matchesSearch && matchesStatus && matchesCapability;
  });

  const totalInteractions = filteredAgents.reduce((sum, agent) => sum + agent.interactions, 0);
  
  const topPerformers = [...filteredAgents]
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 3);

  const handleDeleteAgent = async (id) => {
  const agent = agents.find(a => a._id === id);
  if (window.confirm(`Are you sure you want to delete ${agent.title}?`)) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setAgents(agents.filter(a => a._id !== id));
    } catch (err) {
      console.error("Error deleting agent:", err);
    }
  }
};

  const handleDuplicateAgent = (id) => {
    const agent = agents.find(a => a.id === id);
    const newAgent = {
      ...agent,
      id: Math.max(...agents.map(a => a.id)) + 1,
      title: `${agent.title} (Copy)`,
      updated: "Just now",
      lastActive: new Date()
    };
    setAgents([...agents, newAgent]);
  };

  const handleEditAgent = async (id) => {
  const agent = agents.find(a => a._id === id);
  const newName = prompt(`Edit agent name:`, agent.title);
  if (newName && newName.trim()) {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newName.trim(), updated: "Just now" })
      });
      const updated = await res.json();
      setAgents(agents.map(a => (a._id === id ? updated : a)));
    } catch (err) {
      console.error("Error updating agent:", err);
    }
  }
};
  const handleToggleStatus = async (id) => {
  const agent = agents.find(a => a._id === id);
  const newStatus = agent.Status === "Active" ? "Archived" : "Active";
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Status: newStatus })
    });
    const updated = await res.json();
    setAgents(agents.map(a => (a._id === id ? updated : a)));
  } catch (err) {
    console.error("Error toggling status:", err);
  }
};

  const handleCreateAgent = async () => {
  const name = prompt("Enter new agent name:");
  if (name && name.trim()) {
    const newAgent = {
      title: name.trim(),
      Status: "Active",
      tags: ["General"],
      interactions: 0,
      updated: "Just now"
    };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgent)
      });
      const created = await res.json();
      setAgents([...agents, created]);
    } catch (err) {
      console.error("Error creating agent:", err);
    }
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
                <a href="#" className="hover:text-primary transition-colors">AI Agent Platform</a>
              </h2>
            </div>

            <nav className="hidden md:flex items-center gap-9">
              <a className="text-sm font-semibold text-primary transition-colors" href="#">Dashboard</a>
              <a className="text-sm text-text-light dark:text-text-dark hover:text-primary transition-colors" href="#">Agents</a>
              <a className="text-sm text-text-light dark:text-text-dark hover:text-primary transition-colors" href="#">Conversations</a>
            </nav>

            <div className="flex items-center gap-4">
              <HeaderButton 
                icon="help_outline" 
                onClick={() => alert('Help documentation coming soon!')}
              />
              <HeaderButton 
                icon="notifications" 
                onClick={() => setShowNotifications(!showNotifications)}
                badge={3}
              />
              <HeaderButton 
                icon={darkMode ? "light_mode" : "dark_mode"}
                onClick={() => setDarkMode(!darkMode)}
              />
              <button
                onClick={() => alert('Profile settings')}
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 hover:ring-2 hover:ring-primary transition-all"
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC5mfB8ZF2ZNMlBhmxmZq6UJfT5JoykPuBTrgVIML-6u-H8snZ-WITA1mGeoB4DdGwzHGnDkAPIudEMno19-wUsQaIVlu_IEJIygjJWse0v5GIPyPMDcvidPY8SPCP-Gtyrr5c72ZXhWmGNe2CHhgxcUiioAF8mkCa_nKMk5XWORJoG6OnZj2qJqPjWcYT2mkVMJReVFwyGgjdJXR01CjBp6aBSyoF7AC4qgH7JM8gKA8u07eZ_rGkI_x1CRlRFYq0qk4cC9fK07yM")',
                }}
              ></button>
            </div>

            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-4xl font-black tracking-tight">Agent Management</p>
                <p className="text-sm text-inactive mt-1">{agents.length} total agents • {agents.filter(a => a.status === 'Active').length} active</p>
              </div>
              <button
                onClick={handleCreateAgent}
                className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined mr-2">add</span>
                <span className="truncate">Create New Agent</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <SearchBar 
                value={searchTerm} 
                onChange={setSearchTerm}
                resultCount={filteredAgents.length}
              />
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
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {filteredAgents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onEdit={() => handleEditAgent(agent.id)}
                      onDuplicate={() => handleDuplicateAgent(agent.id)}
                      onDelete={() => handleDeleteAgent(agent.id)}
                      onToggleStatus={() => handleToggleStatus(agent.id)}
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
                <UsageStats 
                  totalInteractions={totalInteractions}
                  topPerformers={topPerformers}
                  agentCount={filteredAgents.length}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function HeaderButton({ icon, onClick, badge }) {
  return (
    <button 
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors relative"
    >
      <span className="material-symbols-outlined text-text-light dark:text-text-dark">{icon}</span>
      {badge && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function NotificationDropdown({ onClose }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
  fetchAgents();
  }, []);

  const fetchAgents = async () => {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    setAgents(data);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
  }
};

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-16 right-4 w-80 bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-2 z-50"
    >
      <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
        <h3 className="font-bold">Notifications</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <NotificationItem 
          icon="check_circle"
          color="text-success"
          title="Agent deployed successfully"
          time="2 minutes ago"
        />
        <NotificationItem 
          icon="warning"
          color="text-yellow-500"
          title="High API usage detected"
          time="1 hour ago"
        />
        <NotificationItem 
          icon="info"
          color="text-primary"
          title="New feature available"
          time="3 hours ago"
        />
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
          <input
            className="form-input flex-1 bg-transparent text-text-light dark:text-text-dark px-2 focus:outline-none"
            placeholder="Search agents..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {value && (
            <button
              onClick={() => onChange('')}
              className="px-3 text-inactive hover:text-text-light dark:hover:text-text-dark"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
      </label>
      {value && (
        <p className="text-xs text-inactive mt-1 ml-1">
          Found {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </p>
      )}
    </div>
  );
}

function FilterBar({ statusFilter, setStatusFilter, capabilityFilter, setCapabilityFilter, viewMode, setViewMode }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      <FilterDropdown
        label={`Status: ${statusFilter}`}
        options={['All', 'Active', 'Archived']}
        onSelect={setStatusFilter}
      />
      <FilterDropdown
        label={`Capabilities: ${capabilityFilter}`}
        options={['All', 'NLP', 'Customer Support', 'Data Analysis', 'Reporting', 'Image Generation', 'Code Generation', 'Creative', 'Developer Tool']}
        onSelect={setCapabilityFilter}
      />
      <div className="flex items-center rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark h-12">
        <button
          onClick={() => setViewMode('grid')}
          className={`w-12 h-12 flex items-center justify-center rounded-l-lg transition-all ${
            viewMode === 'grid' ? 'text-primary bg-primary/10 dark:bg-primary/20' : 'text-inactive hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          title="Grid view"
        >
          <span className="material-symbols-outlined">grid_view</span>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`w-12 h-12 flex items-center justify-center rounded-r-lg transition-all ${
            viewMode === 'list' ? 'text-primary bg-primary/10 dark:bg-primary/20' : 'text-inactive hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          title="List view"
        >
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position dropdown dynamically when open
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const anchor = buttonRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const dropdownHeight = dropdown.offsetHeight;
      const spaceBelow = window.innerHeight - anchor.bottom;

      const style = {
        position: 'fixed',
        left: `${anchor.left}px`,
        minWidth: `${anchor.width}px`,
        maxHeight: '300px',
        overflowY: 'auto',
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
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 items-center gap-x-2 rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark pl-4 pr-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <p className="text-sm font-medium text-text-light dark:text-text-dark whitespace-nowrap">{label}</p>
        <span
          className={`material-symbols-outlined text-inactive transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="absolute bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl py-1 mt-2 min-w-full animate-fadeIn"
        >
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


function AgentCard({ agent, onEdit, onDuplicate, onDelete, onToggleStatus }) {
  const [showMenu, setShowMenu] = useState(false);
  const isActive = agent.status === "Active";
  const isArchived = agent.status === "Archived";
  
  return (
    <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300 relative group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-primary/10 dark:bg-primary/20" : "bg-gray-200 dark:bg-gray-700"}`}>
            <span className={`material-symbols-outlined text-2xl ${isActive ? "text-primary" : "text-inactive"}`}>{agent.icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">{agent.title}</h3>
            <button
              onClick={onToggleStatus}
              className={`text-sm font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity ${isActive ? "text-success" : "text-inactive"}`}
              title={`Click to ${isActive ? 'archive' : 'activate'}`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-success" : "bg-inactive"}`}></span>
              {agent.status}
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
        {agent.tags.map((tag, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
              isArchived
                ? "bg-gray-200 dark:bg-gray-700 text-inactive"
                : "bg-primary/10 dark:bg-primary/20 text-primary"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-inactive">Last updated: {agent.updated}</p>
        <p className="text-inactive font-medium">{(agent.interactions / 1000).toFixed(0)}k interactions</p>
      </div>
    </div>
  );
}

function CardButton({ icon, danger, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
        danger ? "text-inactive hover:text-danger" : "text-inactive hover:text-primary"
      }`}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  );
}

function UsageStats({ totalInteractions, topPerformers, agentCount }) {
  const chartData = [60, 80, 40, 100, 75, 65];
  const [animatedTotal, setAnimatedTotal] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = totalInteractions / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= totalInteractions) {
        setAnimatedTotal(totalInteractions);
        clearInterval(timer);
      } else {
        setAnimatedTotal(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalInteractions]);
  
  return (
    <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 sticky top-24">
      <h2 className="text-xl font-bold mb-6">Usage Statistics</h2>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-inactive font-medium mb-1">Total Interactions</p>
          <p className="text-3xl font-bold">{animatedTotal.toLocaleString()}</p>
          <p className="text-xs text-inactive mt-1">Across {agentCount} {agentCount === 1 ? 'agent' : 'agents'}</p>
        </div>
        <div>
          <p className="text-sm text-inactive font-medium mb-2">Interactions per Day</p>
          <div className="h-24 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-end p-2 gap-1">
            {chartData.map((h, i) => (
              <div 
                key={i} 
                style={{ height: `${h}%` }} 
                className="flex-1 bg-primary rounded-t-sm transition-all hover:bg-primary/80 cursor-pointer"
                title={`Day ${i + 1}: ${h}% activity`}
              ></div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-inactive font-medium mb-3">Top Performing Agents</p>
          {topPerformers.length > 0 ? (
            <ul className="space-y-3">
              {topPerformers.map((agent, idx) => (
                <li key={agent.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-inactive">#{idx + 1}</span>
                    <p className="text-sm font-medium">{agent.title}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">{(agent.interactions / 1000).toFixed(0)}k</p>
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