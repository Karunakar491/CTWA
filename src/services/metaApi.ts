// src/services/metaApi.ts

// import { META_API_CONFIG, FLOWS_ENDPOINTS } from '@/config/api';
import { ValidationError } from '@/lib/whatsapp-flows-validator';

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

// Main deployment function
export async function deployFlowToMetaAPI(flowName: string, flowJson: any): Promise<DeploymentResult> {
  try {
    console.log('Simulating deployment to Meta API:', { flowName, flowJson });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, simulate a successful deployment
    // In a real application, this would be handled by a backend server
    const mockFlowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Mock deployment successful:', mockFlowId);
    
    return {
      success: true,
      flowId: mockFlowId,
      message: 'Flow deployed successfully! (Demo Mode - No actual deployment to Meta API)'
    };
  } catch (error) {
    console.error('Network error during deployment:', error);
    return {
      success: false,
      message: 'Deployment simulation failed',
      errors: [{
        path: 'root',
        message: 'Demo deployment error occurred',
        value: null,
        severity: 'error' as const,
        originalMessage: error instanceof Error ? error.message : 'Network error'
      }]
    };
  }
}

// Additional API functions for complete WhatsApp Flows management

export async function getFlows(): Promise<any[]> {
  try {
    // Simulate fetching flows
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock data
    return [
      {
        id: 'flow_demo_1',
        name: 'Demo Flow 1',
        status: 'PUBLISHED'
      },
      {
        id: 'flow_demo_2', 
        name: 'Demo Flow 2',
        status: 'DRAFT'
      }
    ];
  } catch (error) {
    console.error('Error fetching flows:', error);
    return [];
  }
}

export async function updateFlow(flowId: string, updates: any): Promise<boolean> {
  try {
    // Simulate update
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock update flow:', flowId, updates);
    return true;
  } catch (error) {
    console.error('Error updating flow:', error);
    return false;
  }
}

export async function deleteFlow(flowId: string): Promise<boolean> {
  try {
    // Simulate delete
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock delete flow:', flowId);
    return true;
  } catch (error) {
    console.error('Error deleting flow:', error);
    return false;
  }
}

export async function publishFlow(flowId: string): Promise<boolean> {
  try {
    // Simulate publish
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Mock publish flow:', flowId);
    return true;
  } catch (error) {
    console.error('Error publishing flow:', error);
    return false;
  }
}

export async function deprecateFlow(flowId: string): Promise<boolean> {
  try {
    // Simulate deprecate
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock deprecate flow:', flowId);
    return true;
  } catch (error) {
    console.error('Error deprecating flow:', error);
    return false;
  }
}

// Mock function to get flow by ID
export async function getFlowById(flowId: string): Promise<any> {
  try {
    // Simulate fetching flow data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock flow data based on ID
    const mockFlowData = {
      version: "7.1",
      data_api_version: "3.0",
      name: `Flow ${flowId}`,
      routing_model: {},
      screens: [
        {
          id: `screen_${Date.now()}`,
          title: "Welcome Screen",
          terminal: false,
          data: [
            {
              id: `heading_${Date.now()}`,
              type: "TextHeading",
              text: "Welcome to our service!"
            },
            {
              id: `footer_${Date.now()}`,
              type: "Footer",
              label: "Get Started",
              on_click_action: {
                name: "complete"
              }
            }
          ]
        }
      ]
    };
    
    console.log('Mock fetch flow:', flowId, mockFlowData);
    return mockFlowData;
  } catch (error) {
    console.error('Error fetching flow:', error);
    return null;
  }
}