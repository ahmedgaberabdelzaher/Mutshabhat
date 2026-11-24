import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Body, Card, Muted, Screen, Title } from '@/components/ui';
import { colors } from '@/config/theme';
import { SOURCES } from '@/config/sources';
import { getQuranRepository } from '@/data';

export default function SourcesScreen() {
  const tanzilNotice = getQuranRepository().sourceInfo.notice;
  return (
    <Screen>
      <Muted>
        بيانات المتشابهات في هذه النسخة مرشّحة للمراجعة، وليست معتمدة من اللجنة العلمية بعد.
      </Muted>
      {SOURCES.map((s) => (
        <Card key={s.key}>
          <Title>{s.title}</Title>
          <Muted>{s.role}</Muted>
          <Body>{`الترخيص: ${s.license}`}</Body>
          {s.lines.map((l) => (
            <Body key={l}>{l}</Body>
          ))}
          <Link href={s.url as never} style={styles.link} testID={`source-link-${s.key}`}>
            {s.url}
          </Link>
          {s.licenseUrl ? (
            <Link href={s.licenseUrl as never} style={styles.link}>
              {`نص الترخيص: ${s.licenseUrl}`}
            </Link>
          ) : null}
          {s.key === 'tanzil' ? (
            <Text style={styles.notice} testID="tanzil-notice">
              {tanzilNotice}
            </Text>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primary, fontSize: 15, textDecorationLine: 'underline' },
  notice: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
    writingDirection: 'ltr',
    textAlign: 'left',
    backgroundColor: '#F6F2E8',
    padding: 8,
    borderRadius: 8,
  },
});
