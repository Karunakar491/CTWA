import { flowValidationService, ValidationResult, CorrectionResult, CompatibilityReport } from '../flowValidation';
import { FlowJSONDefinition } from '../metaApi';

describe('FlowValidationService', () => {
  describe('validateFlow', () => {
    it('should validate a correct flow successfully', async () => {
      const validFlow: FlowJSONDefinition = {
        version: '7.1',
        data_api_version: '3.0',
        screens: [
          {
            id: 'welcome_screen',
            title: 'Welcome',
            data: [
              {
                type: 'TextHeading',
                text: 'Welcome to our service',
                name: 'heading'
              },
              {
                type: 'Button',
                text: 'Continue',
                action: {
                  name: 'navigate',
                  next: {
                    type: 'screen',
                    name: 'form_screen'
                  }
                }
              }
            ]
          },
          {
            id: 'form_screen',
            title: 'Information Form',
            terminal: true,
            data: [
              {
                type: 'TextInput',
                name: 'user_name',
                label: 'Your Name',
                required: true
              },
              {
                type: 'Button',
                text: 'Submit',
                action: {
                  name: 'complete'
                }
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(validFlow);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const invalidFlow: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: '',
            title: '',
            data: [
              {
                type: 'TextHeading',
                text: '',
                name: 'heading'
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(invalidFlow);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === 'MISSING_SCREEN_ID')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_SCREEN_TITLE')).toBe(true);
    });

    it('should detect invalid component types', async () => {
      const invalidFlow: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'test_screen',
            title: 'Test Screen',
            data: [
              {
                type: 'InvalidComponent' as any,
                name: 'invalid'
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(invalidFlow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'UNKNOWN_COMPONENT_TYPE')).toBe(true);
    });

    it('should detect navigation to non-existent screens', async () => {
      const invalidFlow: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'screen1',
            title: 'Screen 1',
            data: [
              {
                type: 'Button',
                text: 'Go to Screen 2',
                action: {
                  name: 'navigate',
                  next: {
                    type: 'screen',
                    name: 'non_existent_screen'
                  }
                }
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(invalidFlow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_SCREEN_REFERENCE')).toBe(true);
    });

    it('should warn about unreachable screens', async () => {
      const flowWithUnreachableScreen: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'screen1',
            title: 'Screen 1',
            terminal: true,
            data: [
              {
                type: 'TextHeading',
                text: 'Welcome'
              }
            ]
          },
          {
            id: 'screen2',
            title: 'Screen 2',
            data: [
              {
                type: 'TextHeading',
                text: 'Unreachable'
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithUnreachableScreen);

      expect(result.warnings.some(w => w.code === 'UNREACHABLE_SCREEN')).toBe(true);
    });

    it('should validate TextInput component properly', async () => {
      const flowWithTextInput: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'form_screen',
            title: 'Form',
            data: [
              {
                type: 'TextInput',
                name: 'email',
                label: 'Email Address',
                required: true,
                input_type: 'email',
                max_chars: 100
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithTextInput);

      expect(result.isValid).toBe(true);
    });

    it('should warn about excessive max_chars in TextInput', async () => {
      const flowWithExcessiveMaxChars: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'form_screen',
            title: 'Form',
            data: [
              {
                type: 'TextInput',
                name: 'description',
                label: 'Description',
                max_chars: 2000
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithExcessiveMaxChars);

      expect(result.warnings.some(w => w.code === 'EXCESSIVE_MAX_CHARS')).toBe(true);
    });

    it('should validate Image component and warn about missing alt text', async () => {
      const flowWithImage: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'image_screen',
            title: 'Image Screen',
            data: [
              {
                type: 'Image',
                src: 'https://example.com/image.jpg'
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithImage);

      expect(result.warnings.some(w => w.code === 'MISSING_ALT_TEXT')).toBe(true);
    });

    it('should detect invalid image URLs', async () => {
      const flowWithInvalidImage: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'image_screen',
            title: 'Image Screen',
            data: [
              {
                type: 'Image',
                src: 'invalid-url'
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithInvalidImage);

      expect(result.errors.some(e => e.code === 'INVALID_IMAGE_URL')).toBe(true);
    });

    it('should validate layout references', async () => {
      const flowWithLayout: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'layout_screen',
            title: 'Layout Screen',
            data: [
              {
                type: 'TextHeading',
                text: 'Heading',
                name: 'heading'
              },
              {
                type: 'TextBody',
                text: 'Body text',
                name: 'body'
              }
            ],
            layout: {
              type: 'SingleColumnLayout',
              children: ['heading', 'body', 'non_existent']
            }
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithLayout);

      expect(result.errors.some(e => e.code === 'INVALID_LAYOUT_REFERENCE')).toBe(true);
    });

    it('should handle unsupported flow versions', async () => {
      const unsupportedVersionFlow: FlowJSONDefinition = {
        version: '99.0' as any,
        screens: [
          {
            id: 'test_screen',
            title: 'Test',
            data: []
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(unsupportedVersionFlow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'UNSUPPORTED_VERSION')).toBe(true);
    });
  });

  describe('autoCorrectFlow', () => {
    it('should auto-correct missing screen IDs and titles', async () => {
      const flowWithMissingFields: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: '',
            title: '',
            data: [
              {
                type: 'TextHeading',
                text: 'Test'
              }
            ]
          }
        ]
      };

      const result: CorrectionResult = await flowValidationService.autoCorrectFlow(flowWithMissingFields);

      expect(result.correctedFlow.screens[0].id).toBe('screen_1');
      expect(result.correctedFlow.screens[0].title).toBe('Screen 1');
      expect(result.appliedFixes).toHaveLength(2);
      expect(result.appliedFixes.some(f => f.path === 'screens[0].id')).toBe(true);
      expect(result.appliedFixes.some(f => f.path === 'screens[0].title')).toBe(true);
    });

    it('should auto-correct missing button text', async () => {
      const flowWithMissingButtonText: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'test_screen',
            title: 'Test Screen',
            data: [
              {
                type: 'Button',
                text: '',
                action: {
                  name: 'complete'
                }
              }
            ]
          }
        ]
      };

      const result: CorrectionResult = await flowValidationService.autoCorrectFlow(flowWithMissingButtonText);

      expect(result.correctedFlow.screens[0].data[0].text).toBe('Continue');
      expect(result.appliedFixes).toHaveLength(1);
      expect(result.appliedFixes[0].path).toBe('screens[0].data[0].text');
    });
  });

  describe('checkCompatibility', () => {
    it('should report compatibility for same version', async () => {
      const flow: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'test_screen',
            title: 'Test',
            data: [
              {
                type: 'TextHeading',
                text: 'Test'
              }
            ]
          }
        ]
      };

      const result: CompatibilityReport = await flowValidationService.checkCompatibility(flow, '7.1');

      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toContain('Flow is already at target version');
    });

    it('should detect unsupported components in target version', async () => {
      const flowWithNewComponent: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'test_screen',
            title: 'Test',
            data: [
              {
                type: 'ChipsSelector',
                name: 'chips',
                label: 'Select options',
                data_source: [
                  { id: '1', title: 'Option 1' }
                ]
              }
            ]
          }
        ]
      };

      const result: CompatibilityReport = await flowValidationService.checkCompatibility(flowWithNewComponent, '6.0');

      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'unsupported')).toBe(true);
    });

    it('should handle unsupported target versions', async () => {
      const flow: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'test_screen',
            title: 'Test',
            data: []
          }
        ]
      };

      const result: CompatibilityReport = await flowValidationService.checkCompatibility(flow, '99.0');

      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.message.includes('not supported'))).toBe(true);
    });
  });

  describe('migrateFlow', () => {
    it('should migrate flow version successfully', async () => {
      const flow: FlowJSONDefinition = {
        version: '7.0',
        screens: [
          {
            id: 'test_screen',
            title: 'Test',
            data: [
              {
                type: 'TextHeading',
                text: 'Test'
              }
            ]
          }
        ]
      };

      const migratedFlow = await flowValidationService.migrateFlow(flow, '7.1');

      expect(migratedFlow.version).toBe('7.1');
    });

    it('should throw error for incompatible migration', async () => {
      const flowWithIncompatibleComponent: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'test_screen',
            title: 'Test',
            data: [
              {
                type: 'ChipsSelector',
                name: 'chips',
                label: 'Select',
                data_source: []
              }
            ]
          }
        ]
      };

      await expect(
        flowValidationService.migrateFlow(flowWithIncompatibleComponent, '6.0')
      ).rejects.toThrow('Cannot migrate flow');
    });
  });

  describe('Component-specific validations', () => {
    it('should validate CheckboxGroup component', async () => {
      const flowWithCheckboxGroup: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'checkbox_screen',
            title: 'Checkbox Screen',
            data: [
              {
                type: 'CheckboxGroup',
                name: 'preferences',
                label: 'Select your preferences',
                required: true,
                data_source: [
                  { id: 'option1', title: 'Option 1', description: 'First option' },
                  { id: 'option2', title: 'Option 2', enabled: true }
                ]
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithCheckboxGroup);

      expect(result.isValid).toBe(true);
    });

    it('should validate DatePicker component', async () => {
      const flowWithDatePicker: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'date_screen',
            title: 'Date Screen',
            data: [
              {
                type: 'DatePicker',
                name: 'appointment_date',
                label: 'Select appointment date',
                required: true,
                min_date: '2024-01-01',
                max_date: '2024-12-31',
                unavailable_dates: ['2024-12-25', '2024-01-01']
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithDatePicker);

      expect(result.isValid).toBe(true);
    });

    it('should validate Form component', async () => {
      const flowWithForm: FlowJSONDefinition = {
        version: '7.1',
        screens: [
          {
            id: 'form_screen',
            title: 'Form Screen',
            data: [
              {
                type: 'Form',
                name: 'user_form',
                children: ['name_input', 'email_input'],
                init_values: {
                  name_input: '',
                  email_input: ''
                }
              },
              {
                type: 'TextInput',
                name: 'name_input',
                label: 'Name',
                required: true
              },
              {
                type: 'TextInput',
                name: 'email_input',
                label: 'Email',
                input_type: 'email',
                required: true
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithForm);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Version-specific component support', () => {
    it('should support ChipsSelector in version 7.0+', async () => {
      const flowWithChipsSelector: FlowJSONDefinition = {
        version: '7.0',
        screens: [
          {
            id: 'chips_screen',
            title: 'Chips Screen',
            data: [
              {
                type: 'ChipsSelector',
                name: 'tags',
                label: 'Select tags',
                data_source: [
                  { id: 'tag1', title: 'Tag 1' },
                  { id: 'tag2', title: 'Tag 2' }
                ],
                min_selected_items: 1,
                max_selected_items: 3
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithChipsSelector);

      expect(result.isValid).toBe(true);
    });

    it('should support ImageCarousel in version 7.0+', async () => {
      const flowWithImageCarousel: FlowJSONDefinition = {
        version: '7.0',
        screens: [
          {
            id: 'carousel_screen',
            title: 'Carousel Screen',
            data: [
              {
                type: 'ImageCarousel',
                images: [
                  { src: 'https://example.com/image1.jpg', alt_text: 'Image 1' },
                  { src: 'https://example.com/image2.jpg', alt_text: 'Image 2' }
                ]
              }
            ]
          }
        ]
      };

      const result: ValidationResult = await flowValidationService.validateFlow(flowWithImageCarousel);

      expect(result.isValid).toBe(true);
    });
  });
});