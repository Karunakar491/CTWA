/**
 * Template Library Service
 * Manages flow templates, categories, and search functionality
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { FlowJSONDefinition } from './metaApi';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  flowDefinition: FlowJSONDefinition;
  previewImage?: string;
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFilters {
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  createdBy?: string;
  searchTerm?: string;
}

export interface SearchResult {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class TemplateLibraryService {
  private templatesDir: string;
  private categoriesFile: string;
  private categories: string[] = [
    'Customer Support',
    'Lead Generation',
    'Appointment Booking',
    'Survey',
    'Sign Up',
    'Sign In',
    'Contact Us',
    'Other'
  ];

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'data', 'templates');
    this.categoriesFile = path.join(process.cwd(), 'data', 'template-categories.json');
    
    // Create directories if they don't exist
    this.initDirectories();
    this.loadCategories();
  }

  private initDirectories(): void {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        fs.mkdirSync(this.templatesDir, { recursive: true });
      }
      
      const dataDir = path.dirname(this.templatesDir);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to initialize template directories', { error });
      throw new Error('Failed to initialize template directories');
    }
  }

  private loadCategories(): void {
    try {
      if (fs.existsSync(this.categoriesFile)) {
        const fileContent = fs.readFileSync(this.categoriesFile, 'utf-8');
        this.categories = JSON.parse(fileContent);
      } else {
        // Save default categories
        fs.writeFileSync(this.categoriesFile, JSON.stringify(this.categories, null, 2));
      }
    } catch (error) {
      logger.error('Failed to load template categories', { error });
      // Continue with default categories
    }
  }

  /**
   * Get all templates
   */
  async getTemplates(filters?: TemplateFilters): Promise<Template[]> {
    try {
      const files = fs.readdirSync(this.templatesDir);
      let templates: Template[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.templatesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const template = JSON.parse(fileContent) as Template;
          templates.push(template);
        }
      }
      
      // Apply filters if provided
      if (filters) {
        if (filters.category) {
          templates = templates.filter(t => t.category === filters.category);
        }
        
        if (filters.tags && filters.tags.length > 0) {
          templates = templates.filter(t => 
            filters.tags!.some(tag => t.tags.includes(tag))
          );
        }
        
        if (filters.isPublic !== undefined) {
          templates = templates.filter(t => t.isPublic === filters.isPublic);
        }
        
        if (filters.createdBy) {
          templates = templates.filter(t => t.createdBy === filters.createdBy);
        }
        
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          templates = templates.filter(t => 
            t.name.toLowerCase().includes(term) || 
            t.description.toLowerCase().includes(term) ||
            t.tags.some(tag => tag.toLowerCase().includes(term))
          );
        }
      }
      
      return templates;
    } catch (error) {
      logger.error('Failed to get templates', { error });
      throw new Error('Failed to get templates');
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const filePath = path.join(this.templatesDir, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as Template;
    } catch (error) {
      logger.error('Failed to get template by ID', { id, error });
      throw new Error(`Failed to get template with ID: ${id}`);
    }
  }

  /**
   * Create new template
   */
  async createTemplate(templateData: Partial<Template>): Promise<Template> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const template: Template = {
        id,
        name: templateData.name || 'Untitled Template',
        description: templateData.description || '',
        category: templateData.category || 'Other',
        tags: templateData.tags || [],
        flowDefinition: templateData.flowDefinition || {
          version: '7.1',
          screens: []
        },
        previewImage: templateData.previewImage,
        isPublic: templateData.isPublic || false,
        createdBy: templateData.createdBy || 'system',
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      };
      
      // Save template to file
      const filePath = path.join(this.templatesDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
      
      logger.info('Template created', { id, name: template.name });
      
      return template;
    } catch (error) {
      logger.error('Failed to create template', { error });
      throw new Error('Failed to create template');
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    try {
      const template = await this.getTemplateById(id);
      
      if (!template) {
        throw new Error(`Template with ID ${id} not found`);
      }
      
      // Update template properties
      const updatedTemplate: Template = {
        ...template,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };
      
      // Save updated template
      const filePath = path.join(this.templatesDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(updatedTemplate, null, 2));
      
      logger.info('Template updated', { id, name: updatedTemplate.name });
      
      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to update template', { id, error });
      throw new Error(`Failed to update template with ID: ${id}`);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.templatesDir, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      // Delete template file
      fs.unlinkSync(filePath);
      
      logger.info('Template deleted', { id });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete template', { id, error });
      throw new Error(`Failed to delete template with ID: ${id}`);
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(
    query: string,
    category?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<SearchResult> {
    try {
      const filters: TemplateFilters = {
        searchTerm: query,
        category,
        isPublic: true
      };
      
      const templates = await this.getTemplates(filters);
      
      // Calculate pagination
      const total = templates.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTemplates = templates.slice(startIndex, endIndex);
      
      return {
        templates: paginatedTemplates,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      logger.error('Failed to search templates', { query, category, error });
      throw new Error('Failed to search templates');
    }
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(category?: string, limit: number = 10): Promise<Template[]> {
    try {
      const filters: TemplateFilters = {
        category,
        isPublic: true
      };
      
      const templates = await this.getTemplates(filters);
      
      // Sort by usage count and limit results
      return templates
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get popular templates', { category, error });
      throw new Error('Failed to get popular templates');
    }
  }

  /**
   * Track template usage
   */
  async trackTemplateUsage(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplateById(templateId);
      
      if (template) {
        template.usageCount += 1;
        await this.updateTemplate(templateId, { usageCount: template.usageCount });
      }
    } catch (error) {
      logger.error('Failed to track template usage', { templateId, error });
      // Don't throw error for usage tracking failures
    }
  }

  /**
   * Get template categories
   */
  getCategories(): string[] {
    return this.categories;
  }

  /**
   * Add template category
   */
  async addCategory(category: string): Promise<string[]> {
    try {
      if (!this.categories.includes(category)) {
        this.categories.push(category);
        fs.writeFileSync(this.categoriesFile, JSON.stringify(this.categories, null, 2));
      }
      
      return this.categories;
    } catch (error) {
      logger.error('Failed to add template category', { category, error });
      throw new Error(`Failed to add category: ${category}`);
    }
  }
}

// Export singleton instance
export const templateLibraryService = new TemplateLibraryService();