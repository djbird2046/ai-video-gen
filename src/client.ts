import { createProvider, type ProviderAdapter } from './providers';
import type {
  ClientOptions,
  GenerationResult,
  PollOptions,
  Provider,
  UnifiedVideoRequest
} from './types';

export class VideoGenerationClient {
  private readonly providerCache = new Map<Provider, ProviderAdapter>();
  private readonly pollIntervalMs: number;
  private readonly maxPollTimeMs?: number;

  constructor(private readonly options: ClientOptions = {}) {
    this.pollIntervalMs = options.pollIntervalMs ?? 4000;
    this.maxPollTimeMs = options.maxPollTimeMs ?? 5 * 60 * 1000;
  }

  async generate(request: UnifiedVideoRequest): Promise<GenerationResult> {
    const provider = this.resolveProvider(request.provider);
    const adapter = this.getProvider(provider);
    return adapter.startGeneration({ ...request, provider }, request.apiKey);
  }

  async pollUntilDone(
    requestId: string,
    provider?: Provider,
    opts?: PollOptions
  ): Promise<GenerationResult> {
    const resolvedProvider = this.resolveProvider(provider);
    const adapter = this.getProvider(resolvedProvider);
    const interval = opts?.pollIntervalMs ?? this.pollIntervalMs;
    const maxTime = opts?.maxPollTimeMs ?? this.maxPollTimeMs;
    const apiKeyOverride = opts?.apiKey;
    const startedAt = Date.now();

    let last: GenerationResult | undefined;
    // Basic polling loop for non-streaming providers
    // If a provider supports webhooks/streaming, prefer that path upstream.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      last = await adapter.getStatus(requestId, apiKeyOverride);
      if (last.status === 'succeeded' || last.status === 'failed') {
        return last;
      }

      if (maxTime && Date.now() - startedAt > maxTime) {
        throw new Error(
          `Polling timed out after ${maxTime}ms for ${resolvedProvider} (${requestId})`
        );
      }

      await sleep(interval);
    }
  }

  private getProvider(provider: Provider): ProviderAdapter {
    const cached = this.providerCache.get(provider);
    if (cached) return cached;

    const config = this.options.providerConfigs?.[provider] ?? {};
    const adapter = createProvider(provider, config);
    this.providerCache.set(provider, adapter);
    return adapter;
  }

  private resolveProvider(provider?: Provider): Provider {
    if (provider) return provider;
    if (this.options.defaultProvider) return this.options.defaultProvider;
    throw new Error('Provider is required. Pass request.provider or configure defaultProvider.');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
