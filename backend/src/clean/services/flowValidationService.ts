/**
 * Flow Validation Service
 * Validates flow structures against Meta specifications and provides auto-correction
 */

import Joi from 'joi';
import { logger } from '../utils/logger';
import { FlowJSONDefinition, FlowScreen, FlowComponent, ComponentType } from './metaApi';

// Validation result interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  correctedFlow?: FlowJSONDefinition;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  autoFixAvailable: boolean;
  component?: string;
  screen?: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface ValidationSuggestion {
  path: string;
  message: string;
  suggestedValue?: any;
  reason: string;
}

export interface CorrectionResult {
  correctedFlow: FlowJSONDefinition;
  appliedFixes: AppliedFix[];
  remainingIssues: ValidationError[];
}

export interface AppliedFix {
  path: string;
  description: string;
  originalValue: any;
  correctedValue: any;
}

export interface MigrationRule {
  component: string;
  changes: ComponentChange[];
}

export interface ComponentChange {
  type: 'add' | 'remove' | 'modify' | 'rename';
  property?: string;
  defaultValue?: any;
  mapping?: Record<string, any>;
}

export class FlowValidationService {
  private componentSchemas: Map<string, Map<ComponentType, Joi.Schema>> = new Map();
  private versionSchemas: Map<string, Joi.Schema> = new Map();
  private migrationRules: Map<string, MigrationRule[]> = new Map();

  constructor() {
    this.initializeSchemas();
    this.initializeMigrationRules();
  }

  private initializeSchemas(): void {
    // Initialize schemas for each supported version
    const supportedVersions = ['3.0', '4.0', '5.0', '6.0', '7.0', '7.1'];
    
    supportedVersions.forEach(version => {
      this.versionSchemas.set(version, this.createVersionSchema(version));
      this.componentSchemas.set(version, this.createComponentSchemas(version));
    });
  }

