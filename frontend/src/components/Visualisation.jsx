import React, { useState } from 'react';
import Suggestions from './Suggestions';

const VISUAL_TIPS = [
  { 
    label: "Graphs", 
    prompt: "Generate me a graph of AI agent performance over time, with clear axes and a legend, in a modern infographic style", 
    icon: "account_tree" 
  },
  { 
    label: "Pictures", 
    prompt: "Generate a background image with bright colours", 
    icon: "lightbulb" 
  },
  { 
    label: "Agent Concept", 
    prompt: "Generate a simple visual explaining how an AI agent works", 
    icon: "schema" 
  },
  { 
    label: "Image Generation", 
    prompt: "Generate a simple web design for me, with a modern and clean aesthetic, using soft colors and rounded elements", 
    icon: "image" 
  },
  { 
    label: "Knowledge Visualisation", 
    prompt: "A 3D representation of a neural network or knowledge graph with interconnected nodes and data flows, in a clean and modern style", 
    icon: "database" 
  }
];

export default function Visualisation() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch('/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.imageUrl) setImageUrl(data.imageUrl);
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Visualisation</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Transform your ideas into stunning visuals.</p>
      </div>

      {/* Suggestions Section */}
      <Suggestions 
        suggestions={VISUAL_TIPS} 
        onSelect={(selectedPrompt) => setPrompt(selectedPrompt)} 
      />

      {/* Input Area */}
      <div className="flex gap-4 mb-8 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <input 
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create..."
          className="flex-1 px-4 py-3 bg-transparent dark:text-white outline-none"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">
            {loading ? 'autorenew' : 'auto_awesome'}
          </span>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Result Area */}
      {imageUrl && (
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
          <img src={imageUrl} alt="AI Generated" className="w-full h-auto" />
        </div>
      )}
    </div>
  );
}