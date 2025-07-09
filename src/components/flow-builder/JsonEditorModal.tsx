import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useFlowStore } from '@/store/flowStore';
import { whatsappFlowsValidator, ValidationError } from '@/lib/whatsapp-flows-validator';
import { useToast } from '@/hooks/use-toast';
import { ApiLogEntry } from '@/types/api';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  RotateCcw,
  Lightbulb,
  Zap,
  Info,
  Code,
  Terminal,
  Trash2,
  Clock,
  Globe,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface JsonEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialApiLogs?: ApiLogEntry[];
}

let editorStylesAdded = false;

export function JsonEditorModal({ open, onOpenChange, initialApiLogs = [] }: JsonEditorModalProps) {
  const { flowData, setFlowData } = useFlowStore();
  const { toast } = useToast();
  
  // Editor state
  const [jsonText, setJsonText] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidJson, setIsValidJson] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  // API Console state
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>(initialApiLogs);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'request' | 'response' | 'error'>('all');

  // Initialize editor content when modal opens
  useEffect(() => {
    if (open) {
      const formattedJson = JSON.stringify(flowData, null, 2);
      setJsonText(formattedJson);
      setHasUnsavedChanges(false);
      validateJsonContent(formattedJson);
      setApiLogs(initialApiLogs);
    }
  }, [open, flowData, initialApiLogs]);

  // Update editor decorations when validation errors change
  useEffect(() => {
    if (editorInstance) {
      updateEditorDecorations();
    }
  }, [editorInstance, validationErrors, jsonText]);

  const validateJsonContent = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setIsValidJson(true);
      
      // Use the comprehensive WhatsApp Flows validator
      const { errors } = whatsappFlowsValidator.validate(parsed);
      setValidationErrors(errors);
    } catch (error) {
      setIsValidJson(false);
      setValidationErrors([{
        path: 'root',
        message: `Invalid JSON format: ${(error as Error).message}`,
        value: null,
        severity: 'error',
        originalMessage: (error as Error).message
      }]);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setJsonText(value);
    setHasUnsavedChanges(true);
    validateJsonContent(value);
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

    // Handle click on error lines for auto-fix
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

  const handleErrorFix = (error: ValidationError) => {
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

  const handleSaveAndReturn = () => {
    if (isValidJson && validationErrors.filter(e => e.severity === 'error').length === 0) {
      try {
        const parsed = JSON.parse(jsonText);
        setFlowData(parsed);
        setHasUnsavedChanges(false);
        onOpenChange(false);
        
        toast({
          title: "Flow Updated",
          description: "Your changes have been saved successfully.",
        });
      } catch (error) {
        toast({
          title: "Save Failed",
          description: "Failed to parse JSON. Please check for syntax errors.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied",
        description: "JSON copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
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

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setJsonText(content);
          setHasUnsavedChanges(true);
          validateJsonContent(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    const formattedJson = JSON.stringify(flowData, null, 2);
    setJsonText(formattedJson);
    setHasUnsavedChanges(false);
    validateJsonContent(formattedJson);
  };

  // API Console functions
  const clearApiLogs = () => {
    setApiLogs([]);
    setExpandedLogs(new Set());
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

  const getFilteredLogs = () => {
    if (consoleFilter === 'all') return apiLogs;
    return apiLogs.filter(log => log.type === consoleFilter);
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'request': return <Globe className="w-3 h-3 text-blue-600" />;
      case 'response': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'error': return <AlertCircle className="w-3 h-3 text-red-600" />;
      default: return <Info className="w-3 h-3 text-gray-600" />;
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'request': return 'text-blue-600 bg-blue-50';
      case 'response': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const canSave = isValidJson && validationErrors.filter(e => e.severity === 'error').length === 0;
  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;
  const filteredLogs = getFilteredLogs();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 overflow-hidden">
        <div className="flex flex-col h-[98vh]">
          {/* Header */}
          <DialogHeader className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Builder
                </Button>
                <div>
                  <DialogTitle className="text-lg flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    WhatsApp Flow JSON Editor
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Professional development environment with API console
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportJson}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJson}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={handleSaveAndReturn}
                  disabled={!canSave || !hasUnsavedChanges}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save and Return
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Status Bar */}
          <div className="p-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isValidJson ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {isValidJson ? 'Valid JSON' : 'Invalid JSON'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {errorCount === 0 && warningCount === 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Flow Valid
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        {errorCount} Error{errorCount !== 1 ? 's' : ''}
                        {warningCount > 0 && `, ${warningCount} Warning${warningCount !== 1 ? 's' : ''}`}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {apiLogs.length} API Log{apiLogs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Unsaved Changes
                  </Badge>
                )}
                <Badge variant="outline">
                  Lines: {jsonText.split('\n').length}
                </Badge>
                <Badge variant="outline">
                  Characters: {jsonText.length}
                </Badge>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToClipboard}
                        className="h-8 w-8 p-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={!hasUnsavedChanges}
                        className="h-8 w-8 p-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset changes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Main Content - Vertical Split */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="vertical">
              {/* Top Panel - Editor and Error Panel */}
              <ResizablePanel defaultSize={70} minSize={40}>
                <div className="h-full flex">
                  {/* Editor */}
                  <div className="flex-1 relative">
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={jsonText}
                      onChange={handleEditorChange}
                      onMount={handleEditorMount}
                      theme="vs-light"
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
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
                        glyphMargin: true,
                        lightbulb: {
                          enabled: true
                        }
                      }}
                    />
                  </div>

                  {/* Error Panel */}
                  {validationErrors.length > 0 && (
                    <div className="w-80 border-l bg-white overflow-y-auto">
                      <div className="p-3 border-b bg-red-50">
                        <h3 className="font-medium text-red-900 flex items-center text-sm">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Problems ({validationErrors.length})
                        </h3>
                        <p className="text-xs text-red-700 mt-1">
                          Click on issues to jump to location and auto-fix
                        </p>
                      </div>
                      
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
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Bottom Panel - API Console */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full bg-gray-900 text-gray-100 flex flex-col">
                  {/* Console Header */}
                  <div className="p-3 border-b border-gray-700 bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Terminal className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-sm">API Console</span>
                        <Badge variant="outline" className="text-xs bg-gray-700 border-gray-600 text-gray-300">
                          {filteredLogs.length} entries
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Filter buttons */}
                        <div className="flex items-center space-x-1">
                          {(['all', 'request', 'response', 'error'] as const).map((filter) => (
                            <Button
                              key={filter}
                              size="sm"
                              variant={consoleFilter === filter ? "default" : "ghost"}
                              className={`h-6 px-2 text-xs ${
                                consoleFilter === filter 
                                  ? "bg-blue-600 text-white" 
                                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                              }`}
                              onClick={() => setConsoleFilter(filter)}
                            >
                              {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Button>
                          ))}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearApiLogs}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                          title="Clear console"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Console Content */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No API logs yet</p>
                        <p className="text-xs mt-1">Deploy or test your flow to see API interactions</p>
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <div key={log.id} className="border border-gray-700 rounded bg-gray-800">
                          {/* Log Header */}
                          <div 
                            className="p-2 cursor-pointer hover:bg-gray-750 transition-colors"
                            onClick={() => toggleLogExpansion(log.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getLogTypeIcon(log.type)}
                                <span className={`text-xs font-medium px-2 py-1 rounded ${getLogTypeColor(log.type)}`}>
                                  {log.type.toUpperCase()}
                                </span>
                                {log.method && (
                                  <span className="text-xs font-mono text-blue-400">
                                    {log.method}
                                  </span>
                                )}
                                {log.endpoint && (
                                  <span className="text-xs font-mono text-gray-400 truncate">
                                    {log.endpoint}
                                  </span>
                                )}
                                {log.status && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      log.status >= 200 && log.status < 300 
                                        ? 'border-green-500 text-green-400' 
                                        : 'border-red-500 text-red-400'
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
                            <div className="border-t border-gray-700 p-3 bg-gray-850">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-400">Response Data</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 text-gray-400 hover:text-gray-200"
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(log.data, null, 2));
                                      toast({ title: "Copied", description: "Log data copied to clipboard" });
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                                <pre className="text-xs bg-gray-900 p-2 rounded border border-gray-600 overflow-x-auto">
                                  <code className="text-gray-300">
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
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Help Panel */}
          <div className="p-3 bg-blue-50 border-t">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 text-sm">
                  Professional Development Environment
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Full-featured JSON editor with real-time validation, error highlighting, auto-fix suggestions, and comprehensive API logging.
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                  <span>• Click red lines to auto-fix errors</span>
                  <span>• Use Ctrl+S to save quickly</span>
                  <span>• View API logs in console below</span>
                  <span>• Export/import for version control</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}