import { Router, Request, Response, NextFunction } from 'express';
import { reportingService } from '../services/reportingService';
import { flowService } from '../services/flowService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/dashboard/metrics
 * @desc Get dashboard metrics
 * @access Public
 */
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    
    const metrics = await reportingService.getDashboardMetrics(days);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/dashboard/flows/:id/analytics
 * @desc Get flow analytics
 * @access Public
 */
router.get('/flows/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    
    // Get flow details
    const flow = await flowService.getFlowById(id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    const analytics = await reportingService.getFlowAnalytics(id, flow.name, days);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/dashboard/flows/:id/responses
 * @desc Get flow responses
 * @access Public
 */
router.get('/flows/:id/responses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Get flow details
    const flow = await flowService.getFlowById(id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        message: `Flow with ID ${id} not found`
      });
    }
    
    const responses = await reportingService.getFlowResponses(id);
    
    res.json({
      success: true,
      data: responses
    });
  } catch (error) {
    next(error);
  }
});

export default router;