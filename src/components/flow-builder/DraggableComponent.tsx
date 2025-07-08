import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Grip } from 'lucide-react';
import { DraggableComponentProps } from '@/lib/component-definitions';

export function DraggableComponent({ type, label, icon: Icon, category, description, isNew }: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: 'component',
      componentType: type,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-md transition-all duration-200 group ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 rounded-md group-hover:bg-blue-100 transition-colors">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="font-medium text-sm text-gray-900">{label}</div>
            {isNew && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                New
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate">{description}</div>
        </div>
        <Grip className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}