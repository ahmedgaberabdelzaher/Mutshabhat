import { visibilityFor } from '@/config/flavor';
import { getQuranRepository } from '@/data';
import { loadBundledDataset } from '@/data/datasets';
import { LocalMutashabihatRepository, type Scope, type SimilarityFilter } from '@/data/mutashabihat-repository';
import type { MutashabihGroup } from '@/domain/mutashabihat';
import { titleKey } from '@/domain/title';

// Owner (Ahmed): «القائمة يجب ان لا يكون بها تكرار» — no list may contain duplicates.
const quran = getQuranRepository();
const repo = new LocalMutashabihatRepository(loadBundledDataset('review'), visibilityFor('review'), (id) =>
  quran.absoluteIndex(id),
);
const views: [Scope, SimilarityFilter][] = [
  ['pilot', 'lafzi'],
  ['all', 'lafzi'],
  ['all', 'semantic'],
  ['all', 'any'],
];
const ayahsOf = (g: MutashabihGroup) => new Set(g.members.flatMap((m) => m.ayahIds ?? [m.ayahId]));

describe('titleKey', () => {
  it('ignores diacritics, alef forms and a leading و/ف', () => {
    expect(titleKey('هُدًى لِّلْمُتَّقِينَ')).toBe(titleKey('وَهُدًى لِلْمُتَّقِينَ'));
    expect(titleKey('هُدًى لِّلْمُتَّقِينَ')).not.toBe(titleKey('هُدًى وَبُشْرَىٰ'));
  });
});

describe.each(views)('records list (%s, %s): one row per distinct phrase', (scope, similarity) => {
  const rows = repo.getRecordRows(scope, similarity);
  const visible = repo.getGroups(scope, similarity);

  it('never repeats a title', () => {
    expect(new Set(rows.map((r) => r.titleKey)).size).toBe(rows.length);
    for (const r of rows) if (r.title) expect(r.titleKey).toBe(titleKey(r.title.text));
  });

  it('shows every visible record exactly once', () => {
    const ids = rows.flatMap((r) => r.groups.map((g) => g.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(visible.map((g) => g.id).sort());
    for (const r of rows) expect(new Set(r.ayahIds).size).toBe(r.ayahIds.length);
  });

  it('never shows a record separately when a larger record of the list covers its ayahs', () => {
    const rowOf = new Map(rows.flatMap((r) => r.groups.map((g) => [g, r] as const)));
    for (const g of visible) {
      const own = ayahsOf(g);
      const covering = visible.filter((b) => {
        const other = ayahsOf(b);
        return b !== g && other.size > own.size && [...own].every((id) => other.has(id));
      });
      // Shown inside the row of a covering record (the largest one when several cover it).
      if (covering.length) expect(covering.map((b) => rowOf.get(b))).toContain(rowOf.get(g));
    }
  });
});

describe('records list default review view (pilot, lafzi)', () => {
  it('merges «هُدًى لِّلْمُتَّقِينَ» (2:2 ~ 27:2 and 2:2 ~ 31:3) into one row with all positions', () => {
    const rows = repo.getRecordRows('pilot', 'lafzi').filter((r) => r.titleKey === titleKey('هُدًى لِّلْمُتَّقِينَ'));
    expect(rows).toHaveLength(1);
    expect(rows[0].ayahIds).toEqual(['2:2', '27:2', '31:3']);
    expect(rows[0].groups.map((g) => g.id)).toEqual(['hifzlink:2:2~27:2', 'hifzlink:2:2~31:3']);
  });
});

describe('ayah analogue lists', () => {
  it('never show the same ayah twice, nor the opened ayah itself', () => {
    for (const id of repo.getPositionAyahIds('all', 'any')) {
      const shown = repo.getAnalogues(id, 'all', 'any').flatMap((a) => a.ayahIds);
      expect(new Set(shown).size).toBe(shown.length);
      expect(shown).not.toContain(id);
    }
  });
});

describe('browse lists (surah / juz / page)', () => {
  it('list each position once', () => {
    const lists: string[][] = [];
    for (let s = 1; s <= 114; s++) lists.push(quran.getAyahsOfSurah(s).map((a) => a.id));
    for (const ids of lists) {
      const positions = repo.getPositionsIn(ids, 'all', 'lafzi').map((p) => p.ayahId);
      expect(new Set(positions).size).toBe(positions.length);
    }
    const all = repo.getPositionAyahIds('all', 'lafzi');
    expect(new Set(all).size).toBe(all.length);
  });
});
