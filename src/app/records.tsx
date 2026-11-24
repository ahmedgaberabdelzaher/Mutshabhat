import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { FlavorBanner } from '@/components/flavor-banner';
import { ScopeToggle } from '@/components/scope-toggle';
import { SimilarityToggle } from '@/components/similarity-toggle';
import { StatusBadge, Tag } from '@/components/status-badge';
import { Muted } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/config/theme';
import { getMutashabihatRepository, getQuranRepository, type Scope } from '@/data';
import { SIMILARITY_LABELS, SOURCE_LABELS, type MutashabihGroup, type SimilarityType } from '@/domain/mutashabihat';
import { toArabicDigits } from '@/lib/arabic-digits';

function refLabel(id: string) {
  const a = getQuranRepository().getAyah(id);
  return a ? `${a.surahName} ${toArabicDigits(a.ayah)}` : id;
}

/** Every visible record with its status badge and source (QMT-48 AC4). */
export default function RecordsScreen() {
  const repo = getMutashabihatRepository();
  const review = repo.policy.flavor === 'review';
  const [scope, setScope] = useState<Scope>(review ? 'pilot' : 'all');
  const [similarity, setSimilarity] = useState<SimilarityType>('lafzi');
  const groups = repo.getGroups(scope, review ? similarity : 'lafzi');

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={(g) => g.id}
      initialNumToRender={15}
      ListHeaderComponent={
        <View style={styles.header}>
          <FlavorBanner />
          {review ? <ScopeToggle value={scope} onChange={setScope} /> : null}
          {review ? <SimilarityToggle value={similarity} onChange={setSimilarity} /> : null}
          <Muted>{`${toArabicDigits(groups.length)} سجلًا`}</Muted>
        </View>
      }
      ListEmptyComponent={<Muted>لا توجد سجلات لعرضها في هذه النسخة.</Muted>}
      renderItem={({ item }) => <RecordRow group={item} showBadge={repo.policy.showStatusBadge} />}
    />
  );
}

function RecordRow({ group, showBadge }: { group: MutashabihGroup; showBadge: boolean }) {
  const first = getQuranRepository().getAyah(group.members[0].ayahId)!;
  return (
    <Link
      href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(first.surah), ayah: String(first.ayah) } }}
      asChild>
      <Pressable style={styles.row} testID={`record-${group.id}`}>
        <View style={styles.badges}>
          {showBadge ? <StatusBadge status={group.status} testID={`status-${group.id}`} /> : null}
          <Tag label={SOURCE_LABELS[group.source.name]} />
          {group.pilot ? <Tag label="عيّنة اللجنة" /> : null}
          {group.similarityType === 'semantic' ? <Tag label={SIMILARITY_LABELS.semantic} /> : null}
        </View>
        <Text style={styles.refs}>{group.members.map((m) => refLabel(m.ayahId)).join(' · ')}</Text>
        {group.note ? (
          <Text style={styles.note} numberOfLines={2}>
            {group.note}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  refs: { fontSize: 16, color: colors.text, fontWeight: '600' },
  note: { fontSize: 13, color: colors.textMuted },
});
