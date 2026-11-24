process.env.EXPO_PUBLIC_APP_FLAVOR = 'review';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const SurahPicker = require('@/app/browse/surah/index').default;
const SurahPositions = require('@/app/browse/surah/[surah]').default;
const JuzPicker = require('@/app/browse/juz/index').default;
const JuzPositions = require('@/app/browse/juz/[juz]').default;
/* eslint-enable @typescript-eslint/no-require-imports */

const routes = {
  'browse/surah/index': SurahPicker,
  'browse/surah/[surah]': SurahPositions,
  'browse/juz/index': JuzPicker,
  'browse/juz/[juz]': JuzPositions,
};

describe('browse by surah — review build (QMT-30)', () => {
  it('lists the 114 surahs with Arabic names', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/surah' });
    expect(screen.getByTestId('surah-1')).toHaveTextContent(/الفاتحة/);
    expect(screen.getByTestId('surah-2')).toHaveTextContent(/البقرة/);
  });

  it('shows only positions of the chosen surah, in mushaf order, with status badges', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/surah/27' });
    expect(screen.getByTestId('position-27:2')).toBeTruthy();
    expect(screen.queryByTestId('position-2:2')).toBeNull();
    expect(screen.getAllByText('قيد المراجعة').length).toBeGreaterThan(0);
    const ids = screen.getAllByTestId(/^position-/).map((n: { props: { testID: string } }) => n.props.testID);
    const ayahNos = ids.map((id: string) => Number(id.split(':')[1]));
    expect(ids.every((id: string) => id.startsWith('position-27:'))).toBe(true);
    expect([...ayahNos].sort((a, b) => a - b)).toEqual(ayahNos);
  });
});

describe('browse by juz — review build (QMT-31)', () => {
  it('lists the 30 juz', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/juz' });
    expect(screen.getByTestId('juz-1')).toHaveTextContent(/الجزء ١/);
    expect(screen.getByTestId('juz-2')).toHaveTextContent(/البقرة ١٤٢/);
  });

  it('shows only positions inside the chosen juz, with status badges', async () => {
    const { getQuranRepository } = require('@/data'); // eslint-disable-line @typescript-eslint/no-require-imports
    const screen = await renderRouter(routes, { initialUrl: '/browse/juz/30' });
    const ids = screen.getAllByTestId(/^position-/).map((n: { props: { testID: string } }) => n.props.testID.slice(9));
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id: string) => getQuranRepository().getAyah(id).juz === 30)).toBe(true);
    expect(screen.queryAllByText(/مسوّدة|قيد المراجعة/).length).toBeGreaterThan(0);
  });
});
