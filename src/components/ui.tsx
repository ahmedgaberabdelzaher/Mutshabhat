import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, MAX_CONTENT_WIDTH, spacing } from '@/config/theme';

/** Scrollable, centred page container. Layout direction follows the app's RTL setting. */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  if (!scroll) return <View style={styles.screen}><View style={styles.inner}>{children}</View></View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function LinkRow({
  href,
  title,
  subtitle,
  trailing,
  testID,
}: {
  href: Href;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  testID?: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} testID={testID}>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
        </View>
        {trailing}
        <Text style={styles.chevron}>‹</Text>
      </Pressable>
    </Link>
  );
}

export function Button({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export const uiStyles = StyleSheet.create({
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', padding: spacing.lg, gap: spacing.md, flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, lineHeight: 26, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowPressed: { backgroundColor: '#F3EEE2' },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 22, color: colors.textMuted },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
});
