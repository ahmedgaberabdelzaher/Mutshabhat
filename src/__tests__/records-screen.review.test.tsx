// Each test file has its own module registry, so the build flavor is fixed before the app modules load.
process.env.EXPO_PUBLIC_APP_FLAVOR = 'review';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const RecordsScreen = require('@/app/records').default;
const { getQuranRepository } = require('@/data');
/* eslint-enable @typescript-eslint/no-require-imports */

describe('records screen — review build', () => {
  it('shows candidate records with a visible status badge (QMT-48 AC4)', async () => {
    const screen = await renderRouter({ records: RecordsScreen }, { initialUrl: '/records' });
    expect(screen.getByText('نسخة المراجعة')).toBeTruthy();
    // Pilot filter is the default: HifzLink pairs, status «قيد المراجعة».
    expect(screen.getAllByText('قيد المراجعة').length).toBeGreaterThan(0);
  });

  it('titles each record with its similar phrase from the data (group title)', async () => {
    const screen = await renderRouter({ records: RecordsScreen }, { initialUrl: '/records' });
    const words = getQuranRepository().getAyah('2:25').words;
    expect(screen.getByTestId('title-record-hifzlink:2:25~3:15')).toHaveTextContent(words.slice(7, 12).join(' '), {
      exact: true,
    });
    expect(screen.getByTestId('record-hifzlink:2:25~3:15')).toHaveTextContent(/البقرة ٢٥ · آل عمران ١٥/);
  });
});
