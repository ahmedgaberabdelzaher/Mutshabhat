import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AyahText } from '@/components/ayah-text';
import { StatusBadge, Tag } from '@/components/status-badge';
import { colors, spacing } from '@/config/theme';
import { getQuranRepository, type Analogue } from '@/data';
import { SIMILARITY_LABELS, SOURCE_LABELS } from '@/domain/mutashabihat';
import { toArabicDigits } from '@/lib/arabic-digits';

type Props = { analogue: Analogue; showBadge: boolean };

/** One analogue of the opened ayah (QMT-25): its exact text, reference, status badge and provenance. */
export function AnalogueCard({ analogue, showBadge }: Props) {
  const quran = getQuranRepository();
  const ayahs = analogue.ayahIds.map((id) => quran.getAyah(id)!);
  const first = ayahs[0];
  const last = ayahs[ayahs.length - 1];
  const ref =
    ayahs.length > 1
      ? `${first.surahName} ${toArabicDigits(first.ayah)}–${toArabicDigits(last.ayah)}`
      : `${first.surahName} ${toArabicDigits(first.ayah)}`;
  const g = analogue.primary;

  return (
    <View style={styles.card} testID={`analogue-${analogue.ayahId}`}>
      <View style={styles.head}>
        <Link
          href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(first.surah), ayah: String(first.ayah) } }}
          style={styles.ref}>
          {ref}
        </Link>
        {showBadge ? <StatusBadge status={analogue.status} testID={`analogue-status-${analogue.ayahId}`} /> : null}
      </View>
      {ayahs.map((a) => (
        <AyahText key={a.id} ayah={a} testID={`analogue-text-${a.id}`} />
      ))}
      <View style={styles.tags}>
        {analogue.sources.map((s) => (
          <Tag key={s} label={`المصدر: ${SOURCE_LABELS[s]}`} />
        ))}
        {analogue.pilot ? <Tag label="عيّنة اللجنة" testID={`analogue-pilot-${analogue.ayahId}`} /> : null}
        {g.type ? <Tag label={g.type} /> : null}
        {analogue.similarityType === 'semantic' ? (
          <Tag label={SIMILARITY_LABELS.semantic} testID={`analogue-semantic-${analogue.ayahId}`} />
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
  tags: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
