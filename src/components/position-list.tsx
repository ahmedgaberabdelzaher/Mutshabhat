import { Link } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScopeToggle } from '@/components/scope-toggle';
import { SimilarityToggle } from '@/components/similarity-toggle';
import { StatusBadge, Tag } from '@/components/status-badge';
import { Muted } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/config/theme';
import { getMutashabihatRepository, getQuranRepository, type Position, type Scope } from '@/data';
import type { SimilarityType } from '@/domain/mutashabihat';
import type { AyahId } from '@/domain/quran';
import { toArabicDigits } from '@/lib/arabic-digits';

/**
 * Shared NAV list (QMT-30/31/32): positions (ayahs with visible analogues) among the given ayahs, in mushaf order.
 * Uses the same flavor-aware repository as QMT-25: review → candidate records with status; beta/production → approved only.
 */
export function PositionList({ ayahIds, header }: { ayahIds: AyahId[]; header?: ReactNode }) {
  const repo = getMutashabihatRepository();
  const review = repo.policy.flavor === 'review';
  const [scope, setScope] = useState<Scope>('all');
  const [similarity, setSimilarity] = useState<SimilarityType>('lafzi');
  const positions = repo.getPositionsIn(ayahIds, review ? scope : 'all', review ? similarity : 'lafzi');

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={positions}
      keyExtractor={(p) => p.ayahId}
      initialNumToRender={15}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          {review ? <ScopeToggle value={scope} onChange={setScope} /> : null}
          {review ? <SimilarityToggle value={similarity} onChange={setSimilarity} /> : null}
          <Muted testID="positions-count">{`${toArabicDigits(positions.length)} موضعًا`}</Muted>
        </View>
      }
      ListEmptyComponent={
        <Muted testID="no-positions">
          {review ? 'لا توجد مواضع مرشّحة هنا.' : 'لا توجد مواضع معتمدة هنا بعد.'}
        </Muted>
      }
      renderItem={({ item }) => <PositionRow position={item} showBadge={repo.policy.showStatusBadge} />}
    />
  );
}

function PositionRow({ position, showBadge }: { position: Position; showBadge: boolean }) {
  const ayah = getQuranRepository().getAyah(position.ayahId)!;
  const preview = ayah.words.slice(0, 6).join(' ') + (ayah.words.length > 6 ? ' …' : '');
  return (
    <Link
      href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(ayah.surah), ayah: String(ayah.ayah) } }}
      asChild>
      <Pressable style={styles.row} testID={`position-${ayah.id}`}>
        <View style={styles.rowHead}>
          <Text style={styles.ref}>{`${ayah.surahName} ${toArabicDigits(ayah.ayah)}`}</Text>
          <Text style={styles.count}>{`${toArabicDigits(position.analogueCount)} نظير`}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
        {showBadge || position.pilot ? (
          <View style={styles.badges}>
            {showBadge ? position.statuses.map((s) => <StatusBadge key={s} status={s} />) : null}
            {position.pilot ? <Tag label="عيّنة اللجنة" /> : null}
          </View>
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
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: 17, fontWeight: '700', color: colors.text },
  count: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  preview: { fontSize: 15, color: colors.textMuted },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
