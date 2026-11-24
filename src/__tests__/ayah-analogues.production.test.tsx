process.env.EXPO_PUBLIC_APP_FLAVOR = 'production';

/* eslint-disable @typescript-eslint/no-require-imports -- modules must load after the flavor is set */
const { renderRouter } = require('expo-router/testing-library');
const AyahScreen = require('@/app/ayah/[surah]/[ayah]').default;
/* eslint-enable @typescript-eslint/no-require-imports */

const open = (url: string) => renderRouter({ 'ayah/[surah]/[ayah]': AyahScreen }, { initialUrl: url });

describe('ayah + analogues — production build (QMT-25 AC1, AC2, AC4)', () => {
  it('shows no unapproved analogue: no draft / under_review / rejected record and no badge', async () => {
    const screen = await open('/ayah/2/2');
    expect(screen.getByTestId('ayah-text-source')).toBeTruthy();
    expect(screen.queryByTestId('analogue-27:2')).toBeNull();
    expect(screen.queryByText('قيد المراجعة')).toBeNull();
    expect(screen.queryByText('مسوّدة')).toBeNull();
    expect(screen.queryByText('مرفوض')).toBeNull();
    expect(screen.getByTestId('no-analogues')).toHaveTextContent('لا توجد نظائر معتمدة لهذه الآية بعد.');
  });
});
