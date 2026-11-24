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

  it('says so when no precise range is available', async () => {
    const screen = await open('/ayah/2/255');
    const none = screen.queryAllByText('لا يتوفر تحديد دقيق لموضع الاختلاف من البيانات المرخّصة المتاحة.');
    expect(none.length).toBeGreaterThan(0);
  });
});

