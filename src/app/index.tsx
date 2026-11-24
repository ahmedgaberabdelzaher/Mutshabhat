import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { Button, Card, LinkRow, Muted, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/config/theme';
import { getQuranRepository } from '@/data';
import { parseAyahInput } from '@/lib/parse-ayah-input';

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const go = () => {
    const id = parseAyahInput(input);
    const ayah = id ? getQuranRepository().getAyah(id) : undefined;
    if (!ayah) {
      setError('اكتب رقم السورة ثم رقم الآية، مثل ٢:٢٥٥');
      return;
    }
    setError(null);
    router.push({ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(ayah.surah), ayah: String(ayah.ayah) } });
  };

  return (
    <Screen>
      <Card>
        <Title>انتقل إلى آية</Title>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={go}
          placeholder="السورة:الآية — مثل ٢:٢٥٥"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
          style={styles.input}
          testID="ayah-input"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="فتح الآية" onPress={go} testID="open-ayah" />
      </Card>
      <LinkRow href="/quran" title="فهرس السور" subtitle="تصفّح نص المصحف سورةً سورة" />
      <Muted>نص المصحف من مشروع تنزيل (tanzil.net) برخصة CC BY 3.0، من غير أي تعديل.</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 18,
    color: colors.text,
    textAlign: 'right',
  },
  error: { color: colors.rejected },
});
