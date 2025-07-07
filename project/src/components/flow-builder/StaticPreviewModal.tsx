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
import { useFlowStore, FlowComponent } from '@/store/flowStore';
import { 
  ArrowLeft, 
  ArrowRight,
  Smartphone, 
  Wifi, 
  Battery, 
  Signal, 
  Calendar,
  X,
  List,
  RotateCcw,
  Image as ImageIcon,
  FileText,
  Camera,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaticPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaticPreviewModal({ open, onOpenChange }: StaticPreviewModalProps) {
  const { flowData } = useFlowStore();
  const [currentScreenId, setCurrentScreenId] = useState('');
  const [showScreenSelector, setShowScreenSelector] = useState(false);

  // Initialize with first screen when modal opens
  useEffect(() => {
    if (open && flowData.screens.length > 0) {
      setCurrentScreenId(flowData.screens[0].id);
    }
  }, [open, flowData]);

  const currentScreen = flowData.screens.find(s => s.id === currentScreenId);
  const currentScreenIndex = flowData.screens.findIndex(s => s.id === currentScreenId);
  const canGoNext = currentScreenIndex < flowData.screens.length - 1;
  const canGoPrevious = currentScreenIndex > 0;

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
    if (flowData.screens.length > 0) {
      setCurrentScreenId(flowData.screens[0].id);
    }
  };

  // Render static (non-interactive) components
  const renderStaticComponent = (component: FlowComponent): React.ReactNode => {
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
              placeholder={component.helper_text || "Enter text..."}
              className="w-full border-gray-300"
              disabled
              value=""
            />
            {component.max_length && (
              <p className="text-xs text-gray-500 mt-1">
                Max {component.max_length} characters
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
              placeholder={component.helper_text || "Enter details..."}
              className="w-full border-gray-300"
              rows={3}
              disabled
              value=""
            />
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
                type="text"
                placeholder="Select date..."
                className="w-full border-gray-300 pr-10"
                disabled
                value=""
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
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
            <div className="relative">
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-500 flex items-center justify-between">
                <span>Select an option...</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {component.data_source && component.data_source.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {component.data_source.length} options available
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
              {component.data_source?.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.id}
                    disabled
                    className="whatsapp-checkbox"
                  />
                  <Label htmlFor={option.id} className="text-sm text-gray-700">
                    {option.title}
                  </Label>
                </div>
              ))}
            </div>
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
            <RadioGroup disabled>
              {component.data_source?.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="whatsapp-radio"
                  />
                  <Label htmlFor={option.id} className="text-sm text-gray-700">
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
            <div className="flex items-start space-x-3">
              <Checkbox
                id={component.id}
                disabled
                className="whatsapp-checkbox mt-1"
              />
              <Label htmlFor={component.id} className="text-sm leading-relaxed text-gray-700">
                {component.label || 'I agree to the terms and conditions'}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
          </div>
        );

      case 'Button':
        return (
          <div key={component.id} className="mb-4">
            <Button
              disabled
              className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm whatsapp-button"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              {component.title || 'Button'}
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
            
            {component.children?.map(child => renderStaticComponent(child))}
            
            <Button
              disabled
              className="w-full mt-4 whatsapp-button font-semibold"
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
              disabled
              className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm whatsapp-button"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              {component.text || component.label || 'Continue'}
            </Button>
          </div>
        );

      case 'EmbeddedLink':
        return (
          <div key={component.id} className="mb-4">
            <span className="text-blue-600 underline text-sm">
              {component.text || 'Click here'}
            </span>
          </div>
        );

      // Placeholder for components that can't be fully displayed
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
              Preview not available - component will work in actual WhatsApp flow
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
  if (!currentScreen) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle>Static Preview</DialogTitle>
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
          {/* Phone Container - Realistic WhatsApp Style */}
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
                        {currentScreen?.title || 'Preview'}
                      </DialogTitle>
                      <p className="text-xs text-green-100">
                        Screen {currentScreenIndex + 1} of {flowData.screens.length} • Static Preview
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
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
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetPreview}
                      className="p-1 hover:bg-green-700 text-white"
                      title="Reset to first screen"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Screen Selector Dropdown */}
                {showScreenSelector && (
                  <div className="absolute top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2">Jump to Screen</div>
                      {flowData.screens.map((screen, index) => (
                        <button
                          key={screen.id}
                          onClick={() => handleScreenSelect(screen.id)}
                          className={cn(
                            "w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100",
                            currentScreenId === screen.id ? "bg-green-50 text-green-700" : "text-gray-700"
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
                <div className="space-y-4">
                  {currentScreen?.data.map(component => renderStaticComponent(component))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 text-center text-xs text-gray-400 bg-white border-t">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Static Preview • Managed by the business</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}