import type { HighlightRule, MutashabihGroup, TitleBasis } from '@/domain/mutashabihat';
import type { Ayah, AyahId } from '@/domain/quran';

/** Title of a mutashabihat list item: the similar word/phrase itself (exact Tanzil substring). */
export type ListTitle = { text: string; ayahId: AyahId; basis: TitleBasis };

/** Words shown when there is no displayable shared part (same as the build script). */
export const FALLBACK_TITLE_WORDS = 5;

/**
 * Title for one side of a pair, read from the rule data (`titles`, generated at build time, committee-editable).
 * Picks the span in that side's own wording (e.g. جَنَّٰتٍ vs جَنَّٰتٌ); undefined if the rule has no title.
 */
export function pairTitle(rule: HighlightRule | undefined, side: AyahId[]): ListTitle | undefined {
  if (!rule?.titles?.length) return undefined;
  const t = rule.titles.find((x) => side.includes(x.ayahId)) ?? rule.titles[0];
  return { text: t.text, ayahId: t.ayahId, basis: rule.titleBasis ?? 'committee' };
}

export function groupTitle(group: MutashabihGroup): ListTitle | undefined {
  if (!group.title) return undefined;
  return { text: group.title.text, ayahId: group.title.ayahId, basis: group.titleBasis ?? 'committee' };
}

/** Beginning of the ayah, used when the data has no title. Exact words of the Tanzil text. */
export function fallbackTitle(ayah: Ayah): ListTitle {
  return { text: ayah.words.slice(0, FALLBACK_TITLE_WORDS).join(' '), ayahId: ayah.id, basis: 'fallback' };
}
