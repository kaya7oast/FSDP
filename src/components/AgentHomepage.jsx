import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AgentCard from './AgentCard';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api/agents';

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

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mt-4">
            {agents.map((agent, index) => (
              // pass the raw agent object to AgentCard; AgentCard component expects agent props
              <AgentCard key={agent._id ?? index} agent={agent} />
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