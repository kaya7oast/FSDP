import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/agentBuilder.css';
import AgentBuilderAssistant from './AgentBuilderAssistant';

const AgentBuilder = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'assistant'

  const [formData, setFormData] = useState({
    // General Settings
    AgentName: '',
    Description: '',
    Specialization: '',
    Status: 'active',
    Region: 'Central',
    
    // Personality
    Personality: {
      Tone: 'Professional',
      LanguageStyle: 'Analytical',
      Emotion: 'Neutral',
      ToneValue: 50, 
      StyleValue: 50,
      SystemPrompt: ''
    },
    
    // Capabilities
    Capabilities: '',
    
    // Knowledge Base
    KnowledgeBase: {
      Type: 'ExternalAPI',
      SourceURL: ''
    },
    
    // Memory Settings
    MemorySettings: {
      Enabled: true,
      RetentionPolicy: 'long_term',
      ContextWindow: 50
    },
    
    // Integration
    Integration: {
      ConnectedAPIs: [],
      WebhookURL: ''
    },
    
    Owner: {
      UserID: 'U002',
      UserName: 'Wei Han'
    },
    
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  });

  // Handle data coming from the AI Assistant
  const handleAssistantUpdate = (updates) => {
    setFormData(prev => {
      // Merge personality deeply
      const mergedPersonality = { ...prev.Personality, ...(updates.Personality || {}) };
      
      // Convert Array capabilities to string if needed
      let caps = updates.Capabilities || prev.Capabilities;
      if (Array.isArray(caps)) caps = caps.join(', ');

      return {
        ...prev,
        ...updates,
        Capabilities: caps,
        Personality: mergedPersonality,
        UpdatedAt: new Date().toISOString()
      };
    });
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      },
      UpdatedAt: new Date().toISOString()
    }));
  };

  const handleSaveAgent = async () => { // <--- Added 'async'
    try {
      const agentData = {
        ...formData,
        Capabilities: typeof formData.Capabilities === 'string' 
          ? formData.Capabilities.split(',').map(item => item.trim()).filter(item => item)
          : formData.Capabilities
      };

      const response = await fetch('/agents', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        alert('Agent deployed successfully!');
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        alert('Error saving agent: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Network error. Ensure backend is running on port 3000.');
    }
};

  const handleToneChange = (value) => {
    const toneMap = {
      0: 'Very Formal', 25: 'Formal', 50: 'Professional', 75: 'Casual', 100: 'Very Casual'
    };
    const closestTone = Object.keys(toneMap).reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );

    setFormData(prev => ({
      ...prev,
      Personality: {
        ...prev.Personality,
        ToneValue: value,
        Tone: toneMap[closestTone]
      },
      UpdatedAt: new Date().toISOString()
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-display text-slate-800 dark:text-slate-200">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create New Agent
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Configure your agent's personality and capabilities.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* --- IMPROVED TABS --- */}
            <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex shadow-sm">
                <button 
                    onClick={() => setViewMode('form')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                        viewMode === 'form' 
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">list_alt</span>
                    Manual Setup 
                </button>
                <button 
                    onClick={() => setViewMode('assistant')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                        viewMode === 'assistant' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    AI Architect
                </button>
            </div>

            <button 
              onClick={handleSaveAgent}
              className="hidden md:flex h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors items-center gap-2 shadow-sm hover:shadow active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              Deploy Agent
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="transition-all duration-500 ease-in-out">
            {viewMode === 'assistant' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Design with AI</h3>
                                <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                                    Describe your ideal agent naturally. Our Architect will draft the configuration, personality, and capabilities for you. You can switch back to "Manual Setup" at any time to review.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Render the Assistant Component */}
                    <AgentBuilderAssistant 
                        onUpdateForm={handleAssistantUpdate} 
                        onComplete={() => setViewMode('form')}
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    
                    {/* 1. General Info Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">badge</span>
                            General Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Agent Name</label>
                                <input   
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                    placeholder="e.g., SalesGenius Pro"
                                    value={formData.AgentName}
                                    onChange={(e) => setFormData(prev => ({...prev, AgentName: e.target.value, UpdatedAt: new Date().toISOString()}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Specialization</label>
                                <input 
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                    placeholder="e.g., Lead Conversion"
                                    value={formData.Specialization}
                                    onChange={(e) => setFormData(prev => ({...prev, Specialization: e.target.value, UpdatedAt: new Date().toISOString()}))}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
                                    placeholder="Describe what this agent does..."
                                    rows="3"
                                    value={formData.Description}
                                    onChange={(e) => setFormData(prev => ({...prev, Description: e.target.value, UpdatedAt: new Date().toISOString()}))}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 2. Personality Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">psychology</span>
                            Personality & Behavior
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Tone</span>
                                        <span className="text-blue-600 font-medium">{formData.Personality.Tone}</span>
                                    </div>
                                    <input 
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                        max="100" min="0" step="25" type="range" 
                                        value={formData.Personality.ToneValue}
                                        onChange={(e) => handleToneChange(parseInt(e.target.value))}
                                    />
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Formal</span>
                                        <span>Casual</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Prompt</label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-mono" 
                                    placeholder="Enter custom system instructions..."
                                    rows="5"
                                    value={formData.Personality.SystemPrompt}
                                    onChange={(e) => handleInputChange('Personality', 'SystemPrompt', e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 3. Capabilities Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400">extension</span>
                            Capabilities
                        </h2>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Capabilities (Comma Separated)</label>
                            <textarea 
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm" 
                                placeholder="e.g., Data_Analysis, Email_Drafting, Code_Review"
                                rows="3"
                                value={formData.Capabilities}
                                onChange={(e) => setFormData(prev => ({...prev, Capabilities: e.target.value, UpdatedAt: new Date().toISOString()}))}
                            ></textarea>
                            <p className="text-xs text-slate-500">
                                Tip: Use keywords like "Search", "Code", or "Image" to enable specific modules.
                            </p>
                        </div>
                    </div>

                    {/* Mobile Save Button */}
                    <button 
                        onClick={handleSaveAgent}
                        className="w-full md:hidden h-12 bg-blue-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">rocket_launch</span>
                        Deploy Agent
                    </button>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AgentBuilder;