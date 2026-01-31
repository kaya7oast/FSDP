import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle, 
  Position,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion'; 
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride'; 

import WorkflowSidebar from './WorkflowSidebar';
import CreateNodeModal from './CreateNodeModal';
import { BASE_LIBRARY } from '../data/baseLibrary';

// ─── UTILS ─────────────────────────────────────────────────────────
const normalizeNode = (node, isBackendData = false) => {
  return {
    id: node.id || node._id || `node-${Math.random()}`,
    type: 'custom',
    data: {
      label: node.label || node.data?.label || 'Untitled',
      category: node.category || node.data?.category || 'CUSTOM',
      icon: node.icon || node.data?.icon || 'extension',
      content: node.content || node.data?.content || '',
      isUserNode: isBackendData,
      isConnected: false 
    }
  };
};

const parseContent = (content) => {
  if (!content) return { role: '', goal: '', rules: '' };
  const role = content.match(/ROLE:\s*(.*?)(?=\nGOAL:|$)/s)?.[1] || '';
  const goal = content.match(/GOAL:\s*(.*?)(?=\nRULES:|$)/s)?.[1] || '';
  const rules = content.match(/RULES:\s*(.*)/s)?.[1] || '';
  if (!role && !goal && !rules) return { role: '', goal: content, rules: '' };
  return { role: role.trim(), goal: goal.trim(), rules: rules.trim() };
};

// ─── 1. STANDARDIZED TOUR UI (Clean & Professional) ────────────────
const CustomTooltip = ({ index, step, tooltipProps, primaryProps, skipProps, isLastStep }) => (
  <div {...tooltipProps} className="bg-white w-85 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden relative z-99999">
    
    {/* Body */}
    <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
            {/* Step Badge */}
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-xs font-black ring-4 ring-violet-50">
                {index + 1}
            </span>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                {step.title}
            </h3>
        </div>
        
        {/* Content */}
        <div className="text-sm text-slate-600 font-medium leading-relaxed pl-1">
            {step.content}
        </div>
    </div>
    
    {/* Footer (Distinct Background) */}
    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
        {!isLastStep ? (
            <button {...skipProps} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 transition-colors">
                Skip Tutorial
            </button>
        ) : (
            <div></div> // Spacer to keep layout if skip is hidden
        )}

        {/* Action Button */}
        {!step.hideFooter && (
            <button 
                {...primaryProps} 
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-violet-600 shadow-lg shadow-slate-200 hover:shadow-violet-200 transition-all transform active:scale-95"
            >
                {isLastStep ? 'Finish Setup' : (index === 0 ? "Let's Start" : 'Next Step')}
            </button>
        )}
        
        {/* Helper text for interactive steps */}
        {step.hideFooter && (
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider animate-pulse px-2">
                Perform action to continue...
            </span>
        )}
    </div>
  </div>
);

