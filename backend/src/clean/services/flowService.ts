/**
 * Flow Service
 * Handles flow CRUD operations, storage, and deployment
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { metaApiService, FlowJSONDefinition, CreateFlowParams, UpdateFlowParams } from './metaApi';

export interface Flow {
  id: string;
  name: string;
  description?: string;
  flowDefinition: FlowJSONDefinition;
  status: 'draft' | 'deployed' | 'published' | 'archived';
  metaFlowId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  publishedAt?: Date;
}

export interface FlowVersion {
  id: string;
  flowId: string;
  version: number;
  flowDefinition: FlowJSONDefinition;
  changeLog: string;
  createdAt: Date;
}

export interface DeploymentConfig {
  environment: 'staging' | 'production';
  autoPublish: boolean;
  rollbackOnError: boolean;
}

export interface DeploymentResult {
  success: boolean;
  flowId: string;
  metaFlowId?: string;
  status: string;
  message: string;
  errors?: any[];
}

export class FlowService {
  private flowsDir: string;
  private versionsDir: string;

  constructor() {
    this.flowsDir = path.join(process.cwd(), 'data', 'flows');
    this.versionsDir = path.join(process.cwd(), 'data', 'flow-versions');
    
    // Create directories if they don't exist
    this.initDirectories();
  }

  private initDirectories(): void {
    try {
      if (!fs.existsSync(this.flowsDir)) {
        fs.mkdirSync(this.flowsDir, { recursive: true });
      }
      
      if (!fs.existsSync(this.versionsDir)) {
        fs.mkdirSync(this.versionsDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to initialize flow directories', { error });
      throw new Error('Failed to initialize flow directories');
    }
  }

  /**
   * Get all flows
   */
  async getAllFlows(): Promise<Flow[]> {
    try {
      const files = fs.readdirSync(this.flowsDir);
      const flows: Flow[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.flowsDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const flow = JSON.parse(fileContent) as Flow;
          flows.push(flow);
        }
      }
      
      return flows;
    } catch (error) {
      logger.error('Failed to get all flows', { error });
      throw new Error('Failed to get all flows');
    }
  }

  /**
   * Get flow by ID
   */
  async getFlowById(id: string): Promise<Flow | null> {
    try {
      const filePath = path.join(this.flowsDir, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as Flow;
    } catch (error) {
      logger.error('Failed to get flow by ID', { id, error });
      throw new Error(`Failed to get flow with ID: ${id}`);
    }
  }

  /**
   * Create new flow
   */
  async createFlow(flowData: Partial<Flow>): Promise<Flow> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const flow: Flow = {
        id,
        name: flowData.name || 'Untitled Flow',
        description: flowData.description || '',
        flowDefinition: flowData.flowDefinition || {
          version: '7.1',
          screens: []
        },
        status: 'draft',
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      
      // Save flow to file
      const filePath = path.join(this.flowsDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(flow, null, 2));
      
      // Create initial version
      await this.createFlowVersion(flow, 'Initial version');
      
      logger.info('Flow created', { id, name: flow.name });
      
      return flow;
    } catch (error) {
      logger.error('Failed to create flow', { error });
      throw new Error('Failed to create flow');
    }
  }

  /**
   * Update flow
   */
  async updateFlow(id: string, updates: Partial<Flow>): Promise<Flow> {
    try {
      const flow = await this.getFlowById(id);
      
      if (!flow) {
        throw new Error(`Flow with ID ${id} not found`);
      }
      
      // Update flow properties
      const updatedFlow: Flow = {
        ...flow,
        ...updates,
        id, // Ensure ID doesn't change
        version: flow.version + 1,
        updatedAt: new Date()
      };
      
      // Save updated flow
      const filePath = path.join(this.flowsDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(updatedFlow, null, 2));
      
      // Create new version
      await this.createFlowVersion(updatedFlow, updates.description || 'Updated flow');
      
      logger.info('Flow updated', { id, name: updatedFlow.name, version: updatedFlow.version });
      
      return updatedFlow;
    } catch (error) {
      logger.error('Failed to update flow', { id, error });
      throw new Error(`Failed to update flow with ID: ${id}`);
    }
  }

  /**
   * Delete flow
   */
  async deleteFlow(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.flowsDir, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      // Delete flow file
      fs.unlinkSync(filePath);
      
      // Delete flow versions
      const versionFiles = fs.readdirSync(this.versionsDir);
      for (const file of versionFiles) {
        if (file.startsWith(`${id}_v`)) {
          fs.unlinkSync(path.join(this.versionsDir, file));
        }
      }
      
      logger.info('Flow deleted', { id });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete flow', { id, error });
      throw new Error(`Failed to delete flow with ID: ${id}`);
    }
  }

  /**
   * Deploy flow to Meta API
   */
  async deployFlow(id: string, config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      const flow = await this.getFlowById(id);
      
      if (!flow) {
        throw new Error(`Flow with ID ${id} not found`);
      }
      
      // If flow already has a Meta Flow ID, update it
      if (flow.metaFlowId) {
        const updateParams: UpdateFlowParams = {
          name: flow.name,
          flow_json: flow.flowDefinition,
          categories: [{ category: 'OTHER' }]
        };
        
        const result = await metaApiService.updateFlow(flow.metaFlowId, updateParams);
        
        // Update flow status
        flow.status = 'deployed';
        flow.deployedAt = new Date();
        await this.updateFlow(id, flow);
        
        // Publish flow if requested
        if (config.autoPublish) {
          await metaApiService.publishFlow(flow.metaFlowId);
          flow.status = 'published';
          flow.publishedAt = new Date();
          await this.updateFlow(id, flow);
        }
        
        return {
          success: true,
          flowId: id,
          metaFlowId: result.id,
          status: result.status.status,
          message: 'Flow updated and deployed successfully'
        };
      } 
      // Create new flow in Meta API
      else {
        const createParams: CreateFlowParams = {
          name: flow.name,
          categories: [{ category: 'OTHER' }]
        };
        
        const result = await metaApiService.createFlow(createParams);
        
        // Update flow with Meta Flow ID
        flow.metaFlowId = result.id;
        flow.status = 'deployed';
        flow.deployedAt = new Date();
        
        // Update flow JSON
        const updateParams: UpdateFlowParams = {
          flow_json: flow.flowDefinition
        };
        
        await metaApiService.updateFlow(result.id, updateParams);
        
        // Save updated flow
        await this.updateFlow(id, flow);
        
        // Publish flow if requested
        if (config.autoPublish) {
          await metaApiService.publishFlow(result.id);
          flow.status = 'published';
          flow.publishedAt = new Date();
          await this.updateFlow(id, flow);
        }
        
        return {
          success: true,
          flowId: id,
          metaFlowId: result.id,
          status: result.status.status,
          message: 'Flow created and deployed successfully'
        };
      }
    } catch (error) {
      logger.error('Failed to deploy flow', { id, error });
      
      // Handle rollback if requested
      if (config.rollbackOnError) {
        try {
          const flow = await this.getFlowById(id);
          if (flow && flow.version > 1) {
            const previousVersion = await this.getFlowVersion(id, flow.version - 1);
            if (previousVersion) {
              await this.updateFlow(id, {
                flowDefinition: previousVersion.flowDefinition,
                description: 'Rolled back due to deployment error'
              });
              logger.info('Flow rolled back to previous version', { id, version: flow.version - 1 });
            }
          }
        } catch (rollbackError) {
          logger.error('Failed to rollback flow', { id, error: rollbackError });
        }
      }
      
      return {
        success: false,
        flowId: id,
        status: 'error',
        message: `Failed to deploy flow: ${error.message}`,
        errors: [error]
      };
    }
  }

  /**
   * Create flow version
   */
  private async createFlowVersion(flow: Flow, changeLog: string): Promise<FlowVersion> {
    try {
      const versionId = uuidv4();
      const version: FlowVersion = {
        id: versionId,
        flowId: flow.id,
        version: flow.version,
        flowDefinition: flow.flowDefinition,
        changeLog,
        createdAt: new Date()
      };
      
      // Save version to file
      const filePath = path.join(this.versionsDir, `${flow.id}_v${flow.version}.json`);
      fs.writeFileSync(filePath, JSON.stringify(version, null, 2));
      
      return version;
    } catch (error) {
      logger.error('Failed to create flow version', { flowId: flow.id, version: flow.version, error });
      throw new Error(`Failed to create version for flow: ${flow.id}`);
    }
  }

  /**
   * Get flow version
   */
  async getFlowVersion(flowId: string, version: number): Promise<FlowVersion | null> {
    try {
      const filePath = path.join(this.versionsDir, `${flowId}_v${version}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as FlowVersion;
    } catch (error) {
      logger.error('Failed to get flow version', { flowId, version, error });
      throw new Error(`Failed to get version ${version} for flow: ${flowId}`);
    }
  }

  /**
   * Get flow history
   */
  async getFlowHistory(flowId: string): Promise<FlowVersion[]> {
    try {
      const versionFiles = fs.readdirSync(this.versionsDir);
      const flowVersionFiles = versionFiles.filter(file => file.startsWith(`${flowId}_v`));
      
      const versions: FlowVersion[] = [];
      
      for (const file of flowVersionFiles) {
        const filePath = path.join(this.versionsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const version = JSON.parse(fileContent) as FlowVersion;
        versions.push(version);
      }
      
      // Sort versions by version number
      return versions.sort((a, b) => b.version - a.version);
    } catch (error) {
      logger.error('Failed to get flow history', { flowId, error });
      throw new Error(`Failed to get history for flow: ${flowId}`);
    }
  }
}

// Export singleton instance
export const flowService = new FlowService();