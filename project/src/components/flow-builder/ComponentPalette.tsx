import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Plus,
  Smartphone,
  Layers
} from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { componentTypes, categories } from '@/lib/component-definitions';
import { DraggableComponent } from './DraggableComponent';

export function ComponentPalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addNewScreen, flowData } = useFlowStore();

  const filteredComponents = componentTypes.filter(component => {
    const matchesSearch = component.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || component.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">WhatsApp Components</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={addNewScreen}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Screen
          </Button>
        </div>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center space-x-2 mb-2">
          <Layers className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">WhatsApp Flows v7.1</span>
        </div>
        <div className="text-xs text-green-700">
          <div className="font-medium">{flowData.name}</div>
          <div className="text-green-600">{flowData.screens.length} screens • {filteredComponents.length} components available</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredComponents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">No components found</div>
              <div className="text-xs">Try adjusting your search or filters</div>
            </div>
          ) : (
            filteredComponents.map((component) => (
              <DraggableComponent
                key={component.type}
                {...component}
              />
            ))
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="space-y-2">
          <div className="text-xs text-gray-500 text-center">
            Drag components to the canvas to add them
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addNewScreen}
            className="w-full h-7 text-xs"
          >
            <Smartphone className="h-3 w-3 mr-1" />
            Add New Screen
          </Button>
          <div className="text-xs text-center">
            <a 
              href="https://developers.facebook.com/docs/whatsapp/flows/reference/components" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              WhatsApp Flows Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}