import { visibilityFor } from '@/config/flavor';
import { loadBundledDataset } from '@/data/datasets';
import { LocalMutashabihatRepository } from '@/data/mutashabihat-repository';
import { getQuranRepository } from '@/data';
import { comparisonKey } from '@/domain/diff';
import type { MutashabihatDataset } from '@/domain/mutashabihat';

const quran = getQuranRepository();

describe('bundled datasets (QMT-48 AC2)', () => {
  const review = loadBundledDataset('review');
  const production = loadBundledDataset('production');

  it('keeps review and production datasets separate', () => {
    expect(review.kind).toBe('review');
    expect(production.kind).toBe('production');
    expect(production.groups.every((g) => g.status === 'approved')).toBe(true);
    expect(production.highlightRules.every((r) => r.status === 'approved')).toBe(true);
  });

  it('production dataset is empty until the committee approves records', () => {
    expect(production.groups).toHaveLength(0);
  });

  it('review dataset holds candidate records only, each with source, version and valid ayah ids', () => {
    expect(review.groups.length).toBeGreaterThan(2000);
    for (const g of review.groups) {
      expect(['draft', 'under_review']).toContain(g.status);
      expect(['quranpedia', 'waqar144', 'hifzlink']).toContain(g.source.name);
      expect(g.review.version).toBeGreaterThanOrEqual(1);
      expect(g.members.length).toBeGreaterThanOrEqual(2);
      for (const m of g.members) for (const id of m.ayahIds ?? [m.ayahId]) expect(quran.getAyah(id)).toBeDefined();
    }
  });

  it('flags the 285 HifzLink curated pairs as the QMT-49 pilot', () => {
    const pilot = review.groups.filter((g) => g.pilot);
    expect(pilot).toHaveLength(285);
    expect(pilot.every((g) => g.source.name === 'hifzlink' && g.reviewCycle === 'QMT-49')).toBe(true);
  });

  it('includes all Waqar144 entries', () => {
    expect(review.groups.filter((g) => g.source.name === 'waqar144')).toHaveLength(1348);
  });

  it('stores highlight rules as data: auto_diff drafts with valid ranges (QMT-26)', () => {
    expect(review.highlightRules.length).toBeGreaterThan(1000);
    const pairs = new Set<string>();
    for (const g of review.groups) {
      const ids = g.members.map((m) => m.ayahId);
      for (const a of ids) for (const b of ids) if (a !== b) pairs.add(`${a}|${b}`);
    }
    for (const r of review.highlightRules) {
      expect(r.source).toBe('auto_diff');
      expect(r.status).toBe('draft');
      expect(['word', 'letter', 'none']).toContain(r.granularity);
      expect(pairs.has(`${r.pair[0]}|${r.pair[1]}`)).toBe(true);
      for (const range of r.ranges) {
        const words = quran.getAyah(range.ayahId)!.words;
        expect(range.startWord).toBeGreaterThanOrEqual(0);
        expect(range.endWord).toBeLessThan(words.length);
      }
      for (const l of r.letterRanges ?? []) {
        expect(l.end).toBeLessThanOrEqual(quran.getAyah(l.ayahId)!.words[l.word].length);
      }
    }
  });

  it('classifies every pair and group as lafzi or semantic (PO: MVP = lafzi)', () => {
    for (const r of review.highlightRules) {
      expect(['lafzi', 'semantic']).toContain(r.similarityType);
      // Rule: semantic ⇔ little shared wording (confidence low) AND no shared phrase of ≥ 3 words ⇒ no ranges.
      // Low-overlap pairs WITH such a phrase are lafzi, method=phrase.
      if (r.similarityType === 'semantic') {
        expect(r.confidence).toBe('low');
        expect(r.method).toBeUndefined();
        expect(r.ranges).toEqual([]);
        expect(r.granularity).toBe('none');
      } else {
        expect(r.method).toBe(r.confidence === 'low' ? 'phrase' : 'lcs');
      }
      if (r.method === 'phrase') {
        expect(r.algorithm).toBe('phrase-anchor-v1');
        expect(r.phrases!.length).toBeGreaterThan(0);
        for (const p of r.phrases!) {
          expect(p.length).toBeGreaterThanOrEqual(3);
          for (const range of [...p.a, ...p.b]) {
            expect(range.endWord).toBeLessThan(quran.getAyah(range.ayahId)!.words.length);
          }
        }
      }
    }
    // Phrase pairs that formerly had no rule are now lafzi with ranges around the shared phrase.
    const phrase = review.highlightRules.filter((r) => r.method === 'phrase');
    expect(phrase.length).toBeGreaterThan(800);
    expect(phrase.filter((r) => r.ranges.length > 0).length / phrase.length).toBeGreaterThan(0.9);
    for (const g of review.groups) expect(['lafzi', 'semantic']).toContain(g.similarityType);
    const count = (t: string) => review.highlightRules.filter((r) => r.similarityType === t).length;
    expect(count('lafzi')).toBeGreaterThan(1000);
    expect(count('semantic')).toBeGreaterThan(1000);
  });

  it('list titles are exact substrings of the Tanzil text, generated as data for every pair and group', () => {
    const check = (t: { ayahId: string; startWord: number; endWord: number; text: string }) => {
      const ayah = quran.getAyah(t.ayahId)!;
      expect(t.text).toBe(ayah.words.slice(t.startWord, t.endWord + 1).join(' '));
      expect(ayah.text.includes(t.text)).toBe(true);
      expect(t.text.length).toBeGreaterThan(0);
    };
    const basis: Record<string, number> = {};
    for (const r of review.highlightRules) {
      expect(r.titles).toHaveLength(2);
      r.titles!.forEach(check);
      basis[r.titleBasis!] = (basis[r.titleBasis!] ?? 0) + 1;
      if (r.titleBasis === 'phrase') expect(r.method).toBe('phrase');
      // Phrase titles: ≥ 3 words, or ≥ 2 when the shared phrase crosses an ayah end (title stays inside one ayah,
      // e.g. 27:17 ~ 27:83 «فَهُمْ يُوزَعُونَ | حَتَّىٰٓ إِذَا»).
      if (r.titleBasis === 'phrase') expect(r.titles![0].endWord - r.titles![0].startWord).toBeGreaterThanOrEqual(1);
      if (r.titleBasis === 'fallback') expect(r.titles!.every((t) => t.startWord === 0 && t.endWord < 5)).toBe(true);
      if (r.titleBasis !== 'fallback') {
        // Both sides carry the same words (letter-only keys), each in its own exact wording.
        const keys = (t: { text: string }) => t.text.split(' ').map(comparisonKey).filter(Boolean).join(' ');
        expect(keys(r.titles![0])).toBe(keys(r.titles![1]));
      }
    }
    expect(Object.keys(basis).sort()).toEqual(['fallback', 'lcs', 'phrase']);
    for (const g of review.groups) {
      check(g.title!);
      expect(g.titleCoverage).toBeLessThanOrEqual(g.members.length);
      if (g.titleBasis !== 'fallback') expect(g.titleCoverage).toBeGreaterThanOrEqual(2);
    }
    // 2:25 ~ 3:15: the shared phrase, in each ayah's own wording.
    const r = review.highlightRules.find((x) => x.pair.join() === '2:25,3:15')!;
    expect(r.titleBasis).toBe('phrase');
    expect(r.titles!.map((t) => t.text)).toEqual([
      quran.getAyah('2:25')!.words.slice(7, 12).join(' '), // جَنَّٰتٍ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَٰرُ
      quran.getAyah('3:15')!.words.slice(9, 14).join(' '), // جَنَّٰتٌ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَٰرُ
    ]);
  });

  it('review build lists all 285 HifzLink pilot pairs in the default view, whatever their type', () => {
    const repo = new LocalMutashabihatRepository(review, visibilityFor('review'), (id) => quran.absoluteIndex(id));
    const pilot = review.groups.filter((g) => g.pilot);
    expect(pilot).toHaveLength(285);
    expect(pilot.some((g) => g.similarityType === 'semantic')).toBe(true);
    expect(repo.getGroups('all').filter((g) => g.pilot)).toHaveLength(285); // default filter = lafzi
    for (const g of pilot) {
      const [a, b] = g.members.map((m) => m.ayahId);
      const found = repo.getAnalogues(a).find((x) => x.ayahId === b);
      expect(found?.pilot).toBe(true);
      expect(['lafzi', 'semantic']).toContain(found?.similarityType);
    }
  });

  it('semantic pairs never reach beta/production — even if the whole review set were approved', () => {
    const approvedAll: MutashabihatDataset = {
      ...review,
      kind: 'production',
      groups: review.groups.map((g) => ({ ...g, status: 'approved' })),
      highlightRules: review.highlightRules.map((r) => ({ ...r, status: 'approved' })),
    };
    const semanticPairs = new Set(
      review.highlightRules.filter((r) => r.similarityType === 'semantic').map((r) => r.pair.join('|')),
    );
    for (const flavor of ['beta', 'production'] as const) {
      const repo = new LocalMutashabihatRepository(approvedAll, visibilityFor(flavor), (id) => quran.absoluteIndex(id));
      expect(repo.getGroups('all', 'any').every((g) => g.similarityType === 'lafzi')).toBe(true);
      expect(repo.getDatasetInfo().similarityCounts.semantic).toBe(0);
      for (const id of repo.getPositionAyahIds('all', 'any')) {
        for (const a of repo.getAnalogues(id, 'all', 'any')) {
          expect(a.similarityType).toBe('lafzi');
          const key = [a.selfAyahIds[0], a.ayahId].sort((x, y) => quran.absoluteIndex(x) - quran.absoluteIndex(y)).join('|');
          expect(semanticPairs.has(key)).toBe(false);
        }
      }
    }
  });
});
