import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFlowStore, FlowScreen } from '@/store/flowStore';
import { 
  Eye, 
  Play, 
  Settings, 
  Plus, 
  Trash2, 
  Copy, 
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Edit2,
  X
} from 'lucide-react';
import { InteractivePreviewModal } from './InteractivePreviewModal';
import { StaticPreviewModal } from './StaticPreviewModal';
import { cn } from '@/lib/utils';

interface ScreenNodeData {
  screenId: string;
  screen?: FlowScreen;
}

export const ScreenNode = memo(({ data, selected }: NodeProps<ScreenNodeData>) => {
  const { 
    flowData, 
    setActiveScreenId, 
    setSelectedElementId, 
    deleteScreen, 
    duplicateScreen,
    validationErrors,
    componentErrorStatus
  } = useFlowStore();
  
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);
  const [showStaticPreview, setShowStaticPreview] = useState(false);
  
  const screen = flowData.screens.find(s => s.id === data.screenId);
  
  if (!screen) {
    return (
      <Card className="w-80 border-red-300 bg-red-50">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 text-sm">Screen not found</p>
        </CardContent>
      </Card>
    );
  }

  const { setNodeRef } = useDroppable({
    id: `screen-drop-area-${screen.id}`,
  });

  // Check for validation errors on this screen
  const screenErrors = validationErrors.filter(error => 
    error.path.includes(`/screens/${flowData.screens.indexOf(screen)}/`)
  );
  const hasErrors = screenErrors.some(e => e.severity === 'error');
  const hasWarnings = screenErrors.some(e => e.severity === 'warning');

  const handleScreenClick = () => {
    setActiveScreenId(screen.id);
    setSelectedElementId(screen.id);
  };

  const handleDeleteScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (flowData.screens.length > 1) {
      deleteScreen(screen.id);
    }
  };

  const handleDuplicateScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateScreen(screen.id);
  };

  const handleInteractivePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInteractivePreview(true);
  };

  const handleStaticPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStaticPreview(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          "w-80 transition-all duration-200",
          selected ? "ring-2 ring-blue-500 ring-offset-2" : "",
          hasErrors ? "ring-2 ring-red-500 ring-offset-1" : "",
          hasWarnings && !hasErrors ? "ring-2 ring-orange-500 ring-offset-1" : ""
        )}
        onClick={handleScreenClick}
      >
        <Card className={cn(
          "cursor-pointer hover:shadow-lg transition-all duration-200",
          selected ? "border-blue-500 shadow-lg" : "border-gray-200",
          hasErrors ? "border-red-500 bg-red-50" : "",
          hasWarnings && !hasErrors ? "border-orange-500 bg-orange-50" : ""
        )}>
          {/* Connection Handles */}
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 bg-green-500 border-2 border-white"
            style={{ right: -6 }}
          />
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 bg-blue-500 border-2 border-white"
            style={{ left: -6 }}
          />

          {/* Header */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-gray-600" />
                <CardTitle className="text-sm font-medium truncate">
                  {screen.title}
                </CardTitle>
                {hasErrors && (
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                {hasWarnings && !hasErrors && (
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleInteractivePreview}
                  title="Interactive Preview"
                >
                  <Play className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleStaticPreview}
                  title="Static Preview"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {screen.data.length} component{screen.data.length !== 1 ? 's' : ''}
              </Badge>
              
              {screen.terminal && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Terminal
                </Badge>
              )}
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="pt-0">
            {/* Component List */}
            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
              {screen.data.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Plus className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs">Drop components here</p>
                </div>
              ) : (
                screen.data.map((component, index) => {
                  const hasComponentError = componentErrorStatus.has(component.id);
                  return (
                    <div
                      key={component.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded border text-xs",
                        hasComponentError 
                          ? "border-red-300 bg-red-50 text-red-700" 
                          : "border-gray-200 bg-gray-50"
                      )}
                    >
                      <span className="truncate flex-1">
                        {index + 1}. {component.type}
                      </span>
                      {hasComponentError && (
                        <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Error Messages */}
            {screenErrors.length > 0 && (
              <div className="space-y-1 mb-3">
                {screenErrors.slice(0, 2).map((error, index) => (
                  <Alert key={index} className={cn(
                    "py-2 px-3",
                    error.severity === 'error' ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"
                  )}>
                    <AlertDescription className={cn(
                      "text-xs",
                      error.severity === 'error' ? "text-red-700" : "text-orange-700"
                    )}>
                      {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
                {screenErrors.length > 2 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{screenErrors.length - 2} more issue{screenErrors.length - 2 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleInteractivePreview}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Test
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleStaticPreview}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleDuplicateScreen}
                  title="Duplicate screen"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                {flowData.screens.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDeleteScreen}
                    title="Delete screen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modals */}
      <InteractivePreviewModal
        open={showInteractivePreview}
        onOpenChange={setShowInteractivePreview}
      />
      
      <StaticPreviewModal
        open={showStaticPreview}
        onOpenChange={setShowStaticPreview}
      />
    </>
  );
});

ScreenNode.displayName = 'ScreenNode';