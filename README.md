# AIVideoGen SDK

Unified TypeScript SDK for AI video generation across Veo, Sora 2, Tongyi JiMENG, and Keling. Ships a shared request/response contract, per-provider adapters, call-time `apiKey` overrides, and polling for task status.

## Installation

```bash
npm install aivideogen
# or
yarn add aivideogen
```

Requires Node.js 18+ (built-in `fetch`).

Create a `.env` (already gitignored) with your credentials:

```bash
SORA2_API_KEY=sk-...
VEO_OAUTH_TOKEN=ya29....
VEO_PROJECT_ID=your-project
VEO_LOCATION=us-central1
JIMENG_API_KEY=dashscope-...
KELING_ACCESS_KEY=AKID...
KELING_SECRET_KEY=SKID...
```

## Quickstart (Sora 2)

```ts
import { VideoGenerationClient } from 'aivideogen';

const client = new VideoGenerationClient({
  defaultProvider: 'sora2',
  providerConfigs: {
    sora2: { apiKey: process.env.SORA2_API_KEY, baseUrl: 'https://api.openai.com' }
  },
  pollIntervalMs: 5000
});

const job = await client.generate({
  prompt: 'A slow drone shot over a neon city in the rain',
  durationSeconds: 8,
  resolution: '1080p',
  aspectRatio: '16:9',
  apiKey: process.env.SORA2_API_KEY // per-call override (optional)
});

const final = await client.pollUntilDone(job.requestId, job.provider, {
  apiKey: process.env.SORA2_API_KEY
});
console.log(final.status, final.progress, final.videoUrl);
```

## Contract
- Request: `prompt` (required) + optional `provider`, `apiKey`, `model`, `durationSeconds`, `aspectRatio`, `resolution`, `seed`, `webhookUrl`, `metadata`, `negativePrompt`, `guidanceScale`, `framesPerSecond`, `user`.
- Response: `requestId`, `provider`, `status` (`queued|processing|streaming|succeeded|failed`), optional `progress` (0–1), `etaSeconds`, `videoUrl`, `coverUrl`, `errorMessage`, `rawResponse`.

## Providers
- Prefilled domains/paths in `src/providers/index.ts` come from public docs—replace with your project IDs/regions and auth where needed; add custom `mapRequest`/`mapResponse` if a provider’s schema differs.
- Docs:
  - OpenAI Sora 2: https://platform.openai.com/docs/api-reference/videos
  - Veo on Vertex AI: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation
  - Veo via Gemini API: https://ai.google.dev/gemini-api/docs/video
  - Tongyi JiMENG: https://help.aliyun.com/zh/dashscope/developer-reference/video-generation-api-details
  - Keling: https://www.volcengine.com/docs/82379/1310165
- Auth hints:
  - Sora 2: Bearer `SORA2_API_KEY` to `api.openai.com/v1/videos`.
  - Veo: Google Cloud OAuth bearer; paths include `projects/{project}/locations/{location}`; request body may need `instances` wrapping—adjust `mapRequest`.
  - JiMENG: DashScope Bearer token; POST `/api/v1/services/aigc/video-generation/generation`, status GET `/api/v1/tasks/{taskId}`.
  - Keling: Volcengine AK/SK signature required (current `authHeader` is placeholder); domain `open.volcengineapi.com`, action per docs.

See `.env.example` for suggested environment variables. If a provider supports streaming or webhooks, consume those directly; `pollUntilDone` offers a safe polling fallback.

## Scripts
- `npm run build` — bundle CJS/ESM + d.ts via tsup.
- `npm test` — run Vitest unit tests.
- `npm run lint` — ESLint with TypeScript rules.
- `npm run format` — Prettier formatting.
- `npm run typecheck` — strict type checking without emit.
