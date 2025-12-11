export type Provider = 'veo' | 'sora2' | 'jimeng' | 'keling';

export type GenerationStatus = 'queued' | 'processing' | 'streaming' | 'succeeded' | 'failed';

export interface UnifiedVideoRequest {
  provider?: Provider;
  apiKey?: string;
  prompt: string;
  model?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  resolution?: '720p' | '1080p' | '4k';
  seed?: number;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  negativePrompt?: string;
  guidanceScale?: number;
  framesPerSecond?: number;
  user?: string;
}

export interface GenerationResult {
  requestId: string;
  provider: Provider;
  status: GenerationStatus;
  progress?: number;
  etaSeconds?: number;
  videoUrl?: string;
  coverUrl?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  extraHeaders?: Record<string, string>;
  model?: string;
}

export interface ClientOptions {
  defaultProvider?: Provider;
  providerConfigs?: Partial<Record<Provider, ProviderConfig>>;
  pollIntervalMs?: number;
  maxPollTimeMs?: number;
}

export interface PollOptions {
  pollIntervalMs?: number;
  maxPollTimeMs?: number;
  apiKey?: string;
}
