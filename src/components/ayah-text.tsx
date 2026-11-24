import { StyleSheet, Text } from 'react-native';

import { ACTIVE_QURAN_FONT } from '@/config/fonts';
import { colors } from '@/config/theme';
import { segmentAyah } from '@/domain/highlight';
import type { WordRange } from '@/domain/mutashabihat';
import type { Ayah } from '@/domain/quran';
import { toArabicDigits } from '@/lib/arabic-digits';

type Props = {
  ayah: Ayah;
  size?: 'large' | 'normal' | 'small';
  showNumber?: boolean;
  testID?: string;
  /** Data-driven highlight ranges (QMT-26). Display only — the text itself is never changed. */
  ranges?: WordRange[];
  letters?: { ayahId: string; word: number; start: number; end: number }[];
};

const SIZES = { large: 30, normal: 24, small: 20 };

/**
 * Renders the exact Tanzil text of an ayah in the configured Quran font.
 * Highlighting splits the string into nested spans whose concatenation is the original text.
 */
export function AyahText({ ayah, size = 'normal', showNumber = true, testID, ranges, letters }: Props) {
  const fontSize = SIZES[size];
  const highlighted = (ranges?.length ?? 0) + (letters?.length ?? 0) > 0;
  return (
    <Text
      testID={testID}
      style={[styles.text, { fontFamily: ACTIVE_QURAN_FONT.family, fontSize, lineHeight: fontSize * 1.9 }]}>
      <Text testID={testID ? `${testID}-source` : undefined}>
        {highlighted
          ? segmentAyah(ayah, ranges ?? [], letters ?? []).map((s, i) =>
              s.kind === 'plain' ? (
                s.text
              ) : (
                <Text
                  key={i}
                  style={s.kind === 'word' ? styles.word : styles.letter}
                  testID={testID ? `${testID}-${s.kind}` : undefined}>
                  {s.text}
                </Text>
              ),
            )
          : ayah.text}
      </Text>
      {showNumber ? <Text style={styles.number}>{` ﴿${toArabicDigits(ayah.ayah)}﴾`}</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.text, writingDirection: 'rtl' },
  number: { color: colors.primary },
  word: { backgroundColor: colors.highlight, color: colors.highlightText },
  letter: { backgroundColor: colors.letterHighlight, color: '#5A1800' },
});
