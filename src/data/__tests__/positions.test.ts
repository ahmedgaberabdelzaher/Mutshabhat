import { visibilityFor } from '@/config/flavor';
import { productionFixture, reviewFixture } from '@/data/__fixtures__/mutashabihat.fixture';
import { LocalMutashabihatRepository } from '@/data/mutashabihat-repository';
import { getQuranRepository } from '@/data';

const quran = getQuranRepository();
const pos = (id: string) => quran.absoluteIndex(id);
const surahIds = (n: number) => quran.getAyahsOfSurah(n).map((a) => a.id);

describe('positions per division (QMT-30/31/32)', () => {
  it('production: only approved positions of the chosen surah, in mushaf order', () => {
    const repo = new LocalMutashabihatRepository(productionFixture, visibilityFor('production'), pos);
    expect(repo.getPositionsIn(surahIds(2)).map((p) => p.ayahId)).toEqual(['2:5']);
    expect(repo.getPositionsIn(surahIds(31)).map((p) => p.ayahId)).toEqual(['31:5']);
    expect(repo.getPositionsIn(surahIds(27))).toEqual([]); // under_review pair hidden
  });

  it('juz: approved positions inside the chosen juz only', () => {
    const repo = new LocalMutashabihatRepository(productionFixture, visibilityFor('beta'), pos);
    expect(repo.getPositionsIn(quran.getAyahIdsInJuz(1)).map((p) => p.ayahId)).toEqual(['2:5']);
    expect(repo.getPositionsIn(quran.getAyahIdsInJuz(21)).map((p) => p.ayahId)).toEqual(['31:5']);
    expect(repo.getPositionsIn(quran.getAyahIdsInJuz(2))).toEqual([]);
  });

  it('review: candidate positions with their statuses, limited to the division', () => {
    const repo = new LocalMutashabihatRepository(reviewFixture, visibilityFor('review'), pos);
    const inSurah2 = repo.getPositionsIn(surahIds(2));
    expect(inSurah2.map((p) => p.ayahId)).toEqual(['2:2', '2:5']);
    expect(inSurah2[0]).toMatchObject({ analogueCount: 2, pilot: true });
    expect(inSurah2[0].statuses.sort()).toEqual(['draft', 'under_review']);
    expect(repo.getPositionsIn(surahIds(2), 'pilot').map((p) => p.ayahId)).toEqual(['2:2']);
  });
});
