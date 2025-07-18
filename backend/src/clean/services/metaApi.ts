/**
 * Meta WhatsApp Business API service
 * Handles all interactions with Meta's WhatsApp Business APIs
 */

import axios, { AxiosInstance } from 'axios';
import { metaConfigService } from '../config/meta';
import { logger } from '../utils/logger';

// Flow JSON Structure (https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson)
export interface FlowJSONDefinition {
  version: "3.0" | "4.0" | "5.0" | "6.0" | "7.0" | "7.1";
  data_api_version?: "3.0";
  routing_model?: Record<string, string[]>;
  screens: FlowScreen[];
}

export interface FlowScreen {
  id: string;
  title: string;
  terminal?: boolean;
  success?: boolean;
  data: FlowComponent[];
  layout?: {
    type: "SingleColumnLayout";
    children: string[];
  };
}

export interface FlowComponent {
  type: ComponentType;
  name?: string;
  [key: string]: any;
}

export type ComponentType = 
  // Text Components
  | "TextHeading" | "TextSubheading" | "TextBody" | "TextCaption" | "RichText"
  // Input Components  
  | "TextInput" | "TextArea" | "CheckboxGroup" | "RadioButtonsGroup" 
  | "Dropdown" | "DatePicker" | "OptIn" | "ChipsSelector"
  // Media Components
  | "Image" | "ImageCarousel" | "PhotoPicker" | "DocumentPicker"
  // Action Components
  | "Button" | "Footer" | "EmbeddedLink"
  // Container Components
  | "Form";

// Meta API Request/Response Types
export interface CreateFlowParams {
  name: string;
  categories: FlowCategory[];
  clone_flow_id?: string;
  endpoint_uri?: string;
}

export interface UpdateFlowParams {
  name?: string;
  categories?: FlowCategory[];
  flow_json?: FlowJSONDefinition;
  endpoint_uri?: string;
  preview?: FlowPreview;
}

export interface FlowResponse {
  id: string;
  name: string;
  status: FlowStatus;
  categories: FlowCategory[];
  validation_errors?: ValidationError[];
  json_version?: string;
  data_api_version?: string;
  endpoint_uri?: string;
  preview?: FlowPreview;
}

export interface FlowStatus {
  status: "DRAFT" | "PUBLISHED" | "DEPRECATED" | "BLOCKED";
}

export interface FlowCategory {
  category: "SIGN_UP" | "SIGN_IN" | "APPOINTMENT_BOOKING" | "LEAD_GENERATION" | 
           "CONTACT_US" | "CUSTOMER_SUPPORT" | "SURVEY" | "OTHER";
}

export interface FlowPreview {
  screenshot_urls: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  details?: any;
}

export interface DeleteResponse {
  success: boolean;
}

export interface PublishResponse {
  id: string;
  status: FlowStatus;
}

export interface DeprecateResponse {
  id: string;
  status: FlowStatus;
}

// Media Upload Types
export interface MediaFile {
  file: Buffer;
  type: "image/jpeg" | "image/png" | "image/webp";
  filename: string;
}

export interface MediaUploadResponse {
  id: string;
  url: string;
  mime_type: string;
  file_size: number;
}

// Metrics API Types
export interface MetricsParams {
  start: string; // ISO 8601 date
  end: string;   // ISO 8601 date
  granularity: "HOUR" | "DAY" | "WEEK" | "MONTH";
}

