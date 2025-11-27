import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AgentBuilder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    AgentName: '',
    Description: '',
    Specialization: '',
    Personality: { Tone: 'Professional', ToneValue: 50, StyleValue: 50 },
    Capabilities: '',
    KnowledgeBase: { Type: 'ExternalAPI', SourceURL: '' },
    Status: 'Active'
  });

  const handleSave = async () => {
    // Add your save logic here
    console.log("Saving...", formData);
    setTimeout(() => navigate('/dashboard'), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20 animate-fade-in">
      
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold">New Agent Configuration</h1>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Discard</button>
            <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95">
              Deploy Agent
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-blue-100 text-blue-600 rounded-lg material-symbols-outlined">badge</span>
              <h2 className="text-lg font-bold">Agent Identity</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Name</label>
                  <input 
                    type="text" 
                    className="modern-input"
                    placeholder="e.g. Nexus Bot"
                    value={formData.AgentName}
                    onChange={e => setFormData({...formData, AgentName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Role / Specialization</label>
                  <input 
                    type="text" 
                    className="modern-input"
                    placeholder="e.g. Technical Support"
                    value={formData.Specialization}
                    onChange={e => setFormData({...formData, Specialization: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea 
                  rows="3"
                  className="modern-input resize-none"
                  placeholder="What is this agent's primary purpose?"
                  value={formData.Description}
                  onChange={e => setFormData({...formData, Description: e.target.value})}
                ></textarea>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-purple-100 text-purple-600 rounded-lg material-symbols-outlined">psychology</span>
              <h2 className="text-lg font-bold">Personality & Tone</h2>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold">Formality</label>
                  <span className="text-xs text-slate-500">{formData.Personality.ToneValue > 50 ? 'Formal' : 'Casual'}</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  value={formData.Personality.ToneValue}
                  onChange={e => setFormData({...formData, Personality: {...formData.Personality, ToneValue: parseInt(e.target.value)}})}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Casual</span>
                  <span>Formal</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">System Instructions</label>
                <div className="relative">
                  <textarea 
                    rows="6"
                    className="modern-input font-mono text-sm bg-slate-900 text-slate-200 dark:bg-black"
                    placeholder="You are a helpful assistant..."
                    defaultValue="You are a professional assistant designed to help users with technical queries. Be concise and accurate."
                  ></textarea>
                  <span className="absolute top-3 right-3 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">System Prompt</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">extension</span> Capabilities
            </h3>
            <div className="space-y-3">
              {['Web Search', 'Code Execution', 'Image Generation', 'Memory'].map(cap => (
                <label key={cap} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-medium">{cap}</span>
                  <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">library_books</span> Knowledge Base
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Source Type</label>
                <select className="modern-input py-2">
                  <option>External API</option>
                  <option>PDF Document</option>
                  <option>Notion Page</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Endpoint URL</label>
                <input type="text" className="modern-input py-2" placeholder="https://api.example.com/data" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AgentBuilder;