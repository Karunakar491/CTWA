import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InspectorPanel } from './flow-builder/InspectorPanel';
import { FlowCanvas } from './flow-builder/FlowCanvas';
import { ComponentPalette } from './flow-builder/ComponentPalette';
import { PreviewModal } from './flow-builder/PreviewModal';
import { JsonEditorModal } from './flow-builder/JsonEditorModal';
import { InteractivePreviewModal } from './flow-builder/InteractivePreviewModal';
import { Stage } from './flow-builder/Stage';
import { useFlowStore } from '@/store/flowStore';
import { Eye, Download, Play, Code, Edit2, Check, X } from 'lucide-react';

export function FlowBuilder() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  const [tempFlowName, setTempFlowName] = useState('');
  const { flowData, addComponentToScreen, updateFlowName } = useFlowStore();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'component') {
      const componentType = active.data.current.componentType;
      // TODO: Determine target screen based on drop location
      // Currently adds to the first screen for simplicity
      if (flowData.screens.length > 0) {
        addComponentToScreen(flowData.screens[0].id, componentType);
      }
    }
    
    setActiveId(null);
  };

  const handleExportJson = () => {
    const jsonString = JSON.stringify(flowData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-flow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartEditingFlowName = () => {
    setTempFlowName(flowData.name);
    setIsEditingFlowName(true);
  };

  const handleSaveFlowName = () => {
    if (tempFlowName.trim()) {
      updateFlowName(tempFlowName.trim());
    }
    setIsEditingFlowName(false);
  };

  const handleCancelEditingFlowName = () => {
    setIsEditingFlowName(false);
    setTempFlowName('');
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 bg-slate-50 h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isEditingFlowName ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={tempFlowName}
                  onChange={(e) => setTempFlowName(e.target.value)}
                  className="text-xl font-semibold border-none p-0 h-auto focus:ring-0 focus:border-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveFlowName();
                    } else if (e.key === 'Escape') {
                      handleCancelEditingFlowName();
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveFlowName}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEditingFlowName}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-gray-900">{flowData.name}</h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStartEditingFlowName}
                  className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <span className="text-sm text-gray-500">• {flowData.screens.length} screens</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {flowData.screens.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInteractivePreview(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Interactive Preview
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowJsonEditor(true)}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Edit as JSON
                </Button>
                
                <Button size="sm" onClick={handleExportJson}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Flow JSON
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Three-panel layout */}
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-81px)]">
          {/* PANEL 1: Component Palette */}
          <ResizablePanel 
            defaultSize={25} 
            minSize={15} 
            maxSize={35}
            collapsible
            collapsedSize={4}
          >
            <ComponentPalette />
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-gray-300 hover:bg-gray-400 transition-colors" />

          {/* PANEL 2: Center Stage */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <Stage />
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-gray-300 hover:bg-gray-400 transition-colors" />

          {/* PANEL 3: Right Inspector */}
          <ResizablePanel defaultSize={20} minSize={20} maxSize={50}>
            <div className="h-full bg-white border-l border-gray-200">
              <InspectorPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Preview Modal */}
        <PreviewModal 
          open={showPreview} 
          onOpenChange={setShowPreview}
        />

        {/* Interactive Preview Modal */}
        <InteractivePreviewModal 
          open={showInteractivePreview} 
          onOpenChange={setShowInteractivePreview}
        />

        {/* JSON Editor Modal */}
        <JsonEditorModal
          open={showJsonEditor}
          onOpenChange={setShowJsonEditor}
        />

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg opacity-90">
              <div className="font-medium text-sm text-gray-900">
                {activeId.replace('palette-', '').replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}