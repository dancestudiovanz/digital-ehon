import type { BookElement, FontFamily, TextElement } from '../../../types/element'
import type { Page } from '../../../types/page'
import { resolveFontStack } from '../../../utils/fontStacks'

const FONT_CHOICES: { value: FontFamily; label: string }[] = [
  { value: 'Noto Sans JP', label: 'Noto Sans JP' },
  { value: 'sans-serif', label: 'サンセリフ' },
  { value: 'serif', label: 'セリフ' },
  { value: 'cursive', label: '筆記体' },
]

/** ページ背景のワンタップ色（絵本向け） */
const BACKGROUND_PALETTE = [
  '#ffffff',
  '#fffbeb',
  '#fef3c7',
  '#fde68a',
  '#fcd34d',
  '#fed7aa',
  '#fecaca',
  '#fce7f3',
  '#f5d0fe',
  '#e9d5ff',
  '#e0e7ff',
  '#dbeafe',
  '#cffafe',
  '#d1fae5',
  '#ecfccb',
  '#f3f4f6',
  '#e4e4e7',
  '#d4d4d8',
  '#78716c',
  '#1f2937',
] as const

/** 文字色プリセット */
const TEXT_COLOR_PALETTE = [
  '#1f2937',
  '#000000',
  '#ffffff',
  '#b45309',
  '#b91c1c',
  '#be123c',
  '#a21caf',
  '#6d28d9',
  '#1d4ed8',
  '#0f766e',
  '#15803d',
  '#4d7c0f',
] as const

type Props = {
  className?: string
  /** 右サイドバー用の高密度レイアウト */
  compact?: boolean
  /** キャンバス上でテキストを直接編集中（内容はキャンバス側のみ） */
  inlineTextEditing?: boolean
  page: Page
  selectedElement: BookElement | null
  onChangeBackground: (color: string) => void
  onUpdateText: (patch: {
    text?: string
    fontSize?: number
    color?: string
    fontFamily?: TextElement['fontFamily']
    fontWeight?: TextElement['fontWeight']
    textAlign?: TextElement['textAlign']
  }) => void
}

