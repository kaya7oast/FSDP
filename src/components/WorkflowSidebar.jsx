import React, { useState } from 'react';

// --- DATA: The 50+ Options ---
const TRAIT_CATEGORIES = {
  "Identity (Who)": [
    { label: "Expert Role", desc: "Highly knowledgeable authority." },
    { label: "Novice Role", desc: "Learning, asks questions." },
    { label: "Critic", desc: "Critical, finds flaws." },
    { label: "Coach", desc: "Encouraging, guides user." },
    { label: "Formal Tone", desc: "Professional, no slang." },
    { label: "Casual Tone", desc: "Relaxed, friendly." },
    { label: "Sarcastic", desc: "Witty, dry humor." },
    { label: "Empathetic", desc: "Careful, emotional intelligence." }
  ],
  "Knowledge (What)": [
    { label: "Python Expert", desc: "Coding & debugging." },
    { label: "Web Dev", desc: "HTML/CSS/React." },
    { label: "Legal Knowledge", desc: "Contracts & compliance." },
    { label: "Medical Info", desc: "Anatomy & health basics." },
    { label: "History Buff", desc: "Dates & world events." },
    { label: "Math Logic", desc: "Step-by-step reasoning." },
    { label: "Creative Writing", desc: "Storytelling & prose." },
    { label: "Marketing", desc: "Copywriting & sales." }
  ],
  "Controls (Safety)": [
    { label: "No Swearing", desc: "Strict profanity filter." },
    { label: "Strict Facts", desc: "No hallucinations." },
    { label: "Short Answers", desc: "Under 50 words." },
    { label: "Long Answers", desc: "Detailed explanations." },
    { label: "No Bias", desc: "Neutral point of view." },
    { label: "Markdown Only", desc: "Formatted output." }
  ],
  "Outputs (Format)": [
    { label: "Plain Text", desc: "Standard chat bubble." },
    { label: "JSON Object", desc: "Structured data." },
    { label: "Code Block", desc: "Syntax highlighted." },
    { label: "Email Draft", desc: "Subject + Body format." },
    { label: "Table", desc: "Row/Column data." },
    { label: "Audio/Voice", desc: "TTS enabled." },
    { label: "Image Gen", desc: "Visual output." }
  ]
};

// --- COMPONENTS ---

const DraggableTrait = ({ label, desc, category }) => {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', 'trait');
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.setData('application/desc', desc);
    event.dataTransfer.setData('application/category', category);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="p-3 bg-white border border-[#E0D8C3] rounded-xl cursor-grab hover:border-orange-400 hover:shadow-md transition-all active:scale-95 group"
      onDragStart={onDragStart} 
      draggable
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm text-[#4E342E]">{label}</span>
        <span className="material-symbols-outlined text-[16px] text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
      </div>
      <p className="text-[10px] text-[#8D7F71] leading-tight">{desc}</p>
    </div>
  );
};

const TemplateCard = ({ title, tags, onClick }) => (
  <div onClick={onClick} className="p-4 bg-white border-l-4 border-l-orange-400 border border-[#E0D8C3] rounded-xl cursor-pointer hover:shadow-md transition-all mb-3">
    <h4 className="font-bold text-[#4E342E] text-sm mb-1">{title}</h4>
    <div className="flex gap-1 flex-wrap">
      {tags.map((t, i) => (
        <span key={i} className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded">{t}</span>
      ))}
    </div>
  </div>
);

const WorkflowSidebar = ({ isOpen, onClose, onLoadTemplate }) => {
  const [activeTab, setActiveTab] = useState('build'); // 'build' or 'templates'
  const [openCategories, setOpenCategories] = useState(Object.keys(TRAIT_CATEGORIES));

  const toggleCategory = (cat) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <aside className={`
      fixed inset-x-0 bottom-0 z-50 md:z-0 h-[60vh] transform transition-transform duration-300 ease-in-out bg-[#F5F0E6] border-t-2 border-orange-400 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
      md:relative md:inset-auto md:h-full md:w-80 md:transform-none md:border-t-0 md:border-r md:border-[#E0D8C3] md:shadow-none
      ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
    `}>
      
      {/* Mobile Handle / Close Button */}
      <div className="md:hidden flex justify-center pt-2 pb-1" onClick={onClose}>
        <div className="w-12 h-1.5 bg-orange-200 rounded-full"></div>
      </div>

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E0D8C3] flex items-center gap-3">
        <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold">N</div>
        <h3 className="font-extrabold text-[#4E342E] text-lg tracking-tight">Personality Builder</h3>
      </div>

      {/* Tabs */}
      <div className="flex p-3 gap-2">
        <button 
          onClick={() => setActiveTab('build')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'build' ? 'bg-white text-orange-500 shadow-sm' : 'text-[#8D7F71] hover:bg-white/50'}`}
        >
          Build
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'templates' ? 'bg-white text-orange-500 shadow-sm' : 'text-[#8D7F71] hover:bg-white/50'}`}
        >
          Templates
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 h-[calc(100%-140px)] scrollbar-thin scrollbar-thumb-orange-200">
        
        {activeTab === 'build' ? (
          <>
            {/* EXISTING CATEGORIES LOOP */}
            {Object.entries(TRAIT_CATEGORIES).map(([category, items]) => (
              <div key={category} className="mb-4">
                <button 
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between text-xs font-bold text-[#8D7F71] uppercase tracking-widest mb-2 px-1 hover:text-orange-500"
                >
                  {category}
                  <span className={`material-symbols-outlined text-sm transition-transform ${openCategories.includes(category) ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                
                {openCategories.includes(category) && (
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => (
                      <DraggableTrait 
                        key={item.label} 
                        label={item.label} 
                        desc={item.desc} 
                        category={category.split(' ')[0]} 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* --- NEW: CUSTOM CONTEXT NODE --- */}
            <div className="mt-6 pt-6 border-t border-[#E0D8C3]">
              <div className="text-xs font-bold text-[#8D7F71] uppercase tracking-widest mb-2 px-1">
                Advanced
              </div>
              <div 
                className="p-3 bg-white border border-indigo-200 rounded-xl cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:scale-95 group"
                draggable
                onDragStart={(event) => {
                  // This manually sets the data, categorizing it as 'Custom'
                  event.dataTransfer.setData('application/reactflow', 'default'); // Use default shape
                  event.dataTransfer.setData('application/label', 'Custom Context');
                  event.dataTransfer.setData('application/desc', 'Add specific rules or backstory.');
                  event.dataTransfer.setData('application/category', 'Custom'); 
                  event.dataTransfer.effectAllowed = 'move';
                }} 
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-indigo-500">extension</span>
                  <span className="font-bold text-sm text-[#4E342E]">Custom / Other</span>
                </div>
                <p className="text-[10px] text-[#8D7F71] leading-tight">
                  Drag in to add unique rules, constraints, or hidden context.
                </p>
              </div>
            </div>
            {/* -------------------------------- */}
          </>
        ) : (
          // TEMPLATES TAB (Keep as is)
          <div className="space-y-2">
             <TemplateCard title="🐱 The Coding Buddy" tags={["Python", "Web Dev", "Code Block"]} onClick={() => onLoadTemplate('coding')} />
             <TemplateCard title="🧶 The Listener" tags={["Empathetic", "Soft Tone", "Plain Text"]} onClick={() => onLoadTemplate('therapy')} />
             <TemplateCard title="👔 The Professional" tags={["Formal", "Email Draft", "No Swearing"]} onClick={() => onLoadTemplate('business')} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default WorkflowSidebar;