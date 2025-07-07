import { memo } from 'react';
import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { useFlowStore, FlowComponent } from '@/store/flowStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Smartphone, 
  Image as ImageIcon, 
  Calendar, 
  ChevronDown,
  FileText,
  X,
  Wifi,
  Battery,
  Signal,
  Edit2,
  Check
} from 'lucide-react';

interface ScreenNodeProps {
  data: {
    screenId: string;
    screen?: any;
  };
}

export const ScreenNode = memo(({ data }: ScreenNodeProps) => {
  const { 
    flowData, 
    selectedElementId, 
    setSelectedElementId, 
    componentErrorStatus,
    removeComponentFromForm,
    updateScreenTitle
  } = useFlowStore();
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  
  const screen = flowData.screens.find(s => s.id === data.screenId);

  if (!screen) return null;

  const handleStartEditingTitle = () => {
    setTempTitle(screen.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      updateScreenTitle(screen.id, tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false);
    setTempTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditingTitle();
    }
  };
  const renderComponent = (component: FlowComponent, isNested = false): React.ReactNode => {
    const isSelected = selectedElementId === component.id;
    const hasError = componentErrorStatus.has(component.id);
    
    const baseClasses = `cursor-pointer transition-all duration-300 border-2 ${
      isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
    } ${hasError ? 'border-red-500 bg-red-50 shadow-red-200 shadow-lg animate-pulse border-dashed' : 'border-transparent'} ${
      isNested ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''
    }`;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedElementId(component.id);
    };

    switch (component.type) {
      case 'Image':
        return (
          <div
            key={component.id}
            className={`p-3 rounded ${baseClasses} ${!hasError ? 'border-dashed border-gray-300 hover:border-gray-400' : 'hover:border-red-600'}`}
            onClick={handleClick}
          >
            {component.src ? (
              <img
                src={component.src}
                alt="Flow image"
                className="w-full h-32 object-cover rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-500">No image selected</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'Button':
        return (
          <div
            key={component.id}
            className={`p-2 rounded ${baseClasses} ${!hasError ? 'hover:bg-gray-50' : 'hover:bg-red-100'}`}
            onClick={handleClick}
          >
            <div className="flex justify-center">
              <Button 
                className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm"
                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                disabled
              >
                {component.title || 'Button'}
              </Button>
            </div>
            {component.on_click_action && (
              <p className="text-xs text-gray-500 text-center mt-1">
                Action: {component.on_click_action.name}
              </p>
            )}
          </div>
        );

      case 'DatePicker':
        return (
          <div
            key={component.id}
            className={`p-3 rounded space-y-2 ${baseClasses} ${!hasError ? 'hover:bg-gray-50' : 'hover:bg-red-100'}`}
            onClick={handleClick}
          >
            {component.label && (
              <Label className="text-sm font-medium text-gray-900">
                {component.label}
              </Label>
            )}
            <div className="relative">
              <Input 
                placeholder="Select date..." 
                className="text-sm pr-8 border-gray-300"
                style={{ focusBorderColor: '#25D366', focusRingColor: '#25D366' }}
                disabled
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {(component.min_date || component.max_date) && (
              <p className="text-xs text-gray-500">
                {component.min_date && `Min: ${component.min_date}`}
                {component.min_date && component.max_date && ' • '}
                {component.max_date && `Max: ${component.max_date}`}
              </p>
            )}
          </div>
        );

      case 'Dropdown':
        return (
          <div
            key={component.id}
            className={`p-3 rounded space-y-2 ${baseClasses} ${!hasError ? 'hover:bg-gray-50' : 'hover:bg-red-100'}`}
            onClick={handleClick}
          >
            {component.label && (
              <Label className="text-sm font-medium text-gray-900">
                {component.label}
              </Label>
            )}
            <Select disabled>
              <SelectTrigger className="text-sm border-gray-300">
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
            <p className="text-xs text-gray-500">
              {component.data_source?.length || 0} options
            </p>
          </div>
        );

      case 'Form':
        return (
          <div
            key={component.id}
            className={`p-4 rounded-lg border-2 border-dashed ${hasError ? 'border-red-400 bg-red-50' : 'border-blue-300 bg-blue-50'} space-y-3 ${baseClasses}`}
            onClick={handleClick}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-900">
                  Form: {component.name || 'Unnamed'}
                </span>
                {hasError && (
                  <Badge variant="destructive" className="text-xs">
                    Error
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-xs bg-white">
                {component.children?.length || 0} components
              </Badge>
            </div>
            
            {/* Render form children */}
            <div className="space-y-2">
              {component.children?.map((child) => (
                <div key={child.id} className="relative">
                  {renderComponent(child, true)}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeComponentFromForm(component.id, child.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              {(!component.children || component.children.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-xs">Empty form - add components in the inspector</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'TextHeading':
        return (
          <div
            key={component.id}
            className={`p-3 rounded ${baseClasses}`}
            onClick={handleClick}
          >
            <h3 className="font-bold text-lg text-gray-900 leading-tight">
              {component.text || 'Headline'}
            </h3>
          </div>
        );

      case 'TextSubheading':
        return (
          <div
            key={component.id}
            className={`p-3 rounded ${baseClasses}`}
            onClick={handleClick}
          >
            <h4 className="font-semibold text-base text-gray-800 leading-snug">
              {component.text || 'Subheading'}
            </h4>
          </div>
        );

      case 'TextBody':
        return (
          <div
            key={component.id}
            className={`p-3 rounded ${baseClasses}`}
            onClick={handleClick}
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              {component.text || 'Text'}
            </p>
          </div>
        );

      case 'TextCaption':
        return (
          <div
            key={component.id}
            className={`p-3 rounded ${baseClasses}`}
            onClick={handleClick}
          >
            <p className="text-xs text-gray-600 leading-relaxed">
              {component.text || 'Caption'}
            </p>
          </div>
        );

      case 'RichText':
        return (
          <div
            key={component.id}
            className={`p-3 rounded ${baseClasses}`}
            onClick={handleClick}
          >
            <div className="text-sm text-gray-700 leading-relaxed">
              {component.text || 'Rich text content'}
            </div>
          </div>
        );

      case 'TextInput':
        return (
          <div
            key={component.id}
            className={`p-3 rounded space-y-2 ${baseClasses}`}
            onClick={handleClick}
          >
            {component.label && (
              <Label className="text-sm font-medium text-gray-900">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <Input 
              placeholder="Enter text..." 
              className="text-sm border-gray-300 whatsapp-input"
              disabled
            />
          </div>
        );

      case 'TextArea':
        return (
          <div
            key={component.id}
            className={`p-3 rounded space-y-2 ${baseClasses}`}
            onClick={handleClick}
          >
            {component.label && (
              <Label className="text-sm font-medium text-gray-900">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <textarea 
              placeholder="Enter details..." 
              className="w-full text-sm border border-gray-300 rounded-md p-2 resize-none"
              rows={3}
              disabled
            />
          </div>
        );

      case 'CheckboxGroup':
        return (
          <div
            key={component.id}
            className={`p-3 rounded space-y-3 ${baseClasses}`}
            onClick={handleClick}
          >
            {component.label && (
              <Label className="text-sm font-medium text-gray-900">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <div className="space-y-2">
              {component.data_source?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={option.id} 
                    disabled 
                    className="whatsapp-checkbox"
                  />
                  <Label htmlFor={option.id} className="text-sm">
                    {option.title}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'RadioButtonsGroup':
        return (
          <div
            key={component.id}
            className={`p-3 rounded space-y-3 ${baseClasses}`}
            onClick={handleClick}
          >
            {component.label && (
              <Label className="text-sm font-medium text-gray-900">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            <RadioGroup disabled>
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

      case 'Footer':
        return (
          <div
            key={component.id}
            className={`p-4 bg-gray-50 border-t rounded-b ${baseClasses}`}
            onClick={handleClick}
          >
            <div className="flex justify-center">
              <Button 
                className="w-full font-semibold py-3 px-6 rounded-lg shadow-sm whatsapp-button"
                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
              >
                {component.text || component.label || 'Continue'}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div
            key={component.id}
            className={`p-3 rounded ${hasError ? 'bg-red-100' : 'bg-gray-100'} ${baseClasses} ${!hasError ? 'hover:bg-gray-200' : 'hover:bg-red-200'}`}
            onClick={handleClick}
          >
            <span className="text-sm text-gray-600">
              {component.type}
              {hasError && <span className="text-red-600 ml-2">⚠️</span>}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-[320px] overflow-hidden">
      <Handle type="target" position={Position.Top} />
      
      {/* WhatsApp-style Header */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-gray-600" />
            {isEditingTitle ? (
              <div className="flex items-center space-x-1">
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm font-medium h-6 px-2 py-0 border-blue-300 focus:border-blue-500"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveTitle}
                  className="h-5 w-5 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 group">
                <span className="font-medium text-sm text-gray-900">
                  {screen.title}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStartEditingTitle}
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-2 w-2" />
                </Button>
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {screen.id}
          </Badge>
        </div>
      </div>

      {/* Screen Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto bg-white">
        {screen.data.map(component => renderComponent(component))}
        
        {screen.data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Empty screen</p>
            <p className="text-xs">Drag components from the palette to add them</p>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

ScreenNode.displayName = 'ScreenNode';