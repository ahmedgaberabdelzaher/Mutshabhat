process.env.EXPO_PUBLIC_APP_FLAVOR = 'review';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const SurahPicker = require('@/app/browse/surah/index').default;
const SurahPositions = require('@/app/browse/surah/[surah]').default;
/* eslint-enable @typescript-eslint/no-require-imports */

const routes = { 'browse/surah/index': SurahPicker, 'browse/surah/[surah]': SurahPositions };

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
