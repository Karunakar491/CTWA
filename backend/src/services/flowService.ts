import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { metaApiService, FlowJSONDefinition, CreateFlowParams, UpdateFlowParams, FlowResponse } from './metaApi';
import { flowValidationService } from './flowValidation';
import { logger } from '@/utils/logger';

// Simple flow interfaces
export interface FlowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: 'draft' | 'published' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
  metaFlowId?: string;
  flowJson: FlowJSONDefinition;
  tags: string[];
  category?: string;
}

export interface FlowCreateRequest {
  name: string;
  description?: string;
  flowJson: FlowJSONDefinition;
  tags?: string[];
  category?: string;
}

export interface FlowUpdateRequest {
  name?: string;
  description?: string;
  flowJson?: FlowJSONDefinition;
  tags?: string[];
  category?: string;
}

export interface FlowSearchOptions {
  query?: string;
  tags?: string[];
  category?: string;
  status?: 'draft' | 'published' | 'deprecated';
  limit?: number;
  offset?: number;
}

export class FlowService {
  private flowsPath: string;

  constructor() {
    this.flowsPath = process.env.FLOWS_PATH || 'flows';
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.flowsPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize flows directory', { error });
    }
  }

  /**
   * Create a new flow
   */
  async createFlow(flowData: FlowCreateRequest): Promise<FlowMetadata> {
    try {
      // Validate flow JSON
      const validationResult = await flowValidationService.validateFlow(flowData.flowJson);
      if (!validationResult.isValid) {
        throw new Error(`Flow validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      const flowId = this.generateFlowId();
      const now = new Date();

      const flowMetadata: FlowMetadata = {
        id: flowId,
        name: flowData.name,
        description: flowData.description,
        version: flowData.flowJson.version,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        flowJson: flowData.flowJson,
        tags: flowData.tags || [],
        category: flowData.category
      };

      // Store flow metadata
      await this.storeFlowMetadata(flowMetadata);

      logger.info('Flow created successfully', {
        flowId,
        name: flowData.name,
        version: flowData.flowJson.version
      });

      return flowMetadata;

    } catch (error) {
      logger.error('Flow creation failed', {
        name: flowData.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get flow by ID
   */
  async getFlow(flowId: string): Promise<FlowMetadata | null> {
    try {
      return await this.getFlowMetadataFromStorage(flowId);
    } catch (error) {
      logger.error('Failed to get flow', { flowId, error });
      return null;
    }
  }

  /**
   * Update flow
   */
  async updateFlow(flowId: string, updates: FlowUpdateRequest): Promise<FlowMetadata | null> {
    try {
      const existingFlow = await this.getFlow(flowId);
      if (!existingFlow) {
        return null;
      }

      // Validate flow JSON if provided
      if (updates.flowJson) {
        const validationResult = await flowValidationService.validateFlow(updates.flowJson);
        if (!validationResult.isValid) {
          throw new Error(`Flow validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        }
      }

      const updatedFlow: FlowMetadata = {
        ...existingFlow,
        ...updates,
        updatedAt: new Date()
      };

      // If flow JSON changed, update version
      if (updates.flowJson) {
        updatedFlow.version = updates.flowJson.version;
      }

      await this.storeFlowMetadata(updatedFlow);

      logger.info('Flow updated successfully', {
        flowId,
        updates: Object.keys(updates)
      });

      return updatedFlow;

    } catch (error) {
      logger.error('Flow update failed', {
        flowId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete flow
   */
  async deleteFlow(flowId: string): Promise<boolean> {
    try {
      const flow = await this.getFlow(flowId);
      if (!flow) {
        return false;
      }

      // Delete from Meta API if published
      if (flow.metaFlowId) {
        try {
          await metaApiService.deleteFlow(flow.metaFlowId);
          logger.info('Flow deleted from Meta API', { flowId, metaFlowId: flow.metaFlowId });
        } catch (error) {
          logger.warn('Failed to delete flow from Meta API', { flowId, error });
          // Continue with local deletion
        }
      }

      // Delete local metadata
      await this.removeFlowMetadata(flowId);

      logger.info('Flow deleted successfully', { flowId });
      return true;

    } catch (error) {
      logger.error('Flow deletion failed', { flowId, error });
      return false;
    }
  }

  /**
   * Search flows
   */
  async searchFlows(options: FlowSearchOptions = {}): Promise<{ flows: FlowMetadata[]; total: number }> {
    try {
      const allFlows = await this.getAllFlowsFromStorage();
      
      let filteredFlows = allFlows.filter(flow => {
        if (options.status && flow.status !== options.status) return false;
        if (options.category && flow.category !== options.category) return false;
        if (options.tags && options.tags.length > 0) {
          const hasMatchingTag = options.tags.some(tag => flow.tags.includes(tag));
          if (!hasMatchingTag) return false;
        }
        if (options.query) {
          const query = options.query.toLowerCase();
          const searchText = `${flow.name} ${flow.description || ''} ${flow.tags.join(' ')}`.toLowerCase();
          if (!searchText.includes(query)) return false;
        }
        return true;
      });

      // Sort by updated date (newest first)
      filteredFlows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      // Paginate
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      const paginatedFlows = filteredFlows.slice(offset, offset + limit);

      return {
        flows: paginatedFlows,
        total: filteredFlows.length
      };

    } catch (error) {
      logger.error('Flow search failed', { options, error });
      return { flows: [], total: 0 };
    }
  }

  /**
   * Publish flow to Meta API
   */
  async publishFlow(flowId: string): Promise<FlowMetadata | null> {
    try {
      const flow = await this.getFlow(flowId);
      if (!flow) {
        return null;
      }

      // Validate flow before publishing
      const validationResult = await flowValidationService.validateFlow(flow.flowJson);
      if (!validationResult.isValid) {
        throw new Error(`Cannot publish invalid flow: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      let metaFlowId = flow.metaFlowId;

      if (metaFlowId) {
        // Update existing flow in Meta API
        const updateParams: UpdateFlowParams = {
          name: flow.name,
          flow_json: flow.flowJson
        };
        
        await metaApiService.updateFlow(metaFlowId, updateParams);
        await metaApiService.publishFlow(metaFlowId);
      } else {
        // Create new flow in Meta API
        const createParams: CreateFlowParams = {
          name: flow.name,
          categories: [{ category: 'OTHER' }] // Default category
        };

        const metaFlow = await metaApiService.createFlow(createParams);
        metaFlowId = metaFlow.id;

        // Update with flow JSON
        const updateParams: UpdateFlowParams = {
          flow_json: flow.flowJson
        };
        
        await metaApiService.updateFlow(metaFlowId, updateParams);
        await metaApiService.publishFlow(metaFlowId);
      }

      // Update local flow status
      const updatedFlow = await this.updateFlow(flowId, {
        status: 'published',
        metaFlowId
      });

      logger.info('Flow published successfully', {
        flowId,
        metaFlowId,
        name: flow.name
      });

      return updatedFlow;

    } catch (error) {
      logger.error('Flow publishing failed', {
        flowId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Duplicate flow
   */
  async duplicateFlow(flowId: string, newName: string): Promise<FlowMetadata | null> {
    try {
      const originalFlow = await this.getFlow(flowId);
      if (!originalFlow) {
        return null;
      }

      const duplicateData: FlowCreateRequest = {
        name: newName,
        description: `Copy of ${originalFlow.name}`,
        flowJson: originalFlow.flowJson,
        tags: [...originalFlow.tags, 'duplicate'],
        category: originalFlow.category
      };

      const duplicatedFlow = await this.createFlow(duplicateData);

      logger.info('Flow duplicated successfully', {
        originalFlowId: flowId,
        duplicatedFlowId: duplicatedFlow.id,
        newName
      });

      return duplicatedFlow;

    } catch (error) {
      logger.error('Flow duplication failed', {
        flowId,
        newName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private helper methods

  private generateFlowId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async storeFlowMetadata(flow: FlowMetadata): Promise<void> {
    const flowPath = path.join(this.flowsPath, `${flow.id}.json`);
    await fs.writeFile(flowPath, JSON.stringify(flow, null, 2));
  }

  private async getFlowMetadataFromStorage(flowId: string): Promise<FlowMetadata | null> {
    try {
      const flowPath = path.join(this.flowsPath, `${flowId}.json`);
      const data = await fs.readFile(flowPath, 'utf-8');
      const flow = JSON.parse(data);
      
      // Convert date strings back to Date objects
      flow.createdAt = new Date(flow.createdAt);
      flow.updatedAt = new Date(flow.updatedAt);
      
      return flow;
    } catch {
      return null;
    }
  }

  private async getAllFlowsFromStorage(): Promise<FlowMetadata[]> {
    try {
      const files = await fs.readdir(this.flowsPath);
      const flowFiles = files.filter(file => file.endsWith('.json'));
      
      const flows: FlowMetadata[] = [];
      for (const file of flowFiles) {
        const flowId = file.replace('.json', '');
        const flow = await this.getFlowMetadataFromStorage(flowId);
        if (flow) {
          flows.push(flow);
        }
      }
      
      return flows;
    } catch {
      return [];
    }
  }

  private async removeFlowMetadata(flowId: string): Promise<void> {
    try {
      const flowPath = path.join(this.flowsPath, `${flowId}.json`);
      await fs.unlink(flowPath);
    } catch {
      // Ignore errors - file might not exist
    }
  }
}

// Export singleton instance
export const flowService = new FlowService();