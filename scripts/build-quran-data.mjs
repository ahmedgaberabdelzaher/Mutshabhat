#!/usr/bin/env node
/**
 * Build-time converter: Tanzil XML -> app-friendly JSON.
 *
 * Input (unmodified official Tanzil downloads, see DATA_SOURCES.md):
 *   assets/data/tanzil/quran-uthmani.xml  (Tanzil Quran Text, Uthmani 1.1, CC BY 3.0)
 *   assets/data/tanzil/quran-data.xml     (Tanzil metadata: surahs, juz, Madani pages)
 *
 * Output:
 *   src/data/generated/quran-text.json   ayah texts copied verbatim (no normalisation)
 *   src/data/generated/quran-meta.json   surah / juz / page tables
 *
 * The ayah strings are copied byte-for-byte from the XML `text` attributes.
 * The Tanzil XML contains no XML entities, so no decoding is needed; the
 * script fails loudly if that ever changes instead of silently altering text.
 * `src/data/__tests__/quran-text.checksum.test.ts` re-verifies this.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tanzilDir = path.join(root, 'assets/data/tanzil');
const outDir = path.join(root, 'src/data/generated');

export const TANZIL_TEXT_SHA256 =
  '203f0f1bf3158b1e5be4ab9f8f6870e570aab6d9a626fe6192a70b75d4afe0fd';

const xmlBuf = readFileSync(path.join(tanzilDir, 'quran-uthmani.xml'));
const sha = createHash('sha256').update(xmlBuf).digest('hex');
if (sha !== TANZIL_TEXT_SHA256) {
  throw new Error(`quran-uthmani.xml checksum mismatch: ${sha}`);
}
const xml = xmlBuf.toString('utf8');
if (xml.includes('&')) {
  throw new Error('Unexpected XML entity in Tanzil text; refusing to decode/alter text.');
}

const notice = readFileSync(path.join(tanzilDir, 'COPYRIGHT.txt'), 'utf8');

/** @type {{index:number,name:string,ayahs:string[]}[]} */
const surahs = [];
const tagRe = /<sura index="(\d+)" name="([^"]*)">|<aya index="(\d+)" text="([^"]*)"/g;
let m;
while ((m = tagRe.exec(xml))) {
  if (m[1]) {
    surahs.push({ index: Number(m[1]), name: m[2], ayahs: [] });
  } else {
    const s = surahs[surahs.length - 1];
    if (Number(m[3]) !== s.ayahs.length + 1) throw new Error(`Out-of-order ayah ${s.index}:${m[3]}`);
    s.ayahs.push(m[4]);
  }
}
const total = surahs.reduce((n, s) => n + s.ayahs.length, 0);
if (surahs.length !== 114 || total !== 6236) throw new Error(`Unexpected counts ${surahs.length}/${total}`);

const metaXml = readFileSync(path.join(tanzilDir, 'quran-data.xml'), 'utf8');
const attrs = (tag) =>
  [...metaXml.matchAll(new RegExp(`<${tag} ([^>]*?)/>`, 'g'))].map((x) =>
    Object.fromEntries([...x[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
  );

const metaSurahs = attrs('sura').map((a) => ({
  index: Number(a.index),
  ayahCount: Number(a.ayas),
  start: Number(a.start),
  name: a.name,
  tname: a.tname,
  type: a.type,
}));
const juz = attrs('juz').map((a) => ({ index: Number(a.index), surah: Number(a.sura), ayah: Number(a.aya) }));
const pages = attrs('page').map((a) => ({ index: Number(a.index), surah: Number(a.sura), ayah: Number(a.aya) }));
if (metaSurahs.length !== 114 || juz.length !== 30 || pages.length !== 604) {
  throw new Error(`Unexpected metadata counts ${metaSurahs.length}/${juz.length}/${pages.length}`);
}
metaSurahs.forEach((s, i) => {
  if (s.name !== surahs[i].name || s.ayahCount !== surahs[i].ayahs.length) {
    throw new Error(`Metadata mismatch for surah ${s.index}`);
  }
});

mkdirSync(outDir, { recursive: true });
writeFileSync(
  path.join(outDir, 'quran-text.json'),
  JSON.stringify({
    source: 'Tanzil Quran Text (Uthmani, Version 1.1) - https://tanzil.net/',
    license: 'Creative Commons Attribution 3.0 - text used unmodified',
    sourceFile: 'assets/data/tanzil/quran-uthmani.xml',
    sourceSha256: sha,
    notice,
    surahs: surahs.map((s) => s.ayahs),
  }) + '\n',
);
writeFileSync(
  path.join(outDir, 'quran-meta.json'),
  JSON.stringify(
    {
      source: 'Tanzil Quran metadata 1.0 (quran-data.xml) - https://tanzil.net/ - CC BY',
      surahs: metaSurahs,
      juz,
      pages,
    },
    null,
    0,
  ) + '\n',
);
console.log(`Wrote ${total} ayahs, ${metaSurahs.length} surahs, ${juz.length} juz, ${pages.length} pages.`);
