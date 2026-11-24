import { toArabicDigits } from '@/lib/arabic-digits';
import { parseAyahInput } from '@/lib/parse-ayah-input';

describe('parseAyahInput', () => {
  it.each([
    ['2:255', '2:255'],
    ['٢:٢٥٥', '2:255'],
    ['۲:۲۵۵', '2:255'],
    [' 18 / 10 ', '18:10'],
    ['3 7', '3:7'],
  ])('%s -> %s', (input, expected) => {
    expect(parseAyahInput(input)).toBe(expected);
  });

  it('rejects garbage', () => {
    expect(parseAyahInput('')).toBeNull();
    expect(parseAyahInput('البقرة')).toBeNull();
  });

  it('formats Arabic-Indic digits', () => {
    expect(toArabicDigits(255)).toBe('٢٥٥');
  });
});
