import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { templateLibraryService, TemplateCreateRequest, TemplateSearchOptions } from '@/services/templateLibraryService';
import { flowService } from '@/services/flowService';
import { logger } from '@/utils/logger';

const router = Router();

// Search templates
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const searchOptions: TemplateSearchOptions = {
    query: req.query.query as string,
    category: req.query.category as string,
    tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    isOfficial: req.query.isOfficial ? req.query.isOfficial === 'true' : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    sortBy: req.query.sortBy as 'name' | 'usage' | 'rating' | 'created',
    sortOrder: req.query.sortOrder as 'asc' | 'desc'
  };

  const result = await templateLibraryService.searchTemplates(searchOptions);

  res.json({
    success: true,
    data: {
      templates: result.templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags,
        usageCount: template.usageCount,
        rating: template.rating,
        ratingCount: template.ratingCount,
        isOfficial: template.isOfficial,
        previewImage: template.previewImage,
        createdAt: template.createdAt
      })),
      total: result.total,
      limit: searchOptions.limit,
      offset: searchOptions.offset
    }
  });
}));

// Get popular templates
router.get('/popular', asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const templates = await templateLibraryService.getPopularTemplates(limit);

  res.json({
    success: true,
    data: templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      usageCount: template.usageCount,
      rating: template.rating,
      isOfficial: template.isOfficial,
      previewImage: template.previewImage
    }))
  });
}));

// Get categories
router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
  const categories = await templateLibraryService.getCategories();

  res.json({
    success: true,
    data: categories
  });
}));

// Get templates by category
router.get('/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  const templates = await templateLibraryService.getTemplatesByCategory(category, limit);

  res.json({
    success: true,
    data: templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      usageCount: template.usageCount,
      rating: template.rating,
      isOfficial: template.isOfficial,
      previewImage: template.previewImage
    }))
  });
}));

// Get template by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await templateLibraryService.getTemplate(id);
  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  res.json({
    success: true,
    data: template
  });
}));

// Create flow from template
router.post('/:id/use', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Flow name is required'
    });
  }

  try {
    const template = await templateLibraryService.getTemplate(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Create flow from template
    const flowData = {
      name,
      description: description || `Flow created from ${template.name} template`,
      flowJson: template.flowJson,
      tags: [...template.tags, 'from-template'],
      category: template.category
    };

    const flow = await flowService.createFlow(flowData);

    // Increment template usage
    await templateLibraryService.incrementUsage(id);

    logger.info('Flow created from template', {
      templateId: id,
      templateName: template.name,
      flowId: flow.id,
      flowName: flow.name
    });

    res.status(201).json({
      success: true,
      message: 'Flow created from template successfully',
      data: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        version: flow.version,
        status: flow.status,
        createdAt: flow.createdAt,
        tags: flow.tags,
        category: flow.category,
        templateUsed: {
          id: template.id,
          name: template.name
        }
      }
    });

  } catch (error) {
    logger.error('Failed to create flow from template', {
      templateId: id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create flow from template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Create new template (for future use)
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, category, tags, flowJson, previewImage } = req.body;

  if (!name || !description || !category || !flowJson) {
    return res.status(400).json({
      success: false,
      message: 'Name, description, category, and flowJson are required'
    });
  }

  try {
    const templateData: TemplateCreateRequest = {
      name,
      description,
      category,
      tags: tags || [],
      flowJson,
      previewImage
    };

    const template = await templateLibraryService.createTemplate(templateData);

    logger.info('Template created', {
      templateId: template.id,
      name: template.name,
      category: template.category
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags,
        createdAt: template.createdAt,
        isOfficial: template.isOfficial
      }
    });

  } catch (error) {
    logger.error('Template creation failed', {
      name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      message: 'Template creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;