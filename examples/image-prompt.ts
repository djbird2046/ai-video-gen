import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { VideoGenerationClient } from '../src';

const imagesDir = fileURLToPath(new URL('./images/', import.meta.url));

async function loadImageAsDataUrl(name: string, mime: string): Promise<string> {
  const buffer = await readFile(join(imagesDir, name));
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function main() {
  const veoLocation = process.env.VEO_LOCATION ?? 'us-central1';
  const client = new VideoGenerationClient({
    defaultProvider: 'sora2',
    providerConfigs: {
      sora2: {
        apiKey: process.env.SORA2_API_KEY,
        baseUrl: 'https://api.openai.com'
      },
      veo: {
        apiKey: process.env.VEO_OAUTH_TOKEN,
        baseUrl: `https://${veoLocation}-aiplatform.googleapis.com`
      },
      jimeng: {
        apiKey: process.env.JIMENG_API_KEY,
        baseUrl: 'https://dashscope.aliyuncs.com'
      },
      keling: {
        apiKey: process.env.KELING_ACCESS_KEY,
        baseUrl: 'https://open.volcengineapi.com'
      }
    },
    pollIntervalMs: 5000
  });

  const referenceImages = await Promise.all([
    loadImageAsDataUrl('image1.png', 'image/png'),
    loadImageAsDataUrl('image2.jpeg', 'image/jpeg')
  ]);

  const start = await client.generate({
    prompt: 'Use the provided reference images plus text instructions to craft a short video.',
    // Some providers expect image prompts under specific fields; wire up mapRequest as needed.
    metadata: {
      referenceImages
    },
    aspectRatio: '16:9',
    durationSeconds: 6,
    resolution: '720p',
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
