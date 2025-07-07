import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/flowStore';
import Editor from '@monaco-editor/react';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';

interface JsonEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JsonEditorModal({ open, onOpenChange }: JsonEditorProps) {
  const { flowData, setFlowData } = useFlowStore();
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setJsonText(JSON.stringify(flowData, null, 2));
      setError(null);
    }
  }, [open, flowData]);

  const handleEditorChange = (value?: string) => {
    if(value === undefined) return;
    setJsonText(value);
    try {
      JSON.parse(value);
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
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

  const handleSave = () => {
    if (!error) {
      setFlowData(JSON.parse(jsonText));
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle>Flow JSON Editor</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className="flex items-center space-x-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 px-6">
            <Editor
              height="100%"
              language="json"
              value={jsonText}
              onChange={handleEditorChange}
              options={{ minimap: { enabled: false } }}
            />
        </div>
        <DialogFooter className="p-4 border-t bg-slate-50 flex items-center justify-between">
           {error ? (
              <div className="text-red-600 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{error}</div>
           ) : (
              <div className="text-green-600 text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-2" />JSON is valid</div>
           )}
           <Button onClick={handleSave} disabled={!!error}>Save and Update Flow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}