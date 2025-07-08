// src/config/api.ts

export const META_API_CONFIG = {
  BASE_URL: 'https://graph.facebook.com/v22.0',
  WABA_ID: '314510838411963',
  ACCESS_TOKEN: 'EAAMFCYvYZBekBO4zSWfzfGig3Fr6PBGjXuZBrMmFePfHDgtBs2xXEFtwnqhDbQAPlTRFJ0BpLd1svF0a24DdmXKE3imgYkmRqP1bdim1GM5gXD0xGsKMYBaNvwZAZBXSi29l6j02bMX43cn6baPNNrLZAaqE6xyGfhDh2ZAveoEQLuhKpjpdP4aFdmse7otCSbYAZDZD'
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