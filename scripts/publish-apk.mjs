/**
 * publish-apk.mjs
 * Uploads dist-releases/lalao-v1.0.0.apk to Convex Storage and publishes
 * it as the latest app release so the landing page reflects it immediately.
 *
 * Usage: node scripts/publish-apk.mjs
 */

import { createReadStream, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONVEX_URL = 'https://wary-goshawk-890.eu-west-1.convex.cloud';
const APK_PATH   = resolve(__dirname, '../dist-releases/lalao-v1.0.0.apk');

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  // ── 1. Get a signed upload URL ───────────────────────────────────────────
  console.log('⬆  Requesting Convex upload URL…');
  const uploadUrl = await client.mutation(api.releases.generateApkUploadUrl);
  console.log('   Upload URL:', uploadUrl);

  // ── 2. Upload the APK binary ─────────────────────────────────────────────
  const apkStat   = statSync(APK_PATH);
  const apkSizeMB = (apkStat.size / (1024 * 1024)).toFixed(1) + ' MB';
  console.log(`⬆  Uploading ${APK_PATH} (${apkSizeMB})…`);

  const apkBuffer = await import('fs').then(fs =>
    new Promise((res, rej) => {
      const chunks = [];
      const stream = fs.createReadStream(APK_PATH);
      stream.on('data', c => chunks.push(c));
      stream.on('end', () => res(Buffer.concat(chunks)));
      stream.on('error', rej);
    })
  );

  const uploadResp = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: apkBuffer,
  });

  if (!uploadResp.ok) {
    throw new Error(`Upload failed: ${uploadResp.status} ${await uploadResp.text()}`);
  }

  const { storageId } = await uploadResp.json();
  console.log('   Storage ID:', storageId);

  // ── 3. Publish the release record ────────────────────────────────────────
  console.log('📦 Publishing release to Convex appReleases…');
  const result = await client.mutation(api.releases.publishRelease, {
    version:          '1.0.0',
    buildNumber:      100,
    releaseDate:      'September 12, 2026',
    apkStorageId:     storageId,
    apkSize:          apkSizeMB,
    status:           'published',
    minAndroidVersion:'Android 8.0+',
    releaseNotes: [
      'Nearby Rallies feed — discover & join local activities in real time',
      'Direct messaging with voice notes and instant media attachments',
      'Identity & Blue Check verification system',
      'Push notifications for Rally matches and chat messages',
      'Convex Cloud live backend integration',
    ],
  });

  console.log(`\n✅ Done! Release ${result.action}: ${result.releaseId}`);
  console.log('   The landing page will now serve the new APK via Convex CDN.');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
