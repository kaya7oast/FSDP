import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AgentCard from './AgentCard';

const AgentHomepage = () => {
  const agents = [
    { name: 'Sales Bot', description: 'Handles all sales inquiries and lead generation.', active: true },
    { name: 'Customer Support Bot', description: 'Provides 24/7 customer support and answers FAQs.', active: true },
    { name: 'Research Assistant', description: 'Gathers and summarizes information from the web.', active: false },
    { name: 'Content Creator', description: 'Generates high-quality content for your blog.', active: true },
  ];

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Create New Agent
            </button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {agents.map((agent, index) => (
              <AgentCard key={index} agent={agent} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentHomepage;