process.env.EXPO_PUBLIC_APP_FLAVOR = 'review';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const SurahPicker = require('@/app/browse/surah/index').default;
const SurahPositions = require('@/app/browse/surah/[surah]').default;
const JuzPicker = require('@/app/browse/juz/index').default;
const JuzPositions = require('@/app/browse/juz/[juz]').default;
const PagePicker = require('@/app/browse/page/index').default;
const PagePositions = require('@/app/browse/page/[page]').default;
const { getQuranRepository } = require('@/data');
/* eslint-enable @typescript-eslint/no-require-imports */

const routes = {
  'browse/surah/index': SurahPicker,
  'browse/surah/[surah]': SurahPositions,
  'browse/juz/index': JuzPicker,
  'browse/juz/[juz]': JuzPositions,
  'browse/page/index': PagePicker,
  'browse/page/[page]': PagePositions,
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
    // Title = the similar word/phrase (data), details (surah name + ayah number) kept below it.
    const title = screen.getByTestId('title-position-27:2');
    expect(getQuranRepository().getAyah('27:2').text.includes(String(title.props.children))).toBe(true);
    expect(screen.getByTestId('position-27:2')).toHaveTextContent(/النمل ٢/);
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
    const screen = await renderRouter(routes, { initialUrl: '/browse/juz/30' });
    const ids = screen.getAllByTestId(/^position-/).map((n: { props: { testID: string } }) => n.props.testID.slice(9));
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id: string) => getQuranRepository().getAyah(id).juz === 30)).toBe(true);
    expect(screen.queryAllByText(/مسوّدة|قيد المراجعة/).length).toBeGreaterThan(0);
  });
});

describe('browse by page — review build (QMT-32)', () => {
  it('lists Madinah pages from Tanzil metadata', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/page' });
    expect(screen.getByTestId('page-1')).toHaveTextContent(/الصفحة ١/);
    expect(screen.getByTestId('page-2')).toHaveTextContent(/البقرة ١/);
  });

  it('shows only positions on the chosen page, in mushaf order', async () => {
    const screen = await renderRouter(routes, { initialUrl: '/browse/page/2' });
    const ids = screen.getAllByTestId(/^position-/).map((n: { props: { testID: string } }) => n.props.testID.slice(9));
    expect(ids).toContain('2:2');
    expect(ids.every((id: string) => getQuranRepository().getAyah(id).page === 2)).toBe(true);
    const order = ids.map((id: string) => getQuranRepository().absoluteIndex(id));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
