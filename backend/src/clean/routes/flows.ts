import { Router, Request, Response, NextFunction } from 'express';
import { flowService } from '../services/flowService';
import { flowValidationService } from '../services/flowValidationService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/flows
 * @desc Get all flows
 * @access Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flows = await flowService.getAllFlows();
    
    res.json({
      success: true,
      data: flows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/flows/:id
 * @desc Get flow by ID
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const flow = await flowService.getFlowById(id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: flow
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/flows
 * @desc Create new flow
 * @access Public
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowData = req.body;
    const flow = await flowService.createFlow(flowData);
    
    res.status(201).json({
      success: true,
      message: 'Flow created successfully',
      data: flow
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/flows/:id
 * @desc Update flow by ID
 * @access Public
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const flowData = req.body;
    
    // Check if flow exists
    const existingFlow = await flowService.getFlowById(id);
    if (!existingFlow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    const updatedFlow = await flowService.updateFlow(id, flowData);
    
    res.json({
      success: true,
      message: 'Flow updated successfully',
      data: updatedFlow
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/flows/:id
 * @desc Delete flow by ID
 * @access Public
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if flow exists
    const existingFlow = await flowService.getFlowById(id);
    if (!existingFlow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    await flowService.deleteFlow(id);
    
    res.json({
      success: true,
      message: `Flow with ID ${id} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/flows/:id/deploy
 * @desc Deploy flow by ID
 * @access Public
 */
router.post('/:id/deploy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deploymentConfig = req.body;
    
    // Check if flow exists
    const existingFlow = await flowService.getFlowById(id);
    if (!existingFlow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    // Deploy flow
    const result = await flowService.deployFlow(id, {
      environment: deploymentConfig.environment || 'production',
      autoPublish: deploymentConfig.autoPublish || false,
      rollbackOnError: deploymentConfig.rollbackOnError || true
    });
    
    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/flows/:id/validate
 * @desc Validate flow by ID
 * @access Public
 */
router.post('/:id/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if flow exists
    const existingFlow = await flowService.getFlowById(id);
    if (!existingFlow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    // Validate flow
    const validationResult = await flowValidationService.validateFlow(existingFlow.flowDefinition);
    
    res.json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/flows/:id/history
 * @desc Get flow version history
 * @access Public
 */
router.get('/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if flow exists
    const existingFlow = await flowService.getFlowById(id);
    if (!existingFlow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    // Get flow history
    const history = await flowService.getFlowHistory(id);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

export default router;