export interface FlowMetrics {
  data: MetricDataPoint[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface MetricDataPoint {
  start_time: string;
  end_time: string;
  flow_started: number;
  flow_completed: number;
  flow_completion_rate: number;
}

// Webhook Types
export interface WebhookPayload {
  object: "whatsapp_business_account";
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: {
    messaging_product: "whatsapp";
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    messages?: WebhookMessage[];
    statuses?: WebhookStatus[];
  };
  field: "messages";
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "interactive";
  interactive: {
    type: "nfm_reply";
    nfm_reply: {
      response_json: string;
      body: string;
      name: string;
    };
  };
}

export interface WebhookStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: any[];
}

export class MetaApiService {
  private client: AxiosInstance;
  private baseUrl: string;
  private retryCount: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    const config = metaConfigService.getConfig();
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Meta API Request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Meta API Request Error', { error });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Meta API Response', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      async (error) => {
        const { config, response } = error;
        
        // Log error details
        logger.error('Meta API Response Error', {
          status: response?.status,
          data: response?.data,
          url: config?.url,
          method: config?.method
        });

        // Handle rate limiting
        if (response?.status === 429 && config && !config.__isRetry) {
          const retryAfter = parseInt(response.headers['retry-after'] || '60', 10);
          logger.warn(`Rate limited by Meta API, retrying after ${retryAfter} seconds`);
          
          // Wait for the specified time
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          
          // Retry the request
          config.__isRetry = true;
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh API client with new configuration
   */
  refreshConfig(): void {
    const config = metaConfigService.getConfig();
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`
      }
    });
  }

  /**
   * Create a new flow
   */
  async createFlow(params: CreateFlowParams): Promise<FlowResponse> {
    try {
      const config = metaConfigService.getConfig();
      const response = await this.client.post(`/${config.wabaId}/flows`, params);
      return response.data;
    } catch (error) {
      logger.error('Failed to create flow', { error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Get flow by ID
   */
  async getFlow(flowId: string): Promise<FlowResponse> {
    try {
      const response = await this.client.get(`/${flowId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get flow', { flowId, error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Update flow
   */
  async updateFlow(flowId: string, params: UpdateFlowParams): Promise<FlowResponse> {
    try {
      const response = await this.client.post(`/${flowId}`, params);
      return response.data;
    } catch (error) {
      logger.error('Failed to update flow', { flowId, error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete flow
   */
  async deleteFlow(flowId: string): Promise<DeleteResponse> {
    try {
      const response = await this.client.delete(`/${flowId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to delete flow', { flowId, error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Publish flow
   */
  async publishFlow(flowId: string): Promise<PublishResponse> {
    try {
      const response = await this.client.post(`/${flowId}/publish`);
      return response.data;
    } catch (error) {
      logger.error('Failed to publish flow', { flowId, error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Deprecate flow
   */
  async deprecateFlow(flowId: string): Promise<DeprecateResponse> {
    try {
      const response = await this.client.post(`/${flowId}/deprecate`);
      return response.data;
    } catch (error) {
      logger.error('Failed to deprecate flow', { flowId, error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Upload media for flow
   */
  async uploadMedia(file: MediaFile): Promise<MediaUploadResponse> {
    try {
      const config = metaConfigService.getConfig();
      
      // Create form data
      const formData = new FormData();
      const blob = new Blob([file.file], { type: file.type });
      formData.append('file', blob, file.filename);
      formData.append('type', file.type);
      
      // Upload media
      const response = await this.client.post(
        `/${config.wabaId}/flows/media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to upload media', { error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Get flow metrics
   */
  async getFlowMetrics(flowId: string, params: MetricsParams): Promise<FlowMetrics> {
    try {
      const response = await this.client.get(`/${flowId}/metrics`, { params });
      return response.data;
    } catch (error) {
      logger.error('Failed to get flow metrics', { flowId, error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Process webhook payload
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      logger.info('Processing webhook payload', { payload });
      
      // Extract flow responses
      const flowResponses = payload.entry
        .flatMap(entry => entry.changes)
        .filter(change => change.field === 'messages')
        .flatMap(change => change.value.messages || [])
        .filter(message => message.type === 'interactive' && message.interactive.type === 'nfm_reply');
      
      // Process each flow response
      for (const response of flowResponses) {
        try {
          const responseData = JSON.parse(response.interactive.nfm_reply.response_json);
          logger.info('Flow response data', { 
            from: response.from,
            flowName: response.interactive.nfm_reply.name,
            responseData 
          });
          
          // TODO: Store flow response data
          
        } catch (parseError) {
          logger.error('Failed to parse flow response JSON', { 
            response: response.interactive.nfm_reply.response_json,
            error: parseError
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process webhook', { error });
      throw error;
    }
  }

  /**
   * Send flow to a user
   */
  async sendFlow(
    flowId: string, 
    recipientPhone: string, 
    flowTokenParams?: Record<string, string>
  ): Promise<any> {
    try {
      const config = metaConfigService.getConfig();
      
      const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'interactive',
        interactive: {
          type: 'flow',
          flow: {
            id: flowId,
            ...(flowTokenParams && { flow_token_params: flowTokenParams })
          }
        }
      };
      
      const response = await this.client.post(
        `/${config.phoneNumberId}/messages`,
        messageData
      );
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send flow', { flowId, recipientPhone, error });
      throw this.handleApiError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      
      // Format error message
      const errorMessage = data.error?.message || 'Unknown API error';
      const errorCode = data.error?.code || status;
      
      const formattedError = new Error(`Meta API Error (${errorCode}): ${errorMessage}`);
      (formattedError as any).statusCode = status;
      (formattedError as any).details = data.error;
      
      return formattedError;
    }
    
    return error;
  }
}

// Export singleton instance
export const metaApiService = new MetaApiService();