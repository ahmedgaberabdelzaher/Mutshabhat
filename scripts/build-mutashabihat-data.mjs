#!/usr/bin/env node
/**
 * Build-time normaliser: candidate mutashabihat sources -> review dataset (QMT-48).
 *
 * Inputs (licensed, see DATA_SOURCES.md):
 *   assets/data/candidate/hifzlink/pairs.curated.json      CC BY 4.0  (285 curated pairs -> pilot, QMT-49)
 *   assets/data/candidate/waqar144/mutashabiha_data.json   CC0
 *   assets/data/candidate/quranpedia/similar.slim.json     Quranpedia.net Data License
 *
 * Output:
 *   assets/data/review/mutashabihat.review.json   (kind=review; statuses draft / under_review only)
 *
 * The production dataset (assets/data/production/mutashabihat.production.json) is NOT generated
 * from candidate data. Only committee-approved records may be added to it.
 *
 * Highlight rules are produced by ./lib/auto-diff.mjs when available (QMT-26); otherwise empty.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));

const meta = read('src/data/generated/quran-meta.json');
const quran = read('src/data/generated/quran-text.json');
const surahStarts = meta.surahs.map((s) => s.start);

/** Waqar144 uses absolute 0-based ayah numbers (0 = 1:1, 7 = 2:1). */
function absToId(abs) {
  let si = 0;
  while (si + 1 < surahStarts.length && surahStarts[si + 1] <= abs) si++;
  return `${si + 1}:${abs - surahStarts[si] + 1}`;
}
function assertAyah(id) {
  const [s, a] = id.split(':').map(Number);
  if (!quran.surahs[s - 1] || quran.surahs[s - 1][a - 1] === undefined) throw new Error(`Unknown ayah ${id}`);
  return id;
}
const member = (ids) => {
  ids.forEach(assertAyah);
  return ids.length > 1 ? { ayahId: ids[0], ayahIds: ids, differenceRanges: [] } : { ayahId: ids[0], differenceRanges: [] };
};

const groups = [];

// 1) HifzLink curated pairs — pilot set for the committee's first review cycle (QMT-49).
const HIFZ_TYPE = { word_swap: 'إبدال' }; // other categories are kept raw in sourceCategory (no false precision)
for (const p of read('assets/data/candidate/hifzlink/pairs.curated.json')) {
  if (p.status !== 'curated') continue;
  const g = {
    id: `hifzlink:${p.ayah1}~${p.ayah2}`,
    members: [member([p.ayah1]), member([p.ayah2])],
    status: 'under_review',
    review: { version: 1 },
    source: { name: 'hifzlink', ref: `pairs.json ${p.ayah1}|${p.ayah2}` },
    pilot: true,
    reviewCycle: 'QMT-49',
  };
  if (HIFZ_TYPE[p.category]) g.type = HIFZ_TYPE[p.category];
  if (p.category) g.sourceCategory = p.category;
  if (p.note) g.note = p.note;
  groups.push(g);
}

// 2) Waqar144 — every entry, as candidate drafts.
const waqar = read('assets/data/candidate/waqar144/mutashabiha_data.json');
const seenWaqar = new Map();
for (const juz of Object.keys(waqar).sort((a, b) => Number(a) - Number(b))) {
  waqar[juz].forEach((e, i) => {
    const toIds = (x) => (Array.isArray(x) ? x : [x]).map(absToId);
    const src = toIds(e.src.ayah);
    const key = src.join('+');
    const n = (seenWaqar.get(key) ?? 0) + 1;
    seenWaqar.set(key, n);
    const g = {
      id: `waqar144:${key}${n > 1 ? `#${n}` : ''}`,
      members: [member(src), ...e.muts.map((m) => member(toIds(m.ayah)))],
      status: 'draft',
      review: { version: 1 },
      source: { name: 'waqar144', ref: `mutashabiha_data.json juz ${juz} [${i}]` },
    };
    if (e.ctx) g.showNextAyahContext = true;
    groups.push(g);
  });
}

// 3) Quranpedia — similar-ayah groups, de-duplicated (the dump repeats each group under every member ayah).
const qp = read('assets/data/candidate/quranpedia/similar.slim.json');
const seenQp = new Set();
for (const a of qp.data) {
  a.similar.forEach((s, i) => {
    const ids = [...new Set(s.ayahs.map((x) => `${x.surah}:${x.ayah}`))];
    if (ids.length < 2) return; // nothing to compare
    const key = [...ids].sort().join(',') + '|' + (s.notes ?? '');
    if (seenQp.has(key)) return;
    seenQp.add(key);
    const anchor = `${a.surah}:${a.ayah}`;
    const ordered = ids.includes(anchor) ? [anchor, ...ids.filter((x) => x !== anchor)] : ids;
    const g = {
      id: `quranpedia:${anchor}#${i + 1}`,
      members: ordered.map((x) => member([x])),
      status: 'draft',
      review: { version: 1 },
      source: { name: 'quranpedia', ref: `/v1/ayah/${a.surah}/${a.ayah}/similar [${i}] (dump ${qp.license.version})` },
    };
    if (s.notes) g.note = s.notes;
    groups.push(g);
  });
}

const ids = new Set();
for (const g of groups) {
  if (ids.has(g.id)) throw new Error(`Duplicate group id ${g.id}`);
  ids.add(g.id);
}

let highlightRules = [];
const autoDiff = path.join(root, 'scripts/lib/auto-diff.mjs');
if (existsSync(autoDiff)) {
  const { buildHighlightRules } = await import(pathToFileURL(autoDiff).href);
  highlightRules = buildHighlightRules(groups, quran.surahs);
}

const { ALGORITHM } = existsSync(autoDiff) ? await import(pathToFileURL(autoDiff).href) : {};

const dataset = {
  schemaVersion: 1,
  kind: 'review',
  datasetVersion: 1,
  description:
    'CANDIDATE review sample (QMT-48). Not approved by the scientific committee. Never ship in beta/production builds.',
  sources: {
    hifzlink: 'srmdn/quran-mutashabihat ad48424 curated pairs, CC BY 4.0',
    waqar144: 'Waqar144/Quran_Mutashabihat_Data 7b259fc, CC0 1.0',
    quranpedia: `Quranpedia.net similar.json.gz dump ${qp.license.version}, Quranpedia.net Data License`,
    text: 'Tanzil Uthmani 1.1 (word indexes refer to Tanzil tokens)',
    ...(ALGORITHM ? { highlightRules: ALGORITHM } : {}),
  },
  groups,
  highlightRules,
};
writeFileSync(path.join(root, 'assets/data/review/mutashabihat.review.json'), JSON.stringify(dataset) + '\n');
const count = (name) => groups.filter((g) => g.source.name === name).length;
console.log(
  `Review dataset: ${groups.length} groups (hifzlink ${count('hifzlink')}, waqar144 ${count('waqar144')}, quranpedia ${count('quranpedia')}), ${highlightRules.length} highlight rules.`,
);
