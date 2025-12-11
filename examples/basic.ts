import process from 'node:process';

import { VideoGenerationClient } from '../src';

async function main() {
  const veoLocation = process.env.VEO_LOCATION ?? 'us-central1';
  const client = new VideoGenerationClient({
    defaultProvider: 'sora2',
    providerConfigs: {
      // OpenAI Sora 2 video
      sora2: {
        apiKey: process.env.SORA2_API_KEY,
        baseUrl: 'https://api.openai.com'
      },
      // Google Veo (Vertex AI) — replace PROJECT_ID/LOCATION in src/providers/index.ts with real values
      veo: {
        apiKey: process.env.VEO_OAUTH_TOKEN,
        baseUrl: `https://${veoLocation}-aiplatform.googleapis.com`
      },
      // Alibaba Qwen Jimeng (DashScope)
      jimeng: {
        apiKey: process.env.JIMENG_API_KEY,
        baseUrl: 'https://dashscope.aliyuncs.com'
      },
      // Volcano Engine Keling — implement AK/SK signing; domain here is illustrative
      keling: {
        apiKey: process.env.KELING_ACCESS_KEY,
        baseUrl: 'https://open.volcengineapi.com'
      }
    },
    pollIntervalMs: 5000
  });

  const start = await client.generate({
    prompt: 'A cinematic drone shot of a neon-lit city in the rain',
    aspectRatio: '16:9',
    durationSeconds: 8,
    resolution: '1080p',
    apiKey: process.env.SORA2_API_KEY
  });

  const final = await client.pollUntilDone(start.requestId, start.provider, {
    maxPollTimeMs: 3 * 60 * 1000,
    apiKey: process.env.SORA2_API_KEY
  });

  console.log('Status:', final.status);
  console.log('Video URL:', final.videoUrl);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
