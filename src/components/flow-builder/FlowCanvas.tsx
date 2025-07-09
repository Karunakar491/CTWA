import { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Plus, Eye, AlertTriangle, Info } from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';

const nodeTypes = {
  screen: ScreenNode,
};

export function FlowCanvas() {
  const { 
    flowData, 
    addNewScreen, 
    setActiveScreenId, 
    activeScreenId, 
    validationErrors,
    updateComponentNavigationTarget,
    addFlowConnection,
    removeFlowConnection
  } = useFlowStore();
  
  // Create nodes from screens
  const initialNodes: Node[] = flowData.screens.map((screen, index) => ({
    id: screen.id,
    type: 'screen',
    position: { x: 250 + (index * 400), y: 100 },
    data: { screenId: screen.id },
  }));

  // Create edges from flow connections and component navigation
  const initialEdges: Edge[] = [];
  
  // Add edges from component navigation
  flowData.screens.forEach(screen => {
    screen.data.forEach(component => {
      if (component.on_click_action?.next?.name && 
          (component.type === 'Button' || component.type === 'Footer')) {
        const targetScreenExists = flowData.screens.find(s => s.id === component.on_click_action?.next?.name);
        if (targetScreenExists) {
          initialEdges.push({
            id: `${component.id}-${component.on_click_action.next.name}`,
            source: screen.id,
            target: component.on_click_action.next.name,
            label: component.title || component.label || 'Navigate',
            style: { stroke: '#25D366', strokeWidth: 2 },
            animated: true,
          });
        }
      }
    });
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { setNodeRef } = useDroppable({
    id: 'flow-canvas',
  });

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.source !== params.target) {
        const newEdge = addEdge({
          ...params,
          id: `${params.source}-${params.target}`,
          style: { stroke: '#25D366', strokeWidth: 2 },
          animated: true,
        }, edges);
        
        setEdges(newEdge);
        
        // Update the flow data to reflect this connection
        // Find a button or footer in the source screen and update its navigation target
        const sourceScreen = flowData.screens.find(s => s.id === params.source);
        if (sourceScreen) {
          const navigableComponent = sourceScreen.data.find(c => 
            (c.type === 'Button' || c.type === 'Footer') && 
            (!c.on_click_action?.next?.name || c.on_click_action.next.name === '')
          );
          
          if (navigableComponent) {
            updateComponentNavigationTarget(navigableComponent.id, params.target);
          }
        }
      }
    },
    [edges, setEdges, flowData.screens, updateComponentNavigationTarget]
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
      position: { x: 250 + (nodes.length * 400), y: 100 },
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

  // Get flow-level validation errors
  const flowErrors = validationErrors.filter(error => 
    error.severity === 'warning' && error.originalMessage?.includes('Unreachable')
  );

  return (
    <div 
      ref={setNodeRef}
      className="h-full relative bg-gray-50"
    >
      {/* Flow-level validation alerts */}
      {flowErrors.length > 0 && (
        <div className="absolute top-4 right-4 z-20 w-80 space-y-2">
          {flowErrors.map((error, index) => (
            <Alert key={index} className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                {error.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

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

        {flowData.screens.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-gray-500 border-l pl-3">
            <Info className="h-3 w-3" />
            <span>Drag between screens to connect them</span>
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
        connectionLineStyle={{ stroke: '#25D366', strokeWidth: 2 }}
        defaultEdgeOptions={{
          style: { stroke: '#25D366', strokeWidth: 2 },
          animated: true,
        }}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}