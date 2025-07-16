// src/services/metaApi.ts

import { ValidationError } from '@/lib/whatsapp-flows-validator';

const API_BASE_URL = 'http://localhost:3001/api';

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export interface MetaApiValidationError {
  message: string;
  path: string;
  code: string;
}

export interface MetaApiResponse {
  success: boolean;
  data?: any;
  error?: MetaApiError;
  validation_errors?: MetaApiValidationError[];
}

export interface DeploymentResult {
  success: boolean;
  flowId?: string;
  errors?: ValidationError[];
  message?: string;
}

// Transform Meta API validation errors to our internal format
function transformMetaValidationErrors(metaErrors: MetaApiValidationError[]): ValidationError[] {
  return metaErrors.map(error => ({
    path: error.path || 'unknown',
    message: error.message || 'Unknown validation error',
    value: null,
    severity: 'error' as const,
    originalMessage: error.message || 'Unknown validation error'
  }));
}

// API helper function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Main deployment function - creates and publishes flow
export async function deployFlowToMetaAPI(flowName: string, flowJson: any): Promise<DeploymentResult> {
  try {
    console.log('Deploying flow to backend:', { flowName, flowJson });

    // First create the flow
    const createResponse = await apiCall('/flows', {
      method: 'POST',
      body: JSON.stringify({
        name: flowName,
        description: `Flow created from builder`,
        flowJson,
        tags: ['builder-created'],
        category: 'OTHER'
      }),
    });

    if (!createResponse.success) {
      return {
        success: false,
        message: createResponse.message || 'Failed to create flow',
        errors: createResponse.error ? [transformMetaValidationErrors([createResponse.error])[0]] : []
      };
    }

    const flowId = createResponse.data.id;

    // Then publish to Meta API
    try {
      const publishResponse = await apiCall(`/flows/${flowId}/publish`, {
        method: 'POST',
      });

      if (publishResponse.success) {
        return {
          success: true,
          flowId,
          message: 'Flow deployed and published successfully!'
        };
      } else {
        return {
          success: true, // Flow was created successfully
          flowId,
          message: 'Flow created but publishing to Meta API failed. You can try publishing later.',
          errors: publishResponse.error ? [transformMetaValidationErrors([publishResponse.error])[0]] : []
        };
      }
    } catch (publishError) {
      return {
        success: true, // Flow was created successfully
        flowId,
        message: 'Flow created but publishing to Meta API failed. You can try publishing later.'
      };
    }

  } catch (error) {
    console.error('Network error during deployment:', error);
    return {
      success: false,
      message: 'Failed to connect to backend server',
      errors: [{
        path: 'root',
        message: 'Network error occurred',
        value: null,
        severity: 'error' as const,
        originalMessage: error instanceof Error ? error.message : 'Network error'
      }]
    };
  }
}

// Get all flows
export async function getFlows(): Promise<any[]> {
  try {
    const response = await apiCall('/flows');
    return response.success ? response.data.flows : [];
  } catch (error) {
    console.error('Error fetching flows:', error);
    return [];
  }
}

// Update flow
export async function updateFlow(flowId: string, updates: any): Promise<boolean> {
  try {
    const response = await apiCall(`/flows/${flowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.success;
  } catch (error) {
    console.error('Error updating flow:', error);
    return false;
  }
}

// Delete flow
export async function deleteFlow(flowId: string): Promise<boolean> {
  try {
    const response = await apiCall(`/flows/${flowId}`, {
      method: 'DELETE',
    });
    return response.success;
  } catch (error) {
    console.error('Error deleting flow:', error);
    return false;
  }
}

// Publish flow to Meta API
export async function publishFlow(flowId: string): Promise<boolean> {
  try {
    const response = await apiCall(`/flows/${flowId}/publish`, {
      method: 'POST',
    });
    return response.success;
  } catch (error) {
    console.error('Error publishing flow:', error);
    return false;
  }
}

// Deprecate flow
export async function deprecateFlow(flowId: string): Promise<boolean> {
  try {
    // This would call a deprecate endpoint when available
    console.log('Deprecate flow not implemented yet:', flowId);
    return true;
  } catch (error) {
    console.error('Error deprecating flow:', error);
    return false;
  }
}

// Get flow by ID
export async function getFlowById(flowId: string): Promise<any> {
  try {
    const response = await apiCall(`/flows/${flowId}`);
    return response.success ? response.data : null;
  } catch (error) {
    console.error('Error fetching flow:', error);
    return null;
  }
}

// Get templates
export async function getTemplates(options: {
  category?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (options.category) params.append('category', options.category);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await apiCall(`/templates?${params}`);
    return response.success ? response.data.templates : [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

// Create flow from template
export async function createFlowFromTemplate(templateId: string, flowName: string, description?: string): Promise<any> {
  try {
    const response = await apiCall(`/templates/${templateId}/use`, {
      method: 'POST',
      body: JSON.stringify({
        name: flowName,
        description
      }),
    });
    return response.success ? response.data : null;
  } catch (error) {
    console.error('Error creating flow from template:', error);
    return null;
  }
}

// Upload media
export async function uploadMedia(file: File, uploadToMeta: boolean = false): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadToMeta', uploadToMeta.toString());

    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error uploading media:', error);
    return null;
  }
}