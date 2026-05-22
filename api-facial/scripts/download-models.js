#!/usr/bin/env node
// Downloads face-api.js model weights from the official GitHub repo
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const OUT  = path.join(__dirname, '..', 'public', 'models');

const FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of FILES) {
    const dest = path.join(OUT, f);
    if (fs.existsSync(dest)) {
      console.log(`skip  ${f}`);
      continue;
    }
    process.stdout.write(`dl    ${f} ... `);
    await download(`${BASE}/${f}`, dest);
    console.log('ok');
  }
  console.log('\nAll models in public/models/ — commit them for Vercel deployment.');
})().catch(e => { console.error(e); process.exit(1); });