  private createVersionSchema(version: string): Joi.Schema {
    const baseSchema = Joi.object({
      version: Joi.string().valid(version).required(),
      data_api_version: Joi.string().valid('3.0').optional(),
      routing_model: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())).optional(),
      screens: Joi.array().items(this.createScreenSchema(version)).min(1).required()
    });

    // Version-specific modifications
    switch (version) {
      case '7.1':
      case '7.0':
        return baseSchema.keys({
          // Add version 7.x specific fields
          metadata: Joi.object({
            flow_id: Joi.string().optional(),
            created_at: Joi.date().optional(),
            updated_at: Joi.date().optional()
          }).optional()
        });
      default:
        return baseSchema;
    }
  }

  private createScreenSchema(version: string): Joi.Schema {
    return Joi.object({
      id: Joi.string().required(),
      title: Joi.string().required(),
      terminal: Joi.boolean().optional(),
      success: Joi.boolean().optional(),
      data: Joi.array().items(Joi.object()).required(),
      layout: Joi.object({
        type: Joi.string().valid('SingleColumnLayout').required(),
        children: Joi.array().items(Joi.string()).required()
      }).optional()
    });
  }

  private createComponentSchemas(version: string): Map<ComponentType, Joi.Schema> {
    const schemas = new Map<ComponentType, Joi.Schema>();

    // Text Components
    schemas.set('TextHeading', Joi.object({
      type: Joi.string().valid('TextHeading').required(),
      text: Joi.string().required(),
      name: Joi.string().optional()
    }));

    schemas.set('TextSubheading', Joi.object({
      type: Joi.string().valid('TextSubheading').required(),
      text: Joi.string().required(),
      name: Joi.string().optional()
    }));

    schemas.set('TextBody', Joi.object({
      type: Joi.string().valid('TextBody').required(),
      text: Joi.string().required(),
      name: Joi.string().optional()
    }));

    schemas.set('TextCaption', Joi.object({
      type: Joi.string().valid('TextCaption').required(),
      text: Joi.string().required(),
      name: Joi.string().optional()
    }));

    schemas.set('RichText', Joi.object({
      type: Joi.string().valid('RichText').required(),
      text: Joi.string().required(),
      name: Joi.string().optional(),
      markdown: Joi.boolean().optional()
    }));

    // Input Components
    schemas.set('TextInput', Joi.object({
      type: Joi.string().valid('TextInput').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      input_type: Joi.string().valid('text', 'number', 'email', 'phone', 'password').optional(),
      helper_text: Joi.string().optional(),
      max_chars: Joi.number().min(1).max(1000).optional()
    }));

    schemas.set('TextArea', Joi.object({
      type: Joi.string().valid('TextArea').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      helper_text: Joi.string().optional(),
      max_chars: Joi.number().min(1).max(3000).optional()
    }));

    schemas.set('CheckboxGroup', Joi.object({
      type: Joi.string().valid('CheckboxGroup').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      data_source: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        description: Joi.string().optional(),
        enabled: Joi.boolean().optional()
      })).required()
    }));

    schemas.set('RadioButtonsGroup', Joi.object({
      type: Joi.string().valid('RadioButtonsGroup').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      data_source: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        description: Joi.string().optional(),
        enabled: Joi.boolean().optional()
      })).required()
    }));

    schemas.set('Dropdown', Joi.object({
      type: Joi.string().valid('Dropdown').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      data_source: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        description: Joi.string().optional(),
        enabled: Joi.boolean().optional()
      })).required()
    }));

    schemas.set('DatePicker', Joi.object({
      type: Joi.string().valid('DatePicker').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      min_date: Joi.string().optional(),
      max_date: Joi.string().optional(),
      unavailable_dates: Joi.array().items(Joi.string()).optional()
    }));

    schemas.set('OptIn', Joi.object({
      type: Joi.string().valid('OptIn').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional()
    }));

    // Media Components
    schemas.set('Image', Joi.object({
      type: Joi.string().valid('Image').required(),
      src: Joi.string().uri().required(),
      alt_text: Joi.string().optional(),
      width: Joi.number().optional(),
      height: Joi.number().optional(),
      name: Joi.string().optional()
    }));

    schemas.set('PhotoPicker', Joi.object({
      type: Joi.string().valid('PhotoPicker').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      description: Joi.string().optional()
    }));

    schemas.set('DocumentPicker', Joi.object({
      type: Joi.string().valid('DocumentPicker').required(),
      name: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().optional(),
      description: Joi.string().optional()
    }));

    // Action Components
    schemas.set('Button', Joi.object({
      type: Joi.string().valid('Button').required(),
      text: Joi.string().required(),
      action: Joi.object({
        name: Joi.string().valid('navigate', 'complete', 'data_exchange').required(),
        next: Joi.object({
          type: Joi.string().valid('screen').required(),
          name: Joi.string().required()
        }).when('name', { is: 'navigate', then: Joi.required(), otherwise: Joi.optional() }),
        payload: Joi.object().when('name', { is: 'data_exchange', then: Joi.required(), otherwise: Joi.optional() })
      }).required(),
      name: Joi.string().optional()
    }));

    schemas.set('Footer', Joi.object({
      type: Joi.string().valid('Footer').required(),
      label: Joi.string().required(),
      on_click_action: Joi.object({
        name: Joi.string().valid('navigate', 'complete', 'data_exchange').required(),
        next: Joi.object({
          type: Joi.string().valid('screen').required(),
          name: Joi.string().required()
        }).optional(),
        payload: Joi.object().optional()
      }).required(),
      name: Joi.string().optional()
    }));

    // Container Components
    schemas.set('Form', Joi.object({
      type: Joi.string().valid('Form').required(),
      name: Joi.string().required(),
      children: Joi.array().items(Joi.string()).required(),
      init_values: Joi.object().optional()
    }));

    // Version-specific component modifications
    if (parseFloat(version) >= 7.0) {
      // Add version 7.0+ specific components or modifications
      schemas.set('ChipsSelector', Joi.object({
        type: Joi.string().valid('ChipsSelector').required(),
        name: Joi.string().required(),
        label: Joi.string().required(),
        required: Joi.boolean().optional(),
        data_source: Joi.array().items(Joi.object({
          id: Joi.string().required(),
          title: Joi.string().required()
        })).required(),
        min_selected_items: Joi.number().min(0).optional(),
        max_selected_items: Joi.number().min(1).optional()
      }));

      schemas.set('ImageCarousel', Joi.object({
        type: Joi.string().valid('ImageCarousel').required(),
        images: Joi.array().items(Joi.object({
          src: Joi.string().uri().required(),
          alt_text: Joi.string().optional()
        })).min(1).required(),
        name: Joi.string().optional()
      }));
    }

    return schemas;
  }

  private initializeMigrationRules(): void {
    // Define migration rules between versions
    this.migrationRules.set('3.0->4.0', [
      {
        component: 'TextInput',
        changes: [
          { type: 'add', property: 'input_type', defaultValue: 'text' }
        ]
      }
    ]);

    this.migrationRules.set('6.0->7.0', [
      {
        component: 'Button',
        changes: [
          { type: 'modify', property: 'action.name', mapping: { 'submit': 'data_exchange' } }
        ]
      }
    ]);

    // Add more migration rules as needed
  }

  /**
   * Validate a complete flow against its specified version
   */
  async validateFlow(flow: FlowJSONDefinition): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Validate overall flow structure
      const versionSchema = this.versionSchemas.get(flow.version);
      if (!versionSchema) {
        errors.push({
          path: 'version',
          message: `Unsupported flow version: ${flow.version}`,
          severity: 'error',
          code: 'UNSUPPORTED_VERSION',
          autoFixAvailable: false
        });
        return { isValid: false, errors, warnings, suggestions };
      }

      const { error: structureError } = versionSchema.validate(flow, { abortEarly: false });
      if (structureError) {
        structureError.details.forEach(detail => {
          errors.push({
            path: detail.path.join('.'),
            message: detail.message,
            severity: 'error',
            code: 'STRUCTURE_ERROR',
            autoFixAvailable: this.canAutoFix(detail.type)
          });
        });
      }

      // Validate individual components
      const componentSchemas = this.componentSchemas.get(flow.version);
      if (componentSchemas) {
        for (let screenIndex = 0; screenIndex < flow.screens.length; screenIndex++) {
          const screen = flow.screens[screenIndex];
          await this.validateScreen(screen, screenIndex, componentSchemas, errors, warnings, suggestions);
        }
      }

      // Check for flow connectivity issues
      this.validateFlowConnectivity(flow, errors, warnings);

      // Generate auto-correction if possible
      let correctedFlow: FlowJSONDefinition | undefined;
      if (errors.some(e => e.autoFixAvailable)) {
        const correctionResult = await this.autoCorrectFlow(flow);
        correctedFlow = correctionResult.correctedFlow;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        correctedFlow
      };

    } catch (error) {
      logger.error('Flow validation error', { error: error instanceof Error ? error.message : 'Unknown error' });
      errors.push({
        path: 'root',
        message: 'Internal validation error',
        severity: 'error',
        code: 'VALIDATION_ERROR',
        autoFixAvailable: false
      });

      return { isValid: false, errors, warnings, suggestions };
    }
  }

  private async validateScreen(
    screen: FlowScreen,
    screenIndex: number,
    componentSchemas: Map<ComponentType, Joi.Schema>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[]
  ): Promise<void> {
    const screenPath = `screens[${screenIndex}]`;

    // Validate screen structure
    if (!screen.id || screen.id.trim() === '') {
      errors.push({
        path: `${screenPath}.id`,
        message: 'Screen ID is required',
        severity: 'error',
        code: 'MISSING_SCREEN_ID',
        autoFixAvailable: true,
        screen: screen.id
      });
    }

    if (!screen.title || screen.title.trim() === '') {
      errors.push({
        path: `${screenPath}.title`,
        message: 'Screen title is required',
        severity: 'error',
        code: 'MISSING_SCREEN_TITLE',
        autoFixAvailable: true,
        screen: screen.id
      });
    }

    // Validate components
    for (let componentIndex = 0; componentIndex < screen.data.length; componentIndex++) {
      const component = screen.data[componentIndex];
      const componentPath = `${screenPath}.data[${componentIndex}]`;
      
      await this.validateComponent(component, componentPath, componentSchemas, errors, warnings, suggestions, screen.id);
    }

    // Check for layout consistency
    if (screen.layout) {
      this.validateLayout(screen, screenPath, errors, warnings);
    }
  }

  private async validateComponent(
    component: FlowComponent,
    componentPath: string,
    componentSchemas: Map<ComponentType, Joi.Schema>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    screenId: string
  ): Promise<void> {
    if (!component.type) {
      errors.push({
        path: `${componentPath}.type`,
        message: 'Component type is required',
        severity: 'error',
        code: 'MISSING_COMPONENT_TYPE',
        autoFixAvailable: false,
        screen: screenId
      });
      return;
    }

    const schema = componentSchemas.get(component.type as ComponentType);
    if (!schema) {
      errors.push({
        path: componentPath,
        message: `Unknown component type: ${component.type}`,
        severity: 'error',
        code: 'UNKNOWN_COMPONENT_TYPE',
        autoFixAvailable: false,
        component: component.type,
        screen: screenId
      });
      return;
    }

    const { error } = schema.validate(component, { abortEarly: false });
    if (error) {
      error.details.forEach(detail => {
        errors.push({
          path: `${componentPath}.${detail.path.join('.')}`,
          message: detail.message,
          severity: 'error',
          code: 'COMPONENT_VALIDATION_ERROR',
          autoFixAvailable: this.canAutoFix(detail.type),
          component: component.type,
          screen: screenId
        });
      });
    }

    // Component-specific validations
    await this.validateComponentSpecific(component, componentPath, errors, warnings, suggestions, screenId);
  }

  private async validateComponentSpecific(
    component: FlowComponent,
    componentPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    screenId: string
  ): Promise<void> {
    switch (component.type) {
      case 'Button':
        this.validateButtonComponent(component, componentPath, errors, warnings, suggestions, screenId);
        break;
      case 'TextInput':
        this.validateTextInputComponent(component, componentPath, errors, warnings, suggestions, screenId);
        break;
      case 'Image':
        await this.validateImageComponent(component, componentPath, errors, warnings, suggestions, screenId);
        break;
      // Add more component-specific validations as needed
    }
  }

  private validateButtonComponent(
    component: FlowComponent,
    componentPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    screenId: string
  ): void {
    if (component.action?.name === 'navigate' && !component.action.next) {
      errors.push({
        path: `${componentPath}.action.next`,
        message: 'Navigate action requires next screen specification',
        severity: 'error',
        code: 'MISSING_NAVIGATION_TARGET',
        autoFixAvailable: false,
        component: component.type,
        screen: screenId
      });
    }

    if (!component.text || component.text.trim() === '') {
      errors.push({
        path: `${componentPath}.text`,
        message: 'Button text is required',
        severity: 'error',
        code: 'MISSING_BUTTON_TEXT',
        autoFixAvailable: true,
        component: component.type,
        screen: screenId
      });
    }
  }

  private validateTextInputComponent(
    component: FlowComponent,
    componentPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    screenId: string
  ): void {
    if (component.max_chars && component.max_chars > 1000) {
      warnings.push({
        path: `${componentPath}.max_chars`,
        message: 'Text input max_chars exceeds recommended limit of 1000',
        code: 'EXCESSIVE_MAX_CHARS',
        suggestion: 'Consider using TextArea for longer text inputs'
      });
    }

    if (component.input_type === 'email' && !component.name?.includes('email')) {
      suggestions.push({
        path: `${componentPath}.name`,
        message: 'Consider using descriptive names for email inputs',
        suggestedValue: `${component.name || 'field'}_email`,
        reason: 'Improves form data clarity'
      });
    }
  }

  private async validateImageComponent(
    component: FlowComponent,
    componentPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    suggestions: ValidationSuggestion[],
    screenId: string
  ): Promise<void> {
    if (!component.src) {
      errors.push({
        path: `${componentPath}.src`,
        message: 'Image source URL is required',
        severity: 'error',
        code: 'MISSING_IMAGE_SRC',
        autoFixAvailable: false,
        component: component.type,
        screen: screenId
      });
      return;
    }

    // Validate URL format
    try {
      new URL(component.src);
    } catch {
      errors.push({
        path: `${componentPath}.src`,
        message: 'Invalid image URL format',
        severity: 'error',
        code: 'INVALID_IMAGE_URL',
        autoFixAvailable: false,
        component: component.type,
        screen: screenId
      });
    }

    if (!component.alt_text) {
      warnings.push({
        path: `${componentPath}.alt_text`,
        message: 'Alt text is recommended for accessibility',
        code: 'MISSING_ALT_TEXT',
        suggestion: 'Add descriptive alt text for screen readers'
      });
    }
  }

  private validateLayout(
    screen: FlowScreen,
    screenPath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (screen.layout?.type === 'SingleColumnLayout') {
      const layoutChildren = screen.layout.children || [];
      const componentNames = screen.data
        .filter(component => component.name)
        .map(component => component.name);

      // Check if all layout children reference valid components
      layoutChildren.forEach((childName, index) => {
        if (!componentNames.includes(childName)) {
          errors.push({
            path: `${screenPath}.layout.children[${index}]`,
            message: `Layout references non-existent component: ${childName}`,
            severity: 'error',
            code: 'INVALID_LAYOUT_REFERENCE',
            autoFixAvailable: true,
            screen: screen.id
          });
        }
      });

      // Warn about components not included in layout
      componentNames.forEach(componentName => {
        if (componentName && !layoutChildren.includes(componentName)) {
          warnings.push({
            path: `${screenPath}.layout.children`,
            message: `Component '${componentName}' is not included in layout`,
            code: 'COMPONENT_NOT_IN_LAYOUT',
            suggestion: 'Add component to layout or remove layout specification'
          });
        }
      });
    }
  }

  private validateFlowConnectivity(
    flow: FlowJSONDefinition,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const screenIds = flow.screens.map(screen => screen.id);
    const referencedScreens = new Set<string>();

    // Collect all screen references from navigation actions
    flow.screens.forEach((screen, screenIndex) => {
      screen.data.forEach((component, componentIndex) => {
        if (component.type === 'Button' && component.action?.name === 'navigate') {
          const targetScreen = component.action.next?.name;
          if (targetScreen) {
            referencedScreens.add(targetScreen);
            
            if (!screenIds.includes(targetScreen)) {
              errors.push({
                path: `screens[${screenIndex}].data[${componentIndex}].action.next.name`,
                message: `Navigation references non-existent screen: ${targetScreen}`,
                severity: 'error',
                code: 'INVALID_SCREEN_REFERENCE',
                autoFixAvailable: false,
                component: component.type,
                screen: screen.id
              });
            }
          }
        }
      });
    });

    // Check for unreachable screens (except the first screen)
    screenIds.slice(1).forEach((screenId, index) => {
      if (!referencedScreens.has(screenId)) {
        warnings.push({
          path: `screens[${index + 1}]`,
          message: `Screen '${screenId}' may be unreachable`,
          code: 'UNREACHABLE_SCREEN',
          suggestion: 'Ensure there is a navigation path to this screen'
        });
      }
    });

    // Check for terminal screens
    const hasTerminalScreen = flow.screens.some(screen => screen.terminal === true);
    if (!hasTerminalScreen) {
      warnings.push({
        path: 'screens',
        message: 'Flow has no terminal screen',
        code: 'NO_TERMINAL_SCREEN',
        suggestion: 'Mark at least one screen as terminal or add completion actions'
      });
    }
  }

  private canAutoFix(errorType: string): boolean {
    const autoFixableTypes = [
      'any.required',
      'string.empty',
      'object.missing',
      'array.min'
    ];
    return autoFixableTypes.includes(errorType);
  }

  /**
   * Auto-correct flow issues where possible
   */
  async autoCorrectFlow(flow: FlowJSONDefinition): Promise<CorrectionResult> {
    const correctedFlow = JSON.parse(JSON.stringify(flow)); // Deep clone
    const appliedFixes: AppliedFix[] = [];
    const remainingIssues: ValidationError[] = [];

    try {
      // Auto-fix missing screen IDs
      correctedFlow.screens.forEach((screen: FlowScreen, index: number) => {
        if (!screen.id || screen.id.trim() === '') {
          const originalValue = screen.id;
          screen.id = `screen_${index + 1}`;
          appliedFixes.push({
            path: `screens[${index}].id`,
            description: 'Generated missing screen ID',
            originalValue,
            correctedValue: screen.id
          });
        }

        if (!screen.title || screen.title.trim() === '') {
          const originalValue = screen.title;
          screen.title = `Screen ${index + 1}`;
          appliedFixes.push({
            path: `screens[${index}].title`,
            description: 'Generated missing screen title',
            originalValue,
            correctedValue: screen.title
          });
        }

        // Auto-fix missing button text
        screen.data.forEach((component: FlowComponent, componentIndex: number) => {
          if (component.type === 'Button' && (!component.text || component.text.trim() === '')) {
            const originalValue = component.text;
            component.text = 'Continue';
            appliedFixes.push({
              path: `screens[${index}].data[${componentIndex}].text`,
              description: 'Added default button text',
              originalValue,
              correctedValue: component.text
            });
          }
        });
      });

      // Validate the corrected flow to identify remaining issues
      const validationResult = await this.validateFlow(correctedFlow);
      remainingIssues.push(...validationResult.errors);

      return {
        correctedFlow,
        appliedFixes,
        remainingIssues
      };

    } catch (error) {
      logger.error('Auto-correction error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        correctedFlow: flow,
        appliedFixes: [],
        remainingIssues: [{
          path: 'root',
          message: 'Auto-correction failed',
          severity: 'error',
          code: 'AUTO_CORRECTION_ERROR',
          autoFixAvailable: false
        }]
      };
    }
  }
}

// Export singleton instance
export const flowValidationService = new FlowValidationService();