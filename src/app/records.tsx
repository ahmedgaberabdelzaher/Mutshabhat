import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { FlavorBanner } from '@/components/flavor-banner';
import { ListTitleText } from '@/components/list-title';
import { ScopeToggle } from '@/components/scope-toggle';
import { SimilarityToggle } from '@/components/similarity-toggle';
import { SimilarityBadge, StatusBadge, Tag } from '@/components/status-badge';
import { Muted } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/config/theme';
import { getMutashabihatRepository, getQuranRepository, type RecordRow, type Scope } from '@/data';
import { SOURCE_LABELS, type SimilarityType } from '@/domain/mutashabihat';
import { fallbackTitle } from '@/domain/title';
import { toArabicDigits } from '@/lib/arabic-digits';
import { refLabel } from '@/lib/ref-label';

/**
 * Every visible record with its status badge and source (QMT-48 AC4). One row per distinct similar phrase:
 * duplicates are merged (see getRecordRows / docs/DATA_MODEL.md "De-duplication"); a row opens its positions.
 */
export default function RecordsScreen() {
  const repo = getMutashabihatRepository();
  const review = repo.policy.flavor === 'review';
  const [scope, setScope] = useState<Scope>(review ? 'pilot' : 'all');
  const [similarity, setSimilarity] = useState<SimilarityType>('lafzi');
  const filter = review ? similarity : 'lafzi';
  const rows = repo.getRecordRows(scope, filter);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={rows}
      keyExtractor={(r) => r.id}
      initialNumToRender={15}
      ListHeaderComponent={
        <View style={styles.header}>
          <FlavorBanner />
          {review ? <ScopeToggle value={scope} onChange={setScope} /> : null}
          {review ? <SimilarityToggle value={similarity} onChange={setSimilarity} /> : null}
          <Muted testID="records-count">{`${toArabicDigits(rows.length)} سجلًا`}</Muted>
        </View>
      }
      ListEmptyComponent={<Muted>لا توجد سجلات لعرضها في هذه النسخة.</Muted>}
      renderItem={({ item }) => (
        <RecordRowView row={item} scope={scope} similarity={filter} showBadge={repo.policy.showStatusBadge} />
      )}
    />
  );
}

const MAX_REFS = 6;

function RecordRowView({
  row,
  scope,
  similarity,
  showBadge,
}: {
  row: RecordRow;
  scope: Scope;
  similarity: SimilarityType;
  showBadge: boolean;
}) {
  const first = getQuranRepository().getAyah(row.groups[0].members[0].ayahId)!;
  const refs = row.ayahIds.slice(0, MAX_REFS).map(refLabel);
  const more = row.ayahIds.length - refs.length;
  const note = row.groups.find((g) => g.note)?.note;
  return (
    <Link href={{ pathname: '/record/[id]', params: { id: row.id, scope, similarity } }} asChild>
      <Pressable style={styles.row} testID={`record-${row.id}`}>
        <ListTitleText
          title={row.title ?? fallbackTitle(first)}
          similarityType={row.similarityType}
          testID={`title-record-${row.id}`}
        />
        <View style={styles.badges}>
          {showBadge ? row.statuses.map((s) => <StatusBadge key={s} status={s} testID={`status-${row.id}-${s}`} />) : null}
          {row.sources.map((s) => (
            <Tag key={s} label={SOURCE_LABELS[s]} />
          ))}
          {row.pilot ? <Tag label="عيّنة اللجنة" /> : null}
          {showBadge ? <SimilarityBadge type={row.similarityType} testID={`type-${row.id}`} /> : null}
        </View>
        <Text style={styles.refs} testID={`refs-${row.id}`}>
          {refs.join(' · ') + (more > 0 ? ` · +${toArabicDigits(more)}` : '')}
        </Text>
        {row.ayahIds.length > 2 ? (
          <Text style={styles.note}>{`${toArabicDigits(row.ayahIds.length)} مواضع`}</Text>
        ) : null}
        {note ? (
          <Text style={styles.note} numberOfLines={2}>
            {note}
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
  refs: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  note: { fontSize: 13, color: colors.textMuted },
});
