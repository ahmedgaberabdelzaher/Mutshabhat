const DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Format a number with Arabic-Indic digits for display (e.g. 255 -> "٢٥٥"). */
export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => DIGITS[Number(d)]);
}
