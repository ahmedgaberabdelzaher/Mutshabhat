import type { HighlightRule, WordRange } from './mutashabihat';
import type { Ayah } from './quran';

export type Segment = { text: string; kind: 'plain' | 'word' | 'letter' };

/**
 * Split an ayah into display segments for highlighting (QMT-26). Display layer only:
 * concatenating the segments always gives back the exact Tanzil `text` (tested).
 * Segments are in logical (reading) order; the text engine handles RTL visual order.
 */
export function segmentAyah(
  ayah: Pick<Ayah, 'id' | 'text' | 'words'>,
  ranges: WordRange[],
  letters: { ayahId: string; word: number; start: number; end: number }[] = [],
): Segment[] {
  const marked = new Set<number>();
  for (const r of ranges) {
    if (r.ayahId !== ayah.id) continue;
    for (let i = Math.max(0, r.startWord); i <= Math.min(ayah.words.length - 1, r.endWord); i++) marked.add(i);
  }
  const lettersByWord = new Map<number, { start: number; end: number }[]>();
  for (const l of letters) {
    if (l.ayahId !== ayah.id || l.word < 0 || l.word >= ayah.words.length) continue;
    const list = lettersByWord.get(l.word) ?? [];
    list.push({ start: l.start, end: l.end });
    lettersByWord.set(l.word, list);
  }

  const out: Segment[] = [];
  const push = (text: string, kind: Segment['kind']) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ text, kind });
  };

  ayah.words.forEach((w, i) => {
    if (i > 0) push(' ', marked.has(i - 1) && marked.has(i) ? 'word' : 'plain');
    const base: Segment['kind'] = marked.has(i) ? 'word' : 'plain';
    const ls = (lettersByWord.get(i) ?? [])
      .map((l) => ({ start: Math.max(0, l.start), end: Math.min(w.length, l.end) }))
      .filter((l) => l.end > l.start)
      .sort((a, b) => a.start - b.start);
    let pos = 0;
    for (const l of ls) {
      if (l.start < pos) continue;
      push(w.slice(pos, l.start), base);
      push(w.slice(l.start, l.end), 'letter');
      pos = l.end;
    }
    push(w.slice(pos), base);
  });
  return out;
}

/** Ranges of a rule that belong to the given ayah ids. */
export function rangesFor(rule: HighlightRule | undefined, ayahIds: string[]) {
  if (!rule) return { ranges: [], letters: [] };
  return {
    ranges: rule.ranges.filter((r) => ayahIds.includes(r.ayahId)),
    letters: (rule.letterRanges ?? []).filter((l) => ayahIds.includes(l.ayahId)),
  };
}
