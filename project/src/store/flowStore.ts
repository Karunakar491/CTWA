import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getComponentDefaultProperties, whatsappFlowsValidator, ComponentType } from '@/lib/whatsapp-flows-validator';

export interface FlowComponent {
  id: string;
  type: ComponentType;
  
  // Text properties
  text?: string;
  
  // Input properties
  label?: string;
  name?: string;
  required?: boolean;
  enabled?: boolean;
  
  // Selection properties (standardized)
  data_source?: Array<{ id: string; title: string; description?: string; metadata?: string }>;
  
  // Image properties (standardized)
  src?: string;
  alt_text?: string;
  scale_type?: 'cover' | 'contain';
  width?: number;
  height?: number;
  
  // DatePicker properties
  min_date?: string;
  max_date?: string;
  unavailable_dates?: string[];
  
  // Button/Action properties (standardized)
  title?: string;
  on_click_action?: {
    name: 'navigate' | 'complete' | 'data_exchange' | 'open_url';
    next?: {
      type: 'screen';
      name: string;
    };
    payload?: Record<string, any>;
  };
  
  // Input type properties
  input_type?: 'text' | 'number' | 'email' | 'password';
  max_length?: number;
  helper_text?: string;
  
  // File picker properties
  photo_source?: 'camera_gallery' | 'camera_only' | 'gallery_only';
  max_file_size_kb?: number;
  allowed_mime_types?: string[];
  
  // Form properties (container component)
  children?: FlowComponent[];
  
  // Carousel properties
  images?: Array<{ src: string; alt_text: string }>;
  
  [key: string]: any;
}

export interface FlowScreen {
  id: string;
  title: string;
  data: FlowComponent[];
  terminal?: boolean;
  success?: boolean;
  layout?: {
    type: "SingleColumnLayout";
    children: string[];
  };
  routing_model?: {
    [key: string]: string;
  };
}

export interface FlowData {
  version: string;
  name: string;
  data_api_version?: string;
  screens: FlowScreen[];
  routing_model?: Record<string, string>;
}

interface FlowStore {
  flowData: FlowData;
  selectedElementId: string | null;
  activeScreenId: string | null;
  validationErrors: any[];
  componentErrorStatus: Map<string, boolean>;
  
  // Actions
  setFlowData: (data: FlowData) => void;
  updateFlowName: (name: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setActiveScreenId: (id: string | null) => void;
  updateComponentProperty: (elementId: string, property: string, value: any) => void;
  addComponentOption: (elementId: string) => void;
  removeComponentOption: (elementId: string, optionId: string) => void;
  validateFlow: () => void;
  addNewScreen: () => FlowScreen;
  addComponentToScreen: (screenId: string, componentType: ComponentType) => void;
  addChildComponentToForm: (formId: string, componentType: ComponentType) => void;
  removeComponentFromForm: (formId: string, childId: string) => void;
  deleteScreen: (screenId: string) => void;
  updateScreenTitle: (screenId: string, title: string) => void;
}

// Start with completely empty flow
const initialFlowData: FlowData = {
  version: "5.0",
  data_api_version: "3.0",
  name: "Untitled Flow",
  screens: []
};

// Helper function to find component by ID (including nested components)
const findComponentById = (components: FlowComponent[], id: string): FlowComponent | null => {
  for (const component of components) {
    if (component.id === id) {
      return component;
    }
    if (component.children) {
      const found = findComponentById(component.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to update component by ID (including nested components)
const updateComponentById = (components: FlowComponent[], id: string, property: string, value: any): boolean => {
  for (const component of components) {
    if (component.id === id) {
      component[property] = value;
      return true;
    }
    if (component.children) {
      const updated = updateComponentById(component.children, id, property, value);
      if (updated) return true;
    }
  }
  return false;
};

export const useFlowStore = create<FlowStore>()(
  devtools(
    (set, get) => ({
      flowData: initialFlowData,
      selectedElementId: null,
      activeScreenId: null,
      validationErrors: [],
      componentErrorStatus: new Map(),

      setFlowData: (data) => {
        set({ flowData: data });
        get().validateFlow();
      },
      
      updateFlowName: (name) => {
        const state = get();
        set({ 
          flowData: { 
            ...state.flowData, 
            name 
          } 
        });
      },

      setSelectedElementId: (id) => set({ selectedElementId: id }),

      setActiveScreenId: (id) => set({ activeScreenId: id }),

      updateComponentProperty: (elementId, property, value) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        
        // Find and update the component (including nested components)
        for (const screen of newFlowData.screens) {
          if (updateComponentById(screen.data, elementId, property, value)) {
            break;
          }
        }
        
        set({ flowData: newFlowData });
        get().validateFlow();
      },

      addComponentOption: (elementId) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        
        for (const screen of newFlowData.screens) {
          const component = findComponentById(screen.data, elementId);
          if (component && component.data_source) {
            const newOptionId = `option_${Date.now()}`;
            component.data_source.push({
              id: newOptionId,
              title: "New option"
            });
            break;
          }
        }
        
        set({ flowData: newFlowData });
      },

      removeComponentOption: (elementId, optionId) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        
        for (const screen of newFlowData.screens) {
          const component = findComponentById(screen.data, elementId);
          if (component && component.data_source) {
            component.data_source = component.data_source.filter(opt => opt.id !== optionId);
            break;
          }
        }
        
        set({ flowData: newFlowData });
      },

      addNewScreen: () => {
        const state = get();
        const screenCount = state.flowData.screens.length;
        const newScreenId = `SCREEN_${screenCount + 1}`;
        const newScreen: FlowScreen = {
          id: newScreenId,
          title: `Screen ${screenCount + 1}`,
          data: []
        };
        
        const newFlowData = {
          ...state.flowData,
          screens: [...state.flowData.screens, newScreen]
        };
        
        set({ 
          flowData: newFlowData,
          activeScreenId: newScreenId // Set the new screen as active
        });
        return newScreen;
      },

      deleteScreen: (screenId) => {
        const state = get();
        const newFlowData = {
          ...state.flowData,
          screens: state.flowData.screens.filter(s => s.id !== screenId)
        };
        
        // If we deleted the active screen, set a new active screen
        let newActiveScreenId = state.activeScreenId;
        if (state.activeScreenId === screenId) {
          newActiveScreenId = newFlowData.screens.length > 0 ? newFlowData.screens[0].id : null;
        }
        
        set({ 
          flowData: newFlowData,
          activeScreenId: newActiveScreenId,
          selectedElementId: null
        });
      },

      updateScreenTitle: (screenId, title) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        const screen = newFlowData.screens.find(s => s.id === screenId);
        if (screen) {
          screen.title = title;
        }
        set({ flowData: newFlowData });
      },

      addComponentToScreen: (screenId, componentType) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        const screen = newFlowData.screens.find(s => s.id === screenId);
        
        if (screen) {
          // Use centralized component defaults
          const newComponent = getComponentDefaultProperties(componentType);
          screen.data.push(newComponent);
        }
        
        set({ flowData: newFlowData });
        get().validateFlow();
      },

      addChildComponentToForm: (formId, componentType) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        
        for (const screen of newFlowData.screens) {
          const formComponent = findComponentById(screen.data, formId);
          if (formComponent && formComponent.type === 'Form' && formComponent.children) {
            // Use centralized component defaults
            const newComponent = getComponentDefaultProperties(componentType);
            formComponent.children.push(newComponent);
            break;
          }
        }
        
        set({ flowData: newFlowData });
        get().validateFlow();
      },

      removeComponentFromForm: (formId, childId) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        
        for (const screen of newFlowData.screens) {
          const formComponent = findComponentById(screen.data, formId);
          if (formComponent && formComponent.type === 'Form' && formComponent.children) {
            formComponent.children = formComponent.children.filter(child => child.id !== childId);
            break;
          }
        }
        
        set({ flowData: newFlowData });
      },

      validateFlow: () => {
        const state = get();
        const { errors } = whatsappFlowsValidator.validate(state.flowData);
        
        // Create error status map for quick lookup
        const errorStatus = new Map<string, boolean>();
        errors.forEach(error => {
          // Extract component ID from path if possible
          const pathParts = error.path.split('/');
          const dataIndex = pathParts.findIndex(part => part === 'data');
          if (dataIndex !== -1 && pathParts[dataIndex + 1]) {
            const screenIndex = parseInt(pathParts[pathParts.indexOf('screens') + 1]);
            const componentIndex = parseInt(pathParts[dataIndex + 1]);
            
            if (!isNaN(screenIndex) && !isNaN(componentIndex)) {
              const screen = state.flowData.screens[screenIndex];
              const component = screen?.data[componentIndex];
              if (component) {
                errorStatus.set(component.id, true);
              }
            }
          }
        });
        
        set({ 
          validationErrors: errors,
          componentErrorStatus: errorStatus
        });
      }
    }),
    { name: 'flow-store' }
  )
);