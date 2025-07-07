import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFlowStore, FlowComponent, FlowScreen } from '@/store/flowStore';
import { 
  ArrowLeft, 
  ArrowRight,
  Smartphone, 
  Wifi, 
  Battery, 
  Signal, 
  Calendar,
  ChevronDown,
  X,
  CheckCircle,
  MoreHorizontal,
  List,
  RotateCcw,
  Home,
  Camera,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormDataState {
  [fieldName: string]: any;
}

interface FlowState {
  currentScreenId: string;
  formData: FormDataState;
  completedFlow: boolean;
  flowPath: string[];
  errors: Record<string, string>;
}

export function InteractivePreviewModal({ open, onOpenChange }: PreviewModalProps) {
  const { flowData } = useFlowStore();
  
  // Initialize flow state
  const [flowState, setFlowState] = useState<FlowState>({
    currentScreenId: '',
    formData: {},
    completedFlow: false,
    flowPath: [],
    errors: {}
  });
  
  const [showScreenSelector, setShowScreenSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset flow state when modal opens
  useEffect(() => {
    if (open && flowData.screens.length > 0) {
      const firstScreen = flowData.screens[0];
      setFlowState({
        currentScreenId: firstScreen.id,
        formData: {},
        completedFlow: false,
        flowPath: [firstScreen.id],
        errors: {}
      });
    }
  }, [open, flowData]);

  const currentScreen = flowData.screens.find(s => s.id === flowState.currentScreenId);
  const currentScreenIndex = flowData.screens.findIndex(s => s.id === flowState.currentScreenId);
  const canGoNext = currentScreenIndex < flowData.screens.length - 1;
  const canGoPrevious = currentScreenIndex > 0;

  // Handle form input changes
  const handleInputChange = (name: string, value: any) => {
    setFlowState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: value
      },
      errors: {
        ...prev.errors,
        [name]: '' // Clear error when user starts typing
      }
    }));
  };

  // Validate required fields
  const validateScreen = (screen: FlowScreen): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    const validateComponent = (component: FlowComponent) => {
      if (component.required && component.name) {
        const value = flowState.formData[component.name];
        
        if (!value || (Array.isArray(value) && value.length === 0) || 
            (typeof value === 'string' && value.trim() === '')) {
          errors[component.name] = `${component.label || component.name} is required`;
          isValid = false;
        }
      }

      // Validate children (for Form components)
      if (component.children) {
        component.children.forEach(validateComponent);
      }
    };

    screen.data.forEach(validateComponent);

    setFlowState(prev => ({ ...prev, errors }));
    return isValid;
  };

  // Handle button clicks with navigation logic
  const handleButtonClick = async (component: FlowComponent) => {
    if (!component.on_click_action) return;

    // Validate current screen before navigation
    if (currentScreen && !validateScreen(currentScreen)) {
      return; // Don't navigate if validation fails
    }

    setIsSubmitting(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const action = component.on_click_action;

    if (action.name === 'navigate' && action.next?.name) {
      const targetScreen = flowData.screens.find(s => s.id === action.next?.name);
      if (targetScreen) {
        setFlowState(prev => ({
          ...prev,
          currentScreenId: targetScreen.id,
          flowPath: [...prev.flowPath, targetScreen.id]
        }));
      }
    } else if (action.name === 'complete') {
      setFlowState(prev => ({
        ...prev,
        completedFlow: true
      }));
    } else if (action.name === 'open_url' && action.payload?.url) {
      // Simulate opening URL (in real WhatsApp, this would open the browser)
      window.open(action.payload.url, '_blank');
    }

    setIsSubmitting(false);
  };

  // Handle form submission
  const handleFormSubmit = async (formComponent: FlowComponent) => {
    if (!currentScreen || !validateScreen(currentScreen)) {
      return;
    }

    setIsSubmitting(true);

    // Collect form data
    const formValues: Record<string, any> = {};
    
    if (formComponent.children) {
      formComponent.children.forEach(child => {
        if (child.name && flowState.formData[child.name] !== undefined) {
          formValues[child.name] = flowState.formData[child.name];
        }
      });
    }

    console.log('Form submitted:', formValues);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to next screen or complete flow
    const nextScreen = flowData.screens.find(s => s.id !== flowState.currentScreenId);
    if (nextScreen) {
      setFlowState(prev => ({
        ...prev,
        currentScreenId: nextScreen.id,
        flowPath: [...prev.flowPath, nextScreen.id]
      }));
    } else {
      setFlowState(prev => ({
        ...prev,
        completedFlow: true
      }));
    }

    setIsSubmitting(false);
  };

  // Navigation helpers
  const handleNextScreen = () => {
    if (canGoNext) {
      const nextScreen = flowData.screens[currentScreenIndex + 1];
      setFlowState(prev => ({
        ...prev,
        currentScreenId: nextScreen.id,
        flowPath: [...prev.flowPath, nextScreen.id]
      }));
    }
  };

  const handlePreviousScreen = () => {
    if (canGoPrevious) {
      const prevScreen = flowData.screens[currentScreenIndex - 1];
      setFlowState(prev => ({
        ...prev,
        currentScreenId: prevScreen.id,
        flowPath: prev.flowPath.slice(0, -1)
      }));
    }
  };

  const handleScreenSelect = (screenId: string) => {
    setFlowState(prev => ({
      ...prev,
      currentScreenId: screenId,
      flowPath: [...prev.flowPath, screenId]
    }));
    setShowScreenSelector(false);
  };

  const resetPreview = () => {
    if (flowData.screens.length > 0) {
      const firstScreen = flowData.screens[0];
      setFlowState({
        currentScreenId: firstScreen.id,
        formData: {},
        completedFlow: false,
        flowPath: [firstScreen.id],
        errors: {}
      });
    }
  };

  // Render interactive components
  const renderInteractiveComponent = (component: FlowComponent): React.ReactNode => {
    const hasError = flowState.errors[component.name || ''];

    switch (component.type) {
      case 'Image':
        return (
          <div key={component.id} className="mb-4">
            {component.src ? (
              <img
                src={component.src}
                alt={component.alt_text || "Flow image"}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-500">No image selected</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'TextHeading':
        return (
          <h2 key={component.id} className="text-xl font-bold text-gray-900 mb-4 leading-tight">
            {component.text || 'Headline'}
          </h2>
        );

      case 'TextSubheading':
        return (
          <h3 key={component.id} className="text-lg font-semibold text-gray-800 mb-3 leading-snug">
            {component.text || 'Subheading'}
          </h3>
        );

      case 'TextBody':
        return (
          <p key={component.id} className="text-sm text-gray-700 mb-4 leading-relaxed whitespace-pre-line">
            {component.text || 'Text content'}
          </p>
        );

      case 'TextCaption':
        return (
          <p key={component.id} className="text-xs text-gray-600 mb-3 leading-relaxed">
            {component.text || 'Caption'}
          </p>
        );

      case 'RichText':
        return (
          <div key={component.id} className="text-sm text-gray-700 mb-4 leading-relaxed">
            <div dangerouslySetInnerHTML={{ 
              __html: (component.text || 'Rich text content')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>')
            }} />
          </div>
        );

      case 'TextInput':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <Input
              type={component.input_type || 'text'}
              value={flowState.formData[component.name || ''] || ''}
              onChange={(e) => handleInputChange(component.name || '', e.target.value)}
              placeholder={component.helper_text || "Enter text..."}
              className={cn(
                "w-full transition-colors",
                hasError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-green-500"
              )}
              maxLength={component.max_length}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {hasError}
              </p>
            )}
            {component.max_length && (
              <p className="text-xs text-gray-500 mt-1">
                {(flowState.formData[component.name || ''] || '').length}/{component.max_length}
              </p>
            )}
          </div>
        );

      case 'TextArea':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <Textarea
              value={flowState.formData[component.name || ''] || ''}
              onChange={(e) => handleInputChange(component.name || '', e.target.value)}
              placeholder={component.helper_text || "Enter details..."}
              className={cn(
                "w-full transition-colors",
                hasError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-green-500"
              )}
              rows={3}
              maxLength={component.max_length}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {hasError}
              </p>
            )}
          </div>
        );

      case 'DatePicker':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <div className="relative">
              <Input
                type="date"
                value={flowState.formData[component.name || ''] || ''}
                onChange={(e) => handleInputChange(component.name || '', e.target.value)}
                min={component.min_date}
                max={component.max_date}
                className={cn(
                  "w-full transition-colors",
                  hasError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-green-500"
                )}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {hasError && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {hasError}
              </p>
            )}
          </div>
        );

      case 'Dropdown':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <Select
              value={flowState.formData[component.name || ''] || ''}
              onValueChange={(value) => handleInputChange(component.name || '', value)}
            >
              <SelectTrigger className={cn(
                "w-full transition-colors",
                hasError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-green-500"
              )}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {component.data_source?.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {hasError}
              </p>
            )}
          </div>
        );

      case 'CheckboxGroup':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-3 block">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <div className="space-y-3">
              {component.data_source?.map((option) => {
                const currentValues = flowState.formData[component.name || ''] || [];
                const isChecked = currentValues.includes(option.id);
                
                return (
                  <div key={option.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentValues = flowState.formData[component.name || ''] || [];
                        let newValues;
                        if (checked) {
                          newValues = [...currentValues, option.id];
                        } else {
                          newValues = currentValues.filter((v: string) => v !== option.id);
                        }
                        handleInputChange(component.name || '', newValues);
                      }}
                      className="whatsapp-checkbox"
                    />
                    <Label htmlFor={option.id} className="text-sm cursor-pointer">
                      {option.title}
                    </Label>
                  </div>
                );
              })}
            </div>
            {hasError && (
              <p className="text-red-500 text-xs mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {hasError}
              </p>
            )}
          </div>
        );

      case 'RadioButtonsGroup':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-3 block">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <RadioGroup
              value={flowState.formData[component.name || ''] || ''}
              onValueChange={(value) => handleInputChange(component.name || '', value)}
            >
              {component.data_source?.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="whatsapp-radio"
                  />
                  <Label htmlFor={option.id} className="text-sm cursor-pointer">
                    {option.title}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && (
              <p className="text-red-500 text-xs mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {hasError}
              </p>
            )}
          </div>
        );

      case 'OptIn':
        return (
          <div key={component.id} className="mb-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id={component.id}
                checked={flowState.formData[component.name || ''] || false}
                onCheckedChange={(checked) => handleInputChange(component.name || '', checked)}
                className="whatsapp-checkbox mt-1"
              />
              <Label htmlFor={component.id} className="text-sm leading-relaxed cursor-pointer">
                {component.label || 'I agree to the terms and conditions'}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {hasError && (
              <p className="text-red-500 text-xs mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {hasError}
              </p>
            )}
          </div>
        );

      case 'Button':
        return (
          <div key={component.id} className="mb-4">
            <Button
              onClick={() => handleButtonClick(component)}
              disabled={isSubmitting}
              className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm whatsapp-button transition-all"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                component.title || 'Button'
              )}
            </Button>
          </div>
        );

      case 'Form':
        return (
          <Card key={component.id} className="p-4 mb-4 border border-gray-200 bg-gray-50">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {component.name || 'Form'}
              </h3>
            </div>
            
            {component.children?.map(child => renderInteractiveComponent(child))}
            
            <Button
              onClick={() => handleFormSubmit(component)}
              disabled={isSubmitting}
              className="w-full mt-4 whatsapp-button font-semibold"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Form'
              )}
            </Button>
          </Card>
        );

      case 'Footer':
        return (
          <div key={component.id} className="mt-6 pt-4 border-t">
            <Button
              onClick={() => handleButtonClick(component)}
              disabled={isSubmitting}
              className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm whatsapp-button"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                component.text || component.label || 'Continue'
              )}
            </Button>
          </div>
        );

      case 'EmbeddedLink':
        return (
          <div key={component.id} className="mb-4">
            <Button
              variant="link"
              onClick={() => handleButtonClick(component)}
              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal underline"
            >
              {component.text || 'Click here'}
            </Button>
          </div>
        );

      // Placeholder for components that can't be fully simulated
      case 'ChipsSelector':
      case 'ImageCarousel':
      case 'PhotoPicker':
      case 'DocumentPicker':
        return (
          <div key={component.id} className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{component.type}</span>
            </div>
            <div className="text-xs text-blue-700">
              This component will work in the actual WhatsApp flow but cannot be fully simulated in preview.
            </div>
            {component.label && (
              <div className="text-sm text-blue-800 mt-1">{component.label}</div>
            )}
          </div>
        );

      default:
        return (
          <div key={component.id} className="p-3 bg-gray-100 rounded mb-4">
            <span className="text-sm text-gray-600">{component.type}</span>
          </div>
        );
    }
  };

  // Handle empty flow
  if (!currentScreen && !flowState.completedFlow) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle>Flow Preview</DialogTitle>
          <div className="text-center py-8">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No screens found in this flow.</p>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none p-0 bg-transparent border-none shadow-none">
        <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50">
          {/* Phone Container */}
          <div className="w-[375px] h-[750px] bg-gray-900 rounded-[40px] shadow-2xl p-2 flex flex-col">
            {/* Phone Screen */}
            <div className="bg-white rounded-[35px] flex-1 flex flex-col overflow-hidden">
              {/* Status Bar */}
              <div className="px-6 py-2 flex items-center justify-between text-xs font-medium">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                  </div>
                  <Signal className="w-3 h-3 text-gray-900 ml-2" />
                  <Wifi className="w-3 h-3 text-gray-900" />
                </div>
                <div className="text-gray-900">9:41 AM</div>
                <div className="flex items-center space-x-1">
                  <Battery className="w-4 h-4 text-gray-900" />
                  <span className="text-gray-900">100%</span>
                </div>
              </div>

              {/* WhatsApp Header */}
              <div className="px-4 py-3 bg-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="p-1 hover:bg-green-700 text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div>
                      <DialogTitle className="font-semibold text-white">
                        {flowState.completedFlow ? 'Flow Complete' : currentScreen?.title || 'Preview'}
                      </DialogTitle>
                      <p className="text-xs text-green-100">
                        {flowState.completedFlow 
                          ? 'Thank you for completing the flow' 
                          : `Screen ${currentScreenIndex + 1} of ${flowData.screens.length}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {!flowState.completedFlow && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePreviousScreen}
                          disabled={!canGoPrevious}
                          className="p-1 hover:bg-green-700 text-white disabled:opacity-50"
                          title="Previous screen"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowScreenSelector(!showScreenSelector)}
                          className="p-1 hover:bg-green-700 text-white"
                          title="Select screen"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNextScreen}
                          disabled={!canGoNext}
                          className="p-1 hover:bg-green-700 text-white disabled:opacity-50"
                          title="Next screen"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetPreview}
                      className="p-1 hover:bg-green-700 text-white"
                      title="Reset preview"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Screen Selector Dropdown */}
                {showScreenSelector && !flowState.completedFlow && (
                  <div className="absolute top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2">Jump to Screen</div>
                      {flowData.screens.map((screen, index) => (
                        <button
                          key={screen.id}
                          onClick={() => handleScreenSelect(screen.id)}
                          className={cn(
                            "w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100",
                            flowState.currentScreenId === screen.id ? "bg-green-50 text-green-700" : "text-gray-700"
                          )}
                        >
                          <div className="font-medium">{screen.title}</div>
                          <div className="text-xs text-gray-500">Screen {index + 1}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {flowState.completedFlow ? (
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Flow Completed Successfully!
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Thank you for completing the flow. Your responses have been recorded.
                    </p>
                    
                    {/* Show collected data */}
                    <Card className="p-4 text-left bg-white">
                      <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Collected Data:
                      </h4>
                      {Object.keys(flowState.formData).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(flowState.formData).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="text-gray-900">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No data collected</p>
                      )}
                    </Card>
                    
                    <Button 
                      onClick={resetPreview} 
                      className="mt-6 whatsapp-button"
                      style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Over
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentScreen?.data.map(component => renderInteractiveComponent(component))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 text-center text-xs text-gray-400 bg-white border-t">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Powered by WhatsApp Business</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}