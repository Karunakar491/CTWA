/**
 * Reporting Service
 * Handles analytics, metrics, and reporting for flows
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { metaApiService, MetricsParams, FlowMetrics } from './metaApi';

export interface FlowResponse {
  id: string;
  flowId: string;
  flowName: string;
  userId: string;
  phoneNumber: string;
  responses: Record<string, any>;
  completedAt: Date;
}

export interface FlowAnalytics {
  flowId: string;
  flowName: string;
  totalStarts: number;
  totalCompletions: number;
  completionRate: number;
  averageCompletionTime?: number;
  responsesByDay: {
    date: string;
    starts: number;
    completions: number;
  }[];
  responses: FlowResponse[];
}

export interface DashboardMetrics {
  totalFlows: number;
  activeFlows: number;
  totalResponses: number;
  responseRate: number;
  topFlows: {
    flowId: string;
    flowName: string;
    responses: number;
  }[];
  responsesByDay: {
    date: string;
    responses: number;
  }[];
}

export class ReportingService {
  private responsesDir: string;
  private metricsDir: string;

  constructor() {
    this.responsesDir = path.join(process.cwd(), 'data', 'responses');
    this.metricsDir = path.join(process.cwd(), 'data', 'metrics');
    
    // Create directories if they don't exist
    this.initDirectories();
  }

  private initDirectories(): void {
    try {
      if (!fs.existsSync(this.responsesDir)) {
        fs.mkdirSync(this.responsesDir, { recursive: true });
      }
      
      if (!fs.existsSync(this.metricsDir)) {
        fs.mkdirSync(this.metricsDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to initialize reporting directories', { error });
      throw new Error('Failed to initialize reporting directories');
    }
  }

  /**
   * Store flow response
   */
  async storeFlowResponse(response: Partial<FlowResponse>): Promise<FlowResponse> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const flowResponse: FlowResponse = {
        id,
        flowId: response.flowId || '',
        flowName: response.flowName || '',
        userId: response.userId || '',
        phoneNumber: response.phoneNumber || '',
        responses: response.responses || {},
        completedAt: response.completedAt || now
      };
      
      // Save response to file
      const filePath = path.join(this.responsesDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(flowResponse, null, 2));
      
      // Also save to flow-specific directory for easier querying
      const flowDir = path.join(this.responsesDir, flowResponse.flowId);
      if (!fs.existsSync(flowDir)) {
        fs.mkdirSync(flowDir, { recursive: true });
      }
      
      const flowFilePath = path.join(flowDir, `${id}.json`);
      fs.writeFileSync(flowFilePath, JSON.stringify(flowResponse, null, 2));
      
      logger.info('Flow response stored', { id, flowId: flowResponse.flowId });
      
      return flowResponse;
    } catch (error) {
      logger.error('Failed to store flow response', { error });
      throw new Error('Failed to store flow response');
    }
  }

  /**
   * Get flow responses
   */
  async getFlowResponses(flowId: string): Promise<FlowResponse[]> {
    try {
      const flowDir = path.join(this.responsesDir, flowId);
      
      if (!fs.existsSync(flowDir)) {
        return [];
      }
      
      const files = fs.readdirSync(flowDir);
      const responses: FlowResponse[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(flowDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const response = JSON.parse(fileContent) as FlowResponse;
          
          // Convert date strings back to Date objects
          response.completedAt = new Date(response.completedAt);
          
          responses.push(response);
        }
      }
      
      // Sort by completion date (newest first)
      return responses.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    } catch (error) {
      logger.error('Failed to get flow responses', { flowId, error });
      throw new Error(`Failed to get responses for flow: ${flowId}`);
    }
  }

  /**
   * Get flow analytics
   */
  async getFlowAnalytics(flowId: string, flowName: string, days: number = 30): Promise<FlowAnalytics> {
    try {
      // Get responses from local storage
      const responses = await this.getFlowResponses(flowId);
      
      // Get metrics from Meta API
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const metricsParams: MetricsParams = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        granularity: 'DAY'
      };
      
      let metaMetrics: FlowMetrics | null = null;
      try {
        metaMetrics = await metaApiService.getFlowMetrics(flowId, metricsParams);
      } catch (error) {
        logger.error('Failed to get Meta API metrics', { flowId, error });
        // Continue without Meta metrics
      }
      
      // Calculate analytics
      const totalStarts = metaMetrics?.data.reduce((sum, point) => sum + point.flow_started, 0) || responses.length;
      const totalCompletions = metaMetrics?.data.reduce((sum, point) => sum + point.flow_completed, 0) || responses.length;
      const completionRate = totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0;
      
      // Group responses by day
      const responsesByDay = this.groupResponsesByDay(responses, days);
      
      // If we have Meta metrics, use those for the chart data
      if (metaMetrics) {
        const chartData = metaMetrics.data.map(point => ({
          date: point.start_time.split('T')[0],
          starts: point.flow_started,
          completions: point.flow_completed
        }));
        
        return {
          flowId,
          flowName,
          totalStarts,
          totalCompletions,
          completionRate,
          responsesByDay: chartData,
          responses
        };
      }
      
      // Otherwise, use local data
      return {
        flowId,
        flowName,
        totalStarts,
        totalCompletions,
        completionRate,
        responsesByDay,
        responses
      };
    } catch (error) {
      logger.error('Failed to get flow analytics', { flowId, error });
      throw new Error(`Failed to get analytics for flow: ${flowId}`);
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(days: number = 30): Promise<DashboardMetrics> {
    try {
      // Get all responses
      const allResponses = await this.getAllResponses();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Filter responses within date range
      const recentResponses = allResponses.filter(
        response => response.completedAt >= startDate && response.completedAt <= endDate
      );
      
      // Group by flow
      const flowGroups = this.groupResponsesByFlow(recentResponses);
      
      // Calculate top flows
      const topFlows = Object.entries(flowGroups)
        .map(([flowId, responses]) => ({
          flowId,
          flowName: responses[0]?.flowName || 'Unknown Flow',
          responses: responses.length
        }))
        .sort((a, b) => b.responses - a.responses)
        .slice(0, 5);
      
      // Group by day
      const responsesByDay = this.groupAllResponsesByDay(recentResponses, days);
      
      return {
        totalFlows: Object.keys(flowGroups).length,
        activeFlows: Object.keys(flowGroups).length,
        totalResponses: recentResponses.length,
        responseRate: recentResponses.length / days,
        topFlows,
        responsesByDay
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics', { error });
      throw new Error('Failed to get dashboard metrics');
    }
  }

  /**
   * Get all responses
   */
  private async getAllResponses(): Promise<FlowResponse[]> {
    try {
      if (!fs.existsSync(this.responsesDir)) {
        return [];
      }
      
      const entries = fs.readdirSync(this.responsesDir, { withFileTypes: true });
      const responses: FlowResponse[] = [];
      
      // Process files in root responses directory
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const filePath = path.join(this.responsesDir, entry.name);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const response = JSON.parse(fileContent) as FlowResponse;
          
          // Convert date strings back to Date objects
          response.completedAt = new Date(response.completedAt);
          
          responses.push(response);
        }
      }
      
      return responses;
    } catch (error) {
      logger.error('Failed to get all responses', { error });
      return [];
    }
  }

  /**
   * Group responses by day
   */
  private groupResponsesByDay(responses: FlowResponse[], days: number): { date: string; starts: number; completions: number }[] {
    const result: { date: string; starts: number; completions: number }[] = [];
    
    // Create a map of dates
    const dateMap = new Map<string, { starts: number; completions: number }>();
    
    // Initialize with all dates in range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { starts: 0, completions: 0 });
    }
    
    // Count responses by day
    for (const response of responses) {
      const dateStr = response.completedAt.toISOString().split('T')[0];
      
      if (dateMap.has(dateStr)) {
        const current = dateMap.get(dateStr)!;
        dateMap.set(dateStr, {
          starts: current.starts + 1,
          completions: current.completions + 1
        });
      }
    }
    
    // Convert map to array
    for (const [date, counts] of dateMap.entries()) {
      result.push({
        date,
        starts: counts.starts,
        completions: counts.completions
      });
    }
    
    // Sort by date
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Group all responses by day
   */
  private groupAllResponsesByDay(responses: FlowResponse[], days: number): { date: string; responses: number }[] {
    const result: { date: string; responses: number }[] = [];
    
    // Create a map of dates
    const dateMap = new Map<string, number>();
    
    // Initialize with all dates in range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }
    
    // Count responses by day
    for (const response of responses) {
      const dateStr = response.completedAt.toISOString().split('T')[0];
      
      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, dateMap.get(dateStr)! + 1);
      }
    }
    
    // Convert map to array
    for (const [date, count] of dateMap.entries()) {
      result.push({
        date,
        responses: count
      });
    }
    
    // Sort by date
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Group responses by flow
   */
  private groupResponsesByFlow(responses: FlowResponse[]): Record<string, FlowResponse[]> {
    const result: Record<string, FlowResponse[]> = {};
    
    for (const response of responses) {
      if (!result[response.flowId]) {
        result[response.flowId] = [];
      }
      
      result[response.flowId].push(response);
    }
    
    return result;
  }
}

// Export singleton instance
export const reportingService = new ReportingService();