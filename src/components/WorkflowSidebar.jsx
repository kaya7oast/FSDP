import React from 'react';

// A "Draggable" component with cat-themed styling
const DraggableToy = ({ type, label, icon, color, desc, defaultContent }) => {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.setData('application/color', color);
    event.dataTransfer.setData('application/content', defaultContent);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="p-3 bg-white dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 rounded-2xl cursor-grab hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 transition-all group active:scale-95"
      onDragStart={onDragStart} 
      draggable
    >
      <div className="flex items-center gap-3 mb-1">
        {/* Soft, rounded icon container */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} text-white shadow-sm`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="font-bold text-sm text-stone-700 dark:text-stone-200">{label}</span>
      </div>
      <p className="text-[11px] text-stone-500 leading-tight pl-12">{desc}</p>
    </div>
  );
};

const WorkflowSidebar = () => {
  return (
    <div className="w-72 bg-orange-50/50 dark:bg-stone-900 border-r border-orange-100 dark:border-stone-800 flex flex-col h-full">
      <div className="p-6 border-b border-orange-100 dark:border-stone-800 bg-white/50 backdrop-blur-sm">
        <h3 className="font-extrabold text-stone-800 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500">pets</span>
          Agent DNA
        </h3>
        <p className="text-xs text-stone-500 mt-1">Drag traits to build a brain.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Core Identity */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">1. The Cat (Core)</h4>
          <DraggableToy 
            type="core" 
            label="Agent Identity" 
            icon="fingerprint" 
            color="bg-stone-800"
            desc="The name and role of your agent."
            defaultContent="You are a helpful assistant."
          />
        </div>

        {/* Personality Traits */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">2. Traits</h4>
          <DraggableToy 
            type="context" 
            label="Purr-sonality" 
            icon="mood" 
            color="bg-orange-400"
            desc="Happy? Grumpy? Professional?"
            defaultContent="Be cheerful and optimistic."
          />
          <DraggableToy 
            type="context" 
            label="Backstory" 
            icon="auto_stories" 
            color="bg-amber-400"
            desc="Give the agent a history."
            defaultContent="You grew up in a library..."
          />
        </div>

        {/* Rules */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">3. Boundaries</h4>
          <DraggableToy 
            type="context" 
            label="Hard Rule" 
            icon="verified_user" 
            color="bg-rose-400"
            desc="Strict rules the agent cannot break."
            defaultContent="NEVER discuss politics."
          />
        </div>

        // ... inside WorkflowSidebar return statement, at the very bottom before closing div:

      <div className="p-4 mt-auto">
        <div className="bg-orange-100 rounded-xl p-4 flex items-center gap-3 border border-orange-200">
            <div className="text-3xl">😺</div>
                <div>
                  <div className="text-[10px] font-bold text-orange-400 uppercase">Pro Tip</div>
                  <p className="text-xs text-orange-800 leading-tight">
                    "Connect the yarn balls to link ideas!"
                  </p>
                  </div>
                </div>
            </div>
        </div>
      </div>
  );
};

export default WorkflowSidebar;