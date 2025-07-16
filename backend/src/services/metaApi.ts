import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getCircuitBreaker } from '@/utils/circuitBreaker';
import { logger } from '@/utils/logger';
import { MetaAPIError } from '@/middleware/errorHandler';

// Meta API Types based on official documentation
export interface MetaFlowsAPI {
  createFlow(params: CreateFlowParams): Promise<FlowResponse>;
  updateFlow(flowId: string, params: UpdateFlowParams): Promise<FlowResponse>;
  getFlow(flowId: string): Promise<FlowResponse>;
  deleteFlow(flowId: string): Promise<DeleteResponse>;
  publishFlow(flowId: string): Promise<PublishResponse>;
  deprecateFlow(flowId: string): Promise<DeprecateResponse>;
  uploadMedia(file: MediaFile): Promise<MediaUploadResponse>;
  getFlowMetrics(flowId: string, params: MetricsParams): Promise<FlowMetrics>;
  processWebhook(payload: WebhookPayload): Promise<void>;
}

// Request/Response Types
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

export interface DeleteResponse {
  success: boolean;
}

export interface PublishResponse {
  success: boolean;
}

export interface DeprecateResponse {
  success: boolean;
}

export interface FlowStatus {
  status: "DRAFT" | "PUBLISHED" | "DEPRECATED" | "BLOCKED";
}

export interface FlowCategory {
  category: "SIGN_UP" | "SIGN_IN" | "APPOINTMENT_BOOKING" | "LEAD_GENERATION" | 
           "CONTACT_US" | "CUSTOMER_SUPPORT" | "SURVEY" | "OTHER";
}

export interface FlowPreview {
  preview_url?: string;
  expires_at?: string;
}

// Flow JSON Structure
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
  | "TextHeading" | "TextSubheading" | "TextBody" | "TextCaption" | "RichText"
  | "TextInput" | "TextArea" | "CheckboxGroup" | "RadioButtonsGroup" 
  | "Dropdown" | "DatePicker" | "OptIn" | "ChipsSelector"
  | "Image" | "ImageCarousel" | "PhotoPicker" | "DocumentPicker"
  | "Button" | "Footer" | "EmbeddedLink"
  | "Form";

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

// Error Types
export interface MetaAPIErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
    error_user_title?: string;
    error_user_msg?: string;
  };
}

export interface ValidationError {
  message: string;
  path: string;
  code: string;
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
}

export class MetaAPIService implements MetaFlowsAPI {
  private client: AxiosInstance;
  private circuitBreaker;

  constructor() {
    const baseURL = process.env.META_API_BASE_URL || 'https://graph.facebook.com';
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    
    this.client = axios.create({
      baseURL: `${baseURL}/${apiVersion}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
      },
    });

    // Add request/response interceptors
    this.setupInterceptors();

    // Initialize circuit breaker
    this.circuitBreaker = getCircuitBreaker('meta-api', {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      expectedErrors: (error: Error) => {
        // Don't trigger circuit breaker for client errors (4xx)
        return error.message.includes('400') || error.message.includes('401') || 
               error.message.includes('403') || error.message.includes('404');
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Meta API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        logger.error('Meta API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug('Meta API Response', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        const metaError = this.handleMetaAPIError(error);
        logger.error('Meta API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          error: metaError,
        });
        return Promise.reject(metaError);
      }
    );
  }

  private handleMetaAPIError(error: any): MetaAPIError {
    if (error.response?.data?.error) {
      const metaError = error.response.data as MetaAPIErrorResponse;
      return new MetaAPIError(
        `Meta API Error: ${metaError.error.message}`,
        metaError
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new MetaAPIError('Meta API request timeout');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new MetaAPIError('Meta API connection failed');
    }

    return new MetaAPIError(
      error.message || 'Unknown Meta API error',
      error.response?.data
    );
  }

  async createFlow(params: CreateFlowParams): Promise<FlowResponse> {
    return this.circuitBreaker.execute(async () => {
      const businessAccountId = process.env.META_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        throw new Error('META_BUSINESS_ACCOUNT_ID not configured');
      }

      const response = await this.client.post(`/${businessAccountId}/flows`, params);
      return response.data;
    });
  }

  async updateFlow(flowId: string, params: UpdateFlowParams): Promise<FlowResponse> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.post(`/${flowId}`, params);
      return response.data;
    });
  }

  async getFlow(flowId: string): Promise<FlowResponse> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.get(`/${flowId}`);
      return response.data;
    });
  }

  async deleteFlow(flowId: string): Promise<DeleteResponse> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.delete(`/${flowId}`);
      return { success: response.status === 200 };
    });
  }

  async publishFlow(flowId: string): Promise<PublishResponse> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.post(`/${flowId}/publish`);
      return { success: response.status === 200 };
    });
  }

  async deprecateFlow(flowId: string): Promise<DeprecateResponse> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.client.post(`/${flowId}/deprecate`);
      return { success: response.status === 200 };
    });
  }

  async uploadMedia(file: MediaFile): Promise<MediaUploadResponse> {
    return this.circuitBreaker.execute(async () => {
      const businessAccountId = process.env.META_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        throw new Error('META_BUSINESS_ACCOUNT_ID not configured');
      }

      const formData = new FormData();
      formData.append('file', new Blob([file.file]), file.filename);
      formData.append('type', file.type);
      formData.append('messaging_product', 'whatsapp');

      const response = await this.client.post(`/${businessAccountId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    });
  }

  async getFlowMetrics(flowId: string, params: MetricsParams): Promise<FlowMetrics> {
    return this.circuitBreaker.execute(async () => {
      const queryParams = new URLSearchParams({
        start: params.start,
        end: params.end,
        granularity: params.granularity,
      });

      const response = await this.client.get(`/${flowId}/metrics?${queryParams}`);
      return response.data;
    });
  }

  async processWebhook(payload: WebhookPayload): Promise<void> {
    logger.info('Processing Meta webhook', {
      object: payload.object,
      entryCount: payload.entry.length,
    });

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value.messages) {
          for (const message of change.value.messages) {
            if (message.type === 'interactive' && message.interactive.type === 'nfm_reply') {
              await this.handleFlowResponse(message);
            }
          }
        }
      }
    }
  }

  private async handleFlowResponse(message: WebhookMessage): Promise<void> {
    try {
      const flowResponse = JSON.parse(message.interactive.nfm_reply.response_json);
      
      logger.info('Flow response received', {
        messageId: message.id,
        from: message.from,
        flowName: message.interactive.nfm_reply.name,
        responseData: flowResponse,
      });

      // TODO: Process flow response data
      // This would typically involve:
      // 1. Storing the response in the database
      // 2. Triggering any configured webhooks
      // 3. Processing business logic based on the response
      
    } catch (error) {
      logger.error('Error processing flow response', {
        messageId: message.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const businessAccountId = process.env.META_BUSINESS_ACCOUNT_ID;
      if (!businessAccountId) {
        return false;
      }

      // Simple API call to check connectivity
      await this.client.get(`/${businessAccountId}?fields=id,name`);
      return true;
    } catch (error) {
      logger.error('Meta API health check failed', error);
      return false;
    }
  }

  // Get circuit breaker stats
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}

// Export singleton instance
export const metaApiService = new MetaAPIService();