import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
// import AgentCard from './AgentCard' // removed - using inline preview to match dashboard fields

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/agents';

const AgentHomepage = () => {
  const navigate = useNavigate();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      // ensure array
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError('Failed to load agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Local preview card that matches fields used in agentDashboard.jsx
  const AgentPreview = ({ agent }) => {
    const isActive = String(agent?.status || agent?.Status || "").toLowerCase() === "active";
    const isArchived = String(agent?.status || agent?.Status || "").toLowerCase() === "archived";
    const caps = agent?.Capabilities ?? [];
    const name = agent?.AgentName ?? agent?.name ?? "Unnamed Agent";

    return (
      <div className="bg-white dark:bg-background-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300 relative group min-h-[180px]">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-primary/10 dark:bg-primary/20" : "bg-gray-200 dark:bg-gray-700"}`}>
              <span className={`material-symbols-outlined text-2xl ${isActive ? "text-primary" : "text-inactive"}`}>smart_toy</span>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{name}</h3>
              <div className={`text-sm font-medium flex items-center gap-2 mt-1 ${isActive ? "text-success" : "text-inactive"}`}>
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-success" : "bg-inactive"}`}></span>
                <span>{agent?.status ?? agent?.Status ?? "unknown"}</span>
              </div>
            </div>
          </div>

          {/* read-only on homepage */}
        </div>

        {/* Capabilities: organized as consistent chips */}
        <div className="mt-2">
          {caps.length > 0 ? (
            <div className="flex flex-wrap items-start gap-2">
              {caps.map((tag, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors ${isArchived ? "bg-gray-100 dark:bg-gray-800 text-inactive" : "bg-primary/10 dark:bg-primary/20 text-primary"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-inactive">No capabilities</span>
            </div>
          )}
        </div>

        {/* intentionally omitted last-updated and ID */}
      </div>
    );
  };

  return (
    <div className="flex h-auto min-h-screen w-full bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-auto">
        <Header />

        {/* Added page heading + Create button */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Your AI Agents</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Manage and create your custom AI agents.</p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
              title="Go to Agent dashboard to create a new agent"
            >
              Create New Agent
            </button>
          </div>

          <div>
            {loading && <p className="text-sm text-inactive">Loading agents...</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {agents.map((agent, index) => (
              <AgentPreview key={agent._id ?? index} agent={agent} />
            ))}

            {!loading && agents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">No agents found</p>
                <p className="text-inactive">Create a new agent or check your backend.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentHomepage;