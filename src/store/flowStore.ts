// src/store/flowStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getComponentDefaultProperties, whatsappFlowsValidator, ComponentType, ValidationError } from '@/lib/whatsapp-flows-validator';

// --- TYPE DEFINITIONS ---
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
  terminal?: boolean;
  success?: boolean;
  data: FlowComponent[];
  layout?: {
    type: "SingleColumnLayout";
    children: string[];
  };
  routing_model?: {
    [key: string]: string;
  };
}

export interface FlowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowData {
  version: string;
  data_api_version?: string;
  name: string;
  routing_model?: Record<string, string[]>;
  screens: FlowScreen[];
  connections?: FlowConnection[];
}

interface FlowState {
  flowData: FlowData;
  selectedElementId: string | null;
  activeScreenId: string | null;
  validationErrors: ValidationError[];
  componentErrorStatus: Map<string, boolean>;
  deployedFlowId: string | null;
}

interface FlowActions {
  setFlowData: (data: FlowData) => void;
  updateFlowName: (name: string) => void;
  setSelectedElementId: (id: string | null) => void;
  setActiveScreenId: (id: string | null) => void;
  updateComponentProperty: (elementId: string, property: string, value: any) => void;
  updateScreenProperty: (screenId: string, property: string, value: any) => void;
  addComponentOption: (elementId: string) => void;
  removeComponentOption: (elementId: string, optionId: string) => void;
  validateFlow: (externalErrors?: ValidationError[]) => void;
  clearApiErrors: () => void;
  addNewScreen: () => FlowScreen;
  addComponentToScreen: (screenId: string, componentType: ComponentType) => FlowComponent;
  addChildComponentToForm: (formId: string, componentType: ComponentType) => void;
  removeComponentFromForm: (formId: string, childId: string) => void;
  deleteScreen: (screenId: string) => void;
  duplicateScreen: (screenId: string) => FlowScreen;
  updateScreenTitle: (screenId: string, title: string) => void;
  setDeployedFlowId: (id: string | null) => void;
  removeComponentFromScreen: (screenId: string, componentId: string) => void;
  reorderComponentsInScreen: (screenId: string, componentIds: string[]) => void;
  updateComponentNavigationTarget: (componentId: string, targetScreenId: string) => void;
  addFlowConnection: (connection: FlowConnection) => void;
  removeFlowConnection: (connectionId: string) => void;
}

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

// Helper function to generate unique IDs
const generateUniqueId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to deep clone a component with new IDs
const cloneComponentWithNewIds = (component: FlowComponent): FlowComponent => {
  const cloned = { ...component };
  cloned.id = generateUniqueId(component.type.toLowerCase());
  
  if (cloned.children) {
    cloned.children = cloned.children.map(child => cloneComponentWithNewIds(child));
  }
  
  return cloned;
};

// Start with completely empty flow
const initialFlowData: FlowData = {
  version: "7.1",
  data_api_version: "3.0",
  name: "My New WhatsApp Flow",
  routing_model: {},
  screens: [],
  connections: []
};

