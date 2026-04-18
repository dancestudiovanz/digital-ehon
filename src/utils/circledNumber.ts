/** 1〜20 を Unicode の ①〜⑳ に。21 以降は算用数字。 */
export function circledNumber(n: number): string {
  if (n >= 1 && n <= 20) return String.fromCodePoint(0x245f + n)
  return String(n)
}
