import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { flowService, FlowCreateRequest, FlowUpdateRequest, FlowSearchOptions } from '@/services/flowService';
import { flowValidationService } from '@/services/flowValidation';
import { logger } from '@/utils/logger';

const router = Router();

// Get all flows with search/filter
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const searchOptions: FlowSearchOptions = {
    query: req.query.query as string,
    tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    category: req.query.category as string,
    status: req.query.status as 'draft' | 'published' | 'deprecated',
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0
  };

  const result = await flowService.searchFlows(searchOptions);

  res.json({
    success: true,
    data: {
      flows: result.flows.map(flow => ({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        version: flow.version,
        status: flow.status,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
        tags: flow.tags,
        category: flow.category,
        metaFlowId: flow.metaFlowId
      })),
      total: result.total,
      limit: searchOptions.limit,
      offset: searchOptions.offset
    }
  });
}));

// Create new flow
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, flowJson, tags, category } = req.body;

  if (!name || !flowJson) {
    return res.status(400).json({
      success: false,
      message: 'Name and flowJson are required'
    });
  }

  try {
    const flowData: FlowCreateRequest = {
      name,
      description,
      flowJson,
      tags,
      category
    };

    const flow = await flowService.createFlow(flowData);

    logger.info('Flow created', {
      flowId: flow.id,
      name: flow.name
    });

    res.status(201).json({
      success: true,
      message: 'Flow created successfully',
      data: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        version: flow.version,
        status: flow.status,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
        tags: flow.tags,
        category: flow.category
      }
    });

  } catch (error) {
    logger.error('Flow creation failed', {
      name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      message: 'Flow creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get flow by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const flow = await flowService.getFlow(id);
  if (!flow) {
    return res.status(404).json({
      success: false,
      message: 'Flow not found'
    });
  }

  res.json({
    success: true,
    data: flow
  });
}));

// Update flow
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: FlowUpdateRequest = req.body;

  try {
    const updatedFlow = await flowService.updateFlow(id, updates);
    
    if (!updatedFlow) {
      return res.status(404).json({
        success: false,
        message: 'Flow not found'
      });
    }

    logger.info('Flow updated', {
      flowId: id,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Flow updated successfully',
      data: {
        id: updatedFlow.id,
        name: updatedFlow.name,
        description: updatedFlow.description,
        version: updatedFlow.version,
        status: updatedFlow.status,
        createdAt: updatedFlow.createdAt,
        updatedAt: updatedFlow.updatedAt,
        tags: updatedFlow.tags,
        category: updatedFlow.category,
        metaFlowId: updatedFlow.metaFlowId
      }
    });

  } catch (error) {
    logger.error('Flow update failed', {
      flowId: id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      message: 'Flow update failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Delete flow
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await flowService.deleteFlow(id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Flow not found'
    });
  }

  logger.info('Flow deleted', { flowId: id });

  res.json({
    success: true,
    message: 'Flow deleted successfully'
  });
}));

// Validate flow
router.post('/:id/validate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const flow = await flowService.getFlow(id);
  if (!flow) {
    return res.status(404).json({
      success: false,
      message: 'Flow not found'
    });
  }

  const validationResult = await flowValidationService.validateFlow(flow.flowJson);

  res.json({
    success: true,
    data: validationResult
  });
}));

// Publish flow to Meta API
router.post('/:id/publish', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const publishedFlow = await flowService.publishFlow(id);
    
    if (!publishedFlow) {
      return res.status(404).json({
        success: false,
        message: 'Flow not found'
      });
    }

    logger.info('Flow published', {
      flowId: id,
      metaFlowId: publishedFlow.metaFlowId
    });

    res.json({
      success: true,
      message: 'Flow published successfully',
      data: {
        id: publishedFlow.id,
        name: publishedFlow.name,
        status: publishedFlow.status,
        metaFlowId: publishedFlow.metaFlowId
      }
    });

  } catch (error) {
    logger.error('Flow publishing failed', {
      flowId: id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      message: 'Flow publishing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Duplicate flow
router.post('/:id/duplicate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'New flow name is required'
    });
  }

  try {
    const duplicatedFlow = await flowService.duplicateFlow(id, name);
    
    if (!duplicatedFlow) {
      return res.status(404).json({
        success: false,
        message: 'Original flow not found'
      });
    }

    logger.info('Flow duplicated', {
      originalFlowId: id,
      duplicatedFlowId: duplicatedFlow.id,
      newName: name
    });

    res.status(201).json({
      success: true,
      message: 'Flow duplicated successfully',
      data: {
        id: duplicatedFlow.id,
        name: duplicatedFlow.name,
        description: duplicatedFlow.description,
        version: duplicatedFlow.version,
        status: duplicatedFlow.status,
        createdAt: duplicatedFlow.createdAt,
        tags: duplicatedFlow.tags,
        category: duplicatedFlow.category
      }
    });

  } catch (error) {
    logger.error('Flow duplication failed', {
      flowId: id,
      newName: name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({
      success: false,
      message: 'Flow duplication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;