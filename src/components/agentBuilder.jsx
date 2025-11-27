import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/agentBuilder.css';

const AgentBuilder = () => {
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // General Settings
    AgentName: 'Evelyn',
    Description: 'Provides AI-driven insights to improve support response quality.',
    Specialization: 'AI Analytics',
    Status: 'Active',
    Region: 'Central',
    
    // Personality
    Personality: {
      Tone: 'Professional',
      LanguageStyle: 'Analytical',
      Emotion: 'Neutral',
      ToneValue: 30, // 0-100 scale
      StyleValue: 70, // 0-100 scale
      SystemPrompt: ''
    },
    
    // Capabilities - changed to string input
    Capabilities: 'Data_Insights, Trend_Analysis, Report_Generation',
    
    // Knowledge Base
    KnowledgeBase: {
      Type: 'ExternalAPI',
      SourceURL: 'https://api.analyticshub.com'
    },
    
    // Memory Settings
    MemorySettings: {
      Enabled: true,
      RetentionPolicy: 'long_term',
      ContextWindow: 50
    },
    
    // Integration
    Integration: {
      ConnectedAPIs: ['Zendesk', 'Slack', 'ChatGPT'],
      WebhookURL: 'https://hooks.slack.com/services/example'
    },
    
    // Analytics (these would typically be auto-generated)
    Analytics: {
      AverageResponseTime: 1.8,
      SatisfactionScore: 4.9
    },
    
    // Owner (would typically come from auth context)
    Owner: {
      UserID: 'U002',
      UserName: 'Wei Han'
    },
    
    // Auto-generated fields
    TasksCompleted: 210,
    LastActive: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  });

  const [integrations, setIntegrations] = useState(['Zendesk', 'Slack', 'ChatGPT']);
  const [newIntegration, setNewIntegration] = useState('');

  const themeColors = [
    '#137fec', '#17a2b8', '#ff9500', '#34c759', '#af52de', '#5856d6'
  ];

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

  const addIntegration = () => {
    if (newIntegration && !integrations.includes(newIntegration)) {
      const updatedIntegrations = [...integrations, newIntegration];
      setIntegrations(updatedIntegrations);
      setFormData(prev => ({
        ...prev,
        Integration: {
          ...prev.Integration,
          ConnectedAPIs: updatedIntegrations
        },
        UpdatedAt: new Date().toISOString()
      }));
      setNewIntegration('');
    }
  };

  const removeIntegration = (integration) => {
    const updatedIntegrations = integrations.filter(item => item !== integration);
    setIntegrations(updatedIntegrations);
    setFormData(prev => ({
      ...prev,
      Integration: {
        ...prev.Integration,
        ConnectedAPIs: updatedIntegrations
      },
      UpdatedAt: new Date().toISOString()
    }));
  };

  const handleSaveAgent = async () => {
    try {
      const agentData = {
        ...formData,
        Capabilities: formData.Capabilities.split(',').map(item => item.trim()).filter(item => item),
      };

      // Send to your Express server (running on port 3000 or whatever your app.js uses)
      const response = await fetch('http://localhost:3000/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      // Normalize handling: agent-service returns the saved agent object on success.
      const result = await response.json().catch(() => null);

      if (response.ok) {
        alert('Agent saved successfully to database!');
        navigate('/dashboard');
      } else {
        const errMsg = result && result.error ? result.error : JSON.stringify(result) || 'Unknown error';
        alert('Error saving agent: ' + errMsg);
        // keep user on page so they can retry/edit
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Error saving agent. Check console for details.');
      // keep user on page to try again
    }
  };

  const handleToneChange = (value) => {
    const toneMap = {
      0: 'Very Formal',
      25: 'Formal', 
      50: 'Professional',
      75: 'Casual',
      100: 'Very Casual'
    };
    
    const closestTone = Object.keys(toneMap).reduce((prev, curr) => {
      return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });

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

  const handleStyleChange = (value) => {
    const styleMap = {
      0: 'Very Concise',
      25: 'Concise',
      50: 'Balanced', 
      75: 'Detailed',
      100: 'Very Detailed'
    };
    
    const closestStyle = Object.keys(styleMap).reduce((prev, curr) => {
      return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });

    setFormData(prev => ({
      ...prev,
      Personality: {
        ...prev.Personality,
        StyleValue: value,
        LanguageStyle: styleMap[closestStyle]
      },
      UpdatedAt: new Date().toISOString()
    }));
  };

  // Log the current form data structure (for debugging)
  useEffect(() => {
    console.log('Current Form Data:', formData);
  }, [formData]);

  return (
    <div className="light bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200">
      <div className="relative flex min-h-screen w-full">
        {/* Main Content - Full width without sidebar */}
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Page Heading */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Agent Builder</h1>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSaveAgent}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary/90"
                >
                  <span className="truncate">Save Agent</span>
                </button>
              </div>
            </div>

            {/* Profile Header */}
            <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
              <div className="flex w-full flex-col gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div 
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-24 w-24" 
                      data-alt="Abstract gradient avatar" 
                      style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD53iIE4LERqCcrtlTjTMmtfovdGDtFfQthuZ6c6z8FAWoQphqY-N66re0wageRUMEeoLU2GtCOVYn4PB6cpCHAGD8BapKxzBkZTLpofJAAqMpxDvqJ_2qhxMuOI4dZVqF9tu8w0BVz_OEhmnxfsRE8YZIUfHbriJwDPlhdC-nyQGy6w4nVY8QN0FbQJ_XpdBTVDL9EgXz38GmqGGdIU_pgo9uyqzBk3g-NDaibfi30u0d9lFpK79IsfhUIvIRTiAq4pPM93nJoh7Q")` }}
                    ></div>
                    <button className="absolute bottom-0 right-0 flex items-center justify-center size-8 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 border-2 border-white dark:border-slate-900">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-slate-900 dark:text-white text-xl font-bold">Upload Avatar</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Upload a picture to personalize your agent.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* General Settings Form */}
            <div id="general-section" className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Agent Name</p>
                  <input   
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                    placeholder="e.g., Evelyn"
                    value={formData.AgentName}
                    onChange={(e) => setFormData(prev => ({...prev, AgentName: e.target.value, UpdatedAt: new Date().toISOString()}))}
                  />
                </label>
                <label className="flex flex-col">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Specialization</p>
                  <input 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                    placeholder="e.g., AI Analytics"
                    value={formData.Specialization}
                    onChange={(e) => setFormData(prev => ({...prev, Specialization: e.target.value, UpdatedAt: new Date().toISOString()}))}
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Description</p>
                  <textarea 
                    className="form-textarea flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                    placeholder="e.g., Provides AI-driven insights to improve support response quality."
                    rows="3"
                    value={formData.Description}
                    onChange={(e) => setFormData(prev => ({...prev, Description: e.target.value, UpdatedAt: new Date().toISOString()}))}
                  ></textarea>
                </label>
                <label className="flex flex-col">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Region</p>
                  <select 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm"
                    value={formData.Region}
                    onChange={(e) => setFormData(prev => ({...prev, Region: e.target.value, UpdatedAt: new Date().toISOString()}))}
                  >
                    <option value="Central">Central</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </label>
                <label className="flex flex-col">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Status</p>
                  <select 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm"
                    value={formData.Status}
                    onChange={(e) => setFormData(prev => ({...prev, Status: e.target.value, UpdatedAt: new Date().toISOString()}))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Training">Training</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Personality & Behavior */}
            <div id="personality-section" className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Personality & Behavior</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                  <label className="flex flex-col">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Tone: {formData.Personality.Tone}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span>Formal</span>
                      <input 
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full" 
                        max="100" 
                        min="0" 
                        type="range" 
                        value={formData.Personality.ToneValue}
                        onChange={(e) => handleToneChange(parseInt(e.target.value))}
                      />
                      <span>Casual</span>
                    </div>
                  </label>
                  <label className="flex flex-col">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Style: {formData.Personality.LanguageStyle}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span>Concise</span>
                      <input 
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full" 
                        max="100" 
                        min="0" 
                        type="range" 
                        value={formData.Personality.StyleValue}
                        onChange={(e) => handleStyleChange(parseInt(e.target.value))}
                      />
                      <span>Verbose</span>
                    </div>
                  </label>
                  <label className="flex flex-col">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Emotion</p>
                    <select 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm"
                      value={formData.Personality.Emotion}
                      onChange={(e) => handleInputChange('Personality', 'Emotion', e.target.value)}
                    >
                      <option value="Neutral">Neutral</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Professional">Professional</option>
                      <option value="Enthusiastic">Enthusiastic</option>
                      <option value="Empathetic">Empathetic</option>
                    </select>
                  </label>
                </div>
                <label className="flex flex-col">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">System Prompt (Custom Instructions)</p>
                  <textarea 
                    className="form-textarea flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                    placeholder="e.g., You are a helpful assistant that specializes in technology. Always be friendly and provide detailed explanations." 
                    rows="8"
                    value={formData.Personality.SystemPrompt}
                    onChange={(e) => handleInputChange('Personality', 'SystemPrompt', e.target.value)}
                  ></textarea>
                </label>
              </div>
            </div>

            {/* Capabilities - Updated to text input */}
            <div id="capabilities-section" className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Capabilities</h2>
              
              <label className="flex flex-col">
                <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Capabilities (comma-separated, use _ for space)</p>
                <textarea 
                  className="form-textarea flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                  placeholder="e.g., Data_Insights, Trend_Analysis, Report_Generation"
                  rows="3"
                  value={formData.Capabilities}
                  onChange={(e) => setFormData(prev => ({...prev, Capabilities: e.target.value, UpdatedAt: new Date().toISOString()}))}
                ></textarea>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">Enter capabilities separated by commas. They will be converted to an array when saved.</p>
              </label>

              {/* Memory Settings */}
              <div className="mt-8 p-6 border border-slate-200 dark:border-slate-800 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Memory Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="flex items-center justify-between">
                    <span className="font-medium text-sm">Memory Enabled</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        className="sr-only peer" 
                        type="checkbox" 
                        checked={formData.MemorySettings.Enabled}
                        onChange={(e) => handleInputChange('MemorySettings', 'Enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                    </label>
                  </label>
                  <label className="flex flex-col">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Retention Policy</p>
                    <select 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm"
                      value={formData.MemorySettings.RetentionPolicy}
                      onChange={(e) => handleInputChange('MemorySettings', 'RetentionPolicy', e.target.value)}
                    >
                      <option value="short_term">Short Term</option>
                      <option value="long_term">Long Term</option>
                      <option value="session_only">Session Only</option>
                    </select>
                  </label>
                  <label className="flex flex-col">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Context Window</p>
                    <input 
                      type="number"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                      value={formData.MemorySettings.ContextWindow}
                      onChange={(e) => handleInputChange('MemorySettings', 'ContextWindow', parseInt(e.target.value))}
                    />
                  </label>
                </div>
              </div>

              {/* Knowledge Base Settings */}
              <div className="mt-6 p-6 border border-slate-200 dark:border-slate-800 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Knowledge Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Type</p>
                    <select 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm"
                      value={formData.KnowledgeBase.Type}
                      onChange={(e) => handleInputChange('KnowledgeBase', 'Type', e.target.value)}
                    >
                      <option value="ExternalAPI">External API</option>
                      <option value="InternalDB">Internal Database</option>
                      <option value="FileUpload">File Upload</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </label>
                  <label className="flex flex-col">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Source URL</p>
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                      placeholder="https://api.analyticshub.com"
                      value={formData.KnowledgeBase.SourceURL}
                      onChange={(e) => handleInputChange('KnowledgeBase', 'SourceURL', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div id="integrations-section" className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Integrations</h2>
              
              {/* Connected Integrations */}
              {integrations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Connected APIs</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrations.map((integration, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">link</span>
                          <span className="font-medium text-sm">{integration}</span>
                        </div>
                        <button 
                          onClick={() => removeIntegration(integration)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Integration */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6">
                <div className="text-center mb-4">
                  <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">add_circle</span>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add new integration</p>
                </div>
                <div className="flex gap-4 max-w-md mx-auto">
                  <input 
                    type="text"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                    placeholder="Enter API name (e.g., Slack, Zendesk)"
                    value={newIntegration}
                    onChange={(e) => setNewIntegration(e.target.value)}
                  />
                  <button 
                    onClick={addIntegration}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary/90"
                  >
                    <span className="truncate">Add</span>
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="mt-6">
                <label className="flex flex-col">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-medium pb-2">Webhook URL</p>
                  <input 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm" 
                    placeholder="https://hooks.slack.com/services/example"
                    value={formData.Integration.WebhookURL}
                    onChange={(e) => handleInputChange('Integration', 'WebhookURL', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgentBuilder;