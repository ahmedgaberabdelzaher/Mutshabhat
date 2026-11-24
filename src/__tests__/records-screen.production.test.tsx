// Each test file has its own module registry, so the build flavor is fixed before the app modules load.
process.env.EXPO_PUBLIC_APP_FLAVOR = 'production';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const RecordsScreen = require('@/app/records').default;
/* eslint-enable @typescript-eslint/no-require-imports */

describe('records screen — production build', () => {
  it('shows the empty approved state and no candidate records', async () => {
    const screen = await renderRouter({ records: RecordsScreen }, { initialUrl: '/records' });
    expect(screen.getByTestId('no-approved')).toBeTruthy();
    expect(screen.queryByText('مسوّدة')).toBeNull();
    expect(screen.queryByText('قيد المراجعة')).toBeNull();
  });
});
