import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  CheckSquare, 
  Circle, 
  Calendar, 
  ChevronDown as DropdownIcon, 
  MousePointer, 
  FileText,
  Link,
  Camera,
  Upload,
  ToggleLeft,
  Tag,
  Images
} from 'lucide-react';

export interface DraggableComponentProps {
  type: string;
  label: string;
  icon: React.ComponentType<any>;
  category: string;
  description: string;
  isNew?: boolean;
}

export const componentTypes: DraggableComponentProps[] = [
  {
    type: 'TextHeading',
    label: 'Text Heading',
    icon: Type,
    category: 'Text',
    description: 'Main heading text (max 60 chars) - v3.0+'
  },
  {
    type: 'TextSubheading',
    label: 'Text Subheading',
    icon: Type,
    category: 'Text',
    description: 'Secondary heading (max 80 chars) - v5.0'
  },
  {
    type: 'TextBody',
    label: 'Text Body',
    icon: Type,
    category: 'Text',
    description: 'Body text content (max 4096 chars) - v5.0'
  },
  {
    type: 'TextCaption',
    label: 'Text Caption',
    icon: Type,
    category: 'Text',
    description: 'Caption text (max 300 chars) - v5.0',
    isNew: true
  },
  {
    type: 'RichText',
    label: 'Rich Text',
    icon: Type,
    category: 'Text',
    description: 'Formatted text with markdown support - v5.0'
  },
  {
    type: 'TextInput',
    label: 'Text Input',
    icon: Square,
    category: 'Input',
    description: 'Single line text input with label_variant support - v3.0+'
  },
  {
    type: 'TextArea',
    label: 'Text Area',
    icon: Square,
    category: 'Input',
    description: 'Multi-line text input with label_variant support - v4.0+'
  },
  {
    type: 'CheckboxGroup',
    label: 'Checkbox Group',
    icon: CheckSquare,
    category: 'Input',
    description: 'Multiple choice selection (max 20 options) - v3.0+'
  },
  {
    type: 'RadioButtonsGroup',
    label: 'Radio Buttons Group',
    icon: Circle,
    category: 'Input',
    description: 'Single choice selection (max 20 options) - v3.0+'
  },
  {
    type: 'Dropdown',
    label: 'Dropdown',
    icon: DropdownIcon,
    category: 'Input',
    description: 'Dropdown selection (max 200 options) - v3.0+'
  },
  {
    type: 'DatePicker',
    label: 'Date Picker',
    icon: Calendar,
    category: 'Input',
    description: 'Date selection with constraints - v3.0+'
  },
  {
    type: 'ChipsSelector',
    label: 'Chips Selector',
    icon: Tag,
    category: 'Input',
    description: 'Multi-selection using chips interface - v7.0+',
    isNew: true
  },
  {
    type: 'OptIn',
    label: 'Opt In',
    icon: ToggleLeft,
    category: 'Input',
    description: 'Checkbox for user consent/opt-in (max 250 chars) - v3.0+'
  },
  {
    type: 'Image',
    label: 'Image',
    icon: ImageIcon,
    category: 'Media',
    description: 'Display images (max 5MB, 1024x1024px) - v3.0+'
  },
  {
    type: 'ImageCarousel',
    label: 'Image Carousel',
    icon: Images,
    category: 'Media',
    description: 'Multiple images in carousel format - v7.0+',
    isNew: true
  },
  {
    type: 'PhotoPicker',
    label: 'Photo Picker',
    icon: Camera,
    category: 'Media',
    description: 'Camera/gallery photo selection (max 16MB) - v4.0+'
  },
  {
    type: 'DocumentPicker',
    label: 'Document Picker',
    icon: Upload,
    category: 'Media',
    description: 'File upload component (max 100MB) - v4.0+'
  },
  {
    type: 'Button',
    label: 'Button',
    icon: MousePointer,
    category: 'Action',
    description: 'Action button for navigation (max 35 chars) - v3.0+'
  },
  {
    type: 'Footer',
    label: 'Footer',
    icon: MousePointer,
    category: 'Action',
    description: 'Primary action button at screen bottom (max 35 chars) - v3.0+'
  },
  {
    type: 'EmbeddedLink',
    label: 'Embedded Link',
    icon: Link,
    category: 'Action',
    description: 'Clickable link to external URL - v4.0+'
  },
  {
    type: 'Form',
    label: 'Form',
    icon: FileText,
    category: 'Container',
    description: 'Form container for grouping inputs - v3.0+'
  }
];

export const categories = ['All', 'Text', 'Input', 'Media', 'Action', 'Container'];