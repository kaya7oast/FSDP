import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const onDragStart = (event, nodeData) => {
  event.dataTransfer.setData('application/reactflow', 'custom');
  event.dataTransfer.setData('application/data', JSON.stringify(nodeData));
  event.dataTransfer.effectAllowed = 'move';
};

const SidebarItem = ({ label, desc, icon, bg, category, data, isPopular, onContextMenu }) => (
  <div
    className={`
      group relative flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing
      bg-white border shadow-sm transition-all duration-200 select-none
      ${isPopular ? 'border-orange-200 hover:border-orange-400 shadow-orange-100' : 'border-slate-100 hover:border-violet-200 hover:shadow-md'}
      hover:-translate-y-0.5
    `}
    onDragStart={(event) => onDragStart(event, data)}
    onContextMenu={onContextMenu} // ✅ Attach Right Click
    draggable
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${bg} ${isPopular ? 'ring-2 ring-orange-100' : ''}`}>
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-bold text-slate-700 group-hover:text-violet-700 transition-colors truncate flex items-center gap-2">
        {label}
        {isPopular && <span className="material-symbols-outlined text-[12px] text-orange-500">local_fire_department</span>}
      </div>
      <div className="text-[9px] text-slate-400 font-medium truncate">{desc}</div>
    </div>
  </div>
);

const SidebarCategory = ({ title, color, children }) => (
  <div className="mb-6">
    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${color} pl-1 flex items-center gap-1`}>
      {title}
    </h3>
    <div className="grid grid-cols-1 gap-2">
      {children}
    </div>
  </div>
);

const WorkflowSidebar = ({ availableNodes = [], onCreateNode, onEditNode, onDeleteNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { x, y, node }

  // Close menu on click anywhere else
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    // Only allow context menu for User Nodes
    if (node.data.isUserNode) {
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    }
  };

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return availableNodes;
    const lowerTerm = searchTerm.toLowerCase();
    return availableNodes.filter(n => 
      (n.data?.label || '').toLowerCase().includes(lowerTerm) || 
      (n.data?.content || '').toLowerCase().includes(lowerTerm)
    );
  }, [availableNodes, searchTerm]);

  // ✅ FIX: "My Custom Nodes" now looks for isUserNode flag
  const userNodes = useMemo(() => filteredNodes.filter(n => n.data?.isUserNode), [filteredNodes]);
  
  // Base nodes exclude user nodes to avoid duplicates
  const baseNodes = useMemo(() => filteredNodes.filter(n => !n.data?.isUserNode), [filteredNodes]);

  const popularNodes = useMemo(() => {
    if (searchTerm) return []; 
    return [...baseNodes]
      .filter(n => n.data?.usageCount > 0)
      .sort((a, b) => (b.data?.usageCount || 0) - (a.data?.usageCount || 0))
      .slice(0, 3);
  }, [baseNodes, searchTerm]);

  const getBaseNodesByCategory = (cat) => baseNodes.filter(n => n.data?.category === cat);

  return (
    <>
    <aside className="w-72 bg-slate-50 border-r border-slate-200 flex-col h-full hidden md:flex shrink-0">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10 space-y-3">
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-600">build_circle</span>
            Toolbox
            </h2>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {filteredNodes.length}
            </span>
        </div>
        <div className="relative group">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-lg group-focus-within:text-violet-500 transition-colors">search</span>
            <input 
                type="text" 
                placeholder="Search nodes..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button onClick={onCreateNode} id="tour-create-btn" className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Create Custom Node
        </button>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {/* 🔥 POPULAR */}
        {popularNodes.length > 0 && (
            <SidebarCategory title="Most Used" color="text-orange-500">
            {popularNodes.map((node) => (
                <SidebarItem key={`pop-${node.id}`} {...node.data} isPopular={true} bg="bg-orange-50 text-orange-600" />
            ))}
            </SidebarCategory>
        )}

        {/* 👤 CUSTOM NODES (FIXED: Now uses userNodes list) */}
        <SidebarCategory title="My Custom Nodes" color="text-violet-600">
            {userNodes.map((node) => (
            <SidebarItem 
                key={node.id} 
                {...node.data} 
                data={node.data}
                bg="bg-white border-2 border-violet-100 text-violet-600" 
                onContextMenu={(e) => handleContextMenu(e, node)} // Attach context menu
            />
            ))}
            {userNodes.length === 0 && !searchTerm && (
                <div className="text-[10px] text-slate-400 italic px-1 mb-4 border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50">
                    No custom nodes yet.<br/>Click "Create" above!
                </div>
            )}
        </SidebarCategory>

        {/* STANDARD CATEGORIES */}
        {['IDENTITY', 'CAPABILITY', 'KNOWLEDGE', 'LOGIC'].map(cat => {
            const nodes = getBaseNodesByCategory(cat);
            if (nodes.length === 0) return null;
            const colorClass = cat === 'IDENTITY' ? 'text-fuchsia-500' : cat === 'CAPABILITY' ? 'text-emerald-500' : cat === 'KNOWLEDGE' ? 'text-blue-500' : 'text-amber-500';
            const bgClass = cat === 'IDENTITY' ? 'bg-fuchsia-100 text-fuchsia-600' : cat === 'CAPABILITY' ? 'bg-emerald-100 text-emerald-600' : cat === 'KNOWLEDGE' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600';

            return (
                <SidebarCategory key={cat} title={cat} color={colorClass}>
                    {nodes.map((node) => (
                        <SidebarItem key={node.id} {...node.data} data={node.data} bg={bgClass} />
                    ))}
                </SidebarCategory>
            );
        })}
      </div>
    </aside>

    {/* 🖱️ RIGHT CLICK MENU (FIXED POSITION) */}
    <AnimatePresence>
    {contextMenu && (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
            className="bg-slate-800 text-white rounded-xl shadow-2xl p-1.5 min-w-35 border border-slate-700 overflow-hidden"
        >
            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 mb-1">
                {contextMenu.node.data.label}
            </div>
            <button 
                onClick={() => { onEditNode(contextMenu.node); setContextMenu(null); }}
                className="w-full text-left px-2 py-2 text-xs font-bold hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
            >
                <span className="material-symbols-outlined text-sm text-blue-400">edit</span> Edit Node
            </button>
            <button 
                onClick={() => { onDeleteNode(contextMenu.node); setContextMenu(null); }}
                className="w-full text-left px-2 py-2 text-xs font-bold hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg flex items-center gap-2 transition-colors"
            >
                <span className="material-symbols-outlined text-sm">delete</span> Delete
            </button>
        </motion.div>
    )}
    </AnimatePresence>
    </>
  );
};

export default WorkflowSidebar;