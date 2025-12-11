import { GenerationResult, GenerationStatus, Provider, ProviderConfig, UnifiedVideoRequest } from '../types';

export interface ProviderAdapter {
  startGeneration(request: UnifiedVideoRequest, apiKeyOverride?: string): Promise<GenerationResult>;
  getStatus(requestId: string, apiKeyOverride?: string): Promise<GenerationResult>;
}

export interface ProviderSpec {
  name: Provider;
  baseUrl: string;
  startPath: string;
  statusPath: (requestId: string) => string;
  authHeader: (apiKey: string) => string;
  mapRequest?: (request: UnifiedVideoRequest) => unknown;
  mapResponse?: (payload: unknown) => Partial<GenerationResult>;
}

type HttpMethod = 'GET' | 'POST';

export class HttpProviderAdapter implements ProviderAdapter {
  constructor(
    private readonly spec: ProviderSpec,
    private readonly config: ProviderConfig = {}
  ) {}

  async startGeneration(
    request: UnifiedVideoRequest,
    apiKeyOverride?: string
  ): Promise<GenerationResult> {
    const payload =
      this.spec.mapRequest?.(request) ?? defaultMapRequest(request, this.config.model);
    const raw = await this.sendJson(this.spec.startPath, payload, 'POST', apiKeyOverride ?? request.apiKey);
    return this.toResult(raw);
  }

  async getStatus(requestId: string, apiKeyOverride?: string): Promise<GenerationResult> {
    const raw = await this.sendJson(
      this.spec.statusPath(requestId),
      undefined,
      'GET',
      apiKeyOverride
    );
    return this.toResult(raw);
  }

  private async sendJson(
    path: string,
    body?: unknown,
    method: HttpMethod = 'POST',
    apiKeyOverride?: string
  ): Promise<unknown> {
    const baseUrl = this.config.baseUrl ?? this.spec.baseUrl;
    const apiKey = apiKeyOverride ?? this.config.apiKey;
    if (!apiKey) {
      throw new Error(`Missing apiKey for provider ${this.spec.name}`);
    }

    const url = new URL(path, baseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.extraHeaders ?? {})
    };
    headers.Authorization = this.spec.authHeader(apiKey);

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Provider ${this.spec.name} ${method} ${url.pathname} failed: ${response.status} ${text}`
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  private toResult(rawPayload: unknown): GenerationResult {
    const partial = this.spec.mapResponse?.(rawPayload) ?? normalizeResponse(rawPayload);
    const requestId = partial.requestId ?? createFallbackRequestId();
    const status = partial.status ?? 'processing';

    return {
      provider: this.spec.name,
      status,
      requestId,
      progress: partial.progress,
      etaSeconds: partial.etaSeconds,
      videoUrl: partial.videoUrl,
      coverUrl: partial.coverUrl,
      errorMessage: partial.errorMessage,
      rawResponse: rawPayload
    };
  }
}

export function defaultMapRequest(request: UnifiedVideoRequest, defaultModel?: string) {
  return {
    prompt: request.prompt,
    model: request.model ?? defaultModel,
    aspect_ratio: request.aspectRatio,
    resolution: request.resolution,
    duration_seconds: request.durationSeconds,
    seed: request.seed,
    webhook_url: request.webhookUrl,
    metadata: request.metadata,
    negative_prompt: request.negativePrompt,
    guidance_scale: request.guidanceScale,
    fps: request.framesPerSecond,
    user: request.user
  };
}

export function normalizeResponse(rawPayload: unknown): Partial<GenerationResult> {
  if (rawPayload === null || rawPayload === undefined) {
    return {};
  }

  const payload = rawPayload as Record<string, unknown>;
  const statusText = (payload.status ?? payload.state ?? payload.phase) as string | undefined;
  const progress =
    (payload.progress as number | undefined) ??
    (payload.percent as number | undefined) ??
    (payload.percentage as number | undefined);

  return {
    requestId:
      (payload.id as string | undefined) ??
      (payload.request_id as string | undefined) ??
      (payload.task_id as string | undefined),
    status: normalizeStatus(statusText),
    progress: progress !== undefined ? progress / (progress > 1 ? 100 : 1) : undefined,
    etaSeconds: payload.eta_seconds as number | undefined,
    videoUrl:
      (payload.video_url as string | undefined) ??
      (payload.output as Record<string, unknown> | undefined)?.video_url,
    coverUrl:
      (payload.cover_url as string | undefined) ??
      (payload.thumbnail as string | undefined) ??
      (payload.preview as string | undefined),
    errorMessage: payload.error as string | undefined
  };
}

export function normalizeStatus(status?: string): GenerationStatus {
  if (!status) {
    return 'processing';
  }

  const normalized = status.toLowerCase();
  if (['queued', 'pending', 'waiting'].includes(normalized)) return 'queued';
  if (['processing', 'running', 'working'].includes(normalized)) return 'processing';
  if (['streaming', 'generating'].includes(normalized)) return 'streaming';
  if (['succeeded', 'success', 'completed', 'done'].includes(normalized)) return 'succeeded';
  if (['failed', 'error', 'canceled', 'cancelled'].includes(normalized)) return 'failed';
  return 'processing';
}

function createFallbackRequestId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return random;
}
