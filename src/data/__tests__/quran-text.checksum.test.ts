/**
 * QMT-23 guard: the bundled Quran text must stay byte-identical to the official Tanzil file.
 * Fails if assets/data/tanzil/quran-uthmani.xml or src/data/generated/quran-text.json drifts.
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

import { getQuranRepository } from '@/data';

const ROOT = path.resolve(__dirname, '../../..');
const TANZIL_SHA256 = '203f0f1bf3158b1e5be4ab9f8f6870e570aab6d9a626fe6192a70b75d4afe0fd';

const xmlBuf = readFileSync(path.join(ROOT, 'assets/data/tanzil/quran-uthmani.xml'));
const bundled = JSON.parse(
  readFileSync(path.join(ROOT, 'src/data/generated/quran-text.json'), 'utf8'),
) as { sourceSha256: string; surahs: string[][]; notice: string };

/** Independent line-based parse of the source XML (not the build script's regex). */
function parseSource(): string[][] {
  const out: string[][] = [];
  for (const line of xmlBuf.toString('utf8').split('\n')) {
    const t = line.trim();
    if (t.startsWith('<sura ')) out.push([]);
    else if (t.startsWith('<aya ')) {
      const start = t.indexOf('text="') + 'text="'.length;
      out[out.length - 1].push(t.slice(start, t.indexOf('"', start)));
    }
  }
  return out;
}

describe('Tanzil text checksum (QMT-23)', () => {
  it('source XML matches the official Tanzil Uthmani 1.1 SHA-256', () => {
    expect(createHash('sha256').update(xmlBuf).digest('hex')).toBe(TANZIL_SHA256);
    expect(bundled.sourceSha256).toBe(TANZIL_SHA256);
  });

  it('bundled JSON contains every ayah byte-for-byte as in the source XML', () => {
    const source = parseSource();
    expect(source).toHaveLength(114);
    expect(source.flat()).toHaveLength(6236);
    // Hash comparison of the concatenated UTF-8 bytes (fails on any single-byte drift)...
    const digest = (s: string[][]) =>
      createHash('sha256').update(Buffer.from(s.map((x) => x.join('\n')).join('\n\n'), 'utf8')).digest('hex');
    expect(digest(bundled.surahs)).toBe(digest(source));
    // ...and an exact per-ayah comparison so failures point at the ayah.
    bundled.surahs.forEach((ayahs, si) =>
      ayahs.forEach((text, ai) => {
        if (text !== source[si][ai]) throw new Error(`Drift at ${si + 1}:${ai + 1}`);
      }),
    );
  });

  it('the repository serves the exact source string and words re-join to it', () => {
    const repo = getQuranRepository();
    const source = parseSource();
    for (const [s, a] of [
      [1, 1],
      [2, 255],
      [9, 1],
      [114, 6],
    ]) {
      const ayah = repo.getAyah(`${s}:${a}`)!;
      expect(ayah.text).toBe(source[s - 1][a - 1]);
      expect(ayah.words.join(' ')).toBe(ayah.text);
    }
  });

  it('keeps the Tanzil copyright notice with the derived file', () => {
    expect(bundled.notice).toContain('Tanzil Quran Text (Uthmani, Version 1.1)');
    expect(bundled.notice).toContain('PLEASE DO NOT REMOVE OR CHANGE THIS COPYRIGHT BLOCK');
  });
});
