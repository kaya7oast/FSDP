import React from 'react';

const WorkflowSidebar = () => {
  const onDragStart = (event, nodeType, label, color) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.setData('application/color', color); // We pass color too!
    event.dataTransfer.effectAllowed = 'move';
  };

  const DraggableItem = ({ type, label, icon, color, desc }) => (
    <div 
      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-grab hover:shadow-md hover:border-blue-300 transition-all group"
      onDragStart={(event) => onDragStart(event, type, label, color)} 
      draggable
    >
      <div className="flex items-center gap-3 mb-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color} text-white`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{label}</span>
      </div>
      <p className="text-[10px] text-slate-500 leading-tight pl-11">{desc}</p>
    </div>
  );

  return (
    <div className="w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-white">Workflow Tools</h3>
        <p className="text-xs text-slate-500">Drag steps onto the board</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Section 1: Triggers */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Start</h4>
          <DraggableItem 
            type="input" 
            label="When User Chats" 
            icon="chat" 
            color="bg-blue-500"
            desc="Triggers when a message is received."
          />
        </div>

        {/* Section 2: Actions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Actions</h4>
          <DraggableItem 
            type="default" 
            label="Ask AI" 
            icon="psychology" 
            color="bg-purple-500"
            desc="Process text or make a decision."
          />
          <DraggableItem 
            type="default" 
            label="Search Google" 
            icon="public" 
            color="bg-orange-500"
            desc="Find real-time info from the web."
          />
          <DraggableItem 
            type="default" 
            label="Check Email" 
            icon="mail" 
            color="bg-red-500"
            desc="Read or send emails."
          />
        </div>

        {/* Section 3: End */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Finish</h4>
          <DraggableItem 
            type="output" 
            label="Send Reply" 
            icon="send" 
            color="bg-green-500"
            desc="Send the final answer back to the user."
          />
        </div>
      </div>
    </div>
  );
};

export default WorkflowSidebar;