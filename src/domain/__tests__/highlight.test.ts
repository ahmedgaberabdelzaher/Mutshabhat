import { getQuranRepository } from '@/data';
import { loadBundledDataset } from '@/data/datasets';
import { segmentAyah } from '@/domain/highlight';

const quran = getQuranRepository();

describe('segmentAyah (display-only highlighting)', () => {
  it('marks words and letters without changing the text', () => {
    const ayah = quran.getAyah('2:2')!;
    const segs = segmentAyah(ayah, [{ ayahId: '2:2', startWord: 0, endWord: 1 }], [
      { ayahId: '2:2', word: 6, start: 0, end: 2 },
    ]);
    expect(segs.map((s) => s.text).join('')).toBe(ayah.text);
    expect(segs[0]).toEqual({ kind: 'word', text: ayah.words.slice(0, 2).join(' ') });
    expect(segs.some((s) => s.kind === 'letter')).toBe(true);
  });

  it('ignores ranges for other ayahs and clips out-of-range indexes', () => {
    const ayah = quran.getAyah('1:1')!;
    const segs = segmentAyah(ayah, [
      { ayahId: '2:2', startWord: 0, endWord: 3 },
      { ayahId: '1:1', startWord: 3, endWord: 99 },
    ]);
    expect(segs.map((s) => s.text).join('')).toBe(ayah.text);
    expect(segs.filter((s) => s.kind === 'word').map((s) => s.text)).toEqual([ayah.words[3]]);
  });

  it('every stored highlight rule re-joins to the exact Tanzil text on both sides', () => {
    const ds = loadBundledDataset('review');
    for (const rule of ds.highlightRules) {
      for (const id of new Set([...rule.pair, ...rule.ranges.map((r) => r.ayahId)])) {
        const ayah = quran.getAyah(id)!;
        const segs = segmentAyah(ayah, rule.ranges, rule.letterRanges);
        if (segs.map((s) => s.text).join('') !== ayah.text) throw new Error(`Text drift for ${rule.id} / ${id}`);
      }
    }
  });
});
