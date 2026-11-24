import { clusters, comparisonKey, diffPair, letterDiff, type Side } from '@/domain/diff';
import { getQuranRepository } from '@/data';

const side = (id: string, text: string): Side => [{ ayahId: id, words: text.split(' ') }];
const real = (id: string): Side => [{ ayahId: id, words: getQuranRepository().getAyah(id)!.words }];

describe('auto diff (QMT-26)', () => {
  it('زيادة / نقص: extra words on one side only', () => {
    const a = side('a', 'قُلْ إِنَّ ٱللَّهَ عَلِيمٌ حَكِيمٌ بِكُلِّ شَىْءٍ');
    const b = side('b', 'قُلْ إِنَّ ٱللَّهَ عَلِيمٌ حَكِيمٌ');
    const d = diffPair(a, b);
    expect(d.type).toBe('زيادة');
    expect(d.a.ranges).toEqual([{ ayahId: 'a', startWord: 5, endWord: 6 }]);
    expect(d.b.ranges).toEqual([]);
    expect(diffPair(b, a).type).toBe('نقص');
  });

  it('إبدال: a different word in the same slot', () => {
    const d = diffPair(side('a', 'وَٱللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ'), side('b', 'وَٱللَّهُ بِمَا تَعْمَلُونَ خَبِيرٌ'));
    expect(d.type).toBe('إبدال');
    expect(d.a.ranges).toEqual([{ ayahId: 'a', startWord: 3, endWord: 3 }]);
    expect(d.b.ranges).toEqual([{ ayahId: 'b', startWord: 3, endWord: 3 }]);
  });

  it('تقديم/تأخير: same words, different order', () => {
    const d = diffPair(side('a', 'لَهُمْ أَجْرٌ عَظِيمٌ فِى ٱلْآخِرَةِ وَٱلدُّنْيَا'), side('b', 'لَهُمْ أَجْرٌ عَظِيمٌ فِى ٱلدُّنْيَا وَٱلْآخِرَةِ'));
    // Words differ only by the attached و, so this is a substitution of two words in the same slot.
    expect(d.a.ranges.length).toBeGreaterThan(0);
    const swap = diffPair(side('a', 'كَانُوا۟ يَعْمَلُونَ مَا شَآءَ رَبُّكَ أَبَدًا'), side('b', 'كَانُوا۟ مَا شَآءَ يَعْمَلُونَ رَبُّكَ أَبَدًا'));
    expect(swap.type).toBe('تقديم/تأخير');
  });

  it('letter level: same letters with different diacritics are highlighted per letter, not per word', () => {
    const d = diffPair(side('a', 'إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ'), side('b', 'إِنَّهُۥ هُوَ ٱلْغَفُورِ ٱلرَّحِيمِ'));
    expect(d.granularity).toBe('letter');
    expect(d.a.ranges).toEqual([]);
    expect(d.a.letters.map((l) => l.word)).toEqual([2, 3]);
    // The highlighted cluster is the final letter with its vowel.
    const w = 'ٱلْغَفُورُ';
    const l = d.a.letters[0];
    expect(w.slice(l.start, l.end)).toBe('رُ');
  });

  it('letter level inside a 1↔1 substitution of similar words (يعملون / تعملون)', () => {
    const d = diffPair(side('a', 'وَٱللَّهُ بِمَا يَعْمَلُونَ بَصِيرٌ'), side('b', 'وَٱللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ'));
    expect(d.a.ranges).toEqual([{ ayahId: 'a', startWord: 2, endWord: 2 }]);
    expect(d.granularity).toBe('letter');
    const l = d.a.letters[0];
    expect('يَعْمَلُونَ'.slice(l.start, l.end)).toBe('يَ');
  });

  it('identical wording → no ranges (granularity none)', () => {
    const d = diffPair(real('2:5'), real('31:5'));
    expect(d.granularity).toBe('none');
    expect(d.a.ranges).toEqual([]);
    expect(d.b.ranges).toEqual([]);
  });

  it('no false precision: thematic pairs with little shared wording get no ranges', () => {
    const d = diffPair(real('2:255'), real('112:1'));
    expect(d.confidence).toBe('low');
    expect(d.granularity).toBe('none');
    expect(d.a.ranges).toEqual([]);
  });

  it('ignores pause marks and normalises alef forms only for comparison', () => {
    expect(comparisonKey('ۛ')).toBe('');
    expect(comparisonKey('ٱلْكِتَٰبُ')).toBe(comparisonKey('الكتب'));
  });

  it('real pair 2:2 ~ 27:2: highlights the differing ending, not the surrounding context', () => {
    const d = diffPair(real('2:2'), real('27:2'));
    const words2 = getQuranRepository().getAyah('2:2')!.words;
    expect(d.a.ranges).toEqual([{ ayahId: '2:2', startWord: words2.length - 1, endWord: words2.length - 1 }]);
    expect(d.b.ranges).toEqual([{ ayahId: '27:2', startWord: 1, endWord: 2 }]);
  });

  it('RTL-safe: ranges are logical word indexes within bounds, letter offsets within the word', () => {
    for (const [x, y] of [
      ['2:35', '7:19'],
      ['2:58', '7:161'],
      ['2:49', '7:141'],
    ]) {
      const d = diffPair(real(x), real(y));
      for (const [s, r] of [
        [real(x)[0], d.a],
        [real(y)[0], d.b],
      ] as const) {
        for (const range of r.ranges) {
          expect(range.startWord).toBeLessThanOrEqual(range.endWord);
          expect(range.endWord).toBeLessThan(s.words.length);
        }
        for (const l of r.letters) expect(l.end).toBeLessThanOrEqual(s.words[l.word].length);
      }
    }
  });

  it('clusters keep marks with their base letter', () => {
    expect(clusters('بِسْمِ').map((c) => c.text)).toEqual(['بِ', 'سْ', 'مِ']);
    expect(letterDiff('رَبِّكَ', 'رَبِّكُمْ').a.length).toBe(1);
  });
});
