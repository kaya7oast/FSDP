import React, { useState , useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentBuilderAssistant from './AgentBuilderAssistant';
import AgentWorkflowEditor from './AgentWorkflowEditor';

const AgentBuilder = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'workflow' | 'assistant'
  
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

    const handleWorkflowSave = useCallback((data) => {
        setWorkflowData(data);
    }, []);

  const handleSave = async () => {
    try {
      // 1. SETUP: Default to Form Data
      let visualName = formData.AgentName;
      let visualDesc = formData.Description;
      let identityInstructions = []; 
      let outputRules = [];
      let visualCapabilities = [];          

      // 2. VISUAL EXTRACTION (The "Source of Truth")
      if (workflowData && workflowData.visual && workflowData.visual.nodes) {
        const nodes = workflowData.visual.nodes;
        const edges = workflowData.visual.edges || [];

        // A. Find Core Node (This overrides the Form Name if found)
        const coreNode = nodes.find(n => n.type === 'core' || n.data?.category === 'CORE');
        
        if (coreNode) {
            if (coreNode.data.label && coreNode.data.label !== "Agent Persona") {
                visualName = coreNode.data.label;
            }
            if (coreNode.data.content) {
                visualDesc = coreNode.data.content;
            }

            // B. Find Connected Nodes (Capabilities, Rules)
            const connectedNodeIds = new Set();
            edges.forEach(edge => {
                if (edge.source === coreNode.id) connectedNodeIds.add(edge.target);
                if (edge.target === coreNode.id) connectedNodeIds.add(edge.source);
            });

            nodes.forEach(n => {
                if (connectedNodeIds.has(n.id)) {
                    const cat = n.data?.category || '';
                    const label = n.data?.label || '';
                    const content = n.data?.content || '';

                    if (cat.includes('Knowledge') || cat.includes('Tool') || cat.includes('Capability')) {
                        visualCapabilities.push(label);
                    }
                    else if (cat.includes('Identity') || cat.includes('Persona') || cat.includes('Role')) {
                        identityInstructions.push(`${label}: ${content}`);
                    }
                    else if (cat.includes('Output') || cat.includes('Format') || cat.includes('Style')) {
                        outputRules.push(`${label}: ${content}`);
                    }
                }
            });
        }
      }

      // 3. BUILD THE FINAL PROMPT
      let finalSystemPrompt = formData.Personality.SystemPrompt || "";
      if (identityInstructions.length > 0) {
          finalSystemPrompt += "\n\n### IDENTITY & PERSONA\n" + identityInstructions.join('\n');
      }
      if (outputRules.length > 0) {
          finalSystemPrompt += "\n\n### OUTPUT FORMATTING RULES\n" + outputRules.join('\n');
      }

      // 4. VALIDATION
      if (!visualName || visualName.trim() === "" || visualName === "Agent Persona") {
        alert("Please name your agent! (Rename the 'Core' node in Workflow or fill out the Details tab).");
        return;
      }

      // 5. MERGE CAPABILITIES
      let existingCaps = typeof formData.Capabilities === 'string' 
          ? formData.Capabilities.split(',').map(item => item.trim()).filter(i => i) 
          : (Array.isArray(formData.Capabilities) ? formData.Capabilities : []);
      
      const finalCapabilities = [...new Set([...existingCaps, ...visualCapabilities])];

      // 6. CONSTRUCT PAYLOAD (THE FIX IS HERE)
      const agentData = {
        ...formData, 
        
        // CRITICAL FIX: Explicitly overwrite with extracted variables
        AgentName: visualName,
        Description: visualDesc,
        Capabilities: finalCapabilities,
        Personality: {
            ...formData.Personality,
            SystemPrompt: finalSystemPrompt
        },

        Owner: {
          UserID: localStorage.getItem('userId') || "3", // Fallback for safety
          UserName: localStorage.getItem('username')
        },
        WorkflowVisual: workflowData
      };

      console.log("Sending Payload:", agentData); // Debug log

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
        alert('Error: ' + (err.error || err.message || 'Failed to save'));
      }
    } catch (error) {
      console.error(error);
      alert('Network Error: Ensure backend is running.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20 animate-fade-in font-display">
      
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/dashboard')} 
                className="group p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500 group-hover:text-violet-600 transition-colors">arrow_back</span>
            </button>
            <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Agent Studio</h1>
                <p className="text-xs text-slate-500 font-medium">Design & Deploy</p>
            </div>
          </div>

          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
             <button 
               onClick={() => setViewMode('form')}
               className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                   viewMode === 'form' 
                   ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-300' 
                   : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
               <span className="material-symbols-outlined text-[18px]">edit_note</span>
               Details
             </button>

            <button 
              onClick={() => setViewMode('workflow')}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'workflow' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-300' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              Workflow
            </button>

             <button 
               onClick={() => setViewMode('assistant')}
               className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                   viewMode === 'assistant' 
                   ? 'bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-md' 
                   : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
               <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
               AI Architect
             </button>
          </div>

          <div className="flex gap-3">
            <button 
                onClick={() => navigate('/dashboard')} 
                className="hidden md:block px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave} 
                className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105 active:scale-95 rounded-xl shadow-xl shadow-violet-500/20 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              Deploy Agent
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {viewMode === 'assistant' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-linear-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-violet-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner">
                            <span className="material-symbols-outlined text-4xl">psychology_alt</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Co-Design with AI</h3>
                            <p className="text-violet-100 mt-2 text-lg max-w-xl leading-relaxed">
                                Describe your dream agent naturally. The Architect will draft the personality, capabilities, and system prompts for you.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-1">
                    <AgentBuilderAssistant 
                        onUpdateForm={handleAssistantUpdate} 
                        onComplete={() => setViewMode('form')}
                    />
                </div>
            </div>
        ) : viewMode === 'workflow' ? (
            <div className="animate-in fade-in zoom-in-95 duration-500 h-[calc(100vh-180px)]">
              <div className="bg-white dark:bg-slate-900 rounded-3xl h-full border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm">
                     <h2 className="text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Visual Canvas
                     </h2>
                  </div>
                  <AgentWorkflowEditor onSave={handleWorkflowSave} />
              </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="lg:col-span-7 space-y-8">
                    <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl">
                                <span className="material-symbols-outlined">badge</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Core Identity</h2>
                                <p className="text-xs text-slate-500">Who is this agent?</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-bold text-slate-800 dark:text-white"
                                        placeholder="e.g. Nexus Bot"
                                        value={formData.AgentName}
                                        onChange={e => setFormData({...formData, AgentName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-medium"
                                        placeholder="e.g. Technical Support"
                                        value={formData.Specialization}
                                        onChange={e => setFormData({...formData, Specialization: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
                                <textarea 
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none text-sm leading-relaxed"
                                    placeholder="Describe the agent's primary purpose and audience..."
                                    value={formData.Description}
                                    onChange={e => setFormData({...formData, Description: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 rounded-xl">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Brain & Personality</h2>
                                <p className="text-xs text-slate-500">How does it think?</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between mb-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tone Spectrum</label>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {formData.Personality.ToneValue > 60 ? 'Formal & Precise' : formData.Personality.ToneValue < 40 ? 'Casual & Chill' : 'Balanced'}
                                    </span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-600"
                                    value={formData.Personality.ToneValue}
                                    onChange={e => setFormData({...formData, Personality: {...formData.Personality, ToneValue: parseInt(e.target.value)}})}
                                />
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                    <span>Casual</span>
                                    <span>Neutral</span>
                                    <span>Formal</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">System Instructions (The Prompt)</label>
                                <div className="relative group">
                                    <textarea 
                                        rows="8"
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all leading-relaxed"
                                        placeholder="You are a helpful assistant..."
                                        value={formData.Personality.SystemPrompt || ''}
                                        onChange={e => setFormData({...formData, Personality: {...formData.Personality, SystemPrompt: e.target.value}})}
                                    ></textarea>
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold rounded uppercase">Markdown Supported</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">extension</span> 
                            Capabilities
                        </h3>
                        <div className="space-y-2">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                <textarea 
                                    className="w-full bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300 resize-none placeholder:text-slate-400"
                                    rows="4"
                                    placeholder="e.g. Web Search, Python Interpreter, Image Generation, Data Analysis..."
                                    value={formData.Capabilities}
                                    onChange={(e) => setFormData({...formData, Capabilities: e.target.value})}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 px-2">Separate capabilities with commas.</p>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">library_books</span> 
                            Knowledge Base
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Source Type</label>
                                <div className="relative">
                                    <select className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                                        <option>External API Endpoint</option>
                                        <option>Uploaded PDF Document</option>
                                        <option>Notion Page Sync</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <span className="material-symbols-outlined text-sm">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Endpoint URL</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" 
                                    placeholder="https://api.example.com/data" 
                                />
                            </div>
                        </div>
                    </section>

                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Need help? Switch to the <span className="text-violet-600 font-bold cursor-pointer" onClick={() => setViewMode('assistant')}>AI Architect</span> tab.
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AgentBuilder;