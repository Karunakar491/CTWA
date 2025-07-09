export interface ApiLogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method?: string;
  endpoint?: string;
  status?: number;
  statusText?: string;
  data: any;
  duration?: number;
}