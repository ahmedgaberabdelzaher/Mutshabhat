import { renderRouter, screen } from 'expo-router/testing-library';

import AyahScreen from '@/app/ayah/[surah]/[ayah]';
import { getQuranRepository } from '@/data';

describe('Ayah screen (QMT-23)', () => {
  it('shows the unmodified Tanzil text with ayah number and surah name', async () => {
    await renderRouter({ 'ayah/[surah]/[ayah]': AyahScreen }, { initialUrl: '/ayah/2/255' });
    const expected = getQuranRepository().getAyah('2:255')!.text;
    expect(await screen.findByTestId('ayah-text-source')).toHaveTextContent(expected, { exact: true });
    expect(screen.getByTestId('ayah-number')).toHaveTextContent('الآية ٢٥٥');
    expect(screen.getByText('سورة البقرة')).toBeTruthy();
  });
});
