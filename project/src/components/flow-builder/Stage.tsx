import { useFlowStore } from '@/store/flowStore';
import { FlowCanvas } from './FlowCanvas';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Plus } from 'lucide-react';

export function Stage() {
  const { flowData, addNewScreen } = useFlowStore();
  
  // If no screens exist at all
  if (flowData.screens.length === 0) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="mb-4">
            <Smartphone className="h-16 w-16 mx-auto text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Building Your Flow
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first screen to start building your WhatsApp Flow. Add components by dragging them from the palette.
          </p>
          <Button onClick={addNewScreen} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create First Screen
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <FlowCanvas />
    </div>
  );
}