import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import WorkflowSidebar from './WorkFlowSidebar';

const initialNodes = [
  { 
    id: '1', 
    type: 'input', 
    data: { label: 'When User Chats' }, 
    position: { x: 250, y: 50 },
    style: { background: '#fff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px', width: 150 }
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

const AgentWorkflowEditorContent = ({ onSave }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // New State: Track which node is selected for editing
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodeName, setNodeName] = useState("");

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      // We grab the color passed from sidebar
      const colorClass = event.dataTransfer.getData('application/color'); 
      
      // Map tailwind classes to hex for inline styles (ReactFlow needs inline for now)
      // Or just keep it simple:
      const borderColor = colorClass.includes('blue') ? '#3b82f6' : 
                          colorClass.includes('purple') ? '#a855f7' : 
                          colorClass.includes('orange') ? '#f97316' : 
                          colorClass.includes('green') ? '#22c55e' : '#64748b';

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: label },
        style: { 
            background: '#fff', 
            border: `2px solid ${borderColor}`, 
            borderRadius: '10px', 
            padding: '10px',
            minWidth: '150px',
            fontWeight: 600,
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  // --- NEW: Handle Node Click ---
  const onNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
    setNodeName(node.data.label); // Pre-fill the input with current name
  };

  // --- NEW: Update Node Name ---
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setNodeName(newName);
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          // ReactFlow requires creating a new object for data to trigger re-render
          return { ...node, data: { ...node.data, label: newName } };
        }
        return node;
      })
    );
  };

  // Sync to parent
  React.useEffect(() => {
    if(onSave) onSave({ nodes, edges });
  }, [nodes, edges, onSave]);

  return (
    <div className="flex h-[600px] w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden shadow-inner relative">
      
      <WorkflowSidebar />

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
          onNodeClick={onNodeClick} // <--- Listen for clicks
          onPaneClick={() => setSelectedNodeId(null)} // Click empty space to close panel
          fitView
        >
          <Background gap={12} size={1} />
          <Controls />
          <MiniMap style={{ height: 100 }} zoomable pannable />
        </ReactFlow>

        {/* --- THE INSPECTOR PANEL --- */}
        {selectedNodeId && (
            <div className="absolute top-4 right-4 w-64 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-2 z-20">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm">Step Settings</h4>
                    <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Step Name</label>
                        <input 
                            type="text" 
                            className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                            value={nodeName}
                            onChange={handleNameChange}
                        />
                    </div>
                    
                    {/* Placeholder for future configuration */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Description (Optional)</label>
                        <textarea 
                            rows="2"
                            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700 resize-none"
                            placeholder="What should happen here?"
                        ></textarea>
                    </div>
                    
                    <button 
                        onClick={() => {
                            setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
                            setSelectedNodeId(null);
                        }}
                        className="w-full py-2 mt-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        Delete Step
                    </button>
                </div>
            </div>
        )}
        {/* --------------------------- */}
        
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