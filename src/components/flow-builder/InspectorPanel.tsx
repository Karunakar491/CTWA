import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, X, AlertCircle, Calendar, Image as ImageIcon, Settings, Trash2, Info, Copy, Check, Download, RotateCcw, Lightbulb, Zap, Globe, Wifi, Terminal, ChevronDown, ChevronRight, Clock, Save } from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useToast } from '@/hooks/use-toast';
import type { ApiLogEntry } from '@/types/api';

interface InspectorPanelProps {
  activeTab?: 'properties' | 'json' | 'dataExchange';
  apiLogs?: ApiLogEntry[];
}

let editorStylesAdded = false;

export function InspectorPanel({ activeTab = 'properties', apiLogs = [] }: InspectorPanelProps) {
  const { 
    flowData, 
    setFlowData,
    selectedElementId, 
    validationErrors,
    validateFlow,
    updateComponentProperty,
    addComponentOption,
    removeComponentOption,
    addChildComponentToForm,
    removeComponentFromForm
  } = useFlowStore();

  const { toast } = useToast();

  // JSON Editor state
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Data Exchange state
  const [endpointUrl, setEndpointUrl] = useState('https://your-business.com/whatsapp-flows');
  const [simulateEncryption, setSimulateEncryption] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResults, setPingResults] = useState<ApiLogEntry[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Auto-save functionality with debouncing
  const debouncedAutoSave = useCallback(
    debounce((jsonContent: string) => {
      if (autoSaveEnabled && !jsonError && hasUnsavedChanges) {
        try {
          const parsed = JSON.parse(jsonContent);
          setFlowData(parsed);
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
          toast({
            title: "Auto-saved",
            description: "Changes saved automatically",
          });
        } catch (error) {
          // Don't auto-save if JSON is invalid
        }
      }
    }, 1000),
    [autoSaveEnabled, jsonError, hasUnsavedChanges, setFlowData, toast]
  );

  // Update JSON text when flow data changes
  useEffect(() => {
    const formattedJson = JSON.stringify(flowData, null, 2);
    setJsonText(formattedJson);
    setHasUnsavedChanges(false);
    setJsonError(null);
  }, [flowData]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && autoSaveEnabled) {
      debouncedAutoSave(jsonText);
    }
    return () => {
      debouncedAutoSave.cancel();
    };
  }, [jsonText, hasUnsavedChanges, autoSaveEnabled, debouncedAutoSave]);

  // Update editor decorations when validation errors change
  useEffect(() => {
    if (editorInstance) {
      updateEditorDecorations();
    }
  }, [editorInstance, validationErrors, jsonText]);

  const validateJsonContent = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      setJsonError(null);
    } catch (error) {
      setJsonError(`Invalid JSON: ${(error as Error).message}`);
    }
  };

  const updateEditorDecorations = () => {
    if (!editorInstance) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    const markers: monaco.editor.IMarkerData[] = [];

    validationErrors.forEach((error) => {
      const lineNumber = findLineNumberForPath(error.path, jsonText);
      
      if (lineNumber > 0) {
        const isError = error.severity === 'error';
        const className = isError ? 'error-line' : 'warning-line';
        const glyphClassName = isError ? 'error-glyph' : 'warning-glyph';
        const severity = isError ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning;

        decorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
          options: {
            isWholeLine: true,
            className,
            glyphMarginClassName: glyphClassName,
            hoverMessage: {
              value: `**${isError ? 'Error' : 'Warning'}:** ${error.message}\n\n*Click to auto-fix*`
            },
            minimap: {
              color: isError ? '#ff0000' : '#ffa500',
              position: monaco.editor.MinimapPosition.Inline
            }
          }
        });

        markers.push({
          severity,
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: model.getLineMaxColumn(lineNumber),
          message: error.message,
          source: 'WhatsApp Flows Validator'
        });
      }
    });

    editorInstance.deltaDecorations([], decorations);
    monaco.editor.setModelMarkers(model, 'whatsapp-flows', markers);
  };

  const findLineNumberForPath = (path: string, jsonContent: string): number => {
    try {
      const lines = jsonContent.split('\n');
      
      const pathParts = path.includes('/') 
        ? path.split('/').filter(p => p) 
        : path.split('.').filter(p => p);
      
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes(`"${lastPart}"`)) {
            return i + 1;
          }
          
          if (!isNaN(parseInt(lastPart))) {
            const parentPart = pathParts[pathParts.length - 2];
            if (parentPart && line.includes(`"${parentPart}"`)) {
              let arrayIndex = 0;
              for (let j = i + 1; j < lines.length && arrayIndex <= parseInt(lastPart); j++) {
                if (lines[j].trim().startsWith('{') || lines[j].trim().startsWith('"')) {
                  if (arrayIndex === parseInt(lastPart)) {
                    return j + 1;
                  }
                  arrayIndex++;
                }
              }
            }
          }
        }
      }
      
      return 0;
    } catch {
      return 0;
    }
  };

  const handleJsonChange = (value?: string) => {
    if (value === undefined) return;
    setJsonText(value);
    setHasUnsavedChanges(true);
    validateJsonContent(value);
  };

  const handleJsonSave = () => {
    if (!jsonError && hasUnsavedChanges) {
      try {
        const parsed = JSON.parse(jsonText);
        setFlowData(parsed);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        toast({
          title: "Flow Updated",
          description: "Your changes have been saved successfully.",
        });
      } catch (e) {
        setJsonError('Failed to parse JSON');
      }
    }
  };

  const handleJsonReset = () => {
    const formattedJson = JSON.stringify(flowData, null, 2);
    setJsonText(formattedJson);
    setHasUnsavedChanges(false);
    setJsonError(null);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);
    
    if (!editorStylesAdded) {
      const style = document.createElement('style');
      style.textContent = `
        .error-line {
          background-color: rgba(255, 0, 0, 0.1) !important;
          border-left: 3px solid #ff0000 !important;
        }
        .warning-line {
          background-color: rgba(255, 165, 0, 0.1) !important;
          border-left: 3px solid #ffa500 !important;
        }
        .error-glyph {
          background-color: #ff0000 !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
        }
        .warning-glyph {
          background-color: #ffa500 !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
        }
        .error-glyph::after, .warning-glyph::after {
          content: "!" !important;
          color: white !important;
          font-weight: bold !important;
          font-size: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);
      editorStylesAdded = true;
    }

    editor.onMouseDown((e) => {
      const position = e.target.position;
      if (position) {
        const lineNumber = position.lineNumber;
        const error = validationErrors.find(err => 
          findLineNumberForPath(err.path, jsonText) === lineNumber
        );
        
        if (error) {
          handleErrorFix(error);
        }
      }
    });
  };

  const handleErrorFix = (error: any) => {
    let fixedJson = jsonText;
    let wasFixed = false;

    const errorMessage = error.message || error.originalMessage || '';
    
    if (errorMessage.includes('text is required') || errorMessage.includes('text') && errorMessage.includes('required')) {
      const pathParts = error.path.split('/');
      if (pathParts.includes('TextHeading')) {
        fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "New Headline"');
        wasFixed = true;
      } else if (pathParts.includes('TextBody')) {
        fixedJson = fixedJson.replace(/"text":\s*""/g, '"text": "New text content"');
        wasFixed = true;
      }
    } else if (errorMessage.includes('name is required') || errorMessage.includes('name') && errorMessage.includes('required')) {
      fixedJson = fixedJson.replace(/"name":\s*""/g, '"name": "field_name"');
      wasFixed = true;
    } else if (errorMessage.includes('title is required') || errorMessage.includes('title') && errorMessage.includes('required')) {
      fixedJson = fixedJson.replace(/"title":\s*""/g, '"title": "Button Text"');
      wasFixed = true;
    } else if (errorMessage.includes('label is required') || errorMessage.includes('label') && errorMessage.includes('required')) {
      fixedJson = fixedJson.replace(/"label":\s*""/g, '"label": "Label Text"');
      wasFixed = true;
    } else if (errorMessage.includes('src is required') || errorMessage.includes('src') && errorMessage.includes('required')) {
      fixedJson = fixedJson.replace(/"src":\s*""/g, '"src": "https://via.placeholder.com/300x200"');
      wasFixed = true;
    }

    if (wasFixed) {
      setJsonText(fixedJson);
      setHasUnsavedChanges(true);
      
      toast({
        title: "Error Fixed",
        description: "Error fixed! Changes will be auto-saved.",
      });
    }
  };

  // Data Exchange functions
  const pingEndpoint = async () => {
    if (!endpointUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid endpoint URL",
        variant: "destructive",
      });
      return;
    }

    setIsPinging(true);
    const startTime = Date.now();

    const requestPayload = {
      version: "3.0",
      action: "ping",
      screen: "WELCOME",
      data: {
        test: "ping",
        encrypted: simulateEncryption,
        timestamp: new Date().toISOString(),
        flow_token: "demo_flow_token_12345"
      }
    };

    // Log the request
    const requestLog: ApiLogEntry = {
      id: `ping_req_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'request',
      method: 'POST',
      endpoint: endpointUrl,
      data: requestPayload
    };

    setPingResults(prev => [...prev, requestLog]);

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token',
        },
        body: JSON.stringify(requestPayload)
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      // Log successful response
      const responseLog: ApiLogEntry = {
        id: `ping_res_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'response',
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        duration
      };

      setPingResults(prev => [...prev, responseLog]);

      if (response.ok) {
        toast({
          title: "Ping Successful",
          description: `Endpoint responded with status ${response.status}`,
        });
      } else {
        toast({
          title: "Ping Failed",
          description: `Endpoint returned ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      const errorLog: ApiLogEntry = {
        id: `ping_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        status: 0,
        statusText: 'Network Error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        duration
      };

      setPingResults(prev => [...prev, errorLog]);

      toast({
        title: "Ping Failed",
        description: error instanceof Error ? error.message : "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPinging(false);
    }
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const clearPingResults = () => {
    setPingResults([]);
    setExpandedLogs(new Set());
  };

  // Find component including nested components
  const findComponentById = (components: any[], id: string): any => {
    for (const component of components) {
      if (component.id === id) {
        return component;
      }
      if (component.children) {
        const found = findComponentById(component.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedComponent = selectedElementId 
    ? flowData.screens.flatMap(s => s.data).find(c => c.id === selectedElementId) ||
      flowData.screens.flatMap(s => s.data).reduce((found, component) => {
        if (found) return found;
        return findComponentById([component], selectedElementId);
      }, null)
    : null;

  // Find validation errors for selected component
  const componentErrors = selectedElementId 
    ? validationErrors.filter(error => {
        const pathParts = error.path.split('/');
        if (pathParts.includes('data')) {
          const screenIndex = parseInt(pathParts[pathParts.indexOf('screens') + 1]);
          const componentIndex = parseInt(pathParts[pathParts.indexOf('data') + 1]);
          
          if (!isNaN(screenIndex) && !isNaN(componentIndex)) {
            const screen = flowData.screens[screenIndex];
            const component = screen?.data[componentIndex];
            return component?.id === selectedElementId;
          }
        }
        return false;
      })
    : [];

  const hasError = componentErrors.length > 0;

  const handlePropertyChange = (property: string, value: any) => {
    if (selectedElementId) {
      updateComponentProperty(selectedElementId, property, value);
    }
  };

  const handleOptionChange = (optionId: string, title: string) => {
    if (selectedComponent && selectedComponent.data_source) {
      const updatedOptions = selectedComponent.data_source.map((opt: any) => 
        opt.id === optionId ? { ...opt, title } : opt
      );
      handlePropertyChange('data_source', updatedOptions);
    }
  };

  const renderErrorsAndFixes = () => {
    if (componentErrors.length === 0) return null;

    return (
      <div className="space-y-2">
        {componentErrors.map((error, index) => (
          <Alert key={index} variant="destructive" className="relative">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="pr-8">
              <div className="font-medium text-sm">{error.message}</div>
              {error.path && (
                <div className="text-xs text-red-600 mt-1 opacity-75">
                  Path: {error.path}
                </div>
              )}
            </AlertDescription>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100"
                    onClick={() => {
                      if (error.originalMessage?.includes('text is required')) {
                        if (selectedComponent?.type === 'TextHeading') {
                          handlePropertyChange('text', 'New Headline');
                        } else if (selectedComponent?.type === 'TextBody') {
                          handlePropertyChange('text', 'New text content');
                        }
                      } else if (error.originalMessage?.includes('name is required')) {
                        handlePropertyChange('name', 'field_name');
                      } else if (error.originalMessage?.includes('title is required')) {
                        handlePropertyChange('title', 'Button Text');
                      } else if (error.originalMessage?.includes('label is required')) {
                        handlePropertyChange('label', 'Label');
                      }
                    }}
                  >
                    <Zap className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto-fix this error</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Alert>
        ))}
      </div>
    );
  };

  const getComponentInfo = (type: string) => {
    const info = {
      'TextHeading': { name: 'Headline', description: 'Main heading text with character limit', maxLength: 60 },
      'TextSubheading': { name: 'Subheading', description: 'Secondary heading text', maxLength: 80 },
      'TextBody': { name: 'Text', description: 'Body text content for detailed information', maxLength: 4096 },
      'TextCaption': { name: 'Caption', description: 'Caption text for images or sections', maxLength: 300 },
      'RichText': { name: 'Rich Text', description: 'Formatted text with markdown support', maxLength: 4096 },
      'Image': { name: 'Image', description: 'Upload and display images in your flow', maxLength: null },
      'ImageCarousel': { name: 'Image Carousel', description: 'Multiple images in carousel format', maxLength: null },
      'TextInput': { name: 'Text Input', description: 'Single line text input field', maxLength: null },
      'TextArea': { name: 'Text Area', description: 'Multi-line text input field', maxLength: null },
      'CheckboxGroup': { name: 'Checkbox Group', description: 'Multiple choice selection component', maxLength: null },
      'RadioButtonsGroup': { name: 'Radio Group', description: 'Single choice selection component', maxLength: null },
      'Dropdown': { name: 'Dropdown', description: 'Dropdown selection menu', maxLength: null },
      'DatePicker': { name: 'Date Picker', description: 'Date selection input with constraints', maxLength: null },
      'ChipsSelector': { name: 'Chips Selector', description: 'Multi-selection using chips interface', maxLength: null },
      'Button': { name: 'Button', description: 'Action button for navigation or completion', maxLength: null },
      'Footer': { name: 'Footer', description: 'Primary action button at bottom of screen', maxLength: null },
      'OptIn': { name: 'Opt In', description: 'Checkbox for user consent/opt-in', maxLength: 250 },
      'Form': { name: 'Form', description: 'Container for grouping input components', maxLength: null },
      'EmbeddedLink': { name: 'Embedded Link', description: 'Clickable link to external URL', maxLength: null },
      'PhotoPicker': { name: 'Photo Picker', description: 'Camera/gallery photo selection', maxLength: null },
      'DocumentPicker': { name: 'Document Picker', description: 'File upload component', maxLength: null }
    };
    return info[type] || { name: type, description: 'Component', maxLength: null };
  };

  const renderPropertiesForm = () => {
    if (!selectedComponent) {
      return (
        <div className="p-6 text-center text-gray-500">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No Component Selected</h3>
          <p className="text-sm">Select a component from the canvas to edit its properties.</p>
        </div>
      );
    }

    const componentInfo = getComponentInfo(selectedComponent.type);
    const textLength = selectedComponent.text?.length || 0;

    return (
      <div className="p-6 space-y-6">
        {/* Component Type Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-medium">{componentInfo.name}</div>
            <div className="text-sm mt-1">{componentInfo.description}</div>
          </AlertDescription>
        </Alert>

        {/* Validation Errors and Fixes */}
        {renderErrorsAndFixes()}

        {/* Text Content Section */}
        {(selectedComponent.type === 'TextHeading' || 
          selectedComponent.type === 'TextSubheading' || 
          selectedComponent.type === 'TextBody' ||
          selectedComponent.type === 'TextCaption' ||
          selectedComponent.type === 'RichText' ||
          selectedComponent.type === 'Footer') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Text Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="text">Content</Label>
                {selectedComponent.type === 'TextBody' || selectedComponent.type === 'RichText' ? (
                  <Textarea
                    id="text"
                    value={selectedComponent.text || ''}
                    onChange={(e) => handlePropertyChange('text', e.target.value)}
                    className={hasError ? 'border-red-300' : ''}
                    rows={4}
                    placeholder="Enter your text content..."
                  />
                ) : (
                  <Input
                    id="text"
                    value={selectedComponent.text || ''}
                    onChange={(e) => handlePropertyChange('text', e.target.value)}
                    className={hasError ? 'border-red-300' : ''}
                    placeholder="Enter your text..."
                  />
                )}
                {componentInfo.maxLength && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Character count</span>
                    <Badge variant={textLength > componentInfo.maxLength ? "destructive" : "secondary"}>
                      {textLength}/{componentInfo.maxLength}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Component */}
        {selectedComponent.type === 'Image' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Image Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader 
                componentId={selectedComponent.id}
                currentSrc={selectedComponent.src}
              />
            </CardContent>
          </Card>
        )}

        {/* Button Component */}
        {selectedComponent.type === 'Button' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Button Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Button Text</Label>
                <Input
                  id="title"
                  value={selectedComponent.title || ''}
                  onChange={(e) => handlePropertyChange('title', e.target.value)}
                  className={hasError ? 'border-red-300' : ''}
                  placeholder="Enter button text"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={selectedComponent.on_click_action?.name || ''}
                  onValueChange={(value) => handlePropertyChange('on_click_action', { 
                    name: value,
                    next: value === 'navigate' ? { type: 'screen', name: '' } : undefined
                  })}
                >
                  <SelectTrigger className={hasError ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="navigate">Navigate to screen</SelectItem>
                    <SelectItem value="complete">Submit form</SelectItem>
                    <SelectItem value="data_exchange">Data exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedComponent.on_click_action?.name === 'navigate' && (
                <div className="space-y-2">
                  <Label htmlFor="payload">Target Screen</Label>
                  <Select
                    value={selectedComponent.on_click_action?.next?.name || ''}
                    onValueChange={(value) => handlePropertyChange('on_click_action', {
                      ...selectedComponent.on_click_action,
                      next: { type: 'screen', name: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target screen" />
                    </SelectTrigger>
                    <SelectContent>
                      {flowData.screens
                        .filter(screen => screen.id !== selectedComponent.id)
                        .map((screen) => (
                          <SelectItem key={screen.id} value={screen.id}>
                            {screen.title} ({screen.id})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Input Components with data_source */}
        {(selectedComponent.type === 'CheckboxGroup' || 
          selectedComponent.type === 'RadioButtonsGroup' ||
          selectedComponent.type === 'Dropdown' ||
          selectedComponent.type === 'ChipsSelector') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Input Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={selectedComponent.label || ''}
                  onChange={(e) => handlePropertyChange('label', e.target.value)}
                  className={hasError ? 'border-red-300' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Field Name</Label>
                <Input
                  id="name"
                  value={selectedComponent.name || ''}
                  onChange={(e) => handlePropertyChange('name', e.target.value)}
                  placeholder="field_name"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectedElementId && addComponentOption(selectedElementId)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {selectedComponent.data_source?.map((option: any, index: number) => (
                    <Card key={option.id} className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Input
                            value={option.title}
                            onChange={(e) => handleOptionChange(option.id, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="text-sm"
                          />
                        </div>
                        {selectedComponent.data_source && selectedComponent.data_source.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => selectedElementId && removeComponentOption(selectedElementId, option.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500">
                  {selectedComponent.type === 'Dropdown' ? 'Max 200 options' : 'Max 20 options'}, each option max 30 characters
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other input components */}
        {(selectedComponent.type === 'TextInput' || 
          selectedComponent.type === 'TextArea' ||
          selectedComponent.type === 'DatePicker' ||
          selectedComponent.type === 'OptIn' ||
          selectedComponent.type === 'PhotoPicker' ||
          selectedComponent.type === 'DocumentPicker') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Input Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={selectedComponent.label || ''}
                  onChange={(e) => handlePropertyChange('label', e.target.value)}
                  className={hasError ? 'border-red-300' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Field Name</Label>
                <Input
                  id="name"
                  value={selectedComponent.name || ''}
                  onChange={(e) => handlePropertyChange('name', e.target.value)}
                  placeholder="field_name"
                />
              </div>

              {selectedComponent.type === 'DatePicker' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_date">Minimum Date</Label>
                    <Input
                      id="min_date"
                      type="date"
                      value={selectedComponent.min_date || ''}
                      onChange={(e) => handlePropertyChange('min_date', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_date">Maximum Date</Label>
                    <Input
                      id="max_date"
                      type="date"
                      value={selectedComponent.max_date || ''}
                      onChange={(e) => handlePropertyChange('max_date', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Component */}
        {selectedComponent.type === 'Form' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Form Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Form Name</Label>
                <Input
                  id="name"
                  value={selectedComponent.name || ''}
                  onChange={(e) => handlePropertyChange('name', e.target.value)}
                  className={hasError ? 'border-red-300' : ''}
                  placeholder="form_name"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Form Components</Label>
                  <Select onValueChange={(value) => addChildComponentToForm(selectedComponent.id, value as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Add component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TextInput">Text Input</SelectItem>
                      <SelectItem value="TextArea">Text Area</SelectItem>
                      <SelectItem value="Dropdown">Dropdown</SelectItem>
                      <SelectItem value="DatePicker">Date Picker</SelectItem>
                      <SelectItem value="CheckboxGroup">Checkbox Group</SelectItem>
                      <SelectItem value="RadioButtonsGroup">Radio Group</SelectItem>
                      <SelectItem value="OptIn">Opt In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  {selectedComponent.children?.map((child: any) => (
                    <Card key={child.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{child.type}</div>
                          <div className="text-xs text-gray-500">
                            {child.label || child.name || 'Unnamed component'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeComponentFromForm(selectedComponent.id, child.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {(!selectedComponent.children || selectedComponent.children.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No components in this form. Add components using the dropdown above.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full flex flex-col p-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="json">JSON Editor</TabsTrigger>
            <TabsTrigger value="dataExchange">Data Exchange</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="flex-1 overflow-y-auto mt-0">
            {renderPropertiesForm()}
          </TabsContent>
          
          <TabsContent value="json" className="flex-1 overflow-hidden mt-0">
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* JSON Editor Panel */}
              <ResizablePanel defaultSize={70} minSize={40}>
                <div className="h-full flex flex-col">
                  {/* JSON Editor Toolbar */}
                  <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {jsonError ? (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            <span className="text-xs">Syntax Error</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <Check className="w-4 h-4 mr-1" />
                            <span className="text-xs">Valid JSON</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {errorCount === 0 && warningCount === 0 ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Flow Valid</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-medium text-red-700">
                              {errorCount} Error{errorCount !== 1 ? 's' : ''}
                              {warningCount > 0 && `, ${warningCount} Warning${warningCount !== 1 ? 's' : ''}`}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={autoSaveEnabled}
                          onCheckedChange={setAutoSaveEnabled}
                          id="auto-save"
                        />
                        <Label htmlFor="auto-save" className="text-xs">Auto-save</Label>
                        {lastSaved && (
                          <span className="text-xs text-gray-500">
                            Last saved: {lastSaved.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCopyToClipboard}
                              className="h-7 px-2"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy to clipboard</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleExportJson}
                              className="h-7 px-2"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export JSON</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleJsonReset}
                              className="h-7 px-2"
                              disabled={!hasUnsavedChanges}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reset changes</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {!autoSaveEnabled && (
                        <Button
                          onClick={handleJsonSave}
                          disabled={!!jsonError || !hasUnsavedChanges}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 h-7 px-3"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Error Display */}
                  {jsonError && (
                    <Alert variant="destructive" className="m-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {jsonError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* JSON Editor */}
                  <div className="flex-1 border rounded-lg overflow-hidden m-3">
                    <Editor
                      height="100%"
                      language="json"
                      value={jsonText}
                      onChange={handleJsonChange}
                      onMount={handleEditorMount}
                      theme="vs-light"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        formatOnPaste: true,
                        formatOnType: true,
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        folding: true,
                        bracketPairColorization: { enabled: true },
                        guides: {
                          bracketPairs: true,
                          indentation: true
                        },
                        padding: { top: 16, bottom: 16 },
                        glyphMargin: true,
                        lightbulb: {
                          enabled: true
                        }
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Validation Panel */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full bg-white border-t">
                  <div className="p-3 border-b bg-red-50">
                    <h3 className="font-medium text-red-900 flex items-center text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Problems ({validationErrors.length})
                    </h3>
                    <p className="text-xs text-red-700 mt-1">
                      Click on issues to jump to location and auto-fix
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {validationErrors.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">No validation errors found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {validationErrors.map((error, index) => (
                          <div 
                            key={index} 
                            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => {
                              const lineNumber = findLineNumberForPath(error.path, jsonText);
                              if (lineNumber > 0 && editorInstance) {
                                editorInstance.revealLineInCenter(lineNumber);
                                editorInstance.setPosition({ lineNumber, column: 1 });
                                editorInstance.focus();
                              }
                            }}
                          >
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                  error.severity === 'error' ? "bg-red-500" : "bg-orange-500"
                                }`}>
                                  <span className="text-white text-xs font-bold">!</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${
                                  error.severity === 'error' ? "text-red-900" : "text-orange-900"
                                }`}>
                                  {error.message}
                                </div>
                                <div className={`text-xs mt-1 ${
                                  error.severity === 'error' ? "text-red-700" : "text-orange-700"
                                }`}>
                                  {error.path}
                                </div>
                                <div className={`text-xs mt-1 ${
                                  error.severity === 'error' ? "text-red-600" : "text-orange-600"
                                }`}>
                                  Line {findLineNumberForPath(error.path, jsonText)}
                                </div>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 hover:bg-blue-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleErrorFix(error);
                                      }}
                                    >
                                      <Zap className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Auto-fix this issue</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="dataExchange" className="flex-1 overflow-y-auto mt-0 p-4">
            <div className="space-y-6">
              {/* Data Exchange Info */}
              <Alert className="border-blue-200 bg-blue-50">
                <Globe className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="font-medium">WhatsApp Flows Data Exchange</div>
                  <div className="text-sm mt-1">
                    Test your business endpoint that will handle dynamic data and flow routing.
                  </div>
                </AlertDescription>
              </Alert>

              {/* Endpoint Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Endpoint Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your business endpoint for data exchange
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="endpoint-url">Endpoint URL</Label>
                    <Input
                      id="endpoint-url"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="https://your-business.com/whatsapp-flows"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Your business endpoint that will receive WhatsApp Flows data exchange requests
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="simulate-encryption"
                      checked={simulateEncryption}
                      onCheckedChange={setSimulateEncryption}
                    />
                    <Label htmlFor="simulate-encryption" className="text-sm">
                      Simulate Encryption
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>In production, WhatsApp encrypts data exchange payloads using RSA + AES-GCM encryption</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Button
                    onClick={pingEndpoint}
                    disabled={isPinging || !endpointUrl.trim()}
                    className="w-full"
                  >
                    {isPinging ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Pinging Endpoint...
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Ping Endpoint
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* API Console */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center">
                        <Terminal className="w-4 h-4 mr-2" />
                        API Console
                      </CardTitle>
                      <CardDescription>
                        View data exchange requests and responses
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {pingResults.length} entries
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearPingResults}
                        disabled={pingResults.length === 0}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pingResults.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No API requests yet</p>
                        <p className="text-xs mt-1">Click "Ping Endpoint" to test your data exchange endpoint</p>
                      </div>
                    ) : (
                      pingResults.map((log) => (
                        <div key={log.id} className="border border-gray-200 rounded bg-gray-50">
                          {/* Log Header */}
                          <div 
                            className="p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleLogExpansion(log.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  log.type === 'request' ? 'bg-blue-500' :
                                  log.type === 'response' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <span className="text-xs font-medium">
                                  {log.type.toUpperCase()}
                                </span>
                                {log.method && (
                                  <span className="text-xs font-mono text-blue-600">
                                    {log.method}
                                  </span>
                                )}
                                {log.status && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      log.status >= 200 && log.status < 300 
                                        ? 'border-green-500 text-green-600' 
                                        : 'border-red-500 text-red-600'
                                    }`}
                                  >
                                    {log.status}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                  {log.duration && <span>({log.duration}ms)</span>}
                                </div>
                                {expandedLogs.has(log.id) ? (
                                  <ChevronDown className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Log Details */}
                          {expandedLogs.has(log.id) && (
                            <div className="border-t border-gray-200 p-3 bg-white">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-600">
                                    {log.type === 'request' ? 'Request Data' : 'Response Data'}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(log.data, null, 2));
                                      toast({ title: "Copied", description: "Log data copied to clipboard" });
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                                <pre className="text-xs bg-gray-100 p-2 rounded border overflow-x-auto">
                                  <code className="text-gray-700">
                                    {JSON.stringify(log.data, null, 2)}
                                  </code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Data Exchange Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Understanding WhatsApp Flows Data Exchange
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-700 space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">What is Data Exchange?</h4>
                      <p>Data exchange allows your WhatsApp Flow to communicate with your business backend to:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                        <li>Fetch dynamic content (product catalogs, user data, etc.)</li>
                        <li>Validate user inputs in real-time</li>
                        <li>Control flow routing based on business logic</li>
                        <li>Submit form data to your systems</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Security & Encryption</h4>
                      <p className="text-xs">
                        In production, WhatsApp encrypts all data exchange payloads using:
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                        <li><strong>RSA encryption</strong> for secure key exchange</li>
                        <li><strong>AES-GCM encryption</strong> for payload encryption</li>
                        <li><strong>Request signing</strong> to verify authenticity</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Endpoint Requirements</h4>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Must accept POST requests with JSON payloads</li>
                        <li>Must respond within 10 seconds</li>
                        <li>Must handle encrypted payloads in production</li>
                        <li>Should validate flow_token for security</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Testing Note:</strong> This ping feature sends unencrypted test data to help you verify your endpoint is working. 
                        In production, all data will be encrypted according to WhatsApp's security requirements.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

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