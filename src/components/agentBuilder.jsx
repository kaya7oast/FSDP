import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentBuilderAssistant from './AgentBuilderAssistant';
import AgentWorkflowEditor from './AgentWorkflowEditor';

const AgentBuilder = () => {
  const navigate = useNavigate();
  // FIX: Default to 'assistant' so it starts straight away
  const [viewMode, setViewMode] = useState('assistant'); 
  
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

  // Called when the AI Architect finishes its interview
  const handleAssistantComplete = (finalData) => {
    // 1. Merge AI data into form
    setFormData(prev => ({
        ...prev,
        ...finalData,
        Personality: { ...prev.Personality, ...finalData.Personality }
    }));
    
    // 2. Switch to form view for user confirmation
    setViewMode('form');
    
    // 3. Signal Ada to announce completion
    window.dispatchEvent(new CustomEvent('ada:supervisor', { 
        detail: { type: 'INFO', message: "I've drafted the agent configuration. Please review the details below." } 
    }));
  };

  const handleSave = async () => {
    try {
      // 1. SETUP: Variables
      let visualName = formData.AgentName;
      let visualCapabilities = [];
      let identityInstructions = []; 
      let outputRules = [];          
      let customInstructions = [];   // <--- NEW: Array for Custom Nodes

      if (workflowData?.visual?.nodes) {
        const nodes = workflowData.visual.nodes;
        const coreNode = nodes.find(n => n.type === 'core' || n.data?.category === 'CORE');
        
        if (coreNode) {
            visualName = coreNode.data.label;
            // Extract connected logic...
            nodes.forEach(n => {
                const cat = n.data?.category || '';
                if (cat.includes('Knowledge')) visualCapabilities.push(n.data.label);
                else if (cat.includes('Identity')) identityInstructions.push(`${n.data.label}: ${n.data.content}`);
                else if (cat.includes('Output')) outputRules.push(`${n.data.label}: ${n.data.content}`);
            });
        }
      }

      // 2. VALIDATION (The Supervisor)
            visualDesc = coreNode.data.content;

            // B. Get Connected Node IDs
            const connectedNodeIds = new Set();
            edges.forEach(edge => {
                if (edge.source === coreNode.id) connectedNodeIds.add(edge.target);
                if (edge.target === coreNode.id) connectedNodeIds.add(edge.source);
            });

            // C. Loop through ALL connected nodes
            nodes.forEach(n => {
                if (connectedNodeIds.has(n.id)) {
                    const cat = n.data?.category || '';
                    const label = n.data?.label || '';
                    const content = n.data?.content || '';

                    // -- KNOWLEDGE --
                    if (cat.includes('Knowledge') || cat.includes('Tool') || cat.includes('Capability')) {
                        visualCapabilities.push(label);
                    }

                    // -- IDENTITY --
                    else if (cat.includes('Identity') || cat.includes('Persona') || cat.includes('Role')) {
                        identityInstructions.push(`${label}: ${content}`);
                    }

                    // -- OUTPUT --
                    else if (cat.includes('Output') || cat.includes('Format') || cat.includes('Style')) {
                        outputRules.push(`${label}: ${content}`);
                    }

                    // -- NEW: CUSTOM / OTHERS --
                    // If it doesn't match above, we treat it as custom context
                    else {
                        customInstructions.push(`[${label}]: ${content}`);
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
      
      // --- NEW: Append Custom Instructions ---
      if (customInstructions.length > 0) {
          finalSystemPrompt += "\n\n### ADDITIONAL CONTEXT & RULES\n" + customInstructions.join('\n');
      }
      // ---------------------------------------

      // 4. VALIDATION
      if (!visualName || visualName.trim() === "" || visualName === "Agent Persona") {
        window.dispatchEvent(new CustomEvent('ada:supervisor', { 
            detail: { type: 'WARNING', message: "I cannot deploy this agent. It needs a name." } 
        }));
        return;
      }

      // 3. BUILD PAYLOAD
      let finalSystemPrompt = formData.Personality.SystemPrompt || "";
      if (identityInstructions.length > 0) finalSystemPrompt += "\n\n### IDENTITY\n" + identityInstructions.join('\n');
      if (outputRules.length > 0) finalSystemPrompt += "\n\n### OUTPUT RULES\n" + outputRules.join('\n');

      const agentData = {
        ...formData,
        AgentName: visualName, // Ensure visual name takes precedence
        Personality: { ...formData.Personality, SystemPrompt: finalSystemPrompt },
        Owner: {
          UserID: localStorage.getItem('userId'),
          UserName: localStorage.getItem('username')
        },
        Capabilities: finalCapabilities,
        // Update System Prompt
        Personality: {
            ...formData.Personality,
            SystemPrompt: finalSystemPrompt
        },
        WorkflowVisual: workflowData
      };

      // 4. SEND TO BACKEND
      const response = await fetch('/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('ada:supervisor', { 
            detail: { type: 'INFO', message: `Agent ${visualName} deployed successfully.` } 
        }));
        navigate('/dashboard');
      } else {
        const err = await response.json();
        alert('Error: ' + (err.error || err.message || 'Failed to save'));
      }
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('ada:supervisor', { 
            detail: { type: 'CRITICAL', message: "Deployment failed. Check the server connection." } 
      }));
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

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
             <button onClick={() => setViewMode('assistant')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${viewMode === 'assistant' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-slate-500'}`}>
               <span className="material-symbols-outlined text-[16px]">smart_toy</span> AI Architect
             </button>
             <button onClick={() => setViewMode('workflow')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${viewMode === 'workflow' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>
               <span className="material-symbols-outlined text-[16px]">account_tree</span> Visual
             </button>
             <button onClick={() => setViewMode('form')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'form' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>
               Manual
             </button>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95">
              Deploy Agent
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {viewMode === 'assistant' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <AgentBuilderAssistant 
                    onUpdateForm={(updates) => setFormData(prev => ({...prev, ...updates}))} 
                    onComplete={handleAssistantComplete}
                />
            </div>
        )}
        
        {viewMode === 'workflow' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                  <AgentWorkflowEditor onSave={(data) => setWorkflowData(data)} />
              </div>
            </div>
        )}

        {viewMode === 'form' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="lg:col-span-2 space-y-8">
                    {/* Identity Section */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                           <span className="material-symbols-outlined text-blue-500">badge</span> Identity
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Name</label>
                                <input type="text" className="modern-input" value={formData.AgentName} onChange={e => setFormData({...formData, AgentName: e.target.value})} placeholder="Agent Name"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea rows="3" className="modern-input" value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} placeholder="Agent Description"/>
                            </div>
                        </div>
                    </section>

                    {/* Personality Section */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                           <span className="material-symbols-outlined text-purple-500">psychology</span> Personality
                        </h2>
                         <div>
                            <label className="block text-sm font-semibold mb-2">System Instructions</label>
                            <textarea rows="6" className="modern-input font-mono text-sm" value={formData.Personality.SystemPrompt} onChange={e => setFormData({...formData, Personality: {...formData.Personality, SystemPrompt: e.target.value}})} placeholder="You are a helpful assistant..."/>
                        </div>
                    </section>
                </div>
                
                {/* Sidebar Config */}
                <div className="space-y-8">
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                         <h3 className="font-bold mb-4">Capabilities</h3>
                         <textarea className="modern-input" rows="4" value={formData.Capabilities} onChange={e => setFormData({...formData, Capabilities: e.target.value})} placeholder="e.g. Python, Web Search"/>
                    </section>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AgentBuilder;