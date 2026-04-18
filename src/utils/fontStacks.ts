import type { FontFamily } from '../types/element'

/**
 * 保存値（FontFamily）を、実際の描画用スタックに展開する。
 * 同じ generic 名だけだとブラウザ既定で見分けがつかないため、用途別にスタックを分ける。
 */
const FONT_STACKS: Record<FontFamily, string> = {
  'Noto Sans JP':
    '"Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, sans-serif',
  'sans-serif':
    'system-ui, "Segoe UI", "Yu Gothic UI", "Meiryo UI", Meiryo, "MS PGothic", "Hiragino Kaku Gothic ProN", sans-serif',
  serif: '"Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", "Times New Roman", "Noto Serif JP", serif',
  cursive: '"Segoe Print", "Bradley Hand", "Apple Chancery", "Snell Roundhand", cursive',
}

export function resolveFontStack(family: FontFamily): string {
  return FONT_STACKS[family] ?? FONT_STACKS['Noto Sans JP']
}
