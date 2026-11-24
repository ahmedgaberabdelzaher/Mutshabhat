process.env.EXPO_PUBLIC_APP_FLAVOR = 'production';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const SurahPicker = require('@/app/browse/surah/index').default;
const SurahPositions = require('@/app/browse/surah/[surah]').default;
const JuzPicker = require('@/app/browse/juz/index').default;
const JuzPositions = require('@/app/browse/juz/[juz]').default;
const PagePicker = require('@/app/browse/page/index').default;
const PagePositions = require('@/app/browse/page/[page]').default;
/* eslint-enable @typescript-eslint/no-require-imports */

const routes = {
  'browse/surah/index': SurahPicker,
  'browse/surah/[surah]': SurahPositions,
  'browse/juz/index': JuzPicker,
  'browse/juz/[juz]': JuzPositions,
  'browse/page/index': PagePicker,
  'browse/page/[page]': PagePositions,
};

describe('browse by surah — production build (QMT-30)', () => {
  it('shows approved positions only (none yet) and no candidate record', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/surah/2' });
    expect(screen.getByTestId('no-positions')).toHaveTextContent('لا توجد مواضع معتمدة هنا بعد.');
    expect(screen.queryByText('مسوّدة')).toBeNull();
    expect(screen.queryByText('قيد المراجعة')).toBeNull();
  });
});

describe('browse by juz — production build (QMT-31)', () => {
  it('shows approved positions only (none yet)', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/juz/1' });
    expect(screen.getByTestId('no-positions')).toBeTruthy();
    expect(screen.queryByText('مسوّدة')).toBeNull();
  });
});

describe('browse by page — production build (QMT-32)', () => {
  it('shows approved positions only (none yet)', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/page/2' });
    expect(screen.getByTestId('no-positions')).toBeTruthy();
    expect(screen.queryByText('قيد المراجعة')).toBeNull();
  });
});
