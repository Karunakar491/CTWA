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
      src: '',
      alt_text: 'Image description',
      scale_type: 'cover'
    },
    ImageCarousel: {
      id: baseId,
      type: 'ImageCarousel',
      images: [
        {
          src: '',
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
        name: 'navigate',
        next: {
          type: 'screen',
          name: ''
        }
      },
      enabled: true
    },
    Footer: {
      id: baseId,
      type: 'Footer',
      label: 'Continue',
      on_click_action: {
        name: 'navigate',
        next: {
          type: 'screen',
          name: ''
        }
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
  const { message, instancePath } = error;
  
  // Extract component type and field from path
  const pathParts = instancePath.split('/');
  const componentIndex = pathParts.findIndex(part => part === 'data') + 1;
  const fieldName = pathParts[pathParts.length - 1];
  
  // Common user-friendly messages
  if (message?.includes('is required')) {
    if (fieldName === 'text') return 'Please add text content to this component';
    if (fieldName === 'title') return 'Please add a title to this button';
    if (fieldName === 'label') return 'Please add a label to this input field';
    if (fieldName === 'name') return 'Please add a field name for form processing';
    if (fieldName === 'src') return 'Please select an image for this component';
    return `Please fill in the required ${fieldName} field`;
  }
  
  if (message?.includes('must be') && message?.includes('characters or less')) {
    const maxLength = message.match(/(\d+) characters/)?.[1];
    return `Text is too long. Maximum ${maxLength} characters allowed.`;
  }
  
  if (message?.includes('must have at least one')) {
    return 'Please add at least one option to this selection component';
  }
  
  if (message?.includes('cannot have more than')) {
    const maxItems = message.match(/more than (\d+)/)?.[1];
    return `Too many options. Maximum ${maxItems} options allowed.`;
  }
  
  if (message?.includes('file size')) {
    return 'File size is too large. Please choose a smaller file.';
  }
  
  if (message?.includes('Invalid JSON')) {
    return 'There\'s a formatting error in your flow. Please check the JSON structure.';
  }
  
  // Fallback to original message
  return message || 'Please check this field';
};

// Validation rules based on Meta documentation and latest changelog
export class WhatsAppFlowsValidator {
  private ajv: Ajv;
  private schema: any;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    this.schema = this.createSchema();
  }

  private createSchema() {
    return {
      type: "object",
      properties: {
        version: {
          type: "string",
          enum: ["5.0"]
        },
        data_api_version: {
          type: "string",
          enum: ["3.0"]
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
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: [
                        "TextHeading", "TextSubheading", "TextBody", "TextCaption",
                        "RichText", "Image", "ImageCarousel", "TextInput", "TextArea", 
                        "CheckboxGroup", "RadioButtonsGroup", "Dropdown", "DatePicker", 
                        "ChipsSelector", "Button", "Footer", "OptIn", "Form", 
                        "EmbeddedLink", "PhotoPicker", "DocumentPicker"
                      ]
                    }
                  },
                  required: ["type"]
                }
              },
              layout: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["SingleColumnLayout"] },
                  children: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["type", "children"]
              },
              routing_model: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            },
            required: ["id", "title", "data"]
          }
        }
      },
      required: ["version", "screens"]
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

    // Additional custom validations based on latest specs
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

      screen.data.forEach((component: any, componentIndex: number) => {
        const path = `/screens/${screenIndex}/data/${componentIndex}`;
        
        // Validate component-specific rules based on latest changelog
        switch (component.type) {
          case 'TextHeading':
            if (!component.text || component.text.trim() === '') {
              errors.push({
                path: `${path}/text`,
                message: 'Please add a headline to grab attention',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextHeading text is required'
              });
            } else if (component.text.length > 60) {
              errors.push({
                path: `${path}/text`,
                message: 'Headline is too long. Keep it under 60 characters for better readability.',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextHeading text must be 60 characters or less'
              });
            }
            break;

          case 'TextSubheading':
            if (!component.text || component.text.trim() === '') {
              errors.push({
                path: `${path}/text`,
                message: 'Please add subheading text',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextSubheading text is required'
              });
            } else if (component.text.length > 80) {
              errors.push({
                path: `${path}/text`,
                message: 'Subheading is too long. Maximum 80 characters allowed.',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextSubheading text must be 80 characters or less'
              });
            }
            break;

          case 'TextBody':
            if (!component.text || component.text.trim() === '') {
              errors.push({
                path: `${path}/text`,
                message: 'Please add body text to provide information to users',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextBody text is required'
              });
            } else if (component.text.length > 4096) {
              errors.push({
                path: `${path}/text`,
                message: 'Text is too long. Maximum 4096 characters allowed.',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextBody text must be 4096 characters or less'
              });
            }
            break;

          case 'TextCaption':
            if (!component.text || component.text.trim() === '') {
              errors.push({
                path: `${path}/text`,
                message: 'Please add caption text',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextCaption text is required'
              });
            } else if (component.text.length > 300) {
              errors.push({
                path: `${path}/text`,
                message: 'Caption is too long. Maximum 300 characters allowed.',
                value: component.text,
                severity: 'error',
                originalMessage: 'TextCaption text must be 300 characters or less'
              });
            }
            break;

          case 'RichText':
            if (!component.text || component.text.trim() === '') {
              errors.push({
                path: `${path}/text`,
                message: 'Please add rich text content',
                value: component.text,
                severity: 'error',
                originalMessage: 'RichText text is required'
              });
            } else if (component.text.length > 4096) {
              errors.push({
                path: `${path}/text`,
                message: 'Rich text is too long. Maximum 4096 characters allowed.',
                value: component.text,
                severity: 'error',
                originalMessage: 'RichText text must be 4096 characters or less'
              });
            }
            break;

          case 'Image':
            if (!component.src || component.src.trim() === '') {
              errors.push({
                path: `${path}/src`,
                message: 'Please select an image to display',
                value: component.src,
                severity: 'error',
                originalMessage: 'Image component requires src property'
              });
            }
            if (component.width && (component.width < 1 || component.width > 1024)) {
              errors.push({
                path: `${path}/width`,
                message: 'Image width must be between 1 and 1024 pixels',
                value: component.width,
                severity: 'error',
                originalMessage: 'Image width must be between 1 and 1024 pixels'
              });
            }
            break;

          case 'TextInput':
          case 'TextArea':
            if (!component.name || component.name.trim() === '') {
              errors.push({
                path: `${path}/name`,
                message: 'Please add a field name for form processing',
                value: component.name,
                severity: 'error',
                originalMessage: `${component.type} name is required`
              });
            }
            if (component.label && component.label.length > 80) {
              errors.push({
                path: `${path}/label`,
                message: 'Label is too long. Maximum 80 characters allowed.',
                value: component.label,
                severity: 'error',
                originalMessage: `${component.type} label must be 80 characters or less`
              });
            }
            if (component.type === 'TextArea' && component.max_length && component.max_length > 1000) {
              errors.push({
                path: `${path}/max_length`,
                message: 'Text area character limit is too high. Maximum 1000 characters allowed.',
                value: component.max_length,
                severity: 'error',
                originalMessage: 'TextArea max_length cannot exceed 1000 characters'
              });
            }
            break;

          case 'CheckboxGroup':
          case 'RadioButtonsGroup':
          case 'ChipsSelector':
            if (!component.name || component.name.trim() === '') {
              errors.push({
                path: `${path}/name`,
                message: 'Please add a field name for form processing',
                value: component.name,
                severity: 'error',
                originalMessage: `${component.type} name is required`
              });
            }
            if (!component.data_source || !Array.isArray(component.data_source)) {
              errors.push({
                path: `${path}/data_source`,
                message: 'Please add options for users to choose from',
                value: component.data_source,
                severity: 'error',
                originalMessage: `${component.type} requires data_source array`
              });
            } else {
              if (component.data_source.length === 0) {
                errors.push({
                  path: `${path}/data_source`,
                  message: 'Please add at least one option',
                  value: component.data_source,
                  severity: 'error',
                  originalMessage: `${component.type} must have at least one option`
                });
              }
              if (component.data_source.length > 20) {
                errors.push({
                  path: `${path}/data_source`,
                  message: 'Too many options. Maximum 20 options allowed for better user experience.',
                  value: component.data_source,
                  severity: 'error',
                  originalMessage: `${component.type} cannot have more than 20 options`
                });
              }
              component.data_source.forEach((option: any, optionIndex: number) => {
                if (!option.id || option.id.trim() === '') {
                  errors.push({
                    path: `${path}/data_source/${optionIndex}/id`,
                    message: 'Each option needs a unique ID',
                    value: option.id,
                    severity: 'error',
                    originalMessage: 'Option id is required'
                  });
                }
                if (!option.title || option.title.trim() === '') {
                  errors.push({
                    path: `${path}/data_source/${optionIndex}/title`,
                    message: 'Please add text for this option',
                    value: option.title,
                    severity: 'error',
                    originalMessage: 'Option title is required'
                  });
                } else if (option.title.length > 30) {
                  errors.push({
                    path: `${path}/data_source/${optionIndex}/title`,
                    message: 'Option text is too long. Maximum 30 characters allowed.',
                    value: option.title,
                    severity: 'error',
                    originalMessage: 'Option title must be 30 characters or less'
                  });
                }
              });
            }
            break;

          case 'Dropdown':
            if (!component.name || component.name.trim() === '') {
              errors.push({
                path: `${path}/name`,
                message: 'Please add a field name for form processing',
                value: component.name,
                severity: 'error',
                originalMessage: 'Dropdown name is required'
              });
            }
            if (!component.data_source || !Array.isArray(component.data_source)) {
              errors.push({
                path: `${path}/data_source`,
                message: 'Please add options for the dropdown menu',
                value: component.data_source,
                severity: 'error',
                originalMessage: 'Dropdown requires data_source array'
              });
            } else {
              if (component.data_source.length === 0) {
                errors.push({
                  path: `${path}/data_source`,
                  message: 'Please add at least one option to the dropdown',
                  value: component.data_source,
                  severity: 'error',
                  originalMessage: 'Dropdown must have at least one option'
                });
              }
              if (component.data_source.length > 200) {
                errors.push({
                  path: `${path}/data_source`,
                  message: 'Too many dropdown options. Maximum 200 options allowed.',
                  value: component.data_source,
                  severity: 'error',
                  originalMessage: 'Dropdown cannot have more than 200 options'
                });
              }
            }
            break;

          case 'DatePicker':
            if (!component.name || component.name.trim() === '') {
              errors.push({
                path: `${path}/name`,
                message: 'Please add a field name for form processing',
                value: component.name,
                severity: 'error',
                originalMessage: 'DatePicker name is required'
              });
            }
            if (component.min_date && component.max_date) {
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
            break;

          case 'Button':
            if (!component.title || component.title.trim() === '') {
              errors.push({
                path: `${path}/title`,
                message: 'Please add text to the button so users know what it does',
                value: component.title,
                severity: 'error',
                originalMessage: 'Button title is required'
              });
            } else if (component.title.length > 35) {
              errors.push({
                path: `${path}/title`,
                message: 'Button text is too long. Maximum 35 characters allowed.',
                value: component.title,
                severity: 'error',
                originalMessage: 'Button title must be 35 characters or less'
              });
            }
            if (!component.on_click_action) {
              errors.push({
                path: `${path}/on_click_action`,
                message: 'Please set what happens when users click this button',
                value: component.on_click_action,
                severity: 'error',
                originalMessage: 'Button on_click_action is required'
              });
            }
            break;

          case 'Footer':
            if (!component.label || component.label.trim() === '') {
              errors.push({
                path: `${path}/label`,
                message: 'Please add text to the footer button',
                value: component.label,
                severity: 'error',
                originalMessage: 'Footer label is required'
              });
            } else if (component.label.length > 35) {
              errors.push({
                path: `${path}/label`,
                message: 'Footer button text is too long. Maximum 35 characters allowed.',
                value: component.label,
                severity: 'error',
                originalMessage: 'Footer label must be 35 characters or less'
              });
            }
            break;

          case 'OptIn':
            if (!component.name || component.name.trim() === '') {
              errors.push({
                path: `${path}/name`,
                message: 'Please add a field name for form processing',
                value: component.name,
                severity: 'error',
                originalMessage: 'OptIn name is required'
              });
            }
            if (!component.label || component.label.trim() === '') {
              errors.push({
                path: `${path}/label`,
                message: 'Please add text explaining what users are agreeing to',
                value: component.label,
                severity: 'error',
                originalMessage: 'OptIn label is required'
              });
            } else if (component.label.length > 250) {
              errors.push({
                path: `${path}/label`,
                message: 'Opt-in text is too long. Maximum 250 characters allowed.',
                value: component.label,
                severity: 'error',
                originalMessage: 'OptIn label must be 250 characters or less'
              });
            }
            break;

          case 'Form':
            if (!component.name || component.name.trim() === '') {
              errors.push({
                path: `${path}/name`,
                message: 'Please add a name for this form',
                value: component.name,
                severity: 'error',
                originalMessage: 'Form name is required'
              });
            }
            if (!component.children || !Array.isArray(component.children)) {
              errors.push({
                path: `${path}/children`,
                message: 'Please add input fields to this form',
                value: component.children,
                severity: 'error',
                originalMessage: 'Form children array is required'
              });
            } else if (component.children.length === 0) {
              errors.push({
                path: `${path}/children`,
                message: 'Empty form detected. Please add at least one input field.',
                value: component.children,
                severity: 'warning',
                originalMessage: 'Form must contain at least one child component'
              });
            }
            break;

          case 'EmbeddedLink':
            if (!component.text || component.text.trim() === '') {
              errors.push({
                path: `${path}/text`,
                message: 'Please add text for the link',
                value: component.text,
                severity: 'error',
                originalMessage: 'EmbeddedLink text is required'
              });
            }
            if (!component.on_click_action?.payload?.url) {
              errors.push({
                path: `${path}/on_click_action/payload/url`,
                message: 'Please add a valid website URL for this link',
                value: component.on_click_action?.payload?.url,
                severity: 'error',
                originalMessage: 'EmbeddedLink requires valid URL'
              });
            }
            break;

          case 'PhotoPicker':
          case 'DocumentPicker':
            if (!component.name || component.name.trim() === '') {
              errors.push({
                path: `${path}/name`,
                message: 'Please add a field name for form processing',
                value: component.name,
                severity: 'error',
                originalMessage: `${component.type} name is required`
              });
            }
            const maxSize = component.type === 'PhotoPicker' ? 16384 : 102400;
            const maxSizeMB = component.type === 'PhotoPicker' ? 16 : 100;
            if (component.max_file_size_kb && component.max_file_size_kb > maxSize) {
              errors.push({
                path: `${path}/max_file_size_kb`,
                message: `File size limit is too high. Maximum ${maxSizeMB}MB allowed.`,
                value: component.max_file_size_kb,
                severity: 'error',
                originalMessage: `${component.type} max_file_size_kb cannot exceed ${maxSize} KB`
              });
            }
            break;
        }
      });

      // Validate screen-level rules
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
    });

    // Validate flow-level rules
    if (flowData.screens.length > 10) {
      errors.push({
        path: '/screens',
        message: 'Too many screens. WhatsApp allows maximum 10 screens per flow.',
        value: flowData.screens.length,
        severity: 'error',
        originalMessage: 'Flow cannot have more than 10 screens'
      });
    }

    return errors;
  }

  // Auto-fix suggestions for common errors
  getAutoFixSuggestion(error: ValidationError): any {
    const { path, originalMessage } = error;
    
    if (originalMessage?.includes('text is required')) {
      if (path.includes('TextHeading')) return { text: 'New Headline' };
      if (path.includes('TextBody')) return { text: 'New text content' };
      if (path.includes('TextCaption')) return { text: 'New caption' };
      if (path.includes('RichText')) return { text: 'New **rich** text' };
    }
    
    if (originalMessage?.includes('title is required')) {
      return { title: 'Continue' };
    }
    
    if (originalMessage?.includes('label is required')) {
      return { label: 'Enter text' };
    }
    
    if (originalMessage?.includes('name is required')) {
      return { name: 'field_name' };
    }
    
    if (originalMessage?.includes('data_source')) {
      return { 
        data_source: [
          { id: 'option_1', title: 'Option 1' },
          { id: 'option_2', title: 'Option 2' }
        ]
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