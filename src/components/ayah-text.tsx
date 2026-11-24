import { StyleSheet, Text } from 'react-native';

import { ACTIVE_QURAN_FONT } from '@/config/fonts';
import { colors } from '@/config/theme';
import type { Ayah } from '@/domain/quran';
import { toArabicDigits } from '@/lib/arabic-digits';

type Props = {
  ayah: Ayah;
  size?: 'large' | 'normal';
  showNumber?: boolean;
  testID?: string;
};

/**
 * Renders the exact Tanzil text of an ayah in the configured Quran font.
 * The ayah string is passed through unchanged; the end-of-ayah number is a separate span.
 */
export function AyahText({ ayah, size = 'normal', showNumber = true, testID }: Props) {
  const fontSize = size === 'large' ? 30 : 24;
  return (
    <Text
      testID={testID}
      style={[styles.text, { fontFamily: ACTIVE_QURAN_FONT.family, fontSize, lineHeight: fontSize * 1.9 }]}>
      <Text testID={testID ? `${testID}-source` : undefined}>{ayah.text}</Text>
      {showNumber ? <Text style={styles.number}>{` ﴿${toArabicDigits(ayah.ayah)}﴾`}</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.text, writingDirection: 'rtl' },
  number: { color: colors.primary },
});