export const PropertyPanel = ({
  className = '',
  compact = false,
  inlineTextEditing = false,
  page,
  selectedElement,
  onChangeBackground,
  onUpdateText,
}: Props) => {
  const text = selectedElement?.type === 'text' ? selectedElement : null
  const swatchClass = compact
    ? 'h-5 w-5 shrink-0 rounded border shadow-sm'
    : 'h-7 w-7 shrink-0 rounded-md border shadow-sm'
  const swatchGap = compact ? 'gap-1' : 'gap-1.5'

  const textFormatControls = text && (
    <>
      {!inlineTextEditing && (
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">内容</span>
          <textarea
            value={text.text}
            onChange={(event) => onUpdateText({ text: event.target.value })}
            className={`w-full resize-y rounded-lg border border-zinc-200 text-sm ${compact ? 'h-12 p-1.5' : 'h-16 p-2'}`}
            style={{ fontFamily: resolveFontStack(text.fontFamily) }}
          />
        </label>
      )}
      <div className="block space-y-1">
        <span className="text-xs text-zinc-500">フォント</span>
        <div className="grid gap-1">
          {FONT_CHOICES.map((choice) => {
            const active = text.fontFamily === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                title={choice.label}
                onClick={() => onUpdateText({ fontFamily: choice.value })}
                className={`w-full rounded-lg border px-2 py-1.5 text-left transition-colors ${
                  active
                    ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300'
                    : 'border-zinc-200 bg-white hover:border-amber-200 hover:bg-zinc-50'
                } ${compact ? 'py-1 text-[11px]' : 'text-sm'}`}
              >
                <span
                  className="block truncate font-medium text-zinc-800"
                  style={{ fontFamily: resolveFontStack(choice.value) }}
                >
                  {choice.label}
                </span>
                <span
                  className="mt-0.5 block truncate text-zinc-500"
                  style={{ fontFamily: resolveFontStack(choice.value) }}
                >
                  あいう ABC 123
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <label className="block space-y-1">
        <span className="text-xs text-zinc-500">サイズ（px）</span>
        <input
          type="number"
          min={10}
          max={120}
          value={text.fontSize}
          onChange={(event) => onUpdateText({ fontSize: Number(event.target.value) || 20 })}
          className={`w-full rounded-lg border border-zinc-200 text-sm ${compact ? 'px-1.5 py-1 text-xs' : 'px-2 py-1.5'}`}
        />
      </label>
      <div className="space-y-1">
        <span className="text-xs text-zinc-500">文字色</span>
        <div className={`flex flex-wrap ${swatchGap}`}>
          {TEXT_COLOR_PALETTE.map((hex) => (
            <button
              key={hex}
              type="button"
              title={hex}
              aria-label={`文字色 ${hex}`}
              onClick={() => onUpdateText({ color: hex })}
              className={`${swatchClass} ${
                text.color.toLowerCase() === hex.toLowerCase()
                  ? 'ring-2 ring-amber-500 ring-offset-1'
                  : 'border-zinc-200'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <label className="mt-1 flex items-center gap-2">
          <span className="text-xs text-zinc-500">カスタム</span>
          <input
            type="color"
            value={normalizeHexForInput(text.color)}
            onChange={(event) => onUpdateText({ color: event.target.value })}
            className={`cursor-pointer rounded border border-zinc-200 bg-white p-0.5 ${compact ? 'h-7 w-10' : 'h-9 w-14'}`}
          />
        </label>
      </div>
      <div className={`flex flex-wrap ${swatchGap}`}>
        <button
          type="button"
          className={`rounded-lg text-xs ${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'} ${
            text.fontWeight === 'bold' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700'
          }`}
          onClick={() => onUpdateText({ fontWeight: text.fontWeight === 'bold' ? 'normal' : 'bold' })}
        >
          太字
        </button>
        {(['left', 'center', 'right'] as const).map((align) => (
          <button
            key={align}
            type="button"
            className={`rounded-lg text-xs ${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'} ${
              text.textAlign === align ? 'bg-amber-500 text-white' : 'bg-zinc-200 text-zinc-700'
            }`}
            onClick={() => onUpdateText({ textAlign: align })}
          >
            {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
          </button>
        ))}
      </div>
    </>
  )

  return (
    <div
      className={`w-full rounded-2xl bg-white shadow-sm ${className} ${
        compact ? 'space-y-2 rounded-xl p-2' : 'space-y-3 p-3'
      }`}
    >
      <h3 className={`font-bold text-zinc-700 ${compact ? 'text-xs' : 'text-sm'}`}>ページとテキスト</h3>

      {text && inlineTextEditing && (
        <div
          className={`space-y-2 rounded-xl border-2 border-amber-400 bg-amber-50/80 shadow-inner ${compact ? 'p-2' : 'p-3'}`}
        >
          <div className="flex items-center gap-2">
            <span className={`font-bold text-amber-900 ${compact ? 'text-xs' : 'text-sm'}`}>テキスト編集</span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900">
              編集中
            </span>
          </div>
          {!compact && (
            <p className="text-xs leading-relaxed text-amber-900/90">
              文字の入力・改行は<strong>キャンバス上のボックス</strong>で行い、このパネルからフォント・サイズ・色を調整できます。
            </p>
          )}
          {textFormatControls}
        </div>
      )}

      <div className="space-y-2">
        <span className={`font-medium text-zinc-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>ページ背景</span>
        <div className={`flex flex-wrap ${swatchGap}`}>
          {BACKGROUND_PALETTE.map((hex) => (
            <button
              key={hex}
              type="button"
              title={hex}
              aria-label={`背景色 ${hex}`}
              onClick={() => onChangeBackground(hex)}
              className={`${swatchClass} ${
                page.backgroundColor.toLowerCase() === hex.toLowerCase()
                  ? 'ring-2 ring-amber-500 ring-offset-1'
                  : 'border-zinc-200'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">カスタム</span>
          <input
            type="color"
            value={normalizeHexForInput(page.backgroundColor)}
            onChange={(event) => onChangeBackground(event.target.value)}
            className={`cursor-pointer rounded border border-zinc-200 bg-white p-0.5 ${compact ? 'h-7 w-10' : 'h-9 w-14'}`}
          />
        </label>
      </div>

      {!text && (
        <p className={`rounded-lg bg-zinc-50 text-zinc-500 ${compact ? 'px-1.5 py-1.5 text-[10px]' : 'px-2 py-2 text-xs'}`}>
          テキストを選択すると、フォント・サイズ・色をここで変更できます。
        </p>
      )}
      {text && !inlineTextEditing && (
        <div className={`space-y-2 border-t border-zinc-100 ${compact ? 'pt-2' : 'pt-3'}`}>
          <span className={`font-medium text-zinc-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>選択中のテキスト</span>
          {textFormatControls}
        </div>
      )}
    </div>
  )
}

/** type=color は #rrggbb 形式を想定。短縮形や無効値は近い値に寄せる */
function normalizeHexForInput(hex: string): string {
  const raw = hex.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return '#000000'
}
