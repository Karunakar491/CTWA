import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import type { ApiLogEntry } from '@/types/api';
import { 
  ArrowLeft, 
  Send, 
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
  ChevronRight,
  Shield,
  Key,
  Lock,
  Server,
  Webhook
} from 'lucide-react';

interface DataExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiLogs: ApiLogEntry[];
  onAddApiLog: (entry: Omit<ApiLogEntry, 'id' | 'timestamp'>) => void;
}

export function DataExchangeModal({ open, onOpenChange, apiLogs, onAddApiLog }: DataExchangeModalProps) {
  const { toast } = useToast();
  
  // Data Exchange Configuration State
  const [endpointUrl, setEndpointUrl] = useState('https://your-server.com/whatsapp-flows');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  
  // API Console State
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'request' | 'response' | 'error'>('all');
  const [copied, setCopied] = useState(false);

  const handlePingEndpoint = async () => {
    setIsPinging(true);
    const startTime = Date.now();
    
    // Log the ping request
    onAddApiLog({
      type: 'request',
      method: 'POST',
      endpoint: '/ping',
      data: {
        endpoint: endpointUrl,
        encryption_enabled: encryptionEnabled,
        timestamp: new Date().toISOString()
      }
    });
    
    try {
      // Simulate ping request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const duration = Date.now() - startTime;
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        // Log successful response
        onAddApiLog({
          type: 'response',
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            message: 'Endpoint is reachable and configured correctly',
            encryption_supported: encryptionEnabled,
            server_info: {
              version: '1.0.0',
              capabilities: ['data_exchange', 'encryption', 'webhooks']
            }
          },
          duration
        });
        
        setLastPingResult({
          success: true,
          message: 'Endpoint is reachable and configured correctly',
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Ping Successful",
          description: "Your endpoint is configured correctly and ready to receive data.",
        });
      } else {
        // Log error response
        onAddApiLog({
          type: 'error',
          status: 500,
          statusText: 'Internal Server Error',
          data: {
            success: false,
            error: 'Connection timeout or server error',
            details: 'Please check your endpoint URL and server configuration'
          },
          duration
        });
        
        setLastPingResult({
          success: false,
          message: 'Connection timeout or server error',
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Ping Failed",
          description: "Could not reach your endpoint. Please check the URL and server configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log network error
      onAddApiLog({
        type: 'error',
        status: 0,
        statusText: 'Network Error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown network error'
        },
        duration
      });
      
      setLastPingResult({
        success: false,
        message: 'Network error occurred',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Network Error",
        description: "Failed to connect to the endpoint.",
        variant: "destructive",
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
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

  const clearApiLogs = () => {
    // This would need to be implemented in the parent component
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
                  Back to Flow Builder
                </Button>
                <div>
                  <DialogTitle className="text-lg flex items-center">
                    <Server className="w-5 h-5 mr-2" />
                    Data Exchange Configuration
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure your endpoint for WhatsApp Flows data exchange
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content - Vertical Split */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="vertical">
              {/* Top Panel - Configuration */}
              <ResizablePanel defaultSize={60} minSize={40}>
                <div className="h-full overflow-y-auto p-6">
                  <Tabs defaultValue="endpoint" className="h-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="endpoint">Endpoint</TabsTrigger>
                      <TabsTrigger value="encryption">Encryption</TabsTrigger>
                      <TabsTrigger value="testing">Testing</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="endpoint" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Webhook className="w-5 h-5 mr-2" />
                            Endpoint Configuration
                          </CardTitle>
                          <CardDescription>
                            Configure your server endpoint to receive WhatsApp Flows data
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="endpoint-url">Endpoint URL</Label>
                            <Input
                              id="endpoint-url"
                              value={endpointUrl}
                              onChange={(e) => setEndpointUrl(e.target.value)}
                              placeholder="https://your-server.com/whatsapp-flows"
                              className="font-mono"
                            />
                            <p className="text-xs text-gray-500">
                              This URL will receive POST requests with flow data when users submit forms
                            </p>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Send className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Test Connection</span>
                            </div>
                            <Button
                              onClick={handlePingEndpoint}
                              disabled={isPinging || !endpointUrl.trim()}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {isPinging ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  Pinging...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3 mr-2" />
                                  Ping Endpoint
                                </>
                              )}
                            </Button>
                          </div>

                          {lastPingResult && (
                            <Alert className={lastPingResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                              {lastPingResult.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                              <AlertDescription className={lastPingResult.success ? "text-green-800" : "text-red-800"}>
                                <div className="font-medium">
                                  {lastPingResult.success ? 'Connection Successful' : 'Connection Failed'}
                                </div>
                                <div className="text-sm mt-1">{lastPingResult.message}</div>
                                <div className="text-xs mt-1 opacity-75">
                                  {new Date(lastPingResult.timestamp).toLocaleString()}
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Code className="w-5 h-5 mr-2" />
                            Implementation Guide
                          </CardTitle>
                          <CardDescription>
                            Basic endpoint implementation example
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                              <div className="text-green-400 mb-2">// Node.js Express Example</div>
                              <div className="text-blue-400">app</div>
                              <span className="text-white">.post(</span>
                              <span className="text-yellow-400">'/whatsapp-flows'</span>
                              <span className="text-white">{`, (req, res) => {`}</span>
                              <br />
                              <span className="ml-4 text-blue-400">const</span>
                              <span className="text-white"> flowData = req.body;</span>
                              <br />
                              <span className="ml-4 text-green-400">// Process the flow data</span>
                              <br />
                              <span className="ml-4 text-white">console.log(flowData);</span>
                              <br />
                              <span className="ml-4 text-white">{`res.json({ success: `}</span>
                              <span className="text-blue-400">true</span>
                              <span className="text-white">{` });`}</span>
                              <br />
                              <span className="text-white">{`});`}</span>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyToClipboard(`app.post('/whatsapp-flows', (req, res) => {
  const flowData = req.body;
  // Process the flow data
  console.log(flowData);
  res.json({ success: true });
});`)}
                              className="w-full"
                            >
                              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                              Copy Example Code
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="encryption" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Shield className="w-5 h-5 mr-2" />
                            Encryption Settings
                          </CardTitle>
                          <CardDescription>
                            Configure end-to-end encryption for secure data transmission
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Lock className="w-5 h-5 text-gray-600" />
                              <div>
                                <div className="font-medium text-sm">Enable Encryption</div>
                                <div className="text-xs text-gray-500">Encrypt data before sending to your endpoint</div>
                              </div>
                            </div>
                            <Switch
                              checked={encryptionEnabled}
                              onCheckedChange={setEncryptionEnabled}
                            />
                          </div>

                          {encryptionEnabled && (
                            <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                              <div className="space-y-2">
                                <Label htmlFor="public-key">Public Key (PEM Format)</Label>
                                <Textarea
                                  id="public-key"
                                  value={publicKey}
                                  onChange={(e) => setPublicKey(e.target.value)}
                                  placeholder="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
                                  className="font-mono text-xs"
                                  rows={6}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="private-key">Private Key (PEM Format)</Label>
                                <Textarea
                                  id="private-key"
                                  value={privateKey}
                                  onChange={(e) => setPrivateKey(e.target.value)}
                                  placeholder="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
                                  className="font-mono text-xs"
                                  rows={6}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="passphrase">Passphrase (Optional)</Label>
                                <Input
                                  id="passphrase"
                                  type="password"
                                  value={passphrase}
                                  onChange={(e) => setPassphrase(e.target.value)}
                                  placeholder="Enter passphrase if your private key is encrypted"
                                />
                              </div>

                              <Alert className="border-blue-200 bg-blue-50">
                                <Key className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                  <div className="font-medium">Encryption Information</div>
                                  <div className="text-sm mt-1">
                                    WhatsApp Flows uses RSA encryption with OAEP padding. 
                                    Generate your key pair using OpenSSL or your preferred cryptographic library.
                                  </div>
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="testing" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Terminal className="w-5 h-5 mr-2" />
                            Test Your Implementation
                          </CardTitle>
                          <CardDescription>
                            Send test data to verify your endpoint configuration
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Alert className="border-orange-200 bg-orange-50">
                            <Lightbulb className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              <div className="font-medium">Testing Tips</div>
                              <div className="text-sm mt-1">
                                Use tools like ngrok to expose your local development server for testing.
                                Check the API console below for detailed request/response logs.
                              </div>
                            </AlertDescription>
                          </Alert>

                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              onClick={handlePingEndpoint}
                              disabled={isPinging}
                              className="w-full"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Test Ping
                            </Button>
                            
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Simulate sending test flow data
                                onAddApiLog({
                                  type: 'request',
                                  method: 'POST',
                                  endpoint: endpointUrl,
                                  data: {
                                    flow_token: "test_token_123",
                                    screen_data: {
                                      screen_0: {
                                        text_input_1: "Test User Input",
                                        checkbox_group_1: ["option_1", "option_2"]
                                      }
                                    }
                                  }
                                });
                              }}
                              className="w-full"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Send Test Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Bottom Panel - API Console */}
              <ResizablePanel defaultSize={40} minSize={20}>
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
                        <p className="text-xs mt-1">Test your endpoint to see API interactions</p>
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
                                      handleCopyToClipboard(JSON.stringify(log.data, null, 2));
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
                  WhatsApp Flows Data Exchange
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Configure your server endpoint to receive form submissions from WhatsApp Flows. 
                  Enable encryption for secure data transmission and test your implementation with the API console.
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                  <a 
                    href="https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    • View Documentation
                  </a>
                  <span>• Test endpoint connectivity</span>
                  <span>• Monitor API requests in real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}