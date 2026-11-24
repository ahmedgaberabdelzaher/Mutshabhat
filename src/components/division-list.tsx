import type { Href } from 'expo-router';
import type { ReactElement } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { LinkRow } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/config/theme';
import { toArabicDigits } from '@/lib/arabic-digits';

export type Division = { key: string; title: string; subtitle?: string; count: number; href: Href };

/** Picker list for surahs / juz / pages with the number of visible positions in each. */
export function DivisionList({
  items,
  testIDPrefix,
  header,
}: {
  items: Division[];
  testIDPrefix: string;
  header?: ReactElement;
}) {
  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(d) => d.key}
      initialNumToRender={20}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <LinkRow
          href={item.href}
          title={item.title}
          subtitle={[item.subtitle, `${toArabicDigits(item.count)} موضعًا`].filter(Boolean).join(' · ')}
          testID={`${testIDPrefix}-${item.key}`}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
});
