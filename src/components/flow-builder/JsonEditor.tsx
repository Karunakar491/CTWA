import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useFlowStore } from '@/store/flowStore';
import { whatsappFlowsValidator } from '@/lib/whatsapp-flows-validator';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Download, Upload } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface JsonEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JsonEditor({ open, onOpenChange }: JsonEditorProps) {
  const { flowData, setFlowData } = useFlowStore();
  const [editorValue, setEditorValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidJson, setIsValidJson] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      const formattedJson = JSON.stringify(flowData, null, 2);
      setEditorValue(formattedJson);
      setHasChanges(false);
    }
  }, [open, flowData]);

  const validateJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setIsValidJson(true);
      
      // Validate against WhatsApp Flows schema using centralized validator
      const { isValid, errors } = whatsappFlowsValidator.validate(parsed);
      
      if (!isValid && errors.length > 0) {
        const errorMessages = errors.map(error => {
          const path = error.path || 'root';
          return `${path}: ${error.message}`;
        });
        setValidationErrors(errorMessages);
      } else {
        setValidationErrors([]);
      }
      
      return parsed;
    } catch (error) {
      setIsValidJson(false);
      setValidationErrors([`Invalid JSON: ${error.message}`]);
      return null;
    }
  }

  const handleEditorChange = (value: string) => {
    setEditorValue(value);
    setHasChanges(true);
    validateJson(value);
  }

  const handleSave = () => {
    const parsed = validateJson(editorValue);
    if (parsed && validationErrors.length === 0) {
      setFlowData(parsed);
      onOpenChange(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSave} disabled={!isValidJson || validationErrors.length > 0}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Editor
            height="70vh"
            defaultLanguage="json"
            value={editorValue}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                WhatsApp Flows Validator
                {validationErrors.length === 0 ? (
                  <Badge variant="success" className="ml-2">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Invalid
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-blue-700 text-xs">
                This validator checks your flow against the official WhatsApp Flows API specifications. 
                All errors must be fixed before your flow can be deployed to WhatsApp Business.
                The validation uses the latest WhatsApp Flows v7.1 requirements and component specifications.
              </CardDescription>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => {/* Download logic */}}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Upload logic */}}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload JSON
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <Alert variant="destructive" key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}