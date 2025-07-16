import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { FlowJSONDefinition } from './metaApi';
import { logger } from '@/utils/logger';

// Simple template interfaces
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  flowJson: FlowJSONDefinition;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  ratingCount: number;
  isOfficial: boolean;
  previewImage?: string;
}

export interface TemplateCreateRequest {
  name: string;
  description: string;
  category: string;
  tags: string[];
  flowJson: FlowJSONDefinition;
  previewImage?: string;
}

export interface TemplateSearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  isOfficial?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'usage' | 'rating' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export class TemplateLibraryService {
  private templatesPath: string;

  constructor() {
    this.templatesPath = process.env.TEMPLATES_PATH || 'templates';
    this.initializeDirectories();
    this.initializeDefaultTemplates();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.templatesPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize templates directory', { error });
    }
  }

  private async initializeDefaultTemplates(): Promise<void> {
    try {
      // Check if we already have templates
      const existingTemplates = await this.getAllTemplatesFromStorage();
      if (existingTemplates.length > 0) {
        return;
      }

      // Create some default templates
      const defaultTemplates = this.getDefaultTemplates();
      
      for (const template of defaultTemplates) {
        await this.createTemplate(template);
      }

      logger.info('Default templates initialized', { count: defaultTemplates.length });
    } catch (error) {
      logger.error('Failed to initialize default templates', { error });
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: TemplateCreateRequest): Promise<TemplateMetadata> {
    try {
      const templateId = this.generateTemplateId();
      const now = new Date();

      const templateMetadata: TemplateMetadata = {
        id: templateId,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        tags: templateData.tags,
        flowJson: templateData.flowJson,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        rating: 0,
        ratingCount: 0,
        isOfficial: false,
        previewImage: templateData.previewImage
      };

      await this.storeTemplateMetadata(templateMetadata);

      logger.info('Template created successfully', {
        templateId,
        name: templateData.name,
        category: templateData.category
      });

      return templateMetadata;

    } catch (error) {
      logger.error('Template creation failed', {
        name: templateData.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<TemplateMetadata | null> {
    try {
      return await this.getTemplateMetadataFromStorage(templateId);
    } catch (error) {
      logger.error('Failed to get template', { templateId, error });
      return null;
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(options: TemplateSearchOptions = {}): Promise<{ templates: TemplateMetadata[]; total: number }> {
    try {
      const allTemplates = await this.getAllTemplatesFromStorage();
      
      let filteredTemplates = allTemplates.filter(template => {
        if (options.category && template.category !== options.category) return false;
        if (options.isOfficial !== undefined && template.isOfficial !== options.isOfficial) return false;
        if (options.tags && options.tags.length > 0) {
          const hasMatchingTag = options.tags.some(tag => template.tags.includes(tag));
          if (!hasMatchingTag) return false;
        }
        if (options.query) {
          const query = options.query.toLowerCase();
          const searchText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
          if (!searchText.includes(query)) return false;
        }
        return true;
      });

      // Sort templates
      const sortBy = options.sortBy || 'usage';
      const sortOrder = options.sortOrder || 'desc';
      
      filteredTemplates.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'usage':
            aValue = a.usageCount;
            bValue = b.usageCount;
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'created':
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          default:
            aValue = a.usageCount;
            bValue = b.usageCount;
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Paginate
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);

      return {
        templates: paginatedTemplates,
        total: filteredTemplates.length
      };

    } catch (error) {
      logger.error('Template search failed', { options, error });
      return { templates: [], total: 0 };
    }
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<TemplateMetadata[]> {
    const result = await this.searchTemplates({
      sortBy: 'usage',
      sortOrder: 'desc',
      limit
    });
    return result.templates;
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string, limit: number = 10): Promise<TemplateMetadata[]> {
    const result = await this.searchTemplates({
      category,
      sortBy: 'usage',
      sortOrder: 'desc',
      limit
    });
    return result.templates;
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplate(templateId);
      if (template) {
        template.usageCount++;
        template.updatedAt = new Date();
        await this.storeTemplateMetadata(template);
        
        logger.info('Template usage incremented', {
          templateId,
          usageCount: template.usageCount
        });
      }
    } catch (error) {
      logger.error('Failed to increment template usage', { templateId, error });
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const templates = await this.getAllTemplatesFromStorage();
      const categories = [...new Set(templates.map(t => t.category))];
      return categories.sort();
    } catch (error) {
      logger.error('Failed to get categories', { error });
      return [];
    }
  }

  // Private helper methods

  private generateTemplateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async storeTemplateMetadata(template: TemplateMetadata): Promise<void> {
    const templatePath = path.join(this.templatesPath, `${template.id}.json`);
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
  }

  private async getTemplateMetadataFromStorage(templateId: string): Promise<TemplateMetadata | null> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateId}.json`);
      const data = await fs.readFile(templatePath, 'utf-8');
      const template = JSON.parse(data);
      
      // Convert date strings back to Date objects
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);
      
      return template;
    } catch {
      return null;
    }
  }

  private async getAllTemplatesFromStorage(): Promise<TemplateMetadata[]> {
    try {
      const files = await fs.readdir(this.templatesPath);
      const templateFiles = files.filter(file => file.endsWith('.json'));
      
      const templates: TemplateMetadata[] = [];
      for (const file of templateFiles) {
        const templateId = file.replace('.json', '');
        const template = await this.getTemplateMetadataFromStorage(templateId);
        if (template) {
          templates.push(template);
        }
      }
      
      return templates;
    } catch {
      return [];
    }
  }

  private getDefaultTemplates(): TemplateCreateRequest[] {
    return [
      {
        name: 'Lead Generation Form',
        description: 'Simple lead generation form with contact details',
        category: 'Lead Generation',
        tags: ['lead', 'contact', 'form', 'business'],
        flowJson: {
          version: '7.1',
          screens: [
            {
              id: 'welcome',
              title: 'Welcome',
              data: [
                {
                  type: 'TextHeading',
                  text: 'Get in Touch!'
                },
                {
                  type: 'TextBody',
                  text: 'We\'d love to hear from you. Please share your details.'
                },
                {
                  type: 'Button',
                  text: 'Start',
                  action: {
                    name: 'navigate',
                    next: {
                      type: 'screen',
                      name: 'contact_form'
                    }
                  }
                }
              ]
            },
            {
              id: 'contact_form',
              title: 'Contact Information',
              data: [
                {
                  type: 'TextInput',
                  name: 'full_name',
                  label: 'Full Name',
                  required: true
                },
                {
                  type: 'TextInput',
                  name: 'email',
                  label: 'Email Address',
                  input_type: 'email',
                  required: true
                },
                {
                  type: 'TextInput',
                  name: 'phone',
                  label: 'Phone Number',
                  input_type: 'phone'
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
        }
      },
      {
        name: 'Customer Survey',
        description: 'Collect customer feedback with rating and comments',
        category: 'Survey',
        tags: ['survey', 'feedback', 'rating', 'customer'],
        flowJson: {
          version: '7.1',
          screens: [
            {
              id: 'intro',
              title: 'Customer Survey',
              data: [
                {
                  type: 'TextHeading',
                  text: 'Your Feedback Matters'
                },
                {
                  type: 'TextBody',
                  text: 'Help us improve by sharing your experience.'
                },
                {
                  type: 'Button',
                  text: 'Begin Survey',
                  action: {
                    name: 'navigate',
                    next: {
                      type: 'screen',
                      name: 'rating'
                    }
                  }
                }
              ]
            },
            {
              id: 'rating',
              title: 'Rate Your Experience',
              data: [
                {
                  type: 'TextSubheading',
                  text: 'How would you rate our service?'
                },
                {
                  type: 'RadioButtonsGroup',
                  name: 'rating',
                  label: 'Rating',
                  required: true,
                  data_source: [
                    { id: '5', title: '⭐⭐⭐⭐⭐ Excellent' },
                    { id: '4', title: '⭐⭐⭐⭐ Good' },
                    { id: '3', title: '⭐⭐⭐ Average' },
                    { id: '2', title: '⭐⭐ Poor' },
                    { id: '1', title: '⭐ Very Poor' }
                  ]
                },
                {
                  type: 'Button',
                  text: 'Next',
                  action: {
                    name: 'navigate',
                    next: {
                      type: 'screen',
                      name: 'feedback'
                    }
                  }
                }
              ]
            },
            {
              id: 'feedback',
              title: 'Additional Feedback',
              data: [
                {
                  type: 'TextArea',
                  name: 'comments',
                  label: 'Any additional comments?',
                  helper_text: 'Optional - share any specific feedback'
                },
                {
                  type: 'Button',
                  text: 'Submit Survey',
                  action: {
                    name: 'complete'
                  }
                }
              ],
              terminal: true,
              success: true
            }
          ]
        }
      },
      {
        name: 'Appointment Booking',
        description: 'Book appointments with date and time selection',
        category: 'Appointment',
        tags: ['appointment', 'booking', 'schedule', 'calendar'],
        flowJson: {
          version: '7.1',
          screens: [
            {
              id: 'start',
              title: 'Book Appointment',
              data: [
                {
                  type: 'TextHeading',
                  text: 'Schedule Your Appointment'
                },
                {
                  type: 'TextBody',
                  text: 'Choose your preferred date and time.'
                },
                {
                  type: 'Button',
                  text: 'Book Now',
                  action: {
                    name: 'navigate',
                    next: {
                      type: 'screen',
                      name: 'details'
                    }
                  }
                }
              ]
            },
            {
              id: 'details',
              title: 'Appointment Details',
              data: [
                {
                  type: 'TextInput',
                  name: 'name',
                  label: 'Your Name',
                  required: true
                },
                {
                  type: 'DatePicker',
                  name: 'appointment_date',
                  label: 'Preferred Date',
                  required: true
                },
                {
                  type: 'Dropdown',
                  name: 'time_slot',
                  label: 'Time Slot',
                  required: true,
                  data_source: [
                    { id: '09:00', title: '9:00 AM' },
                    { id: '10:00', title: '10:00 AM' },
                    { id: '11:00', title: '11:00 AM' },
                    { id: '14:00', title: '2:00 PM' },
                    { id: '15:00', title: '3:00 PM' },
                    { id: '16:00', title: '4:00 PM' }
                  ]
                },
                {
                  type: 'Button',
                  text: 'Confirm Booking',
                  action: {
                    name: 'complete'
                  }
                }
              ],
              terminal: true,
              success: true
            }
          ]
        }
      }
    ];
  }
}

// Export singleton instance
export const templateLibraryService = new TemplateLibraryService();