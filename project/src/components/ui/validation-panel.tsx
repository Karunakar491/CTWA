import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ValidationError } from '@/lib/whatsapp-flows-validator';
import { cn } from '@/lib/utils';

interface ValidationPanelProps {
  errors: ValidationError[];
  isValidating: boolean;
  onRevalidate: () => void;
  onErrorClick?: (error: ValidationError) => void;
  className?: string;
}

export function ValidationPanel({ 
  errors, 
  isValidating, 
  onRevalidate, 
  onErrorClick,
  className 
}: ValidationPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['error']));

  const errorsByCategory = {
    error: errors.filter(e => e.severity === 'error'),
    warning: errors.filter(e => e.severity === 'warning'),
    info: errors.filter(e => e.severity === 'info')
  };

  const totalErrors = errorsByCategory.error.length;
  const totalWarnings = errorsByCategory.warning.length;
  const totalInfo = errorsByCategory.info.length;
  const isValid = totalErrors === 0;

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getSeverityIcon = (severity: ValidationError['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: ValidationError['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const formatPath = (path: string) => {
    return path.replace(/^\//, '').replace(/\//g, ' → ');
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Flow Validation</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRevalidate}
            disabled={isValidating}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("w-3 h-3", isValidating && "animate-spin")} />
            <span>Revalidate</span>
          </Button>
        </div>

        {/* Status Summary */}
        <div className="space-y-2">
          {isValid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-medium">Flow is valid!</div>
                <div className="text-sm mt-1">
                  Your WhatsApp Flow meets all requirements and is ready for deployment.
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Flow has validation errors</div>
                <div className="text-sm mt-1">
                  Fix the errors below before deploying your flow.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Summary Badges */}
          <div className="flex items-center space-x-2">
            {totalErrors > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalErrors} Error{totalErrors !== 1 ? 's' : ''}
              </Badge>
            )}
            {totalWarnings > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                {totalWarnings} Warning{totalWarnings !== 1 ? 's' : ''}
              </Badge>
            )}
            {totalInfo > 0 && (
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                {totalInfo} Info
              </Badge>
            )}
            {isValid && (
              <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                Valid
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Validation Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isValidating && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Validating flow...</span>
              </div>
            </div>
          )}

          {!isValidating && errors.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">All Good!</h3>
              <p className="text-sm text-gray-500">
                Your WhatsApp Flow passes all validation checks.
              </p>
            </div>
          )}

          {!isValidating && errors.length > 0 && (
            <div className="space-y-4">
              {/* Error Category Sections */}
              {(['error', 'warning', 'info'] as const).map((category) => {
                const categoryErrors = errorsByCategory[category];
                if (categoryErrors.length === 0) return null;

                const isExpanded = expandedCategories.has(category);
                const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1) + 's';

                return (
                  <Card key={category}>
                    <CardHeader 
                      className="pb-3 cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(category)}
                          <CardTitle className="text-sm">
                            {categoryTitle} ({categoryErrors.length})
                          </CardTitle>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {categoryErrors.map((error, index) => (
                            <div key={index}>
                              <div 
                                className={cn(
                                  "p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow",
                                  getSeverityColor(error.severity)
                                )}
                                onClick={() => onErrorClick?.(error)}
                              >
                                <div className="flex items-start space-x-2">
                                  {getSeverityIcon(error.severity)}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">
                                      {error.message}
                                    </div>
                                    {error.path && error.path !== 'root' && (
                                      <div className="text-xs mt-1 opacity-75">
                                        Path: {formatPath(error.path)}
                                      </div>
                                    )}
                                    {error.value !== undefined && error.value !== null && (
                                      <div className="text-xs mt-1 opacity-75">
                                        Value: {typeof error.value === 'string' ? `"${error.value}"` : String(error.value)}
                                      </div>
                                    )}
                                  </div>
                                  <ExternalLink className="w-3 h-3 opacity-50" />
                                </div>
                              </div>
                              {index < categoryErrors.length - 1 && (
                                <Separator className="my-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Help Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-900 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                WhatsApp Flows Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-blue-700 text-xs">
                This validator checks your flow against the official WhatsApp Flows API specifications. 
                All errors must be fixed before your flow can be deployed to WhatsApp Business.
              </CardDescription>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.open('https://developers.facebook.com/docs/whatsapp/flows/reference/components', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}