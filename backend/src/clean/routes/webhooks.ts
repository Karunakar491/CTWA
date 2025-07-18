import { Router, Request, Response, NextFunction } from 'express';
import { metaApiService, WebhookPayload } from '../services/metaApi';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route POST /api/webhooks/meta
 * @desc Receive webhooks from Meta API
 * @access Public
 */
router.post('/meta', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as WebhookPayload;
    
    // Log webhook received
    logger.info('Webhook received from Meta', {
      object: payload.object,
      entryCount: payload.entry?.length || 0
    });
    
    // Process webhook asynchronously
    void metaApiService.processWebhook(payload);
    
    // Respond immediately to Meta (required by Meta's webhook system)
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    logger.error('Error processing webhook', { error });
    // Still return 200 to Meta to prevent retries
    res.status(200).send('EVENT_RECEIVED');
  }
});

/**
 * @route GET /api/webhooks/meta
 * @desc Verify webhook subscription
 * @access Public
 */
router.get('/meta', (req: Request, res: Response) => {
  // Get verification token from query parameters
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Verify token from environment variable
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'whatsapp-flow-webhook-token';
  
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.warn('Webhook verification failed', { mode, token });
    res.sendStatus(403);
  }
});

export default router;