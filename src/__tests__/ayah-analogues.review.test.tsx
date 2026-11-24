process.env.EXPO_PUBLIC_APP_FLAVOR = 'review';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const { fireEvent } = require('@testing-library/react-native');
const AyahScreen = require('@/app/ayah/[surah]/[ayah]').default;
const { getQuranRepository } = require('@/data');
/* eslint-enable @typescript-eslint/no-require-imports */

const open = (url: string) => renderRouter({ 'ayah/[surah]/[ayah]': AyahScreen }, { initialUrl: url });

describe('ayah + analogues — review build (QMT-25 AC3)', () => {
  it('shows the ayah and its candidate analogues with visible status badges', async () => {
    const screen = await open('/ayah/2/2');
    // The opened ayah, unmodified.
    expect(screen.getByTestId('ayah-text-source')).toHaveTextContent(getQuranRepository().getAyah('2:2').text, {
      exact: true,
    });
    // HifzLink pilot pair 2:2 ~ 27:2, status «قيد المراجعة».
    expect(screen.getByTestId('analogue-27:2')).toBeTruthy();
    expect(screen.getByTestId('analogue-status-27:2')).toHaveTextContent('قيد المراجعة');
    expect(screen.getByTestId('analogue-pilot-27:2')).toBeTruthy();
    expect(screen.getByTestId('analogue-text-27:2-source')).toHaveTextContent(getQuranRepository().getAyah('27:2').text, {
      exact: true,
    });
  });

  it('shows draft candidates too, and the pilot filter narrows to HifzLink pairs', async () => {
    const screen = await open('/ayah/2/3');
    // 2:3 ~ 8:3 is a Waqar144 draft pair, not in the HifzLink pilot.
    expect(screen.getByTestId('analogue-status-8:3')).toHaveTextContent('مسوّدة');
    await fireEvent.press(screen.getByTestId('scope-pilot'));
    expect(screen.queryByTestId('analogue-8:3')).toBeNull();
    expect(screen.getByTestId('no-analogues')).toHaveTextContent('لا توجد نظائر لهذه الآية في عيّنة اللجنة.');
  });

  it('offers the lafzi/semantic filter, defaulting to lafzi', async () => {
    const screen = await open('/ayah/2/3');
    expect(screen.getByTestId('similarity-lafzi')).toHaveProp('accessibilityState', { selected: true });
    await fireEvent.press(screen.getByTestId('similarity-semantic'));
    expect(screen.queryByTestId('analogue-8:3')).toBeNull(); // 2:3 ~ 8:3 is lafzi
  });

  it('shows a HifzLink pilot pair even when it is semantic, with its type badge, without any filter', async () => {
    const screen = await open('/ayah/75/31'); // 75:31 ~ 75:32: pilot pair, no shared words
    expect(screen.getByTestId('analogue-pilot-75:32')).toBeTruthy();
    expect(screen.getByTestId('analogue-type-semantic-75:32')).toHaveTextContent('تشابه معنوي');
  });

  it('highlights a phrase-level lafzi pair around the shared phrase', async () => {
    const screen = await open('/ayah/2/25'); // 2:25 ~ 3:15 share «جنات تجري من تحتها الأنهار»
    expect(screen.getByTestId('analogue-type-lafzi-3:15')).toBeTruthy();
    expect(screen.getByTestId('rule-3:15')).toHaveTextContent(/إبراز آلي حول العبارة المشتركة/);
  });

  it('titles each analogue with the similar phrase itself (analogue wording) and keeps the details', async () => {
    const screen = await open('/ayah/2/25');
    const words = getQuranRepository().getAyah('3:15').words;
    expect(screen.getByTestId('title-analogue-3:15')).toHaveTextContent(words.slice(9, 14).join(' '), { exact: true });
    expect(screen.getByTestId('analogue-3:15')).toHaveTextContent(/آل عمران ١٥/); // surah + ayah number kept
  });

  it('falls back to the beginning of the ayah + type badge when nothing is shared', async () => {
    const screen = await open('/ayah/75/31');
    const text = getQuranRepository().getAyah('75:32').text; // 3 words: the whole ayah
    expect(screen.getByTestId('title-analogue-75:32')).toHaveTextContent(`${text} …`, { exact: true });
    expect(screen.getByTestId('title-analogue-75:32-type')).toHaveTextContent('تشابه معنوي');
  });

  it('handles an ayah with no analogues', async () => {
    const screen = await open('/ayah/108/1');
    expect(screen.getByTestId('no-analogues')).toHaveTextContent('لا توجد نظائر مرشّحة لهذه الآية.');
  });
});

describe('difference highlighting — review build (QMT-26 AC3)', () => {
  it('highlights the differing words on both sides and shows the rule status', async () => {
    const screen = await open('/ayah/2/2');
    // Data-driven rule auto:2:2|27:2 — «لِّلْمُتَّقِينَ» vs «وَبُشْرَىٰ لِلْمُؤْمِنِينَ».
    const quran = getQuranRepository();
    expect(screen.getByTestId('analogue-text-27:2-word')).toHaveTextContent(quran.getAyah('27:2').words.slice(1, 3).join(' '));
    expect(screen.getByTestId('self-text-27:2-2:2-word')).toHaveTextContent(quran.getAyah('2:2').words[6]);
    // Highlighting never changes the text.
    expect(screen.getByTestId('analogue-text-27:2-source')).toHaveTextContent(quran.getAyah('27:2').text, { exact: true });
    expect(screen.getByTestId('rule-27:2-status')).toHaveTextContent('مسوّدة');
  });

  it('hides non-pilot semantic pairs by default and lists them via the filter, with no precise difference location', async () => {
    const screen = await open('/ayah/2/3'); // 2:3 has non-pilot semantic pairs (little shared wording)
    // Default view: only pilot pairs may be semantic (PO: pilot always visible, with a type badge).
    const defaultSemantic = screen.queryAllByTestId(/^analogue-type-semantic-/);
    for (const el of defaultSemantic) {
      const id = String(el.props.testID).replace('analogue-type-semantic-', '');
      expect(screen.getByTestId(`analogue-pilot-${id}`)).toBeTruthy();
    }
    expect(screen.getAllByTestId(/^analogue-type-lafzi-/).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByTestId('similarity-semantic'));
    expect(screen.getAllByTestId(/^analogue-type-semantic-/).length).toBeGreaterThan(defaultSemantic.length);
    expect(screen.queryAllByTestId(/^analogue-type-lafzi-/)).toHaveLength(0);
    expect(screen.getAllByTestId(/^rule-.*-semantic$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/لا يتوفر تحديد دقيق لموضع الاختلاف/).length).toBeGreaterThan(0);
  });
});

