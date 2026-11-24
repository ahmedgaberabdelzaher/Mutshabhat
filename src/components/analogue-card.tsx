import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AyahText } from '@/components/ayah-text';
import { ListTitleText } from '@/components/list-title';
import { SimilarityBadge, StatusBadge, Tag } from '@/components/status-badge';
import { colors, spacing } from '@/config/theme';
import { getMutashabihatRepository, getQuranRepository, type Analogue } from '@/data';
import { rangesFor } from '@/domain/highlight';
import { SIMILARITY_LABELS, SOURCE_LABELS, type HighlightRule } from '@/domain/mutashabihat';
import type { Ayah } from '@/domain/quran';
import { fallbackTitle, pairTitle } from '@/domain/title';
import { toArabicDigits } from '@/lib/arabic-digits';

type Props = { analogue: Analogue; showBadge: boolean };

function refOf(ayahs: Ayah[]) {
  const first = ayahs[0];
  const last = ayahs[ayahs.length - 1];
  return ayahs.length > 1
    ? `${first.surahName} ${toArabicDigits(first.ayah)}–${toArabicDigits(last.ayah)}`
    : `${first.surahName} ${toArabicDigits(first.ayah)}`;
}

const GRANULARITY: Record<HighlightRule['granularity'], string> = {
  letter: 'على مستوى الحرف والكلمة',
  word: 'على مستوى الكلمة',
  none: 'النصّان متطابقان لفظًا',
};
const CONFIDENCE: Record<NonNullable<HighlightRule['confidence']>, string> = {
  high: 'تطابق مرتفع',
  medium: 'تطابق جزئي',
  low: 'تطابق ضعيف',
};

/** Explains where a highlight comes from, without claiming more precision than the data has (QMT-26 AC2). */
function RuleInfo({ rule, showBadge, testID }: { rule?: HighlightRule; showBadge: boolean; testID: string }) {
  if (!rule) {
    return (
      <Text style={styles.meta} testID={`${testID}-none`}>
        لا يتوفر تحديد دقيق لموضع الاختلاف من البيانات المرخّصة المتاحة.
      </Text>
    );
  }
  if (rule.similarityType === 'semantic') {
    return (
      <View style={styles.ruleRow} testID={`${testID}-semantic`}>
        <Text style={styles.meta}>
          {`${SIMILARITY_LABELS.semantic} (اشتراك لفظي قليل) · لا يتوفر تحديد دقيق لموضع الاختلاف.`}
        </Text>
        {showBadge ? <StatusBadge status={rule.status} testID={`${testID}-status`} /> : null}
      </View>
    );
  }
  const origin =
    rule.source !== 'auto_diff'
      ? 'إبراز من اللجنة'
      : rule.method === 'phrase'
        ? 'إبراز آلي حول العبارة المشتركة'
        : 'إبراز آلي بالمقارنة النصية';
  const parts = [origin, GRANULARITY[rule.granularity]];
  if (rule.confidence && rule.method !== 'phrase') parts.push(CONFIDENCE[rule.confidence]);
  return (
    <View style={styles.ruleRow} testID={testID}>
      <Text style={styles.meta}>{parts.join(' · ')}</Text>
      {showBadge ? <StatusBadge status={rule.status} testID={`${testID}-status`} /> : null}
    </View>
  );
}

/** One analogue of the opened ayah (QMT-25) with data-driven difference highlighting (QMT-26). */
export function AnalogueCard({ analogue, showBadge }: Props) {
  const quran = getQuranRepository();
  const rule = getMutashabihatRepository().getHighlightRule(analogue.selfAyahIds[0], analogue.ayahId);
  const self = analogue.selfAyahIds.map((id) => quran.getAyah(id)!);
  const other = analogue.ayahIds.map((id) => quran.getAyah(id)!);
  const selfHl = rangesFor(rule, analogue.selfAyahIds);
  const otherHl = rangesFor(rule, analogue.ayahIds);
  const first = other[0];
  const g = analogue.primary;
  // Title = the similar word/phrase, in this analogue's wording, from the rule data.
  const title = pairTitle(rule, analogue.ayahIds) ?? fallbackTitle(first);

  return (
    <View style={styles.card} testID={`analogue-${analogue.ayahId}`}>
      <ListTitleText title={title} similarityType={analogue.similarityType} testID={`title-analogue-${analogue.ayahId}`} />
      <View style={styles.head}>
        <Link
          href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(first.surah), ayah: String(first.ayah) } }}
          style={styles.ref}>
          {refOf(other)}
        </Link>
        {showBadge ? <StatusBadge status={analogue.status} testID={`analogue-status-${analogue.ayahId}`} /> : null}
      </View>
      {other.map((a) => (
        <AyahText key={a.id} ayah={a} testID={`analogue-text-${a.id}`} ranges={otherHl.ranges} letters={otherHl.letters} />
      ))}

      <View style={styles.compare}>
        <Text style={styles.compareLabel}>{`مقارنةً بـ ${refOf(self)}:`}</Text>
        {self.map((a) => (
          <AyahText
            key={a.id}
            ayah={a}
            size="small"
            testID={`self-text-${analogue.ayahId}-${a.id}`}
            ranges={selfHl.ranges}
            letters={selfHl.letters}
          />
        ))}
      </View>

      <RuleInfo rule={rule} showBadge={showBadge} testID={`rule-${analogue.ayahId}`} />

      <View style={styles.tags}>
        {analogue.sources.map((s) => (
          <Tag key={s} label={`المصدر: ${SOURCE_LABELS[s]}`} />
        ))}
        {analogue.pilot ? <Tag label="عيّنة اللجنة" testID={`analogue-pilot-${analogue.ayahId}`} /> : null}
        {g.type ? <Tag label={g.type} /> : null}
        {showBadge ? (
          <SimilarityBadge
            type={analogue.similarityType}
            testID={`analogue-type-${analogue.similarityType}-${analogue.ayahId}`}
          />
        ) : null}
      </View>
      {g.note ? <Text style={styles.note}>{g.note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  ref: { fontSize: 17, fontWeight: '700', color: colors.primary },
  compare: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: spacing.sm, gap: 2 },
  compareLabel: { fontSize: 13, color: colors.textMuted },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.textMuted },
  tags: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
