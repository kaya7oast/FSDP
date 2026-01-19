import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentBuilderAssistant from './AgentBuilderAssistant';
import AgentWorkflowEditor from './AgentWorkflowEditor';

const AgentBuilder = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'assistant'
  
  const [workflowData, setWorkflowData] = useState(null);
  const [formData, setFormData] = useState({
    AgentName: '',
    Description: '',
    Specialization: '',
    Personality: { Tone: 'Professional', ToneValue: 50, StyleValue: 50, SystemPrompt: '' },
    Capabilities: '',
    KnowledgeBase: { Type: 'ExternalAPI', SourceURL: '' },
    Status: 'Active'
  });

  // Function called by AI Assistant to auto-fill form
  const handleAssistantUpdate = (updates) => {
    setFormData(prev => {
      const mergedPersonality = { ...prev.Personality, ...(updates.Personality || {}) };
      // Handle array or string capabilities
      let caps = updates.Capabilities || prev.Capabilities;
      if (Array.isArray(caps)) caps = caps.join(', ');

      return {
        ...prev,
        ...updates,
        Capabilities: caps,
        Personality: mergedPersonality
      };
    });
  };

  const handleSave = async () => {
    try {
      // 1. SETUP: Variables to hold our extracted visual data
      let visualName = formData.AgentName;
      let visualDesc = formData.Description;
      let visualCapabilities = [];
      let identityInstructions = []; // Store text from Identity nodes
      let outputRules = [];          // Store text from Output nodes

      // 2. VISUAL EXTRACTION LOOP
      if (workflowData && workflowData.visual && workflowData.visual.nodes) {
        
        const nodes = workflowData.visual.nodes;
        const edges = workflowData.visual.edges || [];

        // A. Find Core Node
        const coreNode = nodes.find(n => n.type === 'core' || n.data?.category === 'CORE');
        
        if (coreNode) {
            visualName = coreNode.data.label;
            visualDesc = coreNode.data.content;

            // B. Get Connected Node IDs
            const connectedNodeIds = new Set();
            edges.forEach(edge => {
                if (edge.source === coreNode.id) connectedNodeIds.add(edge.target);
                if (edge.target === coreNode.id) connectedNodeIds.add(edge.source);
            });

            // C. Loop through ALL connected nodes to categorize them
            nodes.forEach(n => {
                if (connectedNodeIds.has(n.id)) {
                    const cat = n.data?.category || '';
                    const label = n.data?.label || '';
                    const content = n.data?.content || '';

                    // -- KNOWLEDGE -> Capabilities --
                    if (cat.includes('Knowledge') || cat.includes('Tool') || cat.includes('Capability')) {
                        visualCapabilities.push(label);
                    }

                    // -- IDENTITY -> System Prompt Persona --
                    else if (cat.includes('Identity') || cat.includes('Persona') || cat.includes('Role')) {
                        identityInstructions.push(`${label}: ${content}`);
                    }

                    // -- OUTPUT -> System Prompt Formatting --
                    else if (cat.includes('Output') || cat.includes('Format') || cat.includes('Style') || cat.includes('Mode')) {
                        outputRules.push(`${label}: ${content}`);
                    }
                }
            });
        }
      }

      // 3. BUILD THE SYSTEM PROMPT
      // We combine manual prompt + identity + output rules
      let finalSystemPrompt = formData.Personality.SystemPrompt || "";
      
      if (identityInstructions.length > 0) {
          finalSystemPrompt += "\n\n### IDENTITY & PERSONA\n" + identityInstructions.join('\n');
      }
      if (outputRules.length > 0) {
          finalSystemPrompt += "\n\n### OUTPUT FORMATTING RULES\n" + outputRules.join('\n');
      }

      // 4. VALIDATION
      if (!visualName || visualName.trim() === "" || visualName === "Agent Persona") {
        alert("Please rename your Agent (Click the 'Agent Persona' node to rename it).");
        return;
      }

      // 5. MERGE CAPABILITIES
      let existingCaps = typeof formData.Capabilities === 'string' 
          ? formData.Capabilities.split(',').map(item => item.trim()).filter(i => i) 
          : (Array.isArray(formData.Capabilities) ? formData.Capabilities : []);
      const finalCapabilities = [...new Set([...existingCaps, ...visualCapabilities])];

      // 6. CONSTRUCT PAYLOAD
      const agentData = {
        ...formData,
        AgentName: visualName,
        Description: visualDesc,
        Capabilities: finalCapabilities,
        Personality: {
            ...formData.Personality,
            SystemPrompt: finalSystemPrompt // <--- The "Brain" is now populated!
        },
        WorkflowVisual: workflowData
      };

      console.log("🚀 Deploying Agent Payload:", agentData);

      // 7. SEND TO BACKEND
      const response = await fetch('/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        alert(`Agent "${visualName}" Deployed Successfully!`);
        navigate('/dashboard');
      } else {
        const err = await response.json();
        alert('Error: ' + (err.error || 'Failed to save'));
      }
    } catch (error) {
      console.error(error);
      alert('Network Error: Ensure backend is running.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20 animate-fade-in">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold hidden md:block">New Agent Configuration</h1>
          </div>

          {/* View Switcher Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
             <button 
               onClick={() => setViewMode('form')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'form' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
             >
               Manual
             </button>

            <button 
              onClick={() => setViewMode('workflow')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${viewMode === 'workflow' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              Visual
            </button>

             <button 
               onClick={() => setViewMode('assistant')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${viewMode === 'assistant' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-slate-500'}`}
             >
               <span className="material-symbols-outlined text-[16px]">smart_toy</span>
               AI Architect
             </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Discard
            </button>
            <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95">
              Deploy Agent
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {viewMode === 'assistant' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-linear-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-6 text-white shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Design with AI</h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Chat with the architect to auto-fill the form below. Switch back to "Manual" to review changes.
                            </p>
                        </div>
                    </div>
                </div>
                <AgentBuilderAssistant 
                    onUpdateForm={handleAssistantUpdate} 
                    onComplete={() => setViewMode('form')}
                />
            </div>
        
        ) : viewMode === 'workflow' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                  <h2 className="text-lg font-bold mb-2">Agent Workflow</h2>
                  <p className="text-slate-500 text-sm mb-4">
                    Drag and drop nodes to define how your agent processes information.
                  </p>
                  <AgentWorkflowEditor onSave={(data) => setWorkflowData(data)} />
              </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                            className="modern-input w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Nexus Bot"
                            value={formData.AgentName}
                            onChange={e => setFormData({...formData, AgentName: e.target.value})}
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-semibold mb-2">Role / Specialization</label>
                        <input 
                            type="text" 
                            className="modern-input w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="modern-input w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                            className="modern-input font-mono text-sm bg-slate-900 text-slate-200 dark:bg-black w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="You are a helpful assistant..."
                            value={formData.Personality.SystemPrompt || ''}
                            onChange={e => setFormData({...formData, Personality: {...formData.Personality, SystemPrompt: e.target.value}})}
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
                    <div className="space-y-2">
                         <label className="text-xs font-semibold text-slate-500 uppercase">Comma Separated List</label>
                         <textarea 
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            placeholder="e.g. Web Search, Python, Image Gen"
                            value={formData.Capabilities}
                            onChange={(e) => setFormData({...formData, Capabilities: e.target.value})}
                         />
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">library_books</span> Knowledge Base
                    </h3>
                    <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Source Type</label>
                        <select className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <option>External API</option>
                        <option>PDF Document</option>
                        <option>Notion Page</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Endpoint URL</label>
                        <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" placeholder="https://api.example.com/data" />
                    </div>
                    </div>
                </section>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AgentBuilder;