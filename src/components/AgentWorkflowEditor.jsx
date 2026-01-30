import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle, 
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion'; 
import WorkflowSidebar from './WorkflowSidebar';

// --- STYLING (The "Sleek" Theme Update) ---
const THEME = {
    bg: '#0f172a',          // Dark Slate
    grid: '#334155',        // Slate 700
    accent: '#3b82f6',      // Blue 500
    nodeBg: '#1e293b',      // Slate 800
    textMain: '#f8fafc',    // Slate 50
    textLight: '#94a3b8'    // Slate 400
};

// --- CUSTOM NODE ---
const SleekNode = ({ data, selected }) => {
  const isCore = data.category === 'CORE';
  return (
    <div className={`
      relative rounded-xl transition-all duration-200 
      ${selected 
        ? 'border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] bg-slate-800' 
        : 'border border-slate-700 bg-slate-900 hover:border-blue-400'
      } 
      min-w-[200px] overflow-hidden backdrop-blur-md
    `}>
      {!isCore && <Handle type="target" position={Position.Left} className="w-3! h-3! bg-blue-500! border-2! border-slate-900!" />}
      
      <div className={`px-4 py-2 border-b border-slate-700 flex items-center justify-between ${isCore ? 'bg-blue-900/30' : 'bg-slate-800/50'}`}>
         <span className={`text-[10px] font-bold uppercase tracking-widest ${isCore ? 'text-blue-400' : 'text-slate-400'}`}>
            {data.category || 'MODULE'}
         </span>
         {isCore && <span className="material-symbols-outlined text-[14px] text-blue-400">hub</span>}
      </div>

      <div className="p-3">
         <div className="font-bold text-sm text-slate-100 mb-1">{data.label}</div>
         <div className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded truncate">
            {data.content || "Configured"}
         </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3! h-3! bg-blue-500! border-2! border-slate-900!" />
    </div>
  );
};

let id = 100;
const getId = () => `node_${id++}`;

const AgentWorkflowEditorContent = ({ onSave }) => {
  const reactFlowWrapper = useRef(null);
  const nodeTypes = useMemo(() => ({ core: SleekNode, trait: SleekNode, default: SleekNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    { 
        id: 'core-1', 
        type: 'core', 
        data: { label: 'Agent Persona', category: 'CORE', content: 'Base Identity' }, 
        position: { x: 400, y: 300 } 
    }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // --- 🛡️ SUPERVISOR VALIDATION LOGIC ---
  const validateGraph = useCallback(() => {
      // 1. Detect Detached Nodes (Islands)
      const connectedIds = new Set();
      edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
      
      const detachedNodes = nodes.filter(n => n.type !== 'core' && !connectedIds.has(n.id));
      
      if (detachedNodes.length > 0) {
          const names = detachedNodes.map(n => n.data.label).join(", ");
          // Signal Ada
          window.dispatchEvent(new CustomEvent('ada:supervisor', { 
              detail: { type: 'WARNING', message: `Warning: ${names} is disconnected. Logic will be ignored.` } 
          }));
      }
  }, [nodes, edges]);

  // Run validation 2 seconds after user stops editing (debounce)
  useEffect(() => {
      const timer = setTimeout(validateGraph, 2000);
      return () => clearTimeout(timer);
  }, [nodes, edges, validateGraph]);

  // Sync with Parent
  useEffect(() => {
    if (onSave) onSave({ visual: { nodes, edges } });
  }, [nodes, edges, onSave]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: THEME.accent } }, eds)), [setEdges]);

  const onDrop = useCallback((event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
            label: event.dataTransfer.getData('application/label'), 
            content: event.dataTransfer.getData('application/desc'),
            category: event.dataTransfer.getData('application/category')
        },
      };
      setNodes((nds) => nds.concat(newNode));
      setIsSidebarOpen(false);
  }, [reactFlowInstance, setNodes]);

  const deleteNode = () => {
    if (selectedNode?.type === 'core') {
        window.dispatchEvent(new CustomEvent('ada:supervisor', { 
            detail: { type: 'CRITICAL', message: "Critical Error: Do not delete the Core Node." } 
        }));
        return;
    }
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const updateNodeLabel = (val) => {
    setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: val } } : n));
  };

  return (
    <div className="flex h-[800px] w-full border border-slate-800 rounded-3xl bg-slate-950 overflow-hidden shadow-2xl relative">
      <WorkflowSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onInit={setReactFlowInstance}
          onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
          nodeTypes={nodeTypes}
          onNodeClick={(e, n) => setSelectedNodeId(n.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
        >
          <Background color={THEME.grid} gap={20} size={1} />
          <Controls className="bg-slate-800! border-slate-700! fill-slate-400!" />
        </ReactFlow>

        <button onClick={() => setIsSidebarOpen(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-10 transition-colors">
            <span className="material-symbols-outlined text-2xl">add</span>
        </button>

        <AnimatePresence>
        {selectedNode && (
            <motion.div 
                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}
                className="absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl z-20 overflow-hidden shadow-2xl"
            >
                <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-400 uppercase">{selectedNode.data.category}</span>
                    <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Node Label</label>
                        <input className="modern-input text-white bg-slate-950 border-slate-700" value={selectedNode.data.label} onChange={(e) => updateNodeLabel(e.target.value)} />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-400 mb-1">Content / Config</label>
                        <textarea rows="6" className="modern-input text-white bg-slate-950 border-slate-700" value={selectedNode.data.content || ''} onChange={(e) => setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, content: e.target.value } } : n))} />
                    </div>
                    <button onClick={deleteNode} className="w-full py-2 text-xs font-bold text-red-400 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors">Remove Node</button>
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