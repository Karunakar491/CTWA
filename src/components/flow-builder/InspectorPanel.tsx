import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useFlowStore } from '@/store/flowStore';
import { ImageUploader } from './ImageUploader';
import { InteractivePreviewModal } from './InteractivePreviewModal';
import { StaticPreviewModal } from './StaticPreviewModal';
import { Plus, X, AlertCircle, Calendar, Image as ImageIcon, Settings, Trash2, Info, Copy, Check, Download, RotateCcw, Lightbulb, Zap, CheckCircle, Save, Globe, Terminal, Clock, ChevronDown, ChevronRight, Wifi, Play, Eye, Smartphone } from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useToast } from '@/hooks/use-toast';

interface InspectorPanelProps {
  activeTab?: 'properties' | 'json';
}

let editorStylesAdded = false;

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}

export function InspectorPanel({ activeTab = 'properties' }: InspectorPanelProps) {
  const { 
    flowData, 
    selectedElementId, 
    updateComponentProperty, 
    updateScreenProperty,
    addComponentOption, 
    removeComponentOption,
    validationErrors,
    componentErrorStatus,
    setFlowData,
    validateFlow,
    addChildComponentToForm,
    removeComponentFromScreen,
    addNewScreen
  } = useFlowStore();
  
  const { toast } = useToast();
  
  // State for tabs and modals
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [showInteractivePreview, setShowInteractivePreview] = useState(false);
  const [showStaticPreview, setShowStaticPreview] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Find selected element
  const selectedElement = selectedElementId ? (() => {
    // Check if it's a screen
    const screen = flowData.screens.find(s => s.id === selectedElementId);
    if (screen) return { type: 'screen', data: screen };
    
    // Check if it's a component
    for (const screen of flowData.screens) {
      const findComponent = (components: any[]): any => {
        for (const component of components) {
          if (component.id === selectedElementId) {
            return { type: 'component', data: component, screenId: screen.id };
          }
          if (component.children) {
            const found = findComponent(component.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const found = findComponent(screen.data);
      if (found) return found;
    }
    
    return null;
  })() : null;

  // Initialize JSON editor
  useEffect(() => {
    setJsonValue(JSON.stringify(flowData, null, 2));
  }, [flowData]);

  // Debounced JSON update
  const debouncedJsonUpdate = useCallback(
    debounce((value: string) => {
      try {
        const parsed = JSON.parse(value);
        setFlowData(parsed);
        setJsonError(null);
        validateFlow();
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
      }
    }, 1000),
    [setFlowData, validateFlow]
  );

  const handleJsonChange = (value: string | undefined) => {
    if (value !== undefined) {
      setJsonValue(value);
      debouncedJsonUpdate(value);
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Flow JSON copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonValue], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonValue(formatted);
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  // Get validation errors for selected element
  const elementErrors = selectedElementId ? validationErrors.filter(error => {
    if (selectedElement?.type === 'screen') {
      const screenIndex = flowData.screens.findIndex(s => s.id === selectedElementId);
      return error.path.includes(`/screens/${screenIndex}/`) && !error.path.includes('/data/');
    } else if (selectedElement?.type === 'component') {
      return componentErrorStatus.has(selectedElementId);
    }
    return false;
  }) : [];

  const renderComponentProperties = (component: any, screenId: string) => {
    const componentErrors = validationErrors.filter(error => 
      componentErrorStatus.has(component.id)
    );

    return (
      <div className="space-y-6">
        {/* Component Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{component.type}</h3>
            <p className="text-sm text-gray-500">Component Properties</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStaticPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeComponentFromScreen(screenId, component.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Validation Errors */}
        {componentErrors.length > 0 && (
          <div className="space-y-2">
            {componentErrors.map((error, index) => (
              <Alert key={index} className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Component-specific properties */}
        {renderComponentSpecificProperties(component)}
      </div>
    );
  };

  const renderComponentSpecificProperties = (component: any) => {
    switch (component.type) {
      case 'TextHeading':
      case 'TextSubheading':
      case 'TextBody':
      case 'TextCaption':
      case 'RichText':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Text Content</Label>
              <Textarea
                id="text"
                value={component.text || ''}
                onChange={(e) => updateComponentProperty(component.id, 'text', e.target.value)}
                placeholder="Enter text content..."
                rows={component.type === 'TextBody' || component.type === 'RichText' ? 4 : 2}
              />
              {component.type === 'RichText' && (
                <p className="text-xs text-gray-500 mt-1">
                  Supports **bold** and *italic* markdown formatting
                </p>
              )}
            </div>
          </div>
        );

      case 'Image':
        return (
          <div className="space-y-4">
            <ImageUploader
              componentId={component.id}
              currentSrc={component.src}
            />
            <div>
              <Label htmlFor="alt_text">Alt Text</Label>
              <Input
                id="alt_text"
                value={component.alt_text || ''}
                onChange={(e) => updateComponentProperty(component.id, 'alt_text', e.target.value)}
                placeholder="Describe the image..."
              />
            </div>
            <div>
              <Label htmlFor="scale_type">Scale Type</Label>
              <Select
                value={component.scale_type || 'cover'}
                onValueChange={(value) => updateComponentProperty(component.id, 'scale_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'TextInput':
      case 'TextArea':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Field Name</Label>
              <Input
                id="name"
                value={component.name || ''}
                onChange={(e) => updateComponentProperty(component.id, 'name', e.target.value)}
                placeholder="field_name"
              />
            </div>
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={component.label || ''}
                onChange={(e) => updateComponentProperty(component.id, 'label', e.target.value)}
                placeholder="Enter label..."
              />
            </div>
            <div>
              <Label htmlFor="helper_text">Helper Text</Label>
              <Input
                id="helper_text"
                value={component.helper_text || ''}
                onChange={(e) => updateComponentProperty(component.id, 'helper_text', e.target.value)}
                placeholder="Placeholder text..."
              />
            </div>
            {component.type === 'TextInput' && (
              <div>
                <Label htmlFor="input_type">Input Type</Label>
                <Select
                  value={component.input_type || 'text'}
                  onValueChange={(value) => updateComponentProperty(component.id, 'input_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="password">Password</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {component.type === 'TextArea' && (
              <div>
                <Label htmlFor="max_length">Max Length</Label>
                <Input
                  id="max_length"
                  type="number"
                  value={component.max_length || ''}
                  onChange={(e) => updateComponentProperty(component.id, 'max_length', parseInt(e.target.value) || undefined)}
                  placeholder="1000"
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={component.required || false}
                onCheckedChange={(checked) => updateComponentProperty(component.id, 'required', checked)}
              />
              <Label htmlFor="required">Required field</Label>
            </div>
          </div>
        );

      case 'CheckboxGroup':
      case 'RadioButtonsGroup':
      case 'Dropdown':
      case 'ChipsSelector':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Field Name</Label>
              <Input
                id="name"
                value={component.name || ''}
                onChange={(e) => updateComponentProperty(component.id, 'name', e.target.value)}
                placeholder="field_name"
              />
            </div>
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={component.label || ''}
                onChange={(e) => updateComponentProperty(component.id, 'label', e.target.value)}
                placeholder="Choose options..."
              />
            </div>
            
            {/* Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addComponentOption(component.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {(component.data_source || []).map((option: any, index: number) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Input
                      value={option.title}
                      onChange={(e) => {
                        const newDataSource = [...(component.data_source || [])];
                        newDataSource[index] = { ...option, title: e.target.value };
                        updateComponentProperty(component.id, 'data_source', newDataSource);
                      }}
                      placeholder="Option text"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeComponentOption(component.id, option.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={component.required || false}
                onCheckedChange={(checked) => updateComponentProperty(component.id, 'required', checked)}
              />
              <Label htmlFor="required">Required field</Label>
            </div>
          </div>
        );

      case 'DatePicker':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Field Name</Label>
              <Input
                id="name"
                value={component.name || ''}
                onChange={(e) => updateComponentProperty(component.id, 'name', e.target.value)}
                placeholder="date_field"
              />
            </div>
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={component.label || ''}
                onChange={(e) => updateComponentProperty(component.id, 'label', e.target.value)}
                placeholder="Select date..."
              />
            </div>
            <div>
              <Label htmlFor="min_date">Minimum Date</Label>
              <Input
                id="min_date"
                type="date"
                value={component.min_date || ''}
                onChange={(e) => updateComponentProperty(component.id, 'min_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="max_date">Maximum Date</Label>
              <Input
                id="max_date"
                type="date"
                value={component.max_date || ''}
                onChange={(e) => updateComponentProperty(component.id, 'max_date', e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={component.required || false}
                onCheckedChange={(checked) => updateComponentProperty(component.id, 'required', checked)}
              />
              <Label htmlFor="required">Required field</Label>
            </div>
          </div>
        );

      case 'Button':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Button Text</Label>
              <Input
                id="title"
                value={component.title || ''}
                onChange={(e) => updateComponentProperty(component.id, 'title', e.target.value)}
                placeholder="Continue"
              />
            </div>
            <div>
              <Label htmlFor="action_type">Action Type</Label>
              <Select
                value={component.on_click_action?.name || 'navigate'}
                onValueChange={(value) => {
                  const newAction = { ...component.on_click_action, name: value };
                  if (value === 'navigate') {
                    newAction.next = { type: 'screen', name: '' };
                  } else if (value === 'open_url') {
                    newAction.payload = { url: '' };
                  }
                  updateComponentProperty(component.id, 'on_click_action', newAction);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="navigate">Navigate to Screen</SelectItem>
                  <SelectItem value="complete">Complete Flow</SelectItem>
                  <SelectItem value="open_url">Open URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {component.on_click_action?.name === 'navigate' && (
              <div>
                <Label htmlFor="target_screen">Target Screen</Label>
                <Select
                  value={component.on_click_action?.next?.name || ''}
                  onValueChange={(value) => {
                    const newAction = {
                      ...component.on_click_action,
                      next: { type: 'screen', name: value }
                    };
                    updateComponentProperty(component.id, 'on_click_action', newAction);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select screen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {flowData.screens.map((screen) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        {screen.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {component.on_click_action?.name === 'open_url' && (
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={component.on_click_action?.payload?.url || ''}
                  onChange={(e) => {
                    const newAction = {
                      ...component.on_click_action,
                      payload: { url: e.target.value }
                    };
                    updateComponentProperty(component.id, 'on_click_action', newAction);
                  }}
                  placeholder="https://example.com"
                />
              </div>
            )}
          </div>
        );

      case 'Footer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Footer Text</Label>
              <Input
                id="label"
                value={component.label || ''}
                onChange={(e) => updateComponentProperty(component.id, 'label', e.target.value)}
                placeholder="Continue"
              />
            </div>
            <div>
              <Label htmlFor="action_type">Action Type</Label>
              <Select
                value={component.on_click_action?.name || 'navigate'}
                onValueChange={(value) => {
                  const newAction = { ...component.on_click_action, name: value };
                  if (value === 'navigate') {
                    newAction.next = { type: 'screen', name: '' };
                  } else if (value === 'open_url') {
                    newAction.payload = { url: '' };
                  }
                  updateComponentProperty(component.id, 'on_click_action', newAction);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="navigate">Navigate to Screen</SelectItem>
                  <SelectItem value="complete">Complete Flow</SelectItem>
                  <SelectItem value="open_url">Open URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {component.on_click_action?.name === 'navigate' && (
              <div>
                <Label htmlFor="target_screen">Target Screen</Label>
                <Select
                  value={component.on_click_action?.next?.name || ''}
                  onValueChange={(value) => {
                    const newAction = {
                      ...component.on_click_action,
                      next: { type: 'screen', name: value }
                    };
                    updateComponentProperty(component.id, 'on_click_action', newAction);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select screen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {flowData.screens.map((screen) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        {screen.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 'OptIn':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Field Name</Label>
              <Input
                id="name"
                value={component.name || ''}
                onChange={(e) => updateComponentProperty(component.id, 'name', e.target.value)}
                placeholder="opt_in_field"
              />
            </div>
            <div>
              <Label htmlFor="label">Opt-in Text</Label>
              <Textarea
                id="label"
                value={component.label || ''}
                onChange={(e) => updateComponentProperty(component.id, 'label', e.target.value)}
                placeholder="I agree to the terms and conditions"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={component.required || false}
                onCheckedChange={(checked) => updateComponentProperty(component.id, 'required', checked)}
              />
              <Label htmlFor="required">Required field</Label>
            </div>
          </div>
        );

      case 'EmbeddedLink':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Link Text</Label>
              <Input
                id="text"
                value={component.text || ''}
                onChange={(e) => updateComponentProperty(component.id, 'text', e.target.value)}
                placeholder="Click here to learn more"
              />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={component.on_click_action?.payload?.url || ''}
                onChange={(e) => {
                  const newAction = {
                    name: 'open_url',
                    payload: { url: e.target.value }
                  };
                  updateComponentProperty(component.id, 'on_click_action', newAction);
                }}
                placeholder="https://example.com"
              />
            </div>
          </div>
        );

      case 'Form':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Form Name</Label>
              <Input
                id="name"
                value={component.name || ''}
                onChange={(e) => updateComponentProperty(component.id, 'name', e.target.value)}
                placeholder="form_container"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Form Fields</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addChildComponentToForm(component.id, 'TextInput')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {(component.children || []).map((child: any, index: number) => (
                  <div key={child.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{index + 1}. {child.type}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeComponentFromScreen(component.id, child.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-8 h-8 mx-auto mb-2" />
            <p>No properties available for this component type</p>
          </div>
        );
    }
  };

  const renderScreenProperties = (screen: any) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Screen Properties</h3>
            <p className="text-sm text-gray-500">{screen.title}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInteractivePreview(true)}
            >
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStaticPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Validation Errors */}
        {elementErrors.length > 0 && (
          <div className="space-y-2">
            {elementErrors.map((error, index) => (
              <Alert key={index} className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {error.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Screen Title</Label>
            <Input
              id="title"
              value={screen.title}
              onChange={(e) => updateScreenProperty(screen.id, 'title', e.target.value)}
              placeholder="Screen title..."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="terminal"
              checked={screen.terminal || false}
              onCheckedChange={(checked) => updateScreenProperty(screen.id, 'terminal', checked)}
            />
            <Label htmlFor="terminal">Terminal screen (end of flow)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="success"
              checked={screen.success || false}
              onCheckedChange={(checked) => updateScreenProperty(screen.id, 'success', checked)}
            />
            <Label htmlFor="success">Success screen</Label>
          </div>
        </div>

        <div>
          <Label>Components ({screen.data.length})</Label>
          <div className="mt-2 space-y-1">
            {screen.data.map((component: any, index: number) => (
              <div
                key={component.id}
                className="flex items-center justify-between p-2 border rounded text-sm hover:bg-gray-50"
              >
                <span>{index + 1}. {component.type}</span>
                <Badge variant="outline" className="text-xs">
                  {component.name || component.title || component.text?.substring(0, 20) || 'Unnamed'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Inspector</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInteractivePreview(true)}
              disabled={flowData.screens.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Test Flow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStaticPreview(true)}
              disabled={flowData.screens.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
        
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={currentTab === 'properties' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setCurrentTab('properties')}
          >
            Properties
          </Button>
          <Button
            variant={currentTab === 'json' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setCurrentTab('json')}
          >
            JSON
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {currentTab === 'properties' ? (
          <div className="p-4">
            {selectedElement ? (
              selectedElement.type === 'component' ? (
                renderComponentProperties(selectedElement.data, selectedElement.screenId)
              ) : (
                renderScreenProperties(selectedElement.data)
              )
            ) : (
              <div className="text-center py-12">
                <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Selection</h3>
                <p className="text-gray-500 mb-6">
                  Select a screen or component to edit its properties
                </p>
                {flowData.screens.length === 0 && (
                  <Button onClick={addNewScreen}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Screen
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* JSON Editor Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Flow JSON</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFormatJson}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Format
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJson}
                  >
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadJson}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              {jsonError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {jsonError}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* JSON Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonValue}
                onChange={handleJsonChange}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  lineNumbers: 'on',
                  folding: true,
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  formatOnPaste: true,
                  formatOnType: true
                }}
                onMount={(editor, monaco) => {
                  // Add custom JSON schema validation
                  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    schemas: [{
                      uri: "http://myserver/whatsapp-flows-schema.json",
                      fileMatch: ["*"],
                      schema: {
                        type: "object",
                        properties: {
                          version: { type: "string" },
                          screens: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                title: { type: "string" },
                                data: { type: "array" }
                              },
                              required: ["id", "title", "data"]
                            }
                          }
                        },
                        required: ["version", "screens"]
                      }
                    }]
                  });
                }}
              />
            </div>
          </div>
        )}
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
    </div>
  );
}