// ─── 2. TOUR STEPS ─────────────────────────────────────────────────
const TOUR_STEPS = [
    // STEP 0: Welcome
    {
        target: 'body',
        placement: 'center',
        title: 'Agent Builder Studio',
        content: (
            <div>
                <p className="mb-2">Welcome to your new workspace.</p>
                <p>This interactive guide will help you create your first AI Agent in <b>3 simple steps</b>.</p>
            </div>
        ),
        disableBeacon: true,
    },
    // STEP 1: Drag (Interactive)
    {
        target: '#tour-sidebar', 
        title: 'Step 1: Add Skills',
        content: (
            <div>
                <p className="mb-3">Your agent is empty right now. It needs capabilities.</p>
                <div className="bg-violet-50 text-violet-700 p-3 rounded-xl border border-violet-100 text-xs font-bold">
                    👉 Drag ANY node from this sidebar onto the canvas area.
                </div>
            </div>
        ),
        placement: 'right',
        hideFooter: true,
        spotlightClicks: true,
    },
    // STEP 2: Connect (Interactive)
    {
        target: '#tour-canvas', 
        title: 'Step 2: Connect Logic',
        content: (
            <div>
                <p className="mb-3">Nodes must be linked to flow data.</p>
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 text-xs font-bold">
                    👉 Drag a wire from the "Agent Persona" handle (dot) to your new node.
                </div>
            </div>
        ),
        placement: 'bottom-start', // Positioned carefully
        hideFooter: true,
        spotlightClicks: true,
    },
    // STEP 3: Right Click (Interactive)
    {
        target: '#tour-canvas',
        title: 'Step 3: Power Menu',
        content: (
            <div>
                <p className="mb-3">Access advanced tools quickly.</p>
                <div className="bg-slate-100 text-slate-700 p-3 rounded-xl border border-slate-200 text-xs font-bold">
                    👉 Right-click anywhere on the empty canvas background.
                </div>
            </div>
        ),
        placement: 'bottom-start',
        hideFooter: true,
        spotlightClicks: true,
    },
    // STEP 4: Menu Explained
    {
        target: 'body', 
        title: 'Quick Actions',
        content: 'Success! You can use this menu to "Reset View" if you get lost, or "Clear Canvas" to start over.',
        placement: 'center',
    },
    // STEP 5: Save
    {
        target: '#tour-save-agent',
        title: 'Save & Deploy',
        content: 'That\'s it! When you are happy with your workflow, click here to save your agent.',
        placement: 'bottom-end',
    }
];

// ─── NODE COMPONENT ────────────────────────────────────────────────
const InteractiveNode = ({ data, selected }) => {
  const isCore = data.category === 'CORE';
  const isDisconnected = !isCore && !data.isConnected;

  const getColor = (cat) => {
    switch(cat) {
      case 'IDENTITY': return { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-600', icon: 'face' };
      case 'CAPABILITY': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'handyman' };
      case 'KNOWLEDGE': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: 'database' };
      case 'LOGIC': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'style' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', icon: 'extension' };
    }
  };

  const style = isCore 
    ? { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-white', icon: 'smart_toy' } 
    : getColor(data.category);

  let borderClass = style.border;
  let ringClass = '';

  if (selected) {
    ringClass = 'ring-4 ring-violet-500/20 border-violet-500 shadow-xl';
  } else if (isDisconnected) {
    ringClass = 'ring-2 ring-red-500/10 border-red-400 border-dashed'; 
  } else if (!isCore) {
    ringClass = 'border-solid border-emerald-400/50 shadow-emerald-100'; 
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-2xl overflow-hidden w-60 max-w-[90vw] transition-all duration-300 border shadow-sm ${borderClass} ${ringClass}`}
    >
      {!isCore && <Handle type="target" position={Position.Left} className={`w-3! h-3! ${isDisconnected ? 'bg-red-400!' : 'bg-emerald-400!'}`} />}
      
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isCore ? 'bg-slate-900 border-slate-700' : style.bg + ' ' + (isDisconnected ? 'border-red-200' : style.border)}`}>
         <div className="flex items-center gap-2 overflow-hidden">
            <span className={`material-symbols-outlined text-lg ${isDisconnected ? 'text-red-500' : style.text} shrink-0`}>
                {isDisconnected ? 'link_off' : (data.icon || style.icon)}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDisconnected ? 'text-red-400' : style.text} truncate`}>
                {isDisconnected ? 'Disconnected' : (data.category || 'NODE')}
            </span>
         </div>
      </div>

      <div className={`p-4 ${isCore ? 'bg-slate-800 text-slate-200' : 'bg-white'}`}>
         <div className={`font-bold text-sm mb-2 truncate ${isCore ? 'text-white' : 'text-slate-700'}`}>{data.label}</div>
         <div className={`text-[11px] p-2.5 rounded-lg border leading-relaxed font-mono line-clamp-3 ${isCore ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
            {data.content || "No configuration..."}
         </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3! h-3! bg-violet-500!" />
    </motion.div>
  );
};

