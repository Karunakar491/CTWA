import { useState, useEffect } from 'react';
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
import { useFlowStore } from '@/store/flowStore';
import { ImageUploader } from './ImageUploader';
import { Plus, X, AlertCircle, Calendar, Image as ImageIcon, Settings, Trash2, Info, Copy, Check, Download, RotateCcw, Lightbulb, Zap } from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useToast } from '@/hooks/use-toast';

let editorStylesAdded = false;

export function InspectorPanel() {
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

  // Update JSON text when flow data changes
  useEffect(() => {
    const formattedJson = JSON.stringify(flowData, null, 2);
    setJsonText(formattedJson);
    setHasUnsavedChanges(false);
    setJsonError(null);
  }, [flowData]);

  // Update editor decorations when validation errors change
  useEffect(() => {
    if (editorInstance) {
      updateEditorDecorations();
    }
  }, [editorInstance, validationErrors, jsonText]);

  const updateEditorDecorations = () => {
    if (!editorInstance) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    const markers: monaco.editor.IMarkerData[] = [];

    validationErrors.forEach((error) => {
      const lineNumber = findLineNumberForPath(error.path, jsonText);
      
      if (lineNumber > 0) {
        decorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
          options: {
            isWholeLine: true,
            className: 'error-line',
            glyphMarginClassName: 'error-glyph',
            hoverMessage: {
              value: `**Error:** ${error.message}\n\n*Click to fix*`
            },
            minimap: {
              color: '#ff0000',
              position: monaco.editor.MinimapPosition.Inline
            }
          }
        });

        markers.push({
          severity: monaco.MarkerSeverity.Error,
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
      
      // Handle both JSON pointer paths (/screens/0/data/1) and dot notation paths (screens.0.data.1)
      const pathParts = path.includes('/') 
        ? path.split('/').filter(p => p) 
        : path.split('.').filter(p => p);
      
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        
        // Try to find the property name in the JSON
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Look for the property name as a JSON key
          if (line.includes(`"${lastPart}"`)) {
            return i + 1;
          }
          
          // For array indices, look for the context around that index
          if (!isNaN(parseInt(lastPart))) {
            const parentPart = pathParts[pathParts.length - 2];
            if (parentPart && line.includes(`"${parentPart}"`)) {
              // Found the parent array/object, now count to find the right index
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
    
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleJsonSave = () => {
    if (!jsonError && hasUnsavedChanges) {
      try {
        const parsed = JSON.parse(jsonText);
        setFlowData(parsed);
        setHasUnsavedChanges(false);
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
    a.download = 'whatsapp-flow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);
    
    // Add custom CSS for error styling only once
    if (!editorStylesAdded) {
      const style = document.createElement('style');
      style.textContent = `
        .error-line {
          background-color: rgba(255, 0, 0, 0.1) !important;
          border-left: 3px solid #ff0000 !important;
        }
        .error-glyph {
          background-color: #ff0000 !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
        }
        .error-glyph::after {
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

    // Handle different types of validation errors from both internal validator and Meta API
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
        description: "Error fixed! Save changes to apply.",
      });
    }
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="properties" className="h-full flex flex-col p-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="flex-1 overflow-y-auto mt-0">
            {renderPropertiesForm()}
          </TabsContent>
          
          <TabsContent value="json" className="flex-1 overflow-y-auto mt-0 p-4">
            <div className="space-y-4">
              {/* JSON Editor Toolbar */}
              <div className="flex items-center justify-between">
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
                  
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                      Unsaved
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="h-7 px-2"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportJson}
                    className="h-7 px-2"
                    title="Export JSON"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleJsonReset}
                    className="h-7 px-2"
                    title="Reset changes"
                    disabled={!hasUnsavedChanges}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {jsonError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {jsonError}
                  </AlertDescription>
                </Alert>
              )}

              {/* JSON Editor */}
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
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

              {/* Validation Summary for JSON */}
              <div className="space-y-2">
                {validationErrors.length > 0 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <Lightbulb className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <div className="font-medium">
                        {validationErrors.length} validation error{validationErrors.length !== 1 ? 's' : ''} found
                      </div>
                      <div className="text-sm mt-1">
                        Red lines in the editor indicate errors. Click on them to auto-fix common issues.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Visual Studio-style Error Panel */}
                {validationErrors.length > 0 && (
                  <div className="border border-red-200 rounded-lg bg-red-50 max-h-48 overflow-y-auto">
                    <div className="p-3 border-b border-red-200 bg-red-100">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-900 text-sm">
                          Problems ({validationErrors.length})
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-red-200">
                      {validationErrors.map((error, index) => (
                        <div 
                          key={index} 
                          className="p-3 hover:bg-red-100 cursor-pointer transition-colors"
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
                              <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">!</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-red-900">
                                {error.message}
                              </div>
                              <div className="text-xs text-red-700 mt-1">
                                Path: {error.path}
                              </div>
                              <div className="text-xs text-red-600 mt-1">
                                Line {findLineNumberForPath(error.path, jsonText)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-red-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleErrorFix(error);
                              }}
                              title="Auto-fix this error"
                            >
                              <Zap className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleJsonSave}
                  disabled={!!jsonError || !hasUnsavedChanges}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>

              {/* Info */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Complete WhatsApp Flow JSON</p>
                <p>This shows the entire flow structure. Make changes carefully and save to update the flow.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}