import React, { useCallback, useRef, useState, useMemo } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle, // Import Handle
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion'; 
import WorkflowSidebar from './WorkflowSidebar';

// --- 1. THE CAT NODE (Custom Component) ---
// This replaces the default grey box with a cute card + Yarn Handles
const CatNode = ({ data, selected }) => {
  return (
    <div className={`relative bg-white rounded-3xl border-2 transition-all ${selected ? 'border-orange-400 shadow-lg shadow-orange-100' : 'border-stone-100 shadow-sm'} p-4 min-w-[200px]`}>
       {/* Top "Ear" Decorations */}
       <div className="absolute -top-3 left-4 w-4 h-4 bg-white border-l-2 border-t-2 border-stone-100 transform rotate-45"></div>
       <div className="absolute -top-3 right-4 w-4 h-4 bg-white border-r-2 border-t-2 border-stone-100 transform -rotate-45"></div>

      {/* Inputs (Yarn Ball Style) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-4 !h-4 !bg-orange-300 !border-2 !border-white !rounded-full shadow-sm" 
      />
      
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 rounded-full text-2xl">
           {/* Dynamic Icon based on label */}
           {data.label.includes('Identity') ? '🦁' : 
            data.label.includes('Rule') ? '😾' : 
            data.label.includes('Backstory') ? '📜' : '🐱'}
        </div>
        <div>
           <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">{data.category || 'THOUGHT'}</div>
           <div className="font-bold text-stone-700">{data.label}</div>
        </div>
      </div>

      {/* Content Preview */}
      {data.content && (
        <div className="mt-2 text-[10px] text-stone-500 bg-stone-50 p-2 rounded-xl italic truncate">
          "{data.content}"
        </div>
      )}

      {/* Outputs (Yarn Ball Style) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-4 !h-4 !bg-orange-400 !border-2 !border-white !rounded-full shadow-sm" 
      />
    </div>
  );
};

// ... (Rest of your imports and setup)

let id = 0;
const getId = () => `meow_${id++}`;

const AgentWorkflowEditorContent = ({ onSave }) => {
  const reactFlowWrapper = useRef(null);
  // Tell ReactFlow to use our Custom CatNode
  const nodeTypes = useMemo(() => ({ 
      core: CatNode, 
      context: CatNode, 
      default: CatNode 
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    { 
        id: 'core-1', 
        type: 'core', 
        data: { label: 'Agent Identity', category: 'CORE', content: 'You are a helpful assistant.' }, 
        position: { x: 300, y: 200 } 
    }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#fb923c', strokeWidth: 3, strokeDasharray: '5,5' } // Dashed "Yarn" Line
  }, eds)), [setEdges]);

  // Drag and Drop Logic (Same as before)
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  
  const onDrop = useCallback((event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const position = reactFlowInstance.project({ x: event.clientX, y: event.clientY });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
            label: event.dataTransfer.getData('application/label'), 
            content: event.dataTransfer.getData('application/content'),
            category: type === 'core' ? 'CORE' : 'TRAIT'
        },
      };
      setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  // Save Logic
  React.useEffect(() => {
    if(onSave && nodes.length > 0) {
        const context = nodes.map(n => n.data.content).join('\n\n');
        onSave({ visual: { nodes, edges }, compiledPrompt: context });
    }
  }, [nodes, edges, onSave]);

  return (
    <div className="flex h-[600px] w-full border-4 border-white rounded-[2rem] bg-orange-50 overflow-hidden shadow-2xl relative">
      <WorkflowSidebar />

      <div className="flex-1 h-full relative cursor-crosshair" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes} // <--- Register Custom Nodes
          onNodeClick={(e, n) => setSelectedNodeId(n.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
        >
          <Background color="#fdba74" gap={25} size={3} variant="dots" />
          <Controls className="!bg-white !border-none !shadow-xl !rounded-2xl !m-4" />
          
          {/* --- 2. THE SLEEPING MASCOT (Empty State) --- */}
          {nodes.length < 2 && (
             <div className="absolute bottom-10 right-10 pointer-events-none opacity-50 flex flex-col items-center">
                <span className="text-6xl animate-bounce">💤</span>
                <span className="text-6xl">🐈</span>
                <p className="text-orange-400 font-bold mt-2 bg-white/80 px-3 py-1 rounded-full">Drag toys to wake me up!</p>
             </div>
          )}
        </ReactFlow>
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