#!/usr/bin/env node
/**
 * QMT-48 safety check: export web bundles per flavor and verify that candidate (review) mutashabihat
 * data is present ONLY in the review bundle. Usage: npm run check:production-bundle
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MARKERS = [/CANDIDATE review sample/, /hifzlink:\d+:\d+~/, /waqar144:\d+:\d+/, /quranpedia:\d+:\d+#/];
const out = mkdtempSync(path.join(os.tmpdir(), 'mutshabhat-bundles-'));

function exportAndScan(flavor) {
  const dir = path.join(out, flavor);
  execSync(`npx expo export --platform web --output-dir ${dir}`, {
    stdio: 'ignore',
    env: { ...process.env, EXPO_PUBLIC_APP_FLAVOR: flavor, NODE_ENV: 'production' },
  });
  const hits = [];
  const walk = (d) =>
    readdirSync(d).forEach((f) => {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) return walk(p);
      if (!p.endsWith('.js')) return;
      const js = readFileSync(p, 'utf8');
      for (const m of MARKERS) if (m.test(js)) hits.push(`${path.basename(p)} ~ ${m}`);
    });
  walk(dir);
  return hits;
}

// Positive control: the review bundle must contain the candidate data, otherwise the scan proves nothing.
if (exportAndScan('review').length === 0) {
  console.error('✖ review bundle does not contain the candidate dataset; markers are stale.');
  process.exit(1);
}
console.log('✔ review web bundle contains the candidate dataset (positive control).');

for (const flavor of ['beta', 'production']) {
  const hits = exportAndScan(flavor);
  if (hits.length) {
    console.error(`✖ ${flavor} bundle contains candidate data:\n  ${hits.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`✔ ${flavor} web bundle contains no candidate data.`);
}