export const useFlowStore = create<FlowState & FlowActions>()(
  devtools(
    (set, get) => ({
      // --- INITIAL STATE ---
      flowData: initialFlowData,
      selectedElementId: null,
      activeScreenId: null,
      validationErrors: [],
      componentErrorStatus: new Map(),
      deployedFlowId: null,

      // --- ACTIONS ---

      validateFlow: (externalErrors = []) => {
        const state = get();
        const { errors } = whatsappFlowsValidator.validate(state.flowData);
        
        // Add flow-level validation for unreachable screens
        const flowLevelErrors = get().validateFlowConnections();
        
        // Merge internal validation errors with external errors (e.g., from Meta API)
        const allErrors = [...errors, ...externalErrors, ...flowLevelErrors];
        
        // Create error status map for quick lookup
        const errorStatus = new Map<string, boolean>();
        allErrors.forEach(error => {
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
          
          // Mark screens with errors
          if (error.path.includes('/screens/')) {
            const screenIndex = parseInt(error.path.split('/screens/')[1]?.split('/')[0]);
            if (!isNaN(screenIndex)) {
              const screen = state.flowData.screens[screenIndex];
              if (screen) {
                errorStatus.set(screen.id, true);
              }
            }
          }
        });
        
        set({ 
          validationErrors: allErrors,
          componentErrorStatus: errorStatus
        });
      },

      validateFlowConnections: () => {
        const state = get();
        const errors: ValidationError[] = [];
        
        if (state.flowData.screens.length <= 1) return errors;
        
        // Find all screens that have navigation targets
        const reachableScreenIds = new Set<string>();
        if (state.flowData.screens[0]) {
          reachableScreenIds.add(state.flowData.screens[0].id); // First screen is always reachable
        }
        
        state.flowData.screens.forEach(screen => {
          screen.data.forEach(component => {
            if (component.on_click_action?.next?.name) {
              reachableScreenIds.add(component.on_click_action.next.name);
            }
          });
        });
        
        // Check for unreachable screens
        state.flowData.screens.forEach((screen, index) => {
          if (index > 0 && !reachableScreenIds.has(screen.id)) {
            errors.push({
              path: `/screens/${index}`,
              message: `Screen "${screen.title}" is unreachable. No buttons or actions navigate to this screen.`,
              value: screen.id,
              severity: 'warning',
              originalMessage: 'Unreachable screen detected'
            });
          }
        });
        
        return errors;
      },

      clearApiErrors: () => {
        // Re-run validation with only internal errors (no external errors)
        get().validateFlow([]);
      },
      
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

      updateScreenProperty: (screenId, property, value) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        
        // Find the screen by ID and update the property
        const screen = newFlowData.screens.find(s => s.id === screenId);
        if (screen) {
          (screen as any)[property] = value;
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
        const newScreenId = generateUniqueId('screen');
        const newScreen: FlowScreen = {
          id: newScreenId,
          title: `Screen ${screenCount + 1}`,
          terminal: false,
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
          screens: state.flowData.screens.filter(s => s.id !== screenId),
          connections: state.flowData.connections?.filter(c => 
            c.source !== screenId && c.target !== screenId
          ) || []
        };
        
        // Remove any navigation references to the deleted screen
        newFlowData.screens.forEach(screen => {
          screen.data.forEach(component => {
            if (component.on_click_action?.next?.name === screenId) {
              component.on_click_action.next.name = '';
            }
          });
        });
        
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
        get().validateFlow();
      },

      duplicateScreen: (screenId) => {
        const state = get();
        const screenToDuplicate = state.flowData.screens.find(s => s.id === screenId);
        
        if (!screenToDuplicate) {
          throw new Error('Screen not found');
        }
        
        const newScreenId = generateUniqueId('screen');
        const duplicatedScreen: FlowScreen = {
          ...screenToDuplicate,
          id: newScreenId,
          title: `${screenToDuplicate.title} (Copy)`,
          data: screenToDuplicate.data.map(component => cloneComponentWithNewIds(component))
        };
        
        const newFlowData = {
          ...state.flowData,
          screens: [...state.flowData.screens, duplicatedScreen]
        };
        
        set({ 
          flowData: newFlowData,
          activeScreenId: newScreenId
        });
        get().validateFlow();
        return duplicatedScreen;
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
        
        // Return the new component for the script executor
        return screen?.data[screen.data.length - 1] as FlowComponent;
      },

      removeComponentFromScreen: (screenId, componentId) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        const screen = newFlowData.screens.find(s => s.id === screenId);
        
        if (screen) {
          screen.data = screen.data.filter(component => component.id !== componentId);
        }
        
        set({ flowData: newFlowData });
        get().validateFlow();
      },

      reorderComponentsInScreen: (screenId, componentIds) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        const screen = newFlowData.screens.find(s => s.id === screenId);
        
        if (screen) {
          const reorderedComponents: FlowComponent[] = [];
          componentIds.forEach(id => {
            const component = screen.data.find(c => c.id === id);
            if (component) {
              reorderedComponents.push(component);
            }
          });
          screen.data = reorderedComponents;
        }
        
        set({ flowData: newFlowData });
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

      updateComponentNavigationTarget: (componentId, targetScreenId) => {
        const state = get();
        const newFlowData = { ...state.flowData };
        
        for (const screen of newFlowData.screens) {
          const component = findComponentById(screen.data, componentId);
          if (component && (component.type === 'Button' || component.type === 'Footer')) {
            if (!component.on_click_action) {
              component.on_click_action = {
                name: 'navigate',
                next: { type: 'screen', name: targetScreenId }
              };
            } else {
              component.on_click_action.name = 'navigate';
              component.on_click_action.next = { type: 'screen', name: targetScreenId };
            }
            break;
          }
        }
        
        set({ flowData: newFlowData });
        get().validateFlow();
      },

      addFlowConnection: (connection) => {
        const state = get();
        const newFlowData = {
          ...state.flowData,
          connections: [...(state.flowData.connections || []), connection]
        };
        
        set({ flowData: newFlowData });
      },

      removeFlowConnection: (connectionId) => {
        const state = get();
        const newFlowData = {
          ...state.flowData,
          connections: state.flowData.connections?.filter(c => c.id !== connectionId) || []
        };
        
        set({ flowData: newFlowData });
      },

      setDeployedFlowId: (id) => set({ deployedFlowId: id }),
    }),
    { name: 'flow-store' }
  )
);