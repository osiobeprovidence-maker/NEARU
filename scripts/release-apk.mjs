#!/usr/bin/env node

/**
 * Automated Lalao Android APK Release Pipeline
 * 
 * Workflow:
 * 1. Reads/bumps version from android/app/build.gradle & package.json
 * 2. Compiles web bundle (npm run build) & syncs Capacitor (npx cap sync android)
 * 3. Builds Android APK via Gradle (gradlew.bat assembleDebug)
 * 4. Generates SHA256 checksum, calculates file size, copies versioned artifact
 * 5. Requests signed upload URL from Convex storage using resilient HTTPS client
 * 6. Uploads APK artifact directly to Convex CDN storage with retries
 * 7. Calls api.releases.publishRelease to register and activate release metadata
 * 8. Lalao landing page immediately reflects the new release!
 *
 * Usage:
 *   node scripts/release-apk.mjs
 *   node scripts/release-apk.mjs --version 1.0.0 --notes "New messaging, Add Friends update"
 *   node scripts/release-apk.mjs --skip-build
 *   node scripts/release-apk.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT_DIR, 'android');
const BUILD_GRADLE_PATH = path.join(ANDROID_DIR, 'app', 'build.gradle');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const RELEASES_DIR = path.join(ROOT_DIR, 'dist-releases');

// Resilient HTTPS fetch wrapper to avoid Node 24 default 10s undici timeout
function resilientFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 90000, // 90 second timeout for large file upload
    };

    const req = https.request(parsedUrl, reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: async () => buffer.toString('utf8'),
          json: async () => JSON.parse(buffer.toString('utf8')),
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Connection timed out after 90s to ${parsedUrl.hostname}`));
    });

    req.on('error', (err) => reject(err));

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Retry wrapper with exponential backoff
async function retryWithBackoff(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`   ⚠️ Attempt ${i + 1} failed (${err.message}). Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 1.5;
    }
  }
}

// 1. Load environment variables
const envLocalPath = path.join(ROOT_DIR, '.env.local');
const envProdPath = path.join(ROOT_DIR, '.env.production');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envProdPath)) {
  dotenv.config({ path: envProdPath, override: false });
}

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://rare-rooster-878.eu-west-1.convex.cloud';

// 2. Parse command-line flags
const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}
const isDryRun = args.includes('--dry-run');
const skipBuild = args.includes('--skip-build');
const specifiedVersion = getArg('--version');
const specifiedNotes = getArg('--notes');

console.log('='.repeat(60));
console.log('🚀 LALAO ANDROID APK AUTOMATED RELEASE PIPELINE');
console.log('='.repeat(60));
console.log(`Convex Target: ${CONVEX_URL}`);
if (isDryRun) console.log('MODE: DRY RUN (Build only, no upload/publish)');
if (skipBuild) console.log('MODE: SKIP BUILD (Using existing APK artifact)');

// 3. Inspect current version in build.gradle
const gradleContent = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');
const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
const versionNameMatch = gradleContent.match(/versionName\s+["']([^"']+)["']/);

let currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 1;
let currentVersionName = versionNameMatch ? versionNameMatch[1] : '1.0.0';

let nextVersion = specifiedVersion || currentVersionName;
let nextVersionCode = specifiedVersion && specifiedVersion !== currentVersionName 
  ? currentVersionCode + 1 
  : currentVersionCode;

// If the version was explicitly changed, update gradle & package.json
if (nextVersion !== currentVersionName || nextVersionCode !== currentVersionCode) {
  console.log(`Updating version: ${currentVersionName} (code ${currentVersionCode}) -> ${nextVersion} (code ${nextVersionCode})`);
  
  let updatedGradle = gradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${nextVersionCode}`
  ).replace(
    /versionName\s+["'][^"']+["']/,
    `versionName "${nextVersion}"`
  );
  fs.writeFileSync(BUILD_GRADLE_PATH, updatedGradle, 'utf8');

  // Update package.json
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  pkg.version = nextVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
} else {
  console.log(`Current Version: ${nextVersion} (code ${nextVersionCode})`);
}

// 4. Build Vite web bundle & sync Capacitor (unless skipBuild is set)
if (!skipBuild) {
  console.log('\n📦 Step 1/4: Compiling web assets & syncing Android...');
  try {
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    execSync('npx cap sync android', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Failed to compile web bundle / sync Capacitor:', err.message);
    process.exit(1);
  }

  // 5. Build Android APK using Gradle
  console.log('\n🔨 Step 2/4: Building Android APK via Gradle...');
  const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
  try {
    execSync(`${gradlewCmd} assembleDebug`, { cwd: ANDROID_DIR, stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Gradle APK build failed:', err.message);
    process.exit(1);
  }
} else {
  console.log('\n⏩ Steps 1 & 2 skipped (--skip-build). Verifying existing APK artifact...');
}

// 6. Locate APK artifact
const apkPath = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (!fs.existsSync(apkPath)) {
  console.error(`❌ APK artifact not found at expected path: ${apkPath}`);
  process.exit(1);
}

const stats = fs.statSync(apkPath);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(1) + ' MB';
const apkBuffer = fs.readFileSync(apkPath);

// Calculate SHA-256 checksum
const sha256 = crypto.createHash('sha256').update(apkBuffer).digest('hex');

// Archive local copy with versioned name
if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR, { recursive: true });
}
const versionedApkName = `lalao-v${nextVersion}.apk`;
const archivedApkPath = path.join(RELEASES_DIR, versionedApkName);
fs.copyFileSync(apkPath, archivedApkPath);

console.log(`\n✅ APK Ready:`);
console.log(`   Source:   ${apkPath}`);
console.log(`   Archived: ${archivedApkPath}`);
console.log(`   Size:     ${sizeMb}`);
console.log(`   SHA-256:  ${sha256.substring(0, 16)}...`);

if (isDryRun) {
  console.log('\n[Dry Run] Skipping upload to Convex and metadata publishing.');
  process.exit(0);
}

// 7. Upload APK to Convex Storage
console.log('\n☁️  Step 3/4: Uploading APK release artifact to Convex Storage...');
const client = new ConvexHttpClient(CONVEX_URL, { fetch: resilientFetch });

async function releasePipeline() {
  try {
    // A. Request signed upload URL
    const uploadUrl = await retryWithBackoff(async () => {
      return await client.mutation(api.releases.generateApkUploadUrl, {});
    });

    if (!uploadUrl) {
      throw new Error('Failed to generate Convex upload URL');
    }
    console.log(`   Signed upload URL acquired from Convex.`);

    // B. Stream file via HTTP POST with customFetch
    console.log(`   Streaming ${sizeMb} to Convex CDN...`);
    const uploadResponse = await retryWithBackoff(async () => {
      const resp = await resilientFetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Length': stats.size.toString(),
        },
        body: apkBuffer,
      });
      if (!resp.ok) {
        throw new Error(`Upload failed with status ${resp.status} ${resp.statusText}`);
      }
      return resp;
    });

    const { storageId } = await uploadResponse.json();
    console.log(`   Upload successful! Storage ID: ${storageId}`);

    // 8. Publish release metadata in Convex
    console.log('\n📝 Step 4/4: Registering release metadata in database...');
    
    // Format friendly release date, e.g. "September 7, 2026"
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Default or parsed release notes
    let releaseNotes = [
      'Full-featured mobile messaging with bottom chat composer',
      'Brand-new unified Add Friends discovery hub',
      'Identity-verified community Rallies (Ask, Help, Join)',
      'Performance optimizations & background stability improvements',
    ];

    if (specifiedNotes) {
      releaseNotes = specifiedNotes.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const publishResult = await retryWithBackoff(async () => {
      return await client.mutation(api.releases.publishRelease, {
        version: nextVersion,
        buildNumber: nextVersionCode,
        releaseDate: formattedDate,
        timestamp: Date.now(),
        apkStorageId: storageId,
        apkSize: sizeMb,
        releaseNotes,
        status: 'published',
        minAndroidVersion: 'Android 8.0+',
        sha256,
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 LALAO RELEASE v${nextVersion} PUBLISHED SUCCESSFULLY!`);
    console.log('='.repeat(60));
    console.log(`Version:       v${nextVersion} (Build ${nextVersionCode})`);
    console.log(`Date:          ${formattedDate}`);
    console.log(`Size:          ${sizeMb}`);
    console.log(`Storage ID:    ${storageId}`);
    console.log(`Status:        Published (isLatest: true)`);
    console.log(`Convex Action: ${publishResult.action} (ID: ${publishResult.releaseId})`);
    console.log('\nThe Lalao website landing page is now automatically serving this APK as the latest download!');
  } catch (err) {
    console.error('❌ Release pipeline failed:', err);
    process.exit(1);
  }
}

releasePipeline();
