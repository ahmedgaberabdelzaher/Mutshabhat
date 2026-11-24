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

  it('handles an ayah with no analogues', async () => {
    const screen = await open('/ayah/108/1');
    expect(screen.getByTestId('no-analogues')).toHaveTextContent('لا توجد نظائر مرشّحة لهذه الآية.');
  });
});