// ─── EDITOR LOGIC ──────────────────────────────────────────────────
let id = 1000;
const getId = () => `node_${id++}`;

const AgentWorkflowEditorContent = ({ onSave }) => {
  const reactFlowWrapper = useRef(null);
  const { project, fitView } = useReactFlow();
  
  const nodeTypes = useMemo(() => ({ custom: InteractiveNode, core: InteractiveNode, default: InteractiveNode }), []);
  
  const [library, setLibrary] = useState([]); 
  const [nodes, setNodes, onNodesChange] = useNodesState([{ id: 'core-1', type: 'core', position: { x: 400, y: 300 }, data: { label: 'Agent Persona', category: 'CORE', content: 'You are a helpful AI assistant.', icon: 'smart_toy' } }]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // ─── TOUR STATE ───
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const tourTransitionRef = useRef(false); 
  const interactiveStepsRef = useRef(new Set([1, 2, 3])); 

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // 1. TOUR START
  useEffect(() => {
    // 🚧 DEV MODE: Running every time. 
    // Uncomment localStorage block below for production.
    // const hasSeen = localStorage.getItem('hasSeenTutorial');
    // if (!hasSeen) {
        setTimeout(() => setRunTour(true), 1500); 
    // }
  }, []);

  const handleTourCallback = (data) => {
    const { status, action, index, type } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        setRunTour(false);
        setStepIndex(0);
        // localStorage.setItem('hasSeenTutorial', 'true');
    } else if (action === ACTIONS.NEXT && type === EVENTS.STEP_AFTER) {
        if (!interactiveStepsRef.current.has(index)) {
            setStepIndex(index + 1);
        }
    }
  };

  // ─── CONNECTION CHECKER ───
  useEffect(() => {
    const connectedNodeIds = new Set();
    edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
    });

    setNodes(prevNodes => prevNodes.map(node => {
        if (node.data.category === 'CORE') return node;
        const isConnected = connectedNodeIds.has(node.id);
        if (node.data.isConnected !== isConnected) {
            return { ...node, data: { ...node.data, isConnected: isConnected } };
        }
        return node;
    }));
  }, [edges, setNodes]);

  // ─── HANDLERS ───
  const handleClearCanvas = () => {
    if (window.confirm("Are you sure? This will remove all nodes except the main persona.")) {
        setNodes(nds => nds.filter(n => n.data.category === 'CORE'));
        setEdges([]);
        setContextMenu(null);
    }
  };

  const handleSelectAll = () => {
    setNodes((nds) => nds.map((node) => ({ ...node, selected: true })));
    setContextMenu(null);
  };

  const updateNodeContent = (nodeId, field, value) => {
    setNodes(nds => nds.map(n => {
        if (n.id !== nodeId) return n;
        const currentParts = parseContent(n.data.content);
        const newParts = { ...currentParts, [field]: value };
        const newContent = `ROLE: ${newParts.role}\nGOAL: ${newParts.goal}\nRULES: ${newParts.rules}`;
        return { ...n, data: { ...n.data, content: newContent } };
    }));
  };

  const handleSaveCustomNode = async (nodeData) => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    const isUpdate = editingNode !== null;
    const url = isUpdate ? `/users/nodes/${currentUserId}/${editingNode.id}` : '/users/nodes';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, nodeData })
      });

      if (res.ok) {
        const updatedList = await res.json();
        const safeUserNodes = updatedList.map(n => normalizeNode(n, true));
        const safeBase = BASE_LIBRARY.map(n => normalizeNode(n));
        setLibrary([...safeBase, ...safeUserNodes]);
        setIsModalOpen(false);
        setEditingNode(null);
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteCustomNode = async (nodeId) => {
    if(!window.confirm("Delete this node?")) return;
    const currentUserId = localStorage.getItem('userId');
    try {
        const res = await fetch(`/users/nodes/${currentUserId}/${nodeId}`, { method: 'DELETE' });
        if(res.ok) {
            const updatedList = await res.json();
            const safeUserNodes = updatedList.map(n => normalizeNode(n, true));
            const safeBase = BASE_LIBRARY.map(n => normalizeNode(n));
            setLibrary([...safeBase, ...safeUserNodes]);
        }
    } catch (e) { console.error(e); }
  };
  
  const spawnNode = (nodeData, x, y) => {
    const position = project({ x, y });
    const newNode = {
      id: getId(),
      type: 'custom',
      position,
      data: {
        label: nodeData.label || nodeData.data?.label,
        category: nodeData.category || nodeData.data?.category,
        content: nodeData.content || nodeData.data?.content,
        icon: nodeData.icon || nodeData.data?.icon,
        isConnected: false
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setContextMenu(null);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const fetchLibrary = async () => {
      const safeBase = (BASE_LIBRARY || []).map(n => normalizeNode(n));
      let combinedLibrary = [...safeBase];
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId) {
        try {
          const res = await fetch(`/users/profile?userId=${currentUserId}`);
          if (res.ok) {
            const userData = await res.json();
            combinedLibrary = [...combinedLibrary, ...(userData.customNodes || []).map(n => normalizeNode(n, true))];
          }
        } catch (error) { console.error(error); }
      }
      setLibrary(combinedLibrary);
    };
    fetchLibrary();
  }, []);

  // ─── TRIGGERS ───
  
  const onConnect = useCallback((params) => {
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, eds));
      if (runTour && stepIndex === 2 && !tourTransitionRef.current) {
          tourTransitionRef.current = true;
          setTimeout(() => {
            setStepIndex(3);
            tourTransitionRef.current = false;
          }, 500); 
      }
  }, [setEdges, runTour, stepIndex]);

  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const dataString = event.dataTransfer.getData('application/data');
    if (!dataString) return;
    const data = JSON.parse(dataString);
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    spawnNode(data, event.clientX - bounds.left, event.clientY - bounds.top);
    
    if (runTour && stepIndex === 1 && !tourTransitionRef.current) {
         tourTransitionRef.current = true;
         setTimeout(() => {
           setStepIndex(2);
           tourTransitionRef.current = false;
         }, 300);
    }
  }, [project, setNodes, runTour, stepIndex]);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    setContextMenu({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    
    if (runTour && stepIndex === 3 && !tourTransitionRef.current) {
        tourTransitionRef.current = true;
        setTimeout(() => {
          setStepIndex(4);
          tourTransitionRef.current = false;
        }, 100);
    }
  }, [runTour, stepIndex]);

  return (
    <div className="flex flex-col md:flex-row h-[85vh] w-full border border-slate-200 rounded-3xl bg-[#FFFDF5] overflow-hidden shadow-2xl relative">
      
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        stepIndex={stepIndex}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        callback={handleTourCallback}
        tooltipComponent={CustomTooltip}
        disableOverlayClose={true}
        spotlightClicks={true}
        spotlightPadding={10}
        hideCloseButton={true}
        styles={{
            options: {
                zIndex: 10000,
                overlayColor: 'rgba(0, 0, 0, 0.2)',
            }
        }}
      />

      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden absolute top-4 left-4 z-50 bg-white p-2 rounded-xl shadow-lg border border-slate-200 text-slate-600">
        <span className="material-symbols-outlined">{isSidebarOpen ? 'close' : 'menu'}</span>
      </button>

      <div id="tour-sidebar" className={`fixed inset-y-0 left-0 z-40 w-72 bg-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:inset-auto md:h-full md:w-72 md:shrink-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'}`}>
        <WorkflowSidebar availableNodes={library} onCreateNode={() => { setEditingNode(null); setIsModalOpen(true); }} onEditNode={(node) => { setEditingNode(node); setIsModalOpen(true); }} onDeleteNode={(node) => handleDeleteCustomNode(node.id)} />
      </div>

      <div id="tour-canvas" className="flex-1 h-full relative bg-slate-50 min-w-0" ref={reactFlowWrapper}>
        
        <div id="tour-save-agent" className="absolute top-4 right-4 z-10 hidden md:block">
             <button onClick={() => onSave && onSave({ visual: { nodes, edges } })} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all">
                <span className="material-symbols-outlined text-sm">save</span> Save Agent
             </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, n) => { setSelectedNodeId(n.id); setContextMenu(null); }}
          onPaneClick={() => { setSelectedNodeId(null); setContextMenu(null); }}
          onPaneContextMenu={onPaneContextMenu}
          fitView
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#cbd5e1" gap={24} size={1} />
          <Controls className="bg-white! border-none! shadow-lg! rounded-xl! m-4! text-slate-600! hidden md:flex" />
        </ReactFlow>

        <AnimatePresence>
        {contextMenu && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ top: contextMenu.y, left: contextMenu.x }} className="absolute z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 min-w-50">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canvas Actions</div>
                <button onClick={() => setIsModalOpen(true)} className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-600 rounded-lg flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-lg">add_circle</span> New Node
                </button>
                <button onClick={() => { fitView({ duration: 500 }); setContextMenu(null); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-lg">center_focus_strong</span> Reset View
                </button>
                <button onClick={handleSelectAll} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-lg">select_all</span> Select All
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button onClick={handleClearCanvas} className="w-full text-left px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-lg">delete_sweep</span> Clear Canvas
                </button>
            </motion.div>
        )}
        </AnimatePresence>

        <CreateNodeModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingNode(null); }} onSave={handleSaveCustomNode} initialData={editingNode ? { ...editingNode.data, id: editingNode.id } : null} />

        <AnimatePresence>
        {selectedNode && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="absolute bottom-0 left-0 w-full rounded-t-3xl border-t border-slate-200 md:top-6 md:right-6 md:left-auto md:bottom-auto md:w-80 md:rounded-3xl md:border md:border-white/50 bg-white/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden max-h-[60vh] md:max-h-none flex flex-col">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">settings</span><span className="text-xs font-bold uppercase tracking-wider">Settings</span></div>
                    <button onClick={() => setSelectedNodeId(null)} className="hover:text-violet-300 p-1">✕</button>
                </div>
                
                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Label</label>
                        <input className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 outline-none font-bold text-slate-700" value={selectedNode.data.label} onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: e.target.value } } : n))} />
                    </div>
                    <div className="h-px bg-slate-100 my-1"></div>
                    {(() => {
                        const { role, goal, rules } = parseContent(selectedNode.data.content);
                        return (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 items-center gap-1"><span className="material-symbols-outlined text-[10px]">person</span> Role</label>
                                    <input className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 text-slate-600" placeholder="e.g. Helpful Assistant" value={role} onChange={(e) => updateNodeContent(selectedNodeId, 'role', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 items-center gap-1"><span className="material-symbols-outlined text-[10px]">flag</span> Goal</label>
                                    <textarea rows="2" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 text-slate-600 resize-none" placeholder="What should this agent do?" value={goal} onChange={(e) => updateNodeContent(selectedNodeId, 'goal', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 items-center gap-1"><span className="material-symbols-outlined text-[10px]">gavel</span> Rules</label>
                                    <textarea rows="2" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-violet-400 text-slate-600 resize-none" placeholder="Constraints or style guides..." value={rules} onChange={(e) => updateNodeContent(selectedNodeId, 'rules', e.target.value)} />
                                </div>
                            </>
                        );
                    })()}
                    {selectedNode.data.category !== 'CORE' && (
                        <div className="pt-2">
                            <button onClick={() => { setNodes(nds => nds.filter(n => n.id !== selectedNodeId)); setSelectedNodeId(null); }} className="w-full py-3 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <span className="material-symbols-outlined text-sm">delete</span> Delete Node
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AgentWorkflowEditor = (props) => (
  <ReactFlowProvider>
    <AgentWorkflowEditorContent {...props} />
  </ReactFlowProvider>
);

export default AgentWorkflowEditor;