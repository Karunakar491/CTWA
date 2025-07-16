import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: any[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errors.push({
          location: 'body',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
            type: detail.type,
          })),
        });
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errors.push({
          location: 'query',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
            type: detail.type,
          })),
        });
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errors.push({
          location: 'params',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
            type: detail.type,
          })),
        });
      }
    }

    // Validate headers
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errors.push({
          location: 'headers',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
            type: detail.type,
          })),
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Request validation failed', errors);
    }

    next();
  };
};

// Enhanced common validation schemas
export const commonSchemas = {
  id: Joi.string().uuid().required(),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt'),
  }),
  
  search: Joi.object({
    q: Joi.string().min(1).max(100).trim(),
    category: Joi.string().trim(),
    tags: Joi.array().items(Joi.string().trim()),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
  }),

  flowJson: Joi.object({
    version: Joi.string().valid('3.0', '4.0', '5.0', '6.0', '7.0', '7.1').required(),
    data_api_version: Joi.string().valid('3.0').optional(),
    name: Joi.string().min(1).max(255).required(),
    routing_model: Joi.object().optional(),
    screens: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        terminal: Joi.boolean().optional(),
        success: Joi.boolean().optional(),
        data: Joi.array().items(Joi.object()).required(),
        layout: Joi.object().optional(),
      })
    ).min(1).required(),
  }),

  metaWebhook: Joi.object({
    object: Joi.string().valid('whatsapp_business_account').required(),
    entry: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        changes: Joi.array().items(
          Joi.object({
            value: Joi.object().required(),
            field: Joi.string().required(),
          })
        ).required(),
      })
    ).required(),
  }),

  email: Joi.string().email().lowercase().trim(),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
    }),

  name: Joi.string().min(2).max(100).trim().pattern(/^[a-zA-Z\s]+$/).messages({
    'string.pattern.base': 'Name must contain only letters and spaces',
  }),

  url: Joi.string().uri({ scheme: ['http', 'https'] }),

  phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).messages({
    'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)',
  }),

  dateRange: Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().min(Joi.ref('start')).required(),
  }),

  mediaFile: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().valid(
      'image/jpeg',
      'image/png', 
      'image/webp',
      'application/pdf'
    ).required(),
    size: Joi.number().max(5 * 1024 * 1024).required(), // 5MB max
    destination: Joi.string().required(),
    filename: Joi.string().required(),
    path: Joi.string().required(),
  }),
};

// Custom validation functions
export const customValidators = {
  // Validate WhatsApp Flow component
  flowComponent: (component: any): boolean => {
    const validTypes = [
      'TextHeading', 'TextSubheading', 'TextBody', 'TextCaption', 'RichText',
      'TextInput', 'TextArea', 'CheckboxGroup', 'RadioButtonsGroup', 
      'Dropdown', 'DatePicker', 'OptIn', 'ChipsSelector',
      'Image', 'ImageCarousel', 'PhotoPicker', 'DocumentPicker',
      'Button', 'Footer', 'EmbeddedLink', 'Form'
    ];
    
    return validTypes.includes(component.type);
  },

  // Validate Meta API version compatibility
  apiVersionCompatibility: (version: string, componentType: string): boolean => {
    const compatibility: Record<string, string[]> = {
      'TextCaption': ['5.0', '6.0', '7.0', '7.1'],
      'ChipsSelector': ['7.0', '7.1'],
      'ImageCarousel': ['7.0', '7.1'],
      // Add more component-version mappings
    };

    if (!compatibility[componentType]) {
      return true; // Component available in all versions
    }

    return compatibility[componentType].includes(version);
  },

  // Validate file upload security
  secureFileName: (filename: string): boolean => {
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }

    // Check for executable extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    return !dangerousExtensions.includes(ext);
  },
};

// Validation error formatter
export const formatValidationErrors = (errors: any[]): string => {
  return errors
    .map(errorGroup => 
      errorGroup.details
        .map((detail: any) => `${errorGroup.location}.${detail.field}: ${detail.message}`)
        .join(', ')
    )
    .join('; ');
};