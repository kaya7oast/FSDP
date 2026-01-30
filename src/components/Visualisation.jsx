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

const getProxyUrl = (originalUrl) => `/ai/proxy-image?url=${encodeURIComponent(originalUrl)}`;

export default function Visualisation() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  // Function to download the image
const handleDownload = async () => {
  if (!imageUrl) return;
  try {
    // Fetch from backend proxy instead of directly from OpenAI
    const response = await fetch(getProxyUrl(imageUrl));
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `ai-concept-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed", err);
  }
};

// Function to copy image to clipboard
const handleCopy = async () => {
  if (!imageUrl) return;
  try {
    // Fetch from your backend proxy
    const response = await fetch(getProxyUrl(imageUrl));
    const blob = await response.blob();
    
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
    alert("Image copied to clipboard!");
  } catch (err) {
    console.error("Copy failed", err);
    alert("Copy failed. Try using Download instead.");
  }
};

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
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // Prevents accidental newlines or form submissions
    handleGenerate();
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
            onKeyDown={handleKeyDown} // Add this line
            placeholder="Describe an agent concept or workflow..."
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
  <div className="mt-8">
    <div className="flex justify-end gap-2 mb-4">
      <button 
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-medium text-sm"
      >
        <span className="material-symbols-outlined text-lg">content_copy</span>
        Copy
      </button>
      <button 
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
      >
        <span className="material-symbols-outlined text-lg">download</span>
        Download
      </button>
    </div>
    
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
      <img src={imageUrl} alt="AI Generated Concept" className="w-full h-auto" />
    </div>
  </div>
)}
    </div>
  );
}