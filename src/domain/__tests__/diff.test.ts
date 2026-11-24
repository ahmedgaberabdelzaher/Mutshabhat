import {
  clusters,
  comparisonKey,
  diffPair,
  extendToTwoWords,
  findKeySequence,
  isTitleStopword,
  meaningfulSharedSpan,
  letterDiff,
  phraseDiff,
  sharedSpan,
  similarityOf,
  type Side,
} from '@/domain/diff';
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
    expect(similarityOf(d)).toBe('semantic');
  });

  it('classifies verbal pairs as lafzi', () => {
    expect(similarityOf(diffPair(real('2:2'), real('27:2')))).toBe('lafzi');
    expect(similarityOf(diffPair(real('2:5'), real('31:5')))).toBe('lafzi');
  });

  it('phrase level: a low-overlap pair sharing ≥ 3 consecutive words is lafzi (2:25 ~ 3:15)', () => {
    const whole = diffPair(real('2:25'), real('3:15'));
    expect(whole.confidence).toBe('low');
    expect(whole.sharedRun).toBe(5);
    expect(similarityOf(whole)).toBe('lafzi');
  });

  it('phraseDiff locates the shared phrase and highlights the words around it', () => {
    const d = phraseDiff(real('2:25'), real('3:15'));
    // «جَنَّٰتٍ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَٰرُ» = 2:25 words 7–11, 3:15 words 9–13.
    expect(d.phrases).toEqual([
      {
        a: [{ ayahId: '2:25', startWord: 7, endWord: 11 }],
        b: [{ ayahId: '3:15', startWord: 9, endWord: 13 }],
        length: 5,
      },
    ]);
    expect(d.a.ranges).toEqual([
      { ayahId: '2:25', startWord: 5, endWord: 6 }, // أَنَّ لَهُمْ
      { ayahId: '2:25', startWord: 12, endWord: 13 }, // كُلَّمَا رُزِقُوا۟
    ]);
    expect(d.b.ranges).toEqual([
      { ayahId: '3:15', startWord: 7, endWord: 8 }, // عِندَ رَبِّهِمْ
      { ayahId: '3:15', startWord: 14, endWord: 15 }, // خَٰلِدِينَ فِيهَا
    ]);
    // جَنَّٰتٍ / جَنَّٰتٌ inside the phrase: same letters, different case ending → letter-level only.
    expect(d.a.letters).toEqual([expect.objectContaining({ ayahId: '2:25', word: 7 })]);
    expect(d.granularity).toBe('letter');
    expect(d.type).toBe('إبدال');
  });

  it('phraseDiff: a shared opening phrase highlights only what follows it (2:54 ~ 5:20)', () => {
    const d = phraseDiff(real('2:54'), real('5:20'));
    expect(d.phrases[0].length).toBe(5); // وَإِذْ قَالَ مُوسَىٰ لِقَوْمِهِۦ يَٰقَوْمِ
    expect(d.a.ranges).toEqual([{ ayahId: '2:54', startWord: 5, endWord: 6 }]);
    expect(d.b.ranges).toEqual([{ ayahId: '5:20', startWord: 5, endWord: 6 }]);
  });

  it('phraseDiff: synthetic — window words that also match are not highlighted; one-sided edge = زيادة', () => {
    const d = phraseDiff(side('1:1', 'أ ب ج د هـ و'), side('1:2', 'ب ج د هـ'));
    expect(d.phrases[0].length).toBe(4);
    expect(d.a.ranges).toEqual([
      { ayahId: '1:1', startWord: 0, endWord: 0 },
      { ayahId: '1:1', startWord: 5, endWord: 5 },
    ]);
    expect(d.b.ranges).toEqual([]);
    expect(d.type).toBe('زيادة');
  });

  it('pairs without a ≥ 3-word shared phrase and little overlap stay semantic', () => {
    const d = diffPair(real('75:31'), real('75:32'));
    expect(d.sharedRun).toBeLessThan(3);
    expect(similarityOf(d)).toBe('semantic');
    expect(phraseDiff(real('75:31'), real('75:32')).phrases).toEqual([]);
  });

  it('sharedSpan: longest common contiguous part, inside one ayah per side (list titles)', () => {
    expect(sharedSpan(real('2:25'), real('3:15'))).toEqual({
      a: { ayahId: '2:25', startWord: 7, endWord: 11 },
      b: { ayahId: '3:15', startWord: 9, endWord: 13 },
      length: 5,
    });
    expect(sharedSpan(real('2:2'), real('27:2'))).toBeNull(); // only «هُدًى» shared…
    expect(sharedSpan(real('2:2'), real('27:2'), 1)?.length).toBe(1); // …allowed for lafzi titles
    expect(sharedSpan(real('75:31'), real('75:32'), 1)).toBeNull();
    // A run never crosses an ayah boundary (the title must be a substring of ONE ayah).
    const twoAyahs: Side = [
      { ayahId: '1:1', words: ['أ', 'ب'] },
      { ayahId: '1:2', words: ['ج', 'د'] },
    ];
    expect(sharedSpan(twoAyahs, side('9:9', 'أ ب ج د'))?.length).toBe(2);
  });

  it('title stopwords: particles / function words on the undiacritised form, with و / ف prefixes', () => {
    for (const w of ['مِّنَ', 'فِى', 'لَا', 'مَآ', 'إِنَّ', 'وَلَا', 'فَمَن', 'ٱلَّذِينَ', 'عَلَيْهِمْ', 'ذَٰلِكَ', 'عَنْهَا']) {
      expect(isTitleStopword(w)).toBe(true);
    }
    for (const w of ['هُدًى', 'ٱللَّهِ', 'يَوْمَ', 'جَنَّٰتٍ', 'ٱلْقَيُّومُ']) expect(isTitleStopword(w)).toBe(false);
  });

  it('meaningfulSharedSpan skips particle-only shared runs', () => {
    // 16:11 ~ 30:21: longest shared run «إِنَّ فِى ذَٰلِكَ» is particle-only → «لِّقَوْمٍ يَتَفَكَّرُونَ».
    const s = meaningfulSharedSpan(real('16:11'), real('30:21'))!;
    expect(s.movedOffParticle).toBe(true);
    expect(s.length).toBe(2);
    // Only particles shared → no title span at all (fallback).
    expect(meaningfulSharedSpan(side('1:1', 'قَالَ مِنْ فِى ذَهَبَ'), side('1:2', 'جَآءَ مِنْ فِى رَجَعَ'))).toBeNull();
  });

  it('extendToTwoWords: adds the following word, the preceding one at the ayah end, none for a 1-word ayah', () => {
    const w = 'ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ'.split(' ');
    expect(extendToTwoWords({ ayahId: 'x', startWord: 5, endWord: 5 }, w)).toEqual({
      range: { ayahId: 'x', startWord: 5, endWord: 6 },
      extended: true,
    });
    expect(extendToTwoWords({ ayahId: 'x', startWord: 6, endWord: 6 }, w).range).toEqual({
      ayahId: 'x',
      startWord: 5,
      endWord: 6,
    });
    expect(extendToTwoWords({ ayahId: '2:1', startWord: 0, endWord: 0 }, ['الٓمٓ'])).toEqual({
      range: { ayahId: '2:1', startWord: 0, endWord: 0 },
      extended: false,
    });
    expect(extendToTwoWords({ ayahId: 'x', startWord: 0, endWord: 1 }, w).extended).toBe(false);
  });

  it('findKeySequence matches by letters only, inside one ayah', () => {
    const keys = 'جنت تجري من تحتها الانهر'.split(' ');
    expect(findKeySequence(real('3:15'), keys)).toEqual({
      ayahId: '3:15',
      startWord: 9,
      endWord: 13,
    });
    expect(findKeySequence(real('2:2'), keys)).toBeNull();
  });

  it('ignores pause marks and normalises alef forms only for comparison', () => {
    expect(comparisonKey('ۛ')).toBe('');
    expect(comparisonKey('ٱلْكِتَٰبُ')).toBe(comparisonKey('الكتب'));
  });

  it('real pair 2:2 ~ 27:2: highlights the differing ending, not the surrounding context', () => {
    const d = diffPair(real('2:2'), real('27:2'));
    const words2 = getQuranRepository().getAyah('2:2')!.words;
    expect(d.a.ranges).toEqual([
      {
        ayahId: '2:2',
        startWord: words2.length - 1,
        endWord: words2.length - 1,
      },
    ]);
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
