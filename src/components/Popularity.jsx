import React, { useState, useEffect } from 'react';

const PopularityPage = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [publishedAgents, setPublishedAgents] = useState([]);
  const currentUserId = "user123"; // Replace with your auth logic

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Popularity Hub</h1>
          <p className="text-slate-500 mt-2">Discover and share the best AI agents.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'discover' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
          > Discover </button>
          <button 
            onClick={() => setActiveTab('publish')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'publish' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
          > My Agents </button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Discover Card (Instagram Style) */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-6xl">smart_toy</span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl">Travel Guide Pro</h3>
                <button className="text-blue-600 font-medium text-sm hover:underline">Save Agent</button>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                "This agent is specialized in finding hidden gems in Southeast Asia based on your budget!"
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                  <span className="text-sm font-bold">1.2k</span>
                </button>
                <button className="flex items-center gap-1 text-slate-500 hover:text-blue-500">
                  <span className="material-symbols-outlined">share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6">Publish Your Agents</h3>
          {/* List user's private agents with a "Publish" button */}
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">A1</div>
                 <div>
                   <h4 className="font-bold">Fitness Coach</h4>
                   <p className="text-xs text-slate-500">Last updated 2 days ago</p>
                 </div>
               </div>
               <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                 Publish to Feed
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopularityPage;