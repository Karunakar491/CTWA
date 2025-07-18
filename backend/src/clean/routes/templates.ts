import { Router, Request, Response, NextFunction } from 'express';
import { templateLibraryService } from '../services/templateLibraryService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/templates
 * @desc Get all templates
 * @access Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, searchTerm, isPublic } = req.query;
    
    const filters = {
      category: category as string,
      searchTerm: searchTerm as string,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined
    };
    
    const templates = await templateLibraryService.getTemplates(filters);
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/templates/categories
 * @desc Get template categories
 * @access Public
 */
router.get('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = templateLibraryService.getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/templates/categories
 * @desc Add template category
 * @access Public
 */
router.post('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const categories = await templateLibraryService.addCategory(category);
    
    res.status(201).json({
      success: true,
      message: 'Category added successfully',
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/templates/search
 * @desc Search templates
 * @access Public
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, category, page, pageSize } = req.query;
    
    const searchResults = await templateLibraryService.searchTemplates(
      query as string,
      category as string,
      page ? parseInt(page as string) : 1,
      pageSize ? parseInt(pageSize as string) : 10
    );
    
    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/templates/popular
 * @desc Get popular templates
 * @access Public
 */
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit } = req.query;
    
    const templates = await templateLibraryService.getPopularTemplates(
      category as string,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/templates/:id
 * @desc Get template by ID
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const template = await templateLibraryService.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/templates
 * @desc Create new template
 * @access Public
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templateData = req.body;
    const template = await templateLibraryService.createTemplate(templateData);
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/templates/:id
 * @desc Update template by ID
 * @access Public
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    
    // Check if template exists
    const existingTemplate = await templateLibraryService.getTemplateById(id);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found`
      });
    }
    
    const updatedTemplate = await templateLibraryService.updateTemplate(id, templateData);
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/templates/:id
 * @desc Delete template by ID
 * @access Public
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const existingTemplate = await templateLibraryService.getTemplateById(id);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found`
      });
    }
    
    await templateLibraryService.deleteTemplate(id);
    
    res.json({
      success: true,
      message: `Template with ID ${id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/templates/:id/use
 * @desc Track template usage
 * @access Public
 */
router.post('/:id/use', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const existingTemplate = await templateLibraryService.getTemplateById(id);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found`
      });
    }
    
    await templateLibraryService.trackTemplateUsage(id);
    
    res.json({
      success: true,
      message: `Template usage tracked successfully`
    });
  } catch (error) {
    next(error);
  }
});

export default router;