import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnalogueCard } from '@/components/analogue-card';
import { ScopeToggle } from '@/components/scope-toggle';
import { Muted, Title } from '@/components/ui';
import { spacing } from '@/config/theme';
import { getMutashabihatRepository, type Scope } from '@/data';
import type { AyahId } from '@/domain/quran';
import { toArabicDigits } from '@/lib/arabic-digits';

/**
 * QMT-25: all analogues of the opened ayah on one screen.
 * Review build → candidate analogues with status badges and a pilot/all filter.
 * Beta/production → approved analogues only (filtered in the repository).
 */
export function AnaloguesSection({ ayahId }: { ayahId: AyahId }) {
  const repo = getMutashabihatRepository();
  const review = repo.policy.flavor === 'review';
  const [scope, setScope] = useState<Scope>('all');
  const analogues = repo.getAnalogues(ayahId, review ? scope : 'all');

  return (
    <View style={styles.section} testID="analogues">
      <Title>{`المتشابهات${analogues.length ? ` (${toArabicDigits(analogues.length)})` : ''}`}</Title>
      {review ? (
        <>
          <Muted>بيانات مرشّحة للمراجعة، وليست معتمدة من اللجنة العلمية بعد.</Muted>
          <Muted>الخلفية الصفراء: كلمات مختلفة · البرتقالية: حروف أو حركات مختلفة.</Muted>
          <ScopeToggle value={scope} onChange={setScope} />
        </>
      ) : null}
      {analogues.length === 0 ? (
        <Muted testID="no-analogues">
          {review
            ? scope === 'pilot'
              ? 'لا توجد نظائر لهذه الآية في عيّنة اللجنة.'
              : 'لا توجد نظائر مرشّحة لهذه الآية.'
            : 'لا توجد نظائر معتمدة لهذه الآية بعد.'}
        </Muted>
      ) : (
        analogues.map((a) => <AnalogueCard key={a.ayahId} analogue={a} showBadge={repo.policy.showStatusBadge} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginTop: spacing.sm },
});
