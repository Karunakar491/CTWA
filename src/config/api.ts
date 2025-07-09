export const META_API_CONFIG = {
  BASE_URL: 'https://graph.facebook.com/v22.0',
  WABA_ID: import.meta.env.VITE_META_WABA_ID || 'demo_waba_id',
  ACCESS_TOKEN: import.meta.env.VITE_META_ACCESS_TOKEN || 'demo_access_token'
};

// Additional API endpoints for WhatsApp Flows
export const FLOWS_ENDPOINTS = {
  CREATE_FLOW: `${META_API_CONFIG.BASE_URL}/${META_API_CONFIG.WABA_ID}/flows`,
  GET_FLOWS: `${META_API_CONFIG.BASE_URL}/${META_API_CONFIG.WABA_ID}/flows`,
  UPDATE_FLOW: (flowId: string) => `${META_API_CONFIG.BASE_URL}/${flowId}`,
  DELETE_FLOW: (flowId: string) => `${META_API_CONFIG.BASE_URL}/${flowId}`,
  PUBLISH_FLOW: (flowId: string) => `${META_API_CONFIG.BASE_URL}/${flowId}/publish`,
  DEPRECATE_FLOW: (flowId: string) => `${META_API_CONFIG.BASE_URL}/${flowId}/deprecate`
};