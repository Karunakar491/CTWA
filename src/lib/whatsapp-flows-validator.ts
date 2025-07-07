import Ajv from 'ajv';

// WhatsApp Flows JSON Schema based on Meta documentation
// https://developers.facebook.com/docs/whatsapp/flows/reference/components
// Updated to reflect latest changelog requirements (v7.1)

export interface WhatsAppFlowsSchema {
  version: "5.0";
  data_api_version?: "3.0";
  routing_model?: Record<string, string>;
  screens: WhatsAppScreen[];
}

export interface WhatsAppScreen {
  id: string;
  title: string;
  terminal?: boolean;
  success?: boolean;
  data: WhatsAppComponent[];
  layout?: {
    type: "SingleColumnLayout";
    children: string[];
  };
  routing_model?: Record<string, string>;
}

export interface WhatsAppComponent {
  type: ComponentType;
  [key: string]: any;
}

export type ComponentType = 
  | "TextHeading"
  | "TextSubheading" 
  | "TextBody"
  | "TextCaption"
  | "RichText"
  | "Image"
  | "ImageCarousel"
  | "TextInput"
  | "TextArea"
  | "CheckboxGroup"
  | "RadioButtonsGroup"
  | "Dropdown"
  | "DatePicker"
  | "ChipsSelector"
  | "Button"
  | "Footer"
  | "OptIn"
  | "Form"
  | "EmbeddedLink"
  | "PhotoPicker"
  | "DocumentPicker";

// Component default properties - Single source of truth
export function getComponentDefaultProperties(componentType: ComponentType): any {
  const baseId = `${componentType.toLowerCase()}_${Date.now()}`;
  
  const defaults: Record<ComponentType, any> = {
    TextHeading: {
      id: baseId,
      type: 'TextHeading',
      text: 'New Headline'
    },
    TextSubheading: {
      id: baseId,
      type: 'TextSubheading',
      text: 'New Subheading'
    },
    TextBody: {
      id: baseId,
      type: 'TextBody',
      text: 'New text content'
    },
    TextCaption: {
      id: baseId,
      type: 'TextCaption',
      text: 'New caption'
    },
    RichText: {
      id: baseId,
      type: 'RichText',
      text: 'New **rich** text content'
    },
    Image: {
      id: baseId,
      type: 'Image',
      src: 'https://via.placeholder.com/300x200',
      alt_text: 'Image description',
      scale_type: 'cover'
    },
    ImageCarousel: {
      id: baseId,
      type: 'ImageCarousel',
      images: [
        {
          src: 'https://via.placeholder.com/300x200',
          alt_text: 'Image 1 description'
        }
      ]
    },
    TextInput: {
      id: baseId,
      type: 'TextInput',
      name: 'text_input_field',
      label: 'Enter text',
      input_type: 'text',
      required: false,
      enabled: true
    },
    TextArea: {
      id: baseId,
      type: 'TextArea',
      name: 'textarea_field',
      label: 'Enter details',
      required: false,
      enabled: true,
      max_length: 1000
    },
    CheckboxGroup: {
      id: baseId,
      type: 'CheckboxGroup',
      name: 'checkbox_group',
      label: 'Select options',
      data_source: [
        { id: 'option_1', title: 'Option 1' },
        { id: 'option_2', title: 'Option 2' }
      ],
      required: false,
      enabled: true
    },
    RadioButtonsGroup: {
      id: baseId,
      type: 'RadioButtonsGroup',
      name: 'radio_group',
      label: 'Choose one',
      data_source: [
        { id: 'option_1', title: 'Option 1' },
        { id: 'option_2', title: 'Option 2' }
      ],
      required: false,
      enabled: true
    },
    Dropdown: {
      id: baseId,
      type: 'Dropdown',
      name: 'dropdown_field',
      label: 'Select from list',
      data_source: [
        { id: 'option_1', title: 'Option 1' },
        { id: 'option_2', title: 'Option 2' }
      ],
      required: false,
      enabled: true
    },
    DatePicker: {
      id: baseId,
      type: 'DatePicker',
      name: 'date_field',
      label: 'Select date',
      required: false,
      enabled: true,
      min_date: new Date().toISOString().split('T')[0],
      max_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    ChipsSelector: {
      id: baseId,
      type: 'ChipsSelector',
      name: 'chips_selector',
      label: 'Select tags',
      data_source: [
        { id: 'chip_1', title: 'Tag 1' },
        { id: 'chip_2', title: 'Tag 2' }
      ],
      required: false,
      enabled: true
    },
    Button: {
      id: baseId,
      type: 'Button',
      title: 'Continue',
      on_click_action: {
        name: 'complete'
      },
      enabled: true
    },
    Footer: {
      id: baseId,
      type: 'Footer',
      label: 'Continue',
      on_click_action: {
        name: 'complete'
      },
      enabled: true
    },
    OptIn: {
      id: baseId,
      type: 'OptIn',
      name: 'opt_in_field',
      label: 'I agree to the terms and conditions',
      required: false,
      enabled: true
    },
    Form: {
      id: baseId,
      type: 'Form',
      name: 'form_container',
      children: []
    },
    EmbeddedLink: {
      id: baseId,
      type: 'EmbeddedLink',
      text: 'Click here to learn more',
      on_click_action: {
        name: 'open_url',
        payload: {
          url: 'https://example.com'
        }
      }
    },
    PhotoPicker: {
      id: baseId,
      type: 'PhotoPicker',
      name: 'photo_field',
      label: 'Upload photo',
      required: false,
      enabled: true,
      photo_source: 'camera_gallery',
      max_file_size_kb: 5120
    },
    DocumentPicker: {
      id: baseId,
      type: 'DocumentPicker',
      name: 'document_field',
      label: 'Upload document',
      required: false,
      enabled: true,
      max_file_size_kb: 10240,
      allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png']
    }
  };

  return { ...defaults[componentType] };
}

// User-friendly error messages for marketers
const getUserFriendlyErrorMessage = (error: any): string => {
  const { message, instancePath, keyword } = error;
  
  // Extract component type and field from path
  const pathParts = instancePath.split('/');
  const componentIndex = pathParts.findIndex(part => part === 'data') + 1;
  const fieldName = pathParts[pathParts.length - 1];
  
  // Handle specific validation keywords
  if (keyword === 'required') {
    const missingProperty = error.params?.missingProperty;
    if (missingProperty === 'text') return 'Please add text content to this component';
    if (missingProperty === 'title') return 'Please add a title to this button';
    if (missingProperty === 'label') return 'Please add a label to this input field';
    if (missingProperty === 'name') return 'Please add a field name for form processing';
    if (missingProperty === 'src') return 'Please select an image for this component';
    if (missingProperty === 'on_click_action') return 'Please set what happens when users click this button';
    return `Please fill in the required ${missingProperty} field`;
  }
  
  if (keyword === 'maxLength') {
    const maxLength = error.params?.limit;
    return `Text is too long. Maximum ${maxLength} characters allowed.`;
  }
  
  if (keyword === 'minLength') {
    const minLength = error.params?.limit;
    return `Text is too short. Minimum ${minLength} character${minLength !== 1 ? 's' : ''} required.`;
  }
  
  if (keyword === 'maxItems') {
    const maxItems = error.params?.limit;
    return `Too many options. Maximum ${maxItems} options allowed.`;
  }
  
  if (keyword === 'minItems') {
    const minItems = error.params?.limit;
    return `Please add at least ${minItems} option${minItems !== 1 ? 's' : ''}.`;
  }
  
  if (keyword === 'enum') {
    const allowedValues = error.params?.allowedValues;
    return `Invalid value. Allowed values: ${allowedValues?.join(', ')}`;
  }
  
  if (keyword === 'pattern') {
    if (fieldName === 'id') return 'ID must start with a letter and contain only letters, numbers, and underscores';
    if (fieldName === 'name') return 'Field name must start with a letter and contain only letters, numbers, and underscores';
    return 'Invalid format for this field';
  }
  
  if (keyword === 'maximum') {
    const maximum = error.params?.limit;
    return `Value is too large. Maximum allowed: ${maximum}`;
  }
  
  if (keyword === 'minimum') {
    const minimum = error.params?.limit;
    return `Value is too small. Minimum required: ${minimum}`;
  }
  
  // Fallback to original message
  return message || 'Please check this field';
};

// Enhanced validation with detailed component schemas
export class WhatsAppFlowsValidator {
  private ajv: Ajv;
  private schema: any;

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true, 
      strict: false,
      removeAdditional: false,
      useDefaults: false,
      coerceTypes: false
    });
    this.schema = this.createSchema();
  }

  private createComponentSchemas() {
    return {
      // Text Components
      TextHeading: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "TextHeading" },
          text: { type: "string", minLength: 1, maxLength: 60 }
        },
        required: ["id", "type", "text"],
        additionalProperties: false
      },
      
      TextSubheading: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "TextSubheading" },
          text: { type: "string", minLength: 1, maxLength: 80 }
        },
        required: ["id", "type", "text"],
        additionalProperties: false
      },
      
      TextBody: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "TextBody" },
          text: { type: "string", minLength: 1, maxLength: 4096 }
        },
        required: ["id", "type", "text"],
        additionalProperties: false
      },
      
      TextCaption: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "TextCaption" },
          text: { type: "string", minLength: 1, maxLength: 300 }
        },
        required: ["id", "type", "text"],
        additionalProperties: false
      },
      
      RichText: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "RichText" },
          text: { type: "string", minLength: 1, maxLength: 4096 }
        },
        required: ["id", "type", "text"],
        additionalProperties: false
      },
      
      // Media Components
      Image: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "Image" },
          src: { type: "string", minLength: 1 },
          alt_text: { type: "string", maxLength: 100 },
          scale_type: { type: "string", enum: ["cover", "contain"] },
          width: { type: "integer", minimum: 1, maximum: 1024 },
          height: { type: "integer", minimum: 1, maximum: 1024 }
        },
        required: ["id", "type", "src"],
        additionalProperties: false
      },
      
      ImageCarousel: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "ImageCarousel" },
          images: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: {
              type: "object",
              properties: {
                src: { type: "string", minLength: 1 },
                alt_text: { type: "string", maxLength: 100 }
              },
              required: ["src", "alt_text"],
              additionalProperties: false
            }
          }
        },
        required: ["id", "type", "images"],
        additionalProperties: false
      },
      
      // Input Components
      TextInput: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "TextInput" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          input_type: { type: "string", enum: ["text", "number", "email", "password"] },
          required: { type: "boolean" },
          enabled: { type: "boolean" },
          helper_text: { type: "string", maxLength: 200 },
          max_length: { type: "integer", minimum: 1, maximum: 1000 }
        },
        required: ["id", "type", "name"],
        additionalProperties: false
      },
      
      TextArea: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "TextArea" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          required: { type: "boolean" },
          enabled: { type: "boolean" },
          helper_text: { type: "string", maxLength: 200 },
          max_length: { type: "integer", minimum: 1, maximum: 1000 }
        },
        required: ["id", "type", "name"],
        additionalProperties: false
      },
      
      // Selection Components
      CheckboxGroup: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "CheckboxGroup" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          data_source: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: {
              type: "object",
              properties: {
                id: { type: "string", pattern: "^[a-zA-Z0-9_]+$", minLength: 1 },
                title: { type: "string", minLength: 1, maxLength: 30 },
                description: { type: "string", maxLength: 100 },
                metadata: { type: "string", maxLength: 100 }
              },
              required: ["id", "title"],
              additionalProperties: false
            }
          },
          required: { type: "boolean" },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "name", "data_source"],
        additionalProperties: false
      },
      
      RadioButtonsGroup: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "RadioButtonsGroup" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          data_source: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: {
              type: "object",
              properties: {
                id: { type: "string", pattern: "^[a-zA-Z0-9_]+$", minLength: 1 },
                title: { type: "string", minLength: 1, maxLength: 30 },
                description: { type: "string", maxLength: 100 },
                metadata: { type: "string", maxLength: 100 }
              },
              required: ["id", "title"],
              additionalProperties: false
            }
          },
          required: { type: "boolean" },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "name", "data_source"],
        additionalProperties: false
      },
      
      Dropdown: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "Dropdown" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          data_source: {
            type: "array",
            minItems: 1,
            maxItems: 200,
            items: {
              type: "object",
              properties: {
                id: { type: "string", pattern: "^[a-zA-Z0-9_]+$", minLength: 1 },
                title: { type: "string", minLength: 1, maxLength: 30 },
                description: { type: "string", maxLength: 100 },
                metadata: { type: "string", maxLength: 100 }
              },
              required: ["id", "title"],
              additionalProperties: false
            }
          },
          required: { type: "boolean" },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "name", "data_source"],
        additionalProperties: false
      },
      
      ChipsSelector: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "ChipsSelector" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          data_source: {
            type: "array",
            minItems: 1,
            maxItems: 20,
            items: {
              type: "object",
              properties: {
                id: { type: "string", pattern: "^[a-zA-Z0-9_]+$", minLength: 1 },
                title: { type: "string", minLength: 1, maxLength: 30 },
                description: { type: "string", maxLength: 100 },
                metadata: { type: "string", maxLength: 100 }
              },
              required: ["id", "title"],
              additionalProperties: false
            }
          },
          required: { type: "boolean" },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "name", "data_source"],
        additionalProperties: false
      },
      
      DatePicker: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "DatePicker" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          required: { type: "boolean" },
          enabled: { type: "boolean" },
          min_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          max_date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          unavailable_dates: {
            type: "array",
            items: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }
          }
        },
        required: ["id", "type", "name"],
        additionalProperties: false
      },
      
      // Action Components
      Button: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "Button" },
          title: { type: "string", minLength: 1, maxLength: 35 },
          on_click_action: {
            type: "object",
            properties: {
              name: { type: "string", enum: ["navigate", "complete", "data_exchange", "open_url"] },
              next: {
                type: "object",
                properties: {
                  type: { type: "string", const: "screen" },
                  name: { type: "string", minLength: 1 }
                },
                required: ["type", "name"],
                additionalProperties: false
              },
              payload: { type: "object" }
            },
            required: ["name"],
            additionalProperties: false,
            if: { properties: { name: { const: "navigate" } } },
            then: { required: ["next"] }
          },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "title", "on_click_action"],
        additionalProperties: false
      },
      
      Footer: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "Footer" },
          label: { type: "string", minLength: 1, maxLength: 35 },
          on_click_action: {
            type: "object",
            properties: {
              name: { type: "string", enum: ["navigate", "complete", "data_exchange"] },
              next: {
                type: "object",
                properties: {
                  type: { type: "string", const: "screen" },
                  name: { type: "string", minLength: 1 }
                },
                required: ["type", "name"],
                additionalProperties: false
              },
              payload: { type: "object" }
            },
            required: ["name"],
            additionalProperties: false,
            if: { properties: { name: { const: "navigate" } } },
            then: { required: ["next"] }
          },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "label", "on_click_action"],
        additionalProperties: false
      },
      
      EmbeddedLink: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "EmbeddedLink" },
          text: { type: "string", minLength: 1, maxLength: 100 },
          on_click_action: {
            type: "object",
            properties: {
              name: { type: "string", const: "open_url" },
              payload: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri", minLength: 1 }
                },
                required: ["url"],
                additionalProperties: false
              }
            },
            required: ["name", "payload"],
            additionalProperties: false
          }
        },
        required: ["id", "type", "text", "on_click_action"],
        additionalProperties: false
      },
      
      // Special Components
      OptIn: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "OptIn" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", minLength: 1, maxLength: 250 },
          required: { type: "boolean" },
          enabled: { type: "boolean" }
        },
        required: ["id", "type", "name", "label"],
        additionalProperties: false
      },
      
      PhotoPicker: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "PhotoPicker" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          required: { type: "boolean" },
          enabled: { type: "boolean" },
          photo_source: { type: "string", enum: ["camera_gallery", "camera_only", "gallery_only"] },
          max_file_size_kb: { type: "integer", minimum: 1, maximum: 16384 }
        },
        required: ["id", "type", "name"],
        additionalProperties: false
      },
      
      DocumentPicker: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "DocumentPicker" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          label: { type: "string", maxLength: 80 },
          required: { type: "boolean" },
          enabled: { type: "boolean" },
          max_file_size_kb: { type: "integer", minimum: 1, maximum: 102400 },
          allowed_mime_types: {
            type: "array",
            items: { type: "string" },
            minItems: 1
          }
        },
        required: ["id", "type", "name"],
        additionalProperties: false
      },
      
      // Container Components
      Form: {
        type: "object",
        properties: {
          id: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" },
          type: { type: "string", const: "Form" },
          name: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]*$", minLength: 1 },
          children: {
            type: "array",
            items: {
              oneOf: [
                { $ref: "#/$defs/TextInput" },
                { $ref: "#/$defs/TextArea" },
                { $ref: "#/$defs/CheckboxGroup" },
                { $ref: "#/$defs/RadioButtonsGroup" },
                { $ref: "#/$defs/Dropdown" },
                { $ref: "#/$defs/DatePicker" },
                { $ref: "#/$defs/ChipsSelector" },
                { $ref: "#/$defs/OptIn" },
                { $ref: "#/$defs/PhotoPicker" },
                { $ref: "#/$defs/DocumentPicker" }
              ]
            }
          }
        },
        required: ["id", "type", "name", "children"],
        additionalProperties: false
      }
    };
  }

  private createSchema() {
    const componentSchemas = this.createComponentSchemas();
    
    return {
      type: "object",
      properties: {
        version: {
          type: "string",
          const: "5.0"
        },
        data_api_version: {
          type: "string",
          const: "3.0"
        },
        routing_model: {
          type: "object",
          additionalProperties: { type: "string" }
        },
        screens: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                pattern: "^[a-zA-Z][a-zA-Z0-9_]*$",
                maxLength: 50
              },
              title: {
                type: "string",
                minLength: 1,
                maxLength: 60
              },
              terminal: { type: "boolean" },
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  oneOf: Object.keys(componentSchemas).map(componentType => ({
                    $ref: `#/$defs/${componentType}`
                  }))
                }
              },
              layout: {
                type: "object",
                properties: {
                  type: { type: "string", const: "SingleColumnLayout" },
                  children: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["type", "children"],
                additionalProperties: false
              },
              routing_model: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            },
            required: ["id", "title", "data"],
            additionalProperties: false
          }
        }
      },
      required: ["version", "screens"],
      additionalProperties: false,
      $defs: componentSchemas
    };
  }

  validate(flowData: any): { isValid: boolean; errors: ValidationError[] } {
    const isValid = this.ajv.validate(this.schema, flowData);
    const errors: ValidationError[] = [];

    if (!isValid && this.ajv.errors) {
      errors.push(...this.ajv.errors.map(error => ({
        path: error.instancePath || 'root',
        message: getUserFriendlyErrorMessage(error),
        value: error.data,
        severity: 'error' as const,
        originalMessage: error.message || 'Unknown error'
      })));
    }

    // Additional custom validations for complex business rules
    errors.push(...this.validateCustomRules(flowData));

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  private validateCustomRules(flowData: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!flowData.screens) return errors;

    flowData.screens.forEach((screen: any, screenIndex: number) => {
      if (!screen.data) return;

      // Screen-level validations
      const footerComponents = screen.data.filter((c: any) => c.type === 'Footer');
      if (footerComponents.length > 1) {
        errors.push({
          path: `/screens/${screenIndex}`,
          message: 'Only one footer button is allowed per screen',
          value: footerComponents.length,
          severity: 'error',
          originalMessage: 'Screen can have at most one Footer component'
        });
      }

      const optInComponents = screen.data.filter((c: any) => c.type === 'OptIn');
      if (optInComponents.length > 1) {
        errors.push({
          path: `/screens/${screenIndex}`,
          message: 'Only one opt-in checkbox is allowed per screen',
          value: optInComponents.length,
          severity: 'error',
          originalMessage: 'Screen can have at most one OptIn component'
        });
      }

      // Component-level validations for complex rules
      screen.data.forEach((component: any, componentIndex: number) => {
        const path = `/screens/${screenIndex}/data/${componentIndex}`;
        
        // DatePicker: min_date should not be after max_date
        if (component.type === 'DatePicker' && component.min_date && component.max_date) {
          const minDate = new Date(component.min_date);
          const maxDate = new Date(component.max_date);
          if (minDate > maxDate) {
            errors.push({
              path: `${path}/min_date`,
              message: 'Minimum date cannot be after maximum date',
              value: component.min_date,
              severity: 'error',
              originalMessage: 'min_date cannot be after max_date'
            });
          }
        }

        // Button/Footer: validate navigation targets exist
        if ((component.type === 'Button' || component.type === 'Footer') && 
            component.on_click_action?.name === 'navigate' && 
            component.on_click_action?.next?.name) {
          const targetScreenExists = flowData.screens.some((s: any) => s.id === component.on_click_action.next.name);
          if (!targetScreenExists) {
            errors.push({
              path: `${path}/on_click_action/next/name`,
              message: `Target screen "${component.on_click_action.next.name}" does not exist`,
              value: component.on_click_action.next.name,
              severity: 'error',
              originalMessage: 'Navigation target screen does not exist'
            });
          }
        }

        // Form: validate children are input components
        if (component.type === 'Form' && component.children) {
          const validFormChildTypes = [
            'TextInput', 'TextArea', 'CheckboxGroup', 'RadioButtonsGroup', 
            'Dropdown', 'DatePicker', 'ChipsSelector', 'OptIn', 
            'PhotoPicker', 'DocumentPicker'
          ];
          
          component.children.forEach((child: any, childIndex: number) => {
            if (!validFormChildTypes.includes(child.type)) {
              errors.push({
                path: `${path}/children/${childIndex}/type`,
                message: `${child.type} components cannot be used inside forms`,
                value: child.type,
                severity: 'error',
                originalMessage: 'Invalid component type for form child'
              });
            }
          });
        }

        // Check for duplicate IDs within the same screen
        const componentIds = screen.data.map((c: any) => c.id);
        const duplicateIds = componentIds.filter((id: string, index: number) => 
          componentIds.indexOf(id) !== index
        );
        
        if (duplicateIds.includes(component.id)) {
          errors.push({
            path: `${path}/id`,
            message: `Duplicate component ID "${component.id}" found in this screen`,
            value: component.id,
            severity: 'error',
            originalMessage: 'Component ID must be unique within screen'
          });
        }
      });
    });

    // Flow-level validations
    if (flowData.screens.length > 10) {
      errors.push({
        path: '/screens',
        message: 'Too many screens. WhatsApp allows maximum 10 screens per flow.',
        value: flowData.screens.length,
        severity: 'error',
        originalMessage: 'Flow cannot have more than 10 screens'
      });
    }

    // Check for duplicate screen IDs
    const screenIds = flowData.screens.map((s: any) => s.id);
    const duplicateScreenIds = screenIds.filter((id: string, index: number) => 
      screenIds.indexOf(id) !== index
    );
    
    duplicateScreenIds.forEach((duplicateId: string) => {
      const screenIndex = screenIds.indexOf(duplicateId);
      errors.push({
        path: `/screens/${screenIndex}/id`,
        message: `Duplicate screen ID "${duplicateId}" found`,
        value: duplicateId,
        severity: 'error',
        originalMessage: 'Screen ID must be unique within flow'
      });
    });

    return errors;
  }

  // Auto-fix suggestions for common errors
  getAutoFixSuggestion(error: ValidationError): any {
    const { path, originalMessage } = error;
    
    if (originalMessage?.includes('text is required') || originalMessage?.includes('minLength')) {
      if (path.includes('TextHeading')) return { text: 'New Headline' };
      if (path.includes('TextBody')) return { text: 'New text content' };
      if (path.includes('TextCaption')) return { text: 'New caption' };
      if (path.includes('RichText')) return { text: 'New **rich** text' };
      if (path.includes('EmbeddedLink')) return { text: 'Click here to learn more' };
    }
    
    if (originalMessage?.includes('title is required') || originalMessage?.includes('title')) {
      return { title: 'Continue' };
    }
    
    if (originalMessage?.includes('label is required') || originalMessage?.includes('label')) {
      return { label: 'Enter text' };
    }
    
    if (originalMessage?.includes('name is required') || originalMessage?.includes('name')) {
      return { name: 'field_name' };
    }
    
    if (originalMessage?.includes('src is required') || originalMessage?.includes('src')) {
      return { src: 'https://via.placeholder.com/300x200' };
    }
    
    if (originalMessage?.includes('data_source')) {
      return { 
        data_source: [
          { id: 'option_1', title: 'Option 1' },
          { id: 'option_2', title: 'Option 2' }
        ]
      };
    }
    
    if (originalMessage?.includes('on_click_action')) {
      return { 
        on_click_action: {
          name: 'complete'
        }
      };
    }
    
    return null;
  }
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
  severity: 'error' | 'warning' | 'info';
  originalMessage: string;
}

// Export singleton instance
export const whatsappFlowsValidator = new WhatsAppFlowsValidator();