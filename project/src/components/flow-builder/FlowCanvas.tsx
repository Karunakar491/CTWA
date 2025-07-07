import { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ScreenNode } from './ScreenNode';
import { useFlowStore } from '@/store/flowStore';

const nodeTypes = {
  screen: ScreenNode,
};

export function FlowCanvas() {
  const { flowData, addNewScreen } = useFlowStore();
  
  // Create nodes from screens
  const initialNodes: Node[] = flowData.screens.map((screen, index) => ({
    id: screen.id,
    type: 'screen',
    position: { x: 250 + (index * 350), y: 100 },
    data: { screenId: screen.id },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { setNodeRef } = useDroppable({
    id: 'flow-canvas',
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes when flow data changes
  const updatedNodes = nodes.map(node => {
    const screen = flowData.screens.find(s => s.id === node.data.screenId);
    return {
      ...node,
      data: { ...node.data, screen }
    };
  });

  const handleAddScreen = () => {
    const newScreen = addNewScreen();
    const newNode: Node = {
      id: newScreen.id,
      type: 'screen',
      position: { x: 250 + (nodes.length * 350), y: 100 },
      data: { screenId: newScreen.id },
    };
    setNodes(nds => [...nds, newNode]);
  };

  return (
    <div 
      ref={setNodeRef}
      className="h-full relative bg-gray-50"
    >
      <div className="absolute top-4 left-4 z-10 space-x-2">
        <button
          onClick={handleAddScreen}
          className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Screen
        </button>
      </div>
      
      <ReactFlow
        nodes={updatedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}