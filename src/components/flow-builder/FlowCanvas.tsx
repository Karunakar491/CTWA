import { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
import { Plus, Eye } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

const nodeTypes = {
  screen: ScreenNode,
};

export function FlowCanvas() {
  const { flowData, addNewScreen, setActiveScreenId, activeScreenId } = useFlowStore();
  
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

  const handleScreenSelect = (screenId: string) => {
    setActiveScreenId(screenId);
    // Find the node and center it in view
    const targetNode = nodes.find(node => node.data.screenId === screenId);
    if (targetNode) {
      // You could implement smooth scrolling to the node here
      console.log('Centering screen:', screenId, targetNode.position);
    }
  };
  return (
    <div 
      ref={setNodeRef}
      className="h-full relative bg-gray-50"
    >
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 bg-white rounded-lg shadow-md p-2 border border-gray-200">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddScreen}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Screen
        </Button>
        
        {flowData.screens.length > 1 && (
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <Select
              value={activeScreenId || ''}
              onValueChange={handleScreenSelect}
            >
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="Navigate to screen..." />
              </SelectTrigger>
              <SelectContent>
                {flowData.screens.map((screen, index) => (
                  <SelectItem key={screen.id} value={screen.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{screen.title}</span>
                      <span className="text-xs text-gray-500 ml-2">Screen {index + 1}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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