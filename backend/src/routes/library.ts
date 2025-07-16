import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { flowLibraryService, LibrarySearchOptions } from '@/services/flowLibraryService';
import { logger } from '@/utils/logger';
import { body, query, param, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get library statistics
router.get('/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await flowLibraryService.getLibraryStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

// TEMPLATE ROUTES

// Search templates
router.get('/templates',
  [
    query('query').optional().isString(),
    query('category').optional().isString(),
    query('tags').optional().isString(),
    query('author').optional().isString(),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('businessType').optional().isString(),
    query('isPremium').optional().isBoolean(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('sortBy').optional().isIn(['name', 'rating', 'usage', 'created', 'updated']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const searchOptions: LibrarySearchOptions = {
      query: req.query.query as string,
      category: req.query.category as any,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      author: req.query.author as string,
      difficulty: req.query.difficulty as any,
      businessType: req.query.businessType as string,
      isPremium: req.query.isPremium ? req.query.isPremium === 'true' : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await flowLibraryService.searchTemplates(searchOptions);

    res.json({
      success: true,
      data: {
        templates: result.templates,
        total: result.total,
        limit: searchOptions.limit,
        offset: searchOptions.offset
      }
    });
  })
);

// Get specific template
router.get('/templates/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const template = await flowLibraryService.getTemplate(id);

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
  })
);

// Use template (increment usage count)
router.post('/templates/:id/use',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const template = await flowLibraryService.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await flowLibraryService.incrementTemplateUsage(id);

    logger.info('Template used', {
      templateId: id,
      templateName: template.name,
      newUsageCount: template.usageCount + 1
    });

    res.json({
      success: true,
      message: 'Template usage recorded',
      data: {
        templateId: id,
        flowData: template.flowData
      }
    });
  })
);

// Create new template
router.post('/templates',
  [
    body('name').isString().notEmpty().withMessage('Template name is required'),
    body('description').isString().notEmpty().withMessage('Template description is required'),
    body('category').isString().notEmpty().withMessage('Template category is required'),
    body('tags').isArray().withMessage('Tags must be an array'),
    body('author').isString().notEmpty().withMessage('Author is required'),
    body('version').isString().notEmpty().withMessage('Version is required'),
    body('flowData').isObject().withMessage('Flow data is required'),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('estimatedSetupTime').optional().isInt({ min: 1 }),
    body('businessTypes').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    body('isPremium').optional().isBoolean()
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      tags: req.body.tags,
      author: req.body.author,
      version: req.body.version,
      flowData: req.body.flowData,
      difficulty: req.body.difficulty || 'beginner',
      estimatedSetupTime: req.body.estimatedSetupTime || 30,
      businessTypes: req.body.businessTypes || [],
      isPublic: req.body.isPublic || false,
      isPremium: req.body.isPremium || false,
      thumbnail: req.body.thumbnail,
      previewImages: req.body.previewImages || [],
      requiredIntegrations: req.body.requiredIntegrations || []
    };

    try {
      const template = await flowLibraryService.createTemplate(templateData);

      logger.info('Template created', {
        templateId: template.id,
        name: template.name,
        author: template.author
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });

    } catch (error) {
      logger.error('Failed to create template', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

// Update template
router.patch('/templates/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('name').optional().isString().notEmpty(),
    body('description').optional().isString().notEmpty(),
    body('category').optional().isString().notEmpty(),
    body('tags').optional().isArray(),
    body('flowData').optional().isObject(),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('estimatedSetupTime').optional().isInt({ min: 1 }),
    body('businessTypes').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    body('isPremium').optional().isBoolean()
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const updatedTemplate = await flowLibraryService.updateTemplate(id, updates);

      if (!updatedTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      logger.info('Template updated', {
        templateId: id,
        updates: Object.keys(updates)
      });

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: updatedTemplate
      });

    } catch (error) {
      logger.error('Failed to update template', {
        templateId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

// Delete template
router.delete('/templates/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await flowLibraryService.deleteTemplate(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    logger.info('Template deleted', { templateId: id });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  })
);

// COMPONENT ROUTES

// Search components
router.get('/components',
  [
    query('query').optional().isString(),
    query('category').optional().isString(),
    query('tags').optional().isString(),
    query('author').optional().isString(),
    query('sortBy').optional().isIn(['name', 'rating', 'usage', 'created', 'updated']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const searchOptions: LibrarySearchOptions = {
      query: req.query.query as string,
      category: req.query.category as any,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      author: req.query.author as string,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await flowLibraryService.searchComponents(searchOptions);

    res.json({
      success: true,
      data: {
        components: result.components,
        total: result.total,
        limit: searchOptions.limit,
        offset: searchOptions.offset
      }
    });
  })
);

// Get specific component
router.get('/components/:id',
  [
    param('id').isString().notEmpty().withMessage('Component ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const component = await flowLibraryService.getComponent(id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    res.json({
      success: true,
      data: component
    });
  })
);

// Get popular templates (featured)
router.get('/featured/templates',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await flowLibraryService.searchTemplates({
      sortBy: 'usage',
      sortOrder: 'desc',
      limit: 6,
      isPublic: true
    });

    res.json({
      success: true,
      data: result.templates
    });
  })
);

// Get templates by category
router.get('/categories/:category/templates',
  [
    param('category').isString().notEmpty().withMessage('Category is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await flowLibraryService.searchTemplates({
      category: category as any,
      sortBy: 'rating',
      sortOrder: 'desc',
      limit,
      offset,
      isPublic: true
    });

    res.json({
      success: true,
      data: {
        templates: result.templates,
        total: result.total,
        category,
        limit,
        offset
      }
    });
  })
);

export default router;