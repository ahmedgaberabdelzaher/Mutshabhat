import { renderRouter, screen } from 'expo-router/testing-library';

import AyahScreen from '@/app/ayah/[surah]/[ayah]';
import SourcesScreen from '@/app/sources';

describe('Sources / attribution (QMT-24)', () => {
  it('shows Tanzil attribution: CC BY 3.0, link, unmodified text, and the licence notice', async () => {
    await renderRouter({ sources: SourcesScreen }, { initialUrl: '/sources' });
    expect(screen.getByText('مشروع تنزيل (Tanzil Project)')).toBeTruthy();
    expect(screen.getByText('الترخيص: Creative Commons Attribution 3.0 (CC BY 3.0)')).toBeTruthy();
    expect(screen.getByText('يُعرَض النص كما هو من غير أي تعديل، وفق شروط الترخيص.')).toBeTruthy();
    expect(screen.getByTestId('source-link-tanzil')).toHaveTextContent('https://tanzil.net/');
    expect(screen.getByTestId('tanzil-notice')).toHaveTextContent(/License: Creative Commons Attribution 3.0/);
  });

  it('credits every bundled dataset and the font', async () => {
    await renderRouter({ sources: SourcesScreen }, { initialUrl: '/sources' });
    for (const key of ['quranpedia', 'waqar144', 'hifzlink', 'amiri']) {
      expect(screen.getByTestId(`source-link-${key}`)).toBeTruthy();
    }
    expect(screen.getByText('الترخيص: Creative Commons Attribution 4.0 (CC BY 4.0)')).toBeTruthy();
  });

  it('shows Quranpedia attribution per its licence: name, link and data version', async () => {
    await renderRouter({ sources: SourcesScreen }, { initialUrl: '/sources' });
    expect(screen.getByText('الموسوعة القرآنية (Quranpedia.net) — مركز أصول')).toBeTruthy();
    expect(screen.getByTestId('source-link-quranpedia')).toHaveTextContent('https://quranpedia.net');
    expect(screen.getByText('الترخيص: Quranpedia.net Data License — إصدار التفريغ 2026-11-21')).toBeTruthy();
    expect(screen.getByText(/تاريخ نسخة البيانات \(dump version\): 2026-11-21/)).toBeTruthy();
    expect(screen.getByText(/نص الترخيص: https:\/\/quranpedia.net\/dumps\/LICENSE.md/)).toBeTruthy();
  });

  it('is reachable from the ayah view', async () => {
    await renderRouter({ 'ayah/[surah]/[ayah]': AyahScreen, sources: SourcesScreen }, { initialUrl: '/ayah/1/1' });
    expect(screen.getByTestId('ayah-attribution')).toHaveTextContent(/CC BY 3.0/);
  });
});
