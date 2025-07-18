import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { metaApiService } from './services/metaApi';
import { flowValidationService } from './services/flowValidationService';
import { logger } from './utils/logger';

async function testMetaApiIntegration() {
  try {
    logger.info('Starting Meta API integration test');
    
    // Load test flow
    const flowPath = path.join(process.cwd(), 'test-flow.json');
    const flowData = JSON.parse(fs.readFileSync(flowPath, 'utf-8'));
    
    logger.info('Test flow loaded successfully');
    
    // Step 1: Validate the flow
    logger.info('Validating flow...');
    const validationResult = await flowValidationService.validateFlow(flowData);
    
    if (!validationResult.isValid) {
      logger.warn('Flow validation failed', { errors: validationResult.errors });
      
      if (validationResult.correctedFlow) {
        logger.info('Using auto-corrected flow');
        Object.assign(flowData, validationResult.correctedFlow);
      } else {
        logger.error('Cannot proceed with invalid flow');
        return;
      }
    } else {
      logger.info('Flow validation successful');
    }
    
    // Step 2: Create flow in Meta API
    logger.info('Creating flow in Meta API...');
    const createParams = {
      name: flowData.name,
      categories: [{ category: 'OTHER' }]
    };
    
    const createResult = await metaApiService.createFlow(createParams);
    logger.info('Flow created in Meta API', { flowId: createResult.id });
    
    // Step 3: Update flow with JSON
    logger.info('Updating flow with JSON...');
    const updateParams = {
      flow_json: flowData
    };
    
    const updateResult = await metaApiService.updateFlow(createResult.id, updateParams);
    logger.info('Flow updated with JSON', { status: updateResult.status });
    
    // Step 4: Publish flow
    logger.info('Publishing flow...');
    const publishResult = await metaApiService.publishFlow(createResult.id);
    logger.info('Flow published successfully', { status: publishResult.status });
    
    logger.info('Meta API integration test completed successfully', {
      flowId: createResult.id,
      status: publishResult.status
    });
    
    return {
      success: true,
      flowId: createResult.id,
      status: publishResult.status
    };
  } catch (error) {
    logger.error('Meta API integration test failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
testMetaApiIntegration()
  .then(result => {
    console.log('Test result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });