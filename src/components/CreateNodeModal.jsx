import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── 1. ICON LIBRARY (Curated for AI Agents) ───
const ICON_OPTIONS = [
  'smart_toy', 'face', 'psychology', 'terminal', 'code', 
  'html', 'css', 'javascript', 'database', 'api', 
  'search', 'language', 'translate', 'edit_note', 'draw', 
  'image', 'movie', 'mic', 'volume_up', 'mail', 
  'send', 'chat', 'forum', 'support_agent', 'gavel', 
  'balance', 'verified', 'lock', 'vpn_key', 'shield',
  'bug_report', 'build', 'handyman', 'settings', 'tuners'
];

// ─── 2. QUICK TEMPLATES ───
// Replace the existing PRESETS array with this:
const PRESETS = [
  {
    name: 'Study Buddy',
    category: 'IDENTITY',
    icon: 'school',
    role: 'Exam Coach',
    goal: 'Help me memorize these facts',
    rules: 'Quiz me one by one, give hints if I get stuck'
  },
  {
    name: 'Social Media Manager',
    category: 'IDENTITY',
    icon: 'share',
    role: 'Instagram Expert',
    goal: 'Write a caption for this photo',
    rules: 'Use trending hashtags, be punchy, use emojis'
  },
  {
    name: 'Meeting Notes',
    category: 'LOGIC',
    icon: 'edit_note',
    role: 'Executive Assistant',
    goal: 'Summarize this transcript',
    rules: 'List action items, owners, and deadlines'
  },
  {
    name: 'Trip Planner',
    category: 'KNOWLEDGE',
    icon: 'map',
    role: 'Travel Agent',
    goal: 'Plan a 3-day itinerary',
    rules: 'Include restaurants, landmarks, and transport tips'
  }
];

const CreateNodeModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  if (!isOpen) return null;

  const [activeCategory, setActiveCategory] = useState('IDENTITY');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconInputRef = useRef(null);

  // FORM STATE
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('smart_toy');
  
  // STRUCTURED INPUTS
  const [role, setRole] = useState('');
  const [goal, setGoal] = useState('');
  const [rules, setRules] = useState('');

  // ─── INIT DATA ───
  useEffect(() => {
    if (initialData) {
      // EDIT MODE
      setLabel(initialData.label);
      setIcon(initialData.icon || 'smart_toy');
      setActiveCategory(initialData.category || 'IDENTITY');
      
      // Try to reverse-engineer the content fields
      if(initialData.content) {
         const lines = initialData.content.split('\n');
         const findVal = (key) => lines.find(l => l.startsWith(key))?.replace(key, '') || '';
         
         setRole(findVal('ROLE: '));
         setGoal(findVal('GOAL: '));
         setRules(findVal('RULES: '));
      }
    } else {
      // NEW MODE (Reset)
      setLabel('');
      setIcon('smart_toy');
      setRole(''); setGoal(''); setRules('');
    }
  }, [initialData, isOpen]);

  // Handle clicking outside icon picker to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (iconInputRef.current && !iconInputRef.current.contains(event.target)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyPreset = (preset) => {
    setLabel(preset.name);
    setActiveCategory(preset.category);
    setIcon(preset.icon);
    setRole(preset.role);
    setGoal(preset.goal);
    setRules(preset.rules);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const generatedContent = `ROLE: ${role || '...'}\nGOAL: ${goal || '...'}\nRULES: ${rules || '...'}`;
    
    onSave({
      label,
      icon,
      category: activeCategory,
      content: generatedContent
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {initialData ? 'Edit Custom Node' : 'Design New Node'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Define your AI agent's behavior</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* ⚡ QUICK TEMPLATES (Only show for new nodes) */}
          {!initialData && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start with a Template</label>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex items-center gap-2 px-3 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-xl transition-colors whitespace-nowrap group"
                  >
                    <span className="material-symbols-outlined text-violet-500 text-lg group-hover:scale-110 transition-transform">{p.icon}</span>
                    <span className="text-xs font-bold text-violet-700">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form id="node-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. LABEL & ICON PICKER */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node Name</label>
                <input 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-500 transition-all placeholder:font-normal"
                  placeholder="e.g. Python Helper"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              
              {/* 🎨 ICON DROPDOWN */}
              <div className="space-y-1.5 relative" ref={iconInputRef}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Icon</label>
                <div 
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer hover:border-violet-300 transition-colors"
                >
                    <span className="material-symbols-outlined text-slate-600">{icon}</span>
                    <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                </div>

                {/* DROPDOWN MENU */}
                <AnimatePresence>
                {showIconPicker && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 grid grid-cols-5 gap-2"
                    >
                        {ICON_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => { setIcon(opt); setShowIconPicker(false); }}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${icon === opt ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                <span className="material-symbols-outlined text-xl">{opt}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>

            {/* 2. CATEGORY TABS */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {['IDENTITY', 'CAPABILITY', 'KNOWLEDGE', 'LOGIC'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                      activeCategory === cat 
                        ? 'bg-white text-violet-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. MAD LIBS DESCRIPTION */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-violet-500 text-sm">auto_awesome</span>
                  <span className="text-xs font-bold text-slate-700">Behavior Configuration</span>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role (Who is it?)</label>
                  <input 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:border-violet-400 outline-none transition-all"
                      placeholder="e.g. Senior Python Developer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                  />
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal (What does it do?)</label>
                  <input 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:border-violet-400 outline-none transition-all"
                      placeholder="e.g. Debug code and suggest fixes"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                  />
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rules (Any constraints?)</label>
                  <input 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:border-violet-400 outline-none transition-all"
                      placeholder="e.g. Be concise, only output code"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                  />
               </div>

               {/* Live Preview */}
               <div className="pt-2 border-t border-slate-200 mt-2">
                   <p className="text-[9px] text-slate-400 font-mono leading-tight whitespace-pre-wrap opacity-70">
                      PREVIEW: ROLE: {role || '...'} | GOAL: {goal || '...'} | RULES: {rules || '...'}
                   </p>
               </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit"
            form="node-form"
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Save Node
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateNodeModal;