import { Provider, ProviderConfig } from '../types';

import { HttpProviderAdapter, ProviderSpec } from './httpProvider';

const providerSpecs: Record<Provider, ProviderSpec> = {
  veo: {
    name: 'veo',
    baseUrl: 'https://REGION-aiplatform.googleapis.com', // e.g. us-central1-aiplatform.googleapis.com
    startPath: '/v1/projects/PROJECT_ID/locations/LOCATION/publishers/google/models/veo-001:predict',
    statusPath: (requestId: string) =>
      `/v1/projects/PROJECT_ID/locations/LOCATION/operations/${requestId}`,
    authHeader: (apiKey: string) => `Bearer ${apiKey}`
  },
  sora2: {
    name: 'sora2',
    baseUrl: 'https://api.openai.com',
    startPath: '/v1/videos',
    statusPath: (requestId: string) => `/v1/videos/${requestId}`,
    authHeader: (apiKey: string) => `Bearer ${apiKey}`
  },
  jimeng: {
    name: 'jimeng',
    baseUrl: 'https://dashscope.aliyuncs.com',
    startPath: '/api/v1/services/aigc/video-generation/generation',
    statusPath: (requestId: string) => `/api/v1/tasks/${requestId}`,
    authHeader: (apiKey: string) => `Bearer ${apiKey}`
  },
  keling: {
    name: 'keling',
    baseUrl: 'https://open.volcengineapi.com',
    startPath: '/',
    statusPath: (requestId: string) => `/?Action=GetVideoTaskInfo&TaskId=${requestId}`,
    authHeader: (apiKey: string) => `Bearer ${apiKey}` // Replace with Volcano Engine AK/SK signing
  }
};

export function createProvider(provider: Provider, config: ProviderConfig = {}) {
  const spec = providerSpecs[provider];
  if (!spec) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return new HttpProviderAdapter(spec, config);
}

export { providerSpecs };
export type { ProviderAdapter } from './httpProvider';
