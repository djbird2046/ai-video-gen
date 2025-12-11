# AIVideoGen SDK

统一的 TypeScript AI 视频生成 SDK，覆盖 Veo、Sora 2、通义·即梦、可灵。提供统一的请求/响应契约、按 Provider 的适配器，支持调用级 `apiKey` 覆盖和任务轮询。

## 安装

```bash
npm install aivideogen
# or
yarn add aivideogen
```

需要 Node.js 18+（使用内置 `fetch`）。

在项目根目录创建 `.env`（已在 `.gitignore` 中忽略），填入你的凭证：

```bash
SORA2_API_KEY=sk-...
VEO_OAUTH_TOKEN=ya29....
VEO_PROJECT_ID=your-project
VEO_LOCATION=us-central1
JIMENG_API_KEY=dashscope-...
KELING_ACCESS_KEY=AKID...
KELING_SECRET_KEY=SKID...
```

## 快速开始（以 Sora 2 为例）

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
  apiKey: process.env.SORA2_API_KEY // 可在调用层覆盖
});

const final = await client.pollUntilDone(job.requestId, job.provider, {
  apiKey: process.env.SORA2_API_KEY
});
console.log(final.status, final.progress, final.videoUrl);
```

## 请求/响应契约
- 请求：`prompt`（必填）+ 可选 `provider`、`apiKey`、`model`、`durationSeconds`、`aspectRatio`、`resolution`、`seed`、`webhookUrl`、`metadata`、`negativePrompt`、`guidanceScale`、`framesPerSecond`、`user`。
- 响应：`requestId`、`provider`、`status`（`queued|processing|streaming|succeeded|failed`），可选 `progress`（0–1）、`etaSeconds`、`videoUrl`、`coverUrl`、`errorMessage`、`rawResponse`。

## Provider 说明
- `src/providers/index.ts` 中的域名/路径已按官方文档预填，需替换为你的项目 ID、Region、鉴权方式；若字段不同，可在 `ProviderSpec` 中自定义 `mapRequest`/`mapResponse`。
- 文档：
  - OpenAI Sora 2: https://platform.openai.com/docs/api-reference/videos
  - Veo on Vertex AI: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation
  - Veo via Gemini API: https://ai.google.dev/gemini-api/docs/video
  - 通义·即梦 (DashScope): https://help.aliyun.com/zh/dashscope/developer-reference/video-generation-api-details
  - 可灵 (火山引擎): https://www.volcengine.com/docs/82379/1310165
- 鉴权提示：
  - Sora 2：Bearer `SORA2_API_KEY`，域名 `api.openai.com`。
  - Veo：Google Cloud OAuth Bearer，路径包含 `projects/{project}/locations/{location}`；请求体可能需要 `instances` 包装，按需调整 `mapRequest`。
  - 即梦：DashScope Bearer Token；生成 POST `/api/v1/services/aigc/video-generation/generation`，状态 GET `/api/v1/tasks/{taskId}`。
  - 可灵：需火山引擎 AK/SK 签名（当前 `authHeader` 为占位）；域名 `open.volcengineapi.com`，Action 按文档设置。

参考 `.env.example` 配置环境变量。如 Provider 支持流式或 Webhook，请直接使用其官方方案；`pollUntilDone` 是安全的轮询兜底。
