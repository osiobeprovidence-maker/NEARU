import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://rare-rooster-878.eu-west-1.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log('Publishing release metadata to Convex...');
  const res = await client.mutation(api.releases.publishRelease, {
    version: '1.0.0',
    buildNumber: 2,
    releaseDate: 'September 10, 2026',
    timestamp: Date.now(),
    apkStorageId: 'kg2a0yhdpykze4f2mw5ddy7yjh8e4wp0',
    apkSize: '8.7 MB',
    releaseNotes: [
      'Full-featured mobile messaging with bottom chat composer',
      'Brand-new unified Add Friends discovery hub',
      'Identity-verified community Rallies (Ask, Help, Join)',
      'Performance optimizations & background stability improvements',
    ],
    status: 'published',
    minAndroidVersion: 'Android 8.0+',
    sha256: 'c5c570d019b02f32...',
  });
  console.log('Release metadata published successfully!', res);
}

main().catch(err => {
  console.error('Failed to publish release:', err);
  process.exit(1);
});
