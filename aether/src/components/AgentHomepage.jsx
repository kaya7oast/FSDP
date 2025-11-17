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
    <div className="flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1">
        <Header />
        <div className="p-8">
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