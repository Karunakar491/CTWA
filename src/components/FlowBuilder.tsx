import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InspectorPanel } from './flow-builder/InspectorPanel';
import { ComponentPalette } from './flow-builder/ComponentPalette';
import { Stage } from './flow-builder/Stage';
import { StaticPreviewModal } from './flow-builder/StaticPreviewModal';
import { InteractivePreviewModal } from './flow-builder/InteractivePreviewModal';
import { JsonEditorModal } from './flow-builder/JsonEditorModal';
import { useFlowStore } from '@/store/flowStore';
import { Download, Code, Edit2, Check, X, Upload, Play, Globe, AlertTriangle, Eye, CheckCircle } from 'lucide-react';
import type { ApiLogEntry } from './flow-builder/JsonEditorModal';
import { useToast } from '@/hooks/use-toast';
import { deployFlowToMetaAPI, publishFlow } from '@/services/metaApi';

export function FlowBuilder() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [showStaticPreview, setShowStaticPreview] = useState(false);
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  const [tempFlowName, setTempFlowName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deployedFlowId, setDeployedFlowId] = useState<string | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  
  const { 
    flowData, 
    addComponentToScreen, 
    updateFlowName, 
    validateFlow, 
    clearApiErrors, 
    validationErrors,
    reorderComponentsInScreen
  } = useFlowStore();
  const { toast } = useToast();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for better visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'component') {
      const componentType = active.data.current.componentType;
      
      // Check if dropping on a screen drop area
      if (over.id && typeof over.id === 'string' && over.id.startsWith('screen-drop-area-')) {
        const screenId = over.id.replace('screen-drop-area-', '');
        addComponentToScreen(screenId, componentType);
        
        toast({
          title: "Component Added",
          description: `${componentType} added to screen successfully.`,
        });
      }
      // Check if dropping on the general canvas (add to first screen for backward compatibility)
      else if (over.id === 'flow-canvas' && flowData.screens.length > 0) {
        addComponentToScreen(flowData.screens[0].id, componentType);
        
        toast({
          title: "Component Added",
          description: `${componentType} added to first screen.`,
        });
      }
    }
    // Handle component reordering within screens
    else if (active.id !== over?.id && over?.id) {
      // Find which screen contains these components
      for (const screen of flowData.screens) {
        const activeComponent = screen.data.find(c => c.id === active.id);
        const overComponent = screen.data.find(c => c.id === over.id);
        
        if (activeComponent && overComponent) {
          const componentIds = screen.data.map(c => c.id);
          const oldIndex = componentIds.indexOf(active.id as string);
          const newIndex = componentIds.indexOf(over.id as string);
          
          const newOrder = [...componentIds];
          const [removed] = newOrder.splice(oldIndex, 1);
          newOrder.splice(newIndex, 0, removed);
          
          reorderComponentsInScreen(screen.id, newOrder);
          break;
        }
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
    a.download = `${flowData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flow.json`;
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

  const handleDeployFlow = async () => {
    // Check for validation errors first
    const errorCount = validationErrors.filter(e => e.severity === 'error').length;
    if (errorCount > 0) {
      toast({
        title: "Cannot Deploy Flow",
        description: `Please fix ${errorCount} validation error${errorCount !== 1 ? 's' : ''} before deploying.`,
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    clearApiErrors();
    
    const startTime = Date.now();
    
    // Log the request
    const requestLog: Omit<ApiLogEntry, 'id' | 'timestamp'> = {
      type: 'request',
      method: 'POST',
      endpoint: '/flows',
      data: {
        name: flowData.name,
        categories: ["OTHER"],
        flow_json: flowData,
        publish: true
      }
    };
    
    setApiLogs(prev => [...prev, {
      ...requestLog,
      id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    }]);
    
    try {
      const result = await deployFlowToMetaAPI(flowData.name, flowData);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        // Log successful response
        setApiLogs(prev => [...prev, {
          id: `res_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'response',
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            flowId: result.flowId,
            message: result.message
          },
          duration
        }]);
        
        setDeployedFlowId(result.flowId || null);
        toast({
          title: "Deployment Successful!",
          description: `Flow "${flowData.name}" has been deployed to WhatsApp Business API.`,
          variant: "default",
        });
      } else {
        // Log error response
        setApiLogs(prev => [...prev, {
          id: `err_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'error',
          status: 400,
          statusText: 'Bad Request',
          data: {
            success: false,
            message: result.message,
            errors: result.errors
          },
          duration
        }]);
        
        // Handle deployment errors
        if (result.errors && result.errors.length > 0) {
          // Pass Meta API errors to validation system for highlighting
          validateFlow(result.errors);
          
          toast({
            title: "Deployment Failed",
            description: result.message || "Please fix the highlighted errors and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Deployment Failed",
            description: result.message || "Unknown error occurred during deployment.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log network error
      setApiLogs(prev => [...prev, {
        id: `net_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        status: 0,
        statusText: 'Network Error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown network error'
        },
        duration
      }]);
      
      console.error('Deployment error:', error);
      toast({
        title: "Deployment Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePublishFlow = async () => {
    if (!deployedFlowId) {
      toast({
        title: "Cannot Publish",
        description: "Please deploy the flow first before publishing.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    const startTime = Date.now();
    
    // Log the publish request
    setApiLogs(prev => [...prev, {
      id: `pub_req_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'request',
      method: 'POST',
      endpoint: `/flows/${deployedFlowId}/publish`,
      data: { flowId: deployedFlowId }
    }]);
    
    try {
      const success = await publishFlow(deployedFlowId);
      const duration = Date.now() - startTime;
      
      if (success) {
        // Log successful publish
        setApiLogs(prev => [...prev, {
          id: `pub_res_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'response',
          status: 200,
          statusText: 'OK',
          data: { success: true, published: true },
          duration
        }]);
        
        toast({
          title: "Flow Published!",
          description: `Flow "${flowData.name}" is now live and available to users.`,
          variant: "default",
        });
      } else {
        // Log publish error
        setApiLogs(prev => [...prev, {
          id: `pub_err_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'error',
          status: 400,
          statusText: 'Bad Request',
          data: { success: false, error: 'Failed to publish flow' },
          duration
        }]);
        
        toast({
          title: "Publishing Failed",
          description: "Failed to publish the flow. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log network error
      setApiLogs(prev => [...prev, {
        id: `pub_net_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        status: 0,
        statusText: 'Network Error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        duration
      }]);
      
      console.error('Publishing error:', error);
      toast({
        title: "Publishing Error",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <DndContext 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex-1 bg-slate-50 h-screen overflow-hidden">
        {/* Enhanced Header */}
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
                {/* Enhanced Validation Status Indicator */}
                {errorCount > 0 && (
                  <Alert className="p-2 border-red-200 bg-red-50 w-auto">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <AlertDescription className="text-xs text-red-700 font-medium ml-1">
                      {errorCount} error{errorCount !== 1 ? 's' : ''}
                      {warningCount > 0 && `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
                    </AlertDescription>
                  </Alert>
                )}

                {errorCount === 0 && warningCount > 0 && (
                  <Alert className="p-2 border-orange-200 bg-orange-50 w-auto">
                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                    <AlertDescription className="text-xs text-orange-700 font-medium ml-1">
                      {warningCount} warning{warningCount !== 1 ? 's' : ''}
                    </AlertDescription>
                  </Alert>
                )}

                {errorCount === 0 && warningCount === 0 && (
                  <Alert className="p-2 border-green-200 bg-green-50 w-auto">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <AlertDescription className="text-xs text-green-700 font-medium ml-1">
                      Flow is valid
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowStaticPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Static Preview
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
                
                <Button 
                  size="sm" 
                  onClick={handleDeployFlow}
                  disabled={isDeploying || errorCount > 0}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isDeploying ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Deploy
                    </>
                  )}
                </Button>
                
                {deployedFlowId && (
                  <Button 
                    size="sm" 
                    onClick={handlePublishFlow}
                    disabled={isPublishing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isPublishing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                )}
                
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
          <ResizablePanel defaultSize={40} minSize={30}>
            <Stage />
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-gray-300 hover:bg-gray-400 transition-colors" />

          {/* PANEL 3: Right Inspector */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <div className="h-full bg-white border-l border-gray-200">
              <InspectorPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Static Preview Modal */}
        <StaticPreviewModal 
          open={showStaticPreview} 
          onOpenChange={setShowStaticPreview}
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
          initialApiLogs={apiLogs}
        />

        {/* Enhanced Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-white border-2 border-blue-300 rounded-lg shadow-xl opacity-90 transform rotate-3">
              <div className="font-medium text-sm text-gray-900">
                {activeId.replace('palette-', '').replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Drop on a screen to add
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}