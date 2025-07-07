import { useState } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewModal({ open, onOpenChange }: PreviewModalProps) {
  const { flowData } = useFlowStore();
  const [currentScreenId, setCurrentScreenId] = useState(flowData.screens[0]?.id || '');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [completedFlow, setCompletedFlow] = useState(false);
  const [showScreenSelector, setShowScreenSelector] = useState(false);

  const currentScreen = flowData.screens.find(s => s.id === currentScreenId);
  const currentScreenIndex = flowData.screens.findIndex(s => s.id === currentScreenId);
  const canGoNext = currentScreenIndex < flowData.screens.length - 1;
  const canGoPrevious = currentScreenIndex > 0;

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleButtonClick = (component: FlowComponent) => {
    if (component.on_click_action?.name === 'navigate' && component.on_click_action.next?.name) {
      const targetScreen = flowData.screens.find(s => s.id === component.on_click_action?.next?.name);
      if (targetScreen) {
        setCurrentScreenId(targetScreen.id);
      }
    } else if (component.on_click_action?.name === 'complete') {
      setCompletedFlow(true);
    }
  };

  const handleFormSubmit = (formComponent: FlowComponent) => {
    const formValues: Record<string, any> = {};
    
    if (formComponent.children) {
      formComponent.children.forEach(child => {
        if (child.name && formData[child.name] !== undefined) {
          formValues[child.name] = formData[child.name];
        }
      });
    }

    console.log('Form submitted:', formValues);
    
    const nextScreen = flowData.screens.find(s => s.id !== currentScreenId);
    if (nextScreen) {
      setCurrentScreenId(nextScreen.id);
    } else {
      setCompletedFlow(true);
    }
  };

  const handleNextScreen = () => {
    if (canGoNext) {
      setCurrentScreenId(flowData.screens[currentScreenIndex + 1].id);
    }
  };

  const handlePreviousScreen = () => {
    if (canGoPrevious) {
      setCurrentScreenId(flowData.screens[currentScreenIndex - 1].id);
    }
  };

  const handleScreenSelect = (screenId: string) => {
    setCurrentScreenId(screenId);
    setShowScreenSelector(false);
  };

  const resetPreview = () => {
    setCurrentScreenId(flowData.screens[0]?.id || '');
    setFormData({});
    setCompletedFlow(false);
  };

  const renderInteractiveComponent = (component: FlowComponent): React.ReactNode => {
    switch (component.type) {
      case 'Image':
        return (
          <div key={component.id} className="mb-4">
            {component.src ? (
              <img
                src={component.src}
                alt="Flow image"
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>
        );

      case 'TextHeading':
        return (
          <h2 key={component.id} className="text-lg font-bold text-gray-900 mb-3">
            {component.text || 'Headline'}
          </h2>
        );

      case 'TextSubheading':
        return (
          <h3 key={component.id} className="text-base font-semibold text-gray-800 mb-3">
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
            {component.text || 'Rich text content'}
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
              value={formData[component.name || ''] || ''}
              onChange={(e) => handleInputChange(component.name || '', e.target.value)}
              placeholder="Enter text..."
              className="w-full"
            />
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
              value={formData[component.name || ''] || ''}
              onChange={(e) => handleInputChange(component.name || '', e.target.value)}
              placeholder="Enter details..."
              className="w-full"
              rows={3}
            />
          </div>
        );

      case 'DatePicker':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                {component.label}
              </Label>
            )}
            <div className="relative">
              <Input
                type="date"
                value={formData[component.name || ''] || ''}
                onChange={(e) => handleInputChange(component.name || '', e.target.value)}
                min={component.min_date}
                max={component.max_date}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'Dropdown':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-2 block">
                {component.label}
              </Label>
            )}
            <Select
              value={formData[component.name || ''] || ''}
              onValueChange={(value) => handleInputChange(component.name || '', value)}
            >
              <SelectTrigger>
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
            <div className="space-y-2">
              {component.data_source?.map((option) => {
                const currentValues = formData[component.name || ''] || [];
                const isChecked = currentValues.includes(option.id);
                
                return (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentValues = formData[component.name || ''] || [];
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
                    <Label htmlFor={option.id} className="text-sm">
                      {option.title}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'RadioButtonsGroup':
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <Label className="text-sm font-medium text-gray-900 mb-3 block">
                {component.label}
              </Label>
            )}
            <RadioGroup
              value={formData[component.name || ''] || ''}
              onValueChange={(value) => handleInputChange(component.name || '', value)}
            >
              {component.data_source?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="whatsapp-radio"
                  />
                  <Label htmlFor={option.id} className="text-sm">
                    {option.title}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'OptIn':
        return (
          <div key={component.id} className="mb-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id={component.id}
                checked={formData[component.name || ''] || false}
                onCheckedChange={(checked) => handleInputChange(component.name || '', checked)}
                className="whatsapp-checkbox mt-1"
              />
              <Label htmlFor={component.id} className="text-sm leading-relaxed">
                {component.label || 'I agree to the terms and conditions'}
              </Label>
            </div>
          </div>
        );

      case 'Button':
        return (
          <div key={component.id} className="mb-4">
            <Button
              onClick={() => handleButtonClick(component)}
              className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm whatsapp-button"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              {component.title || 'Button'}
            </Button>
          </div>
        );

      case 'Form':
        return (
          <Card key={component.id} className="p-4 mb-4 border-2 border-dashed border-blue-300 bg-blue-50">
            <div className="mb-4">
              <h3 className="font-medium text-blue-900">
                Form: {component.name || 'Unnamed'}
              </h3>
            </div>
            
            {component.children?.map(child => renderInteractiveComponent(child))}
            
            <Button
              onClick={() => handleFormSubmit(component)}
              className="w-full mt-4 whatsapp-button"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              Submit Form
            </Button>
          </Card>
        );

      case 'Footer':
        return (
          <div key={component.id} className="mt-6 pt-4 border-t">
            <Button
              onClick={() => handleButtonClick(component)}
              className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm whatsapp-button"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              {component.text || component.label || 'Continue'}
            </Button>
          </div>
        );

      // Placeholder for unsupported components
      case 'ChipsSelector':
      case 'ImageCarousel':
      case 'PhotoPicker':
      case 'DocumentPicker':
      case 'EmbeddedLink':
        return (
          <div key={component.id} className="p-3 bg-gray-100 rounded mb-4 border border-gray-300">
            <div className="text-sm text-gray-600 font-medium">{component.type}</div>
            <div className="text-xs text-gray-500 mt-1">
              Preview not available - component will work in actual WhatsApp flow
            </div>
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

  if (!currentScreen && !completedFlow) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle>Flow Preview</DialogTitle>
          <div className="text-center py-8">
            <p className="text-gray-500">No screens found in this flow.</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
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
          {/* Phone Container - Hyper-realistic */}
          <div className="w-[360px] h-[720px] bg-gray-900 rounded-3xl shadow-2xl p-2 flex flex-col">
            {/* Phone Screen */}
            <div className="bg-white rounded-2xl flex-1 flex flex-col overflow-hidden">
              {/* Phone Header - WhatsApp Style */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between mb-2">
                  {/* Status Bar */}
                  <div className="flex items-center space-x-1 text-xs">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                    </div>
                    <Signal className="w-3 h-3 text-gray-900" />
                    <Wifi className="w-3 h-3 text-gray-900" />
                    <Battery className="w-3 h-3 text-gray-900" />
                  </div>
                  <div className="text-xs font-medium text-gray-900">9:41 AM</div>
                </div>
                
                {/* App Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="p-1 hover:bg-gray-100"
                    >
                      <X className="w-5 h-5 text-gray-700" />
                    </Button>
                    <div>
                      <DialogTitle className="font-semibold text-gray-900">
                        {completedFlow ? 'Flow Complete' : currentScreen?.title || 'Preview'}
                      </DialogTitle>
                      <p className="text-xs text-gray-500">
                        {completedFlow ? 'Flow completed' : `Screen ${currentScreenIndex + 1} of ${flowData.screens.length}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!completedFlow && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePreviousScreen}
                          disabled={!canGoPrevious}
                          className="p-1 hover:bg-gray-100 disabled:opacity-50"
                          title="Previous screen"
                        >
                          <ArrowLeft className="w-4 h-4 text-gray-700" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowScreenSelector(!showScreenSelector)}
                          className="p-1 hover:bg-gray-100"
                          title="Select screen"
                        >
                          <List className="w-4 h-4 text-gray-700" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNextScreen}
                          disabled={!canGoNext}
                          className="p-1 hover:bg-gray-100 disabled:opacity-50"
                          title="Next screen"
                        >
                          <ArrowRight className="w-4 h-4 text-gray-700" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetPreview}
                      className="p-1 hover:bg-gray-100"
                      title="Reset preview"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-700" />
                    </Button>
                  </div>
                </div>
                
                {/* Screen Selector Dropdown */}
                {showScreenSelector && !completedFlow && (
                  <div className="absolute top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2">Jump to Screen</div>
                      {flowData.screens.map((screen, index) => (
                        <button
                          key={screen.id}
                          onClick={() => handleScreenSelect(screen.id)}
                          className={cn(
                            "w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100",
                            currentScreenId === screen.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
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

              {/* Phone Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {completedFlow ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Flow Completed!
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      The user has successfully completed the flow.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg text-left">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">
                        Collected Data:
                      </h4>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(formData, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  currentScreen?.data.map(component => renderInteractiveComponent(component))
                )}
              </div>

              {/* Phone Footer */}
              <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 border-t">
                {completedFlow ? (
                  <Button onClick={resetPreview} size="sm" className="text-xs">
                    Start Over
                  </Button>
                ) : (
                  "Managed by the business. Learn more"
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}