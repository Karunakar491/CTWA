import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/utils/logger';

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: FlowCategory;
  tags: string[];
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  isPublic: boolean;
  isPremium: boolean;
  flowData: any; // The actual flow JSON
  thumbnail?: string;
  previewImages?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // in minutes
  requiredIntegrations?: string[];
  businessTypes?: string[];
}

export interface FlowComponent {
  id: string;
  name: string;
  description: string;
  type: string;
  category: ComponentCategory;
  tags: string[];
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  isPublic: boolean;
  componentData: any; // The actual component configuration
  thumbnail?: string;
  dependencies?: string[];
}

export type FlowCategory = 
  | 'customer-support'
  | 'e-commerce'
  | 'lead-generation'
  | 'appointment-booking'
  | 'surveys-feedback'
  | 'onboarding'
  | 'marketing'
  | 'notifications'
  | 'utilities'
  | 'custom';

export type ComponentCategory =
  | 'forms'
  | 'navigation'
  | 'display'
  | 'input'
  | 'media'
  | 'actions'
  | 'containers';

export interface LibrarySearchOptions {
  query?: string;
  category?: FlowCategory | ComponentCategory;
  tags?: string[];
  author?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  businessType?: string;
  isPremium?: boolean;
  minRating?: number;
  sortBy?: 'name' | 'rating' | 'usage' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface LibraryStats {
  totalTemplates: number;
  totalComponents: number;
  categoryCounts: Record<string, number>;
  popularTags: Array<{ tag: string; count: number }>;
  topAuthors: Array<{ author: string; count: number }>;
  recentActivity: Array<{
    type: 'template' | 'component';
    action: 'created' | 'updated' | 'used';
    item: string;
    timestamp: Date;
  }>;
}

export class FlowLibraryService {
  private templatesPath: string;
  private componentsPath: string;
  private templates: Map<string, FlowTemplate> = new Map();
  private components: Map<string, FlowComponent> = new Map();

  constructor() {
    this.templatesPath = process.env.TEMPLATES_PATH || 'data/templates';
    this.componentsPath = process.env.COMPONENTS_PATH || 'data/components';
    this.initializeDirectories();
    this.loadLibraryData();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.templatesPath, { recursive: true });
      await fs.mkdir(this.componentsPath, { recursive: true });
      await fs.mkdir(path.join(this.templatesPath, 'thumbnails'), { recursive: true });
      await fs.mkdir(path.join(this.componentsPath, 'thumbnails'), { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize library directories', { error });
    }
  }

  private async loadLibraryData(): Promise<void> {
    try {
      // Load templates
      await this.loadTemplates();
      // Load components
      await this.loadComponents();
      // Initialize with default templates if empty
      if (this.templates.size === 0) {
        await this.createDefaultTemplates();
      }
      if (this.components.size === 0) {
        await this.createDefaultComponents();
      }
    } catch (error) {
      logger.error('Failed to load library data', { error });
    }
  }

  // Template Management

  async getTemplate(templateId: string): Promise<FlowTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getAllTemplates(): Promise<FlowTemplate[]> {
    return Array.from(this.templates.values());
  }

  async searchTemplates(options: LibrarySearchOptions = {}): Promise<{
    templates: FlowTemplate[];
    total: number;
  }> {
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (options.query) {
      const query = options.query.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.category) {
      templates = templates.filter(t => t.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      templates = templates.filter(t => 
        options.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (options.author) {
      templates = templates.filter(t => t.author === options.author);
    }

    if (options.difficulty) {
      templates = templates.filter(t => t.difficulty === options.difficulty);
    }

    if (options.businessType) {
      templates = templates.filter(t => 
        t.businessTypes?.includes(options.businessType!)
      );
    }

    if (options.isPremium !== undefined) {
      templates = templates.filter(t => t.isPremium === options.isPremium);
    }

    if (options.minRating) {
      templates = templates.filter(t => t.rating >= options.minRating!);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'rating';
    const sortOrder = options.sortOrder || 'desc';

    templates.sort((a, b) => {
      let aValue: any = a[sortBy as keyof FlowTemplate];
      let bValue: any = b[sortBy as keyof FlowTemplate];

      if (sortBy === 'created') {
        aValue = a.createdAt;
        bValue = b.createdAt;
      } else if (sortBy === 'updated') {
        aValue = a.updatedAt;
        bValue = b.updatedAt;
      } else if (sortBy === 'usage') {
        aValue = a.usageCount;
        bValue = b.usageCount;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const paginatedTemplates = templates.slice(offset, offset + limit);

    return {
      templates: paginatedTemplates,
      total: templates.length
    };
  }

  async createTemplate(template: Omit<FlowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>): Promise<FlowTemplate> {
    const newTemplate: FlowTemplate = {
      ...template,
      id: this.generateId('template'),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      rating: 0
    };

    this.templates.set(newTemplate.id, newTemplate);
    await this.saveTemplate(newTemplate);

    logger.info('Template created', { templateId: newTemplate.id, name: newTemplate.name });
    return newTemplate;
  }

  async updateTemplate(templateId: string, updates: Partial<FlowTemplate>): Promise<FlowTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.templates.set(templateId, updatedTemplate);
    await this.saveTemplate(updatedTemplate);

    logger.info('Template updated', { templateId, updates: Object.keys(updates) });
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) return false;

    this.templates.delete(templateId);
    
    try {
      await fs.unlink(path.join(this.templatesPath, `${templateId}.json`));
      logger.info('Template deleted', { templateId });
      return true;
    } catch (error) {
      logger.error('Failed to delete template file', { templateId, error });
      return false;
    }
  }

  async incrementTemplateUsage(templateId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount++;
      template.updatedAt = new Date();
      await this.saveTemplate(template);
    }
  }

  // Component Management

  async getComponent(componentId: string): Promise<FlowComponent | null> {
    return this.components.get(componentId) || null;
  }

  async getAllComponents(): Promise<FlowComponent[]> {
    return Array.from(this.components.values());
  }

  async searchComponents(options: LibrarySearchOptions = {}): Promise<{
    components: FlowComponent[];
    total: number;
  }> {
    let components = Array.from(this.components.values());

    // Apply similar filtering logic as templates
    if (options.query) {
      const query = options.query.toLowerCase();
      components = components.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.category) {
      components = components.filter(c => c.category === options.category);
    }

    // Apply sorting and pagination
    const sortBy = options.sortBy || 'rating';
    const sortOrder = options.sortOrder || 'desc';

    components.sort((a, b) => {
      let aValue: any = a[sortBy as keyof FlowComponent];
      let bValue: any = b[sortBy as keyof FlowComponent];

      if (sortBy === 'created') {
        aValue = a.createdAt;
        bValue = b.createdAt;
      } else if (sortBy === 'updated') {
        aValue = a.updatedAt;
        bValue = b.updatedAt;
      } else if (sortBy === 'usage') {
        aValue = a.usageCount;
        bValue = b.usageCount;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const paginatedComponents = components.slice(offset, offset + limit);

    return {
      components: paginatedComponents,
      total: components.length
    };
  }

  // Library Statistics

  async getLibraryStats(): Promise<LibraryStats> {
    const templates = Array.from(this.templates.values());
    const components = Array.from(this.components.values());

    // Category counts
    const categoryCounts: Record<string, number> = {};
    templates.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    // Popular tags
    const tagCounts: Record<string, number> = {};
    [...templates, ...components].forEach(item => {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top authors
    const authorCounts: Record<string, number> = {};
    [...templates, ...components].forEach(item => {
      authorCounts[item.author] = (authorCounts[item.author] || 0) + 1;
    });

    const topAuthors = Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent activity (mock for now)
    const recentActivity = [
      ...templates.slice(0, 5).map(t => ({
        type: 'template' as const,
        action: 'created' as const,
        item: t.name,
        timestamp: t.createdAt
      })),
      ...components.slice(0, 5).map(c => ({
        type: 'component' as const,
        action: 'created' as const,
        item: c.name,
        timestamp: c.createdAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    return {
      totalTemplates: templates.length,
      totalComponents: components.length,
      categoryCounts,
      popularTags,
      topAuthors,
      recentActivity
    };
  }

  // Private helper methods

  private async loadTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templatesPath);
      const templateFiles = files.filter(file => file.endsWith('.json'));

      for (const file of templateFiles) {
        try {
          const filePath = path.join(this.templatesPath, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const template = JSON.parse(data) as FlowTemplate;
          
          // Convert date strings back to Date objects
          template.createdAt = new Date(template.createdAt);
          template.updatedAt = new Date(template.updatedAt);
          
          this.templates.set(template.id, template);
        } catch (error) {
          logger.error('Failed to load template file', { file, error });
        }
      }

      logger.info('Templates loaded', { count: this.templates.size });
    } catch (error) {
      logger.error('Failed to load templates directory', { error });
    }
  }

  private async loadComponents(): Promise<void> {
    try {
      const files = await fs.readdir(this.componentsPath);
      const componentFiles = files.filter(file => file.endsWith('.json'));

      for (const file of componentFiles) {
        try {
          const filePath = path.join(this.componentsPath, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const component = JSON.parse(data) as FlowComponent;
          
          // Convert date strings back to Date objects
          component.createdAt = new Date(component.createdAt);
          component.updatedAt = new Date(component.updatedAt);
          
          this.components.set(component.id, component);
        } catch (error) {
          logger.error('Failed to load component file', { file, error });
        }
      }

      logger.info('Components loaded', { count: this.components.size });
    } catch (error) {
      logger.error('Failed to load components directory', { error });
    }
  }

  private async saveTemplate(template: FlowTemplate): Promise<void> {
    try {
      const filePath = path.join(this.templatesPath, `${template.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(template, null, 2));
    } catch (error) {
      logger.error('Failed to save template', { templateId: template.id, error });
    }
  }

  private async saveComponent(component: FlowComponent): Promise<void> {
    try {
      const filePath = path.join(this.componentsPath, `${component.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(component, null, 2));
    } catch (error) {
      logger.error('Failed to save component', { componentId: component.id, error });
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createDefaultTemplates(): Promise<void> {
    const defaultTemplates: Omit<FlowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>[] = [
      {
        name: "Welcome Onboarding Flow",
        description: "A comprehensive onboarding flow to welcome new users and collect basic information",
        category: "onboarding",
        tags: ["welcome", "onboarding", "user-info", "beginner"],
        author: "WhatsApp Flow Builder",
        version: "1.0.0",
        isPublic: true,
        isPremium: false,
        difficulty: "beginner",
        estimatedSetupTime: 15,
        businessTypes: ["retail", "service", "saas"],
        flowData: {
          version: "7.1",
          data_api_version: "3.0",
          screens: [
            {
              id: "welcome_screen",
              title: "Welcome",
              data: [
                {
                  type: "TextHeading",
                  text: "Welcome to our service!"
                },
                {
                  type: "TextBody",
                  text: "We're excited to have you on board. Let's get you started with a quick setup."
                },
                {
                  type: "Footer",
                  title: "Get Started",
                  on_click_action: {
                    name: "navigate",
                    next: { type: "screen", name: "info_screen" }
                  }
                }
              ]
            },
            {
              id: "info_screen",
              title: "Your Information",
              data: [
                {
                  type: "TextHeading",
                  text: "Tell us about yourself"
                },
                {
                  type: "TextInput",
                  label: "Full Name",
                  name: "full_name",
                  required: true
                },
                {
                  type: "TextInput",
                  label: "Email Address",
                  name: "email",
                  input_type: "email",
                  required: true
                },
                {
                  type: "Footer",
                  title: "Continue",
                  on_click_action: {
                    name: "navigate",
                    next: { type: "screen", name: "complete_screen" }
                  }
                }
              ]
            },
            {
              id: "complete_screen",
              title: "Setup Complete",
              terminal: true,
              success: true,
              data: [
                {
                  type: "TextHeading",
                  text: "You're all set!"
                },
                {
                  type: "TextBody",
                  text: "Thank you for completing the setup. You can now start using our service."
                },
                {
                  type: "Footer",
                  title: "Finish",
                  on_click_action: {
                    name: "complete"
                  }
                }
              ]
            }
          ]
        }
      },
      {
        name: "Customer Support Flow",
        description: "A comprehensive customer support flow with FAQ and ticket creation",
        category: "customer-support",
        tags: ["support", "faq", "tickets", "help"],
        author: "WhatsApp Flow Builder",
        version: "1.0.0",
        isPublic: true,
        isPremium: false,
        difficulty: "intermediate",
        estimatedSetupTime: 30,
        businessTypes: ["retail", "service", "saas", "ecommerce"],
        flowData: {
          version: "7.1",
          data_api_version: "3.0",
          screens: [
            {
              id: "support_menu",
              title: "How can we help?",
              data: [
                {
                  type: "TextHeading",
                  text: "Customer Support"
                },
                {
                  type: "TextBody",
                  text: "Choose how you'd like to get help:"
                },
                {
                  type: "RadioButtonsGroup",
                  label: "Support Options",
                  name: "support_type",
                  data_source: [
                    { id: "faq", title: "Browse FAQ" },
                    { id: "ticket", title: "Create Support Ticket" },
                    { id: "callback", title: "Request Callback" }
                  ]
                },
                {
                  type: "Footer",
                  title: "Continue",
                  on_click_action: {
                    name: "data_exchange"
                  }
                }
              ]
            }
          ]
        }
      },
      {
        name: "Product Catalog Browser",
        description: "Browse and explore products with detailed views and add to cart functionality",
        category: "e-commerce",
        tags: ["products", "catalog", "shopping", "ecommerce"],
        author: "WhatsApp Flow Builder",
        version: "1.0.0",
        isPublic: true,
        isPremium: true,
        difficulty: "advanced",
        estimatedSetupTime: 45,
        businessTypes: ["retail", "ecommerce"],
        flowData: {
          version: "7.1",
          data_api_version: "3.0",
          screens: [
            {
              id: "catalog_screen",
              title: "Product Catalog",
              data: [
                {
                  type: "TextHeading",
                  text: "Our Products"
                },
                {
                  type: "Dropdown",
                  label: "Select Category",
                  name: "category",
                  data_source: [
                    { id: "electronics", title: "Electronics" },
                    { id: "clothing", title: "Clothing" },
                    { id: "home", title: "Home & Garden" }
                  ]
                },
                {
                  type: "Footer",
                  title: "Browse Products",
                  on_click_action: {
                    name: "data_exchange"
                  }
                }
              ]
            }
          ]
        }
      }
    ];

    for (const templateData of defaultTemplates) {
      await this.createTemplate(templateData);
    }

    logger.info('Default templates created', { count: defaultTemplates.length });
  }

  private async createDefaultComponents(): Promise<void> {
    const defaultComponents: Omit<FlowComponent, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>[] = [
      {
        name: "Contact Form",
        description: "A complete contact form with name, email, and message fields",
        type: "Form",
        category: "forms",
        tags: ["contact", "form", "input"],
        author: "WhatsApp Flow Builder",
        version: "1.0.0",
        isPublic: true,
        componentData: {
          type: "Form",
          name: "contact_form",
          children: [
            {
              type: "TextInput",
              label: "Full Name",
              name: "full_name",
              required: true
            },
            {
              type: "TextInput",
              label: "Email Address",
              name: "email",
              input_type: "email",
              required: true
            },
            {
              type: "TextArea",
              label: "Message",
              name: "message",
              required: true
            }
          ]
        }
      },
      {
        name: "Rating Component",
        description: "5-star rating component with optional feedback",
        type: "RadioButtonsGroup",
        category: "input",
        tags: ["rating", "feedback", "stars"],
        author: "WhatsApp Flow Builder",
        version: "1.0.0",
        isPublic: true,
        componentData: {
          type: "RadioButtonsGroup",
          label: "Rate your experience",
          name: "rating",
          data_source: [
            { id: "1", title: "⭐ Poor" },
            { id: "2", title: "⭐⭐ Fair" },
            { id: "3", title: "⭐⭐⭐ Good" },
            { id: "4", title: "⭐⭐⭐⭐ Very Good" },
            { id: "5", title: "⭐⭐⭐⭐⭐ Excellent" }
          ]
        }
      }
    ];

    for (const componentData of defaultComponents) {
      const newComponent: FlowComponent = {
        ...componentData,
        id: this.generateId('component'),
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: 0
      };

      this.components.set(newComponent.id, newComponent);
      await this.saveComponent(newComponent);
    }

    logger.info('Default components created', { count: defaultComponents.length });
  }
}

// Export singleton instance
export const flowLibraryService = new FlowLibraryService();