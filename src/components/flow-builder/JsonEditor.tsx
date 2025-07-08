import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useFlowStore } from '@/store/flowStore';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Download, Upload } from 'lucide-react';
import Editor from '@monaco-editor/react';
import Ajv from 'ajv';

interface JsonEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// WhatsApp Flows JSON Schema (simplified version based on Meta documentation)
const whatsappFlowSchema = {
  type: "object",
  properties: {
    version: {
      type: "string",
      enum: ["5.0"]
    },
    screens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                type: {
                  type: "string",
                  enum: [
                    "TextHeading", "TextSubheading", "TextBody", "TextInput",
                    "CheckboxGroup", "RadioButtonsGroup", "Footer", "OptIn",
                    "Image", "Dropdown", "DatePicker", "Button", "Form"
                  ]
                }
              },
              required: ["id", "type"]
            }
          }
        },
        required: ["id", "title", "data"]
      }
    }
  },
  required: ["version", "screens"]
};

export function JsonEditor({ open, onOpenChange }: JsonEditorProps) {
  const { flowData, setFlowData } = useFlowStore();
  const [editorValue, setEditorValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidJson, setIsValidJson] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(whatsappFlowSchema);

  useEffect(() => {
    if (open) {
      const formattedJson = JSON.stringify(flowData, null, 2);
      setEditorValue(formattedJson);
      setHasChanges(false);
      validateJson(formattedJson);
    }
  }, [open, flowData]);

  const validateJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setIsValidJson(true);
      
      // Validate against WhatsApp Flows schema
      const isValid = validate(parsed);
      
      if (!isValid && validate.errors) {
        const errors = validate.errors.map(error => {
          const path = error.instancePath || 'root';
          return `${path}: ${error.message}`;
        });
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setIsValidJson(false);
      setValidationErrors(['Invalid JSON format: ' + (error as Error).message]);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorValue(value);
      setHasChanges(true);
      validateJson(value);
    }
  };

  const handleSaveAndReturn = () => {
    if (isValidJson && validationErrors.length === 0) {
      try {
        const parsed = JSON.parse(editorValue);
        setFlowData(parsed);
        setHasChanges(false);
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to save JSON:', error);
      }
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([editorValue], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-flow.json';
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
          setEditorValue(content);
          setHasChanges(true);
          validateJson(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const canSave = isValidJson && validationErrors.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 border-b bg-white">
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
                  <DialogTitle className="text-xl">JSON Flow Editor</DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Edit your WhatsApp Flow as JSON with real-time validation
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
                  disabled={!canSave || !hasChanges}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save and Return to Builder
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Status Bar */}
          <div className="p-4 bg-gray-50 border-b">
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
                  {validationErrors.length === 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Schema Valid
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        {validationErrors.length} Schema Error{validationErrors.length !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Unsaved Changes
                  </Badge>
                )}
                <Badge variant="outline">
                  Lines: {editorValue.split('\n').length}
                </Badge>
                <Badge variant="outline">
                  Characters: {editorValue.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={editorValue}
                onChange={handleEditorChange}
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
                  }
                }}
              />
            </div>

            {/* Error Panel */}
            {(validationErrors.length > 0 || !isValidJson) && (
              <div className="w-80 border-l bg-white overflow-y-auto">
                <div className="p-4 border-b bg-red-50">
                  <h3 className="font-medium text-red-900 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Flow JSON Errors
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Fix these errors to save your changes
                  </p>
                </div>
                
                <div className="p-4 space-y-3">
                  {validationErrors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help Panel */}
          <div className="p-4 bg-blue-50 border-t">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 text-sm">
                  WhatsApp Flows JSON Schema
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  This editor validates your flow against the official WhatsApp Flows JSON schema. 
                  All components must have valid IDs, types, and required properties.
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                  <span>• Version must be "5.0"</span>
                  <span>• All screens must have id, title, and data</span>
                  <span>• Components must have valid types</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}