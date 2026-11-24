// Each test file has its own module registry, so the build flavor is fixed before the app modules load.
process.env.EXPO_PUBLIC_APP_FLAVOR = 'review';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const RecordsScreen = require('@/app/records').default;
const RecordScreen = require('@/app/record/[id]').default;
const { fireEvent } = require('@testing-library/react-native');
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

  it('shows «هُدًى لِّلْمُتَّقِينَ» once: 2:2 ~ 27:2 and 2:2 ~ 31:3 are one row with all positions (no duplicates)', async () => {
    const screen = await renderRouter(
      { records: RecordsScreen, 'record/[id]': RecordScreen },
      { initialUrl: '/records' },
    );
    const words = getQuranRepository().getAyah('2:2').words;
    const title = words.slice(5, 7).join(' ');
    expect(screen.getAllByText(title)).toHaveLength(1);
    expect(screen.queryByTestId('record-hifzlink:2:2~31:3')).toBeNull();
    expect(screen.getByTestId('refs-hifzlink:2:2~27:2')).toHaveTextContent('البقرة ٢ · النمل ٢ · لقمان ٣');
    // Titles in the list are unique.
    const titles = screen.getAllByTestId(/^title-record-/).map((t: { props: { children: string } }) => t.props.children);
    expect(new Set(titles).size).toBe(titles.length);

    fireEvent.press(screen.getByTestId('record-hifzlink:2:2~27:2'));
    expect(await screen.findByTestId('record-title')).toHaveTextContent(title, { exact: true });
    for (const id of ['2:2', '27:2', '31:3']) expect(screen.getByTestId(`record-position-${id}`)).toBeTruthy();
    expect(screen.getByTestId('record-source-hifzlink:2:2~31:3')).toBeTruthy();
  });
});
