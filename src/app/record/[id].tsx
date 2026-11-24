import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AyahText } from '@/components/ayah-text';
import { ListTitleText } from '@/components/list-title';
import { SimilarityBadge, StatusBadge, Tag } from '@/components/status-badge';
import { Muted, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/config/theme';
import { getMutashabihatRepository, getQuranRepository, type Scope } from '@/data';
import { comparisonKey, findKeySequence } from '@/domain/diff';
import { SOURCE_LABELS, type SimilarityType, type WordRange } from '@/domain/mutashabihat';
import type { Ayah } from '@/domain/quran';
import { fallbackTitle } from '@/domain/title';
import { toArabicDigits } from '@/lib/arabic-digits';
import { refLabel } from '@/lib/ref-label';

/** One records-list row: the similar phrase and ALL its positions (the merged, de-duplicated records). */
export default function RecordScreen() {
  const params = useLocalSearchParams<{ id: string; scope?: string; similarity?: string }>();
  const repo = getMutashabihatRepository();
  const quran = getQuranRepository();
  const review = repo.policy.flavor === 'review';
  const scope: Scope = params.scope === 'pilot' ? 'pilot' : 'all';
  const similarity: SimilarityType = review && params.similarity === 'semantic' ? 'semantic' : 'lafzi';
  const row = repo.getRecordRows(scope, similarity).find((r) => r.groups.some((g) => g.id === params.id));
  if (!row) {
    return (
      <Screen>
        <Muted testID="record-missing">هذا السجل غير متاح في هذه النسخة.</Muted>
      </Screen>
    );
  }
  const ayahs = row.ayahIds.map((id) => quran.getAyah(id)).filter((a): a is Ayah => !!a);
  const title = row.title ?? fallbackTitle(ayahs[0]);
  const keys = title.basis === 'fallback' ? [] : title.text.split(' ').map(comparisonKey).filter(Boolean);
  const rangeOf = (a: Ayah): WordRange[] => {
    const r = findKeySequence([{ ayahId: a.id, words: a.words }], keys);
    return r ? [r] : [];
  };
  return (
    <Screen>
      <View style={styles.head}>
        <ListTitleText title={title} similarityType={row.similarityType} testID="record-title" />
        <View style={styles.badges}>
          {repo.policy.showStatusBadge ? row.statuses.map((s) => <StatusBadge key={s} status={s} />) : null}
          {row.pilot ? <Tag label="عيّنة اللجنة" /> : null}
          {repo.policy.showStatusBadge ? <SimilarityBadge type={row.similarityType} /> : null}
        </View>
      </View>
      <Title>{`المواضع (${toArabicDigits(ayahs.length)})`}</Title>
      {ayahs.map((a) => (
        <Link
          key={a.id}
          href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(a.surah), ayah: String(a.ayah) } }}
          asChild>
          <Pressable style={styles.card} testID={`record-position-${a.id}`}>
            <Text style={styles.ref}>{refLabel(a.id)}</Text>
            <AyahText ayah={a} size="small" ranges={rangeOf(a)} />
          </Pressable>
        </Link>
      ))}
      <Title>{`المصادر (${toArabicDigits(row.groups.length)})`}</Title>
      {row.groups.map((g) => (
        <View key={g.id} style={styles.source} testID={`record-source-${g.id}`}>
          <View style={styles.badges}>
            {(g.attributions ?? [{ name: g.source.name, groupId: g.id }]).map((x) => (
              <Tag key={x.groupId} label={SOURCE_LABELS[x.name]} />
            ))}
            {repo.policy.showStatusBadge ? <StatusBadge status={g.status} /> : null}
          </View>
          <Text style={styles.refs}>{g.members.map((m) => refLabel(m.ayahId)).join(' · ')}</Text>
          {g.note ? <Muted>{g.note}</Muted> : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ref: { fontSize: 16, fontWeight: '700', color: colors.primary },
  source: {
    gap: 4,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  refs: { fontSize: 14, color: colors.text, fontWeight: '600' },
});
