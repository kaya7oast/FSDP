import React, { useCallback, useRef, useState, useMemo } from 'react';
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

// --- STYLING: The Professional Cat Theme ---
const THEME = {
    bg: '#FFFDF5',          // Cream
    grid: '#E0D8C3',        // Darker Cream for dots
    accent: '#FFB74D',      // Cat Orange
    nodeBg: '#FFFFFF',
    textMain: '#4E342E',    // Dark Brown
    textLight: '#8D7F71'    // Muted Brown
};

// --- CUSTOM NODE ---
const CatNode = ({ data, selected }) => {
  const isCore = data.category === 'CORE';
  
  return (
    <div className={`
      relative bg-white rounded-2xl transition-all duration-200 
      ${selected 
        ? 'border-2 border-orange-400 ring-4 ring-orange-50 shadow-xl scale-105' 
        : 'border border-[#E0D8C3] shadow-sm hover:border-orange-300 hover:shadow-md'
      } 
      min-w-[200px] overflow-hidden
    `}>
      {/* Input Handle */}
      {!isCore && (
        <Handle type="target" position={Position.Left} className="w-3! h-3! bg-orange-100! border-2! border-orange-400! rounded-full!" />
      )}
      
      {/* Header */}
      <div className={`px-4 py-2 border-b border-[#F5F0E6] flex items-center justify-between ${isCore ? 'bg-[#4E342E]' : 'bg-white'}`}>
         <span className={`text-[10px] font-black uppercase tracking-widest ${isCore ? 'text-orange-400' : 'text-orange-500'}`}>
            {data.category || 'TRAIT'}
         </span>
         <span className={`material-symbols-outlined text-[14px] ${isCore ? 'text-white' : 'text-orange-200'}`}>pets</span>
      </div>

      {/* Body */}
      <div className="p-3">
         <div className="font-bold text-sm text-[#4E342E] mb-1">{data.label}</div>
         <div className="text-[10px] text-[#8D7F71] bg-[#F5F0E6] px-2 py-1 rounded-lg truncate">
            {data.content || "Default behavior"}
         </div>
      </div>

      {/* Output Handle */}
      <Handle type="source" position={Position.Right} className="w-3! h-3! bg-orange-400! border-2! border-white! rounded-full!" />
    </div>
  );
};

let id = 100;
const getId = () => `node_${id++}`;

const AgentWorkflowEditorContent = ({ onSave }) => {
  const reactFlowWrapper = useRef(null);
  const nodeTypes = useMemo(() => ({ core: CatNode, trait: CatNode, default: CatNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    { 
        id: 'core-1', 
        type: 'core', 
        data: { label: 'Agent Persona', category: 'CORE', content: 'You are a helpful AI assistant.' }, 
        position: { x: 400, y: 300 } 
    }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // =========================================================
  // 👇 THIS IS THE MISSING BRIDGE! 👇
  // This useEffect ensures that every time 'nodes' change, 
  // we update the parent 'AgentBuilder' immediately.
  // =========================================================
  React.useEffect(() => {
    if (onSave) {
      onSave({ visual: { nodes, edges } });
    }
  }, [nodes, edges, onSave]);
  // =========================================================

  const updateNodeContent = (newContent) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === selectedNodeId) return { ...n, data: { ...n.data, content: newContent } };
      return n;
    }));
  };

  const updateNodeLabel = (newLabel) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === selectedNodeId) return { ...n, data: { ...n.data, label: newLabel } };
      return n;
    }));
  };

  const deleteNode = () => {
    // Prevent deleting the Core Identity node
    if (selectedNode?.type === 'core' || selectedNode?.data?.category === 'CORE') {
        alert("You cannot delete the Core Identity node!");
        return;
    }
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: THEME.accent, strokeWidth: 2 } 
  }, eds)), [setEdges]);

  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  
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
      setSelectedNodeId(newNode.id);
      setIsSidebarOpen(false);
  }, [reactFlowInstance, setNodes]);

  const loadTemplate = (type) => {
    const center = { x: 400, y: 300 };
    setNodes([]); setEdges([]);
    setTimeout(() => {
        if(type === 'coding') {
            const core = { id: 't-1', type:'core', position: center, data: { label: 'Coding Buddy', category: 'CORE', content: 'You are an expert programmer.' }};
            const t1 = { id: 't-2', type:'trait', position: {x: center.x + 250, y: center.y - 100}, data: { label: 'Python', category: 'Knowledge', content: 'Expert in Python 3.' }};
            const t2 = { id: 't-3', type:'trait', position: {x: center.x + 250, y: center.y + 100}, data: { label: 'Code Block', category: 'Output', content: 'Always output code in markdown blocks.' }};
            setNodes([core, t1, t2]);
            setEdges([ { id: 'e1-2', source: 't-1', target: 't-2', animated: true, style: { stroke: THEME.accent } }, { id: 'e1-3', source: 't-1', target: 't-3', animated: true, style: { stroke: THEME.accent } } ]);
        } else if(type === 'therapy') {
            setNodes([{ id: 't-1', type:'core', position: center, data: { label: 'The Listener', category: 'CORE', content: 'You are an empathetic listener.' } }]);
        }
        setIsSidebarOpen(false);
    }, 50);
  };

  return (
    <div className="flex h-[800px] w-full border border-[#E0D8C3] rounded-3xl bg-[#FFFDF5] overflow-hidden shadow-2xl relative">
      <WorkflowSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLoadTemplate={loadTemplate}/>
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          onNodeClick={(e, n) => setSelectedNodeId(n.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
        >
          <Background color={THEME.grid} gap={20} size={2} />
          <Controls className="bg-white! border-none! shadow-md! rounded-lg! m-4! text-stone-600!" />
        </ReactFlow>

        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-[#4E342E] text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-orange-500 transition-colors">
            <span className="material-symbols-outlined text-2xl">add</span>
        </button>

        <AnimatePresence>
        {selectedNode && (
            <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                className="absolute top-4 right-4 w-72 bg-white/95 backdrop-blur shadow-xl border border-[#E0D8C3] rounded-2xl z-20 overflow-hidden"
            >
                <div className="bg-[#F5F0E6] p-3 border-b border-[#E0D8C3] flex justify-between items-center">
                    <span className="text-xs font-bold text-[#8D7F71] uppercase">{selectedNode.data.category}</span>
                    <button onClick={() => setSelectedNodeId(null)} className="text-[#8D7F71] hover:text-[#4E342E]">✕</button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#4E342E] mb-1">
                            {selectedNode.type === 'core' ? 'Agent Name' : 'Trait Name'}
                        </label>
                        <input 
                            className="w-full text-sm p-2 border border-[#E0D8C3] rounded-lg bg-white focus:border-orange-400 outline-none font-bold text-[#4E342E]"
                            value={selectedNode.data.label} 
                            onChange={(e) => updateNodeLabel(e.target.value)}
                        />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-[#4E342E] mb-1">Configuration / Prompt</label>
                        <textarea rows="6" className="w-full text-sm p-2 border border-[#E0D8C3] rounded-lg focus:border-orange-400 outline-none resize-none bg-white text-[#4E342E]" value={selectedNode.data.content || ''} onChange={(e) => updateNodeContent(e.target.value)} />
                    </div>
                    <button onClick={deleteNode} className="w-full py-2 text-xs font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-100">Remove Node</button>
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