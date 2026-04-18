import {
  Braces,
  ChevronDown,
  ChevronUp,
  Expand,
  Eye,
  FileDown,
  FileSearch,
  ImagePlus,
  Save,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

type TextSelectItem = { id: string; label: string }

type Props = {
  /** compact: 編集系を上段グリッド、保存等は下段で控えめ */
  density?: 'comfortable' | 'compact'
  layout?: 'horizontal' | 'vertical'
  onAddText: () => void
  /** 現在ページのテキスト（手前から）。複数あるときメニューで選べる */
  textSelectItems?: TextSelectItem[]
  onSelectTextElement?: (id: string) => void
  onUploadImage: () => void
  onDeleteElement: () => void
  onSave: () => Promise<void>
  onExportJson: () => void
  onOpenViewer: () => void
  onExportPdf: () => Promise<void>
  onPreviewPdf: () => Promise<void>
  onBringToFront: () => void
  onSendToBack: () => void
  onMoveForward: () => void
  onMoveBackward: () => void
  onImageTransparency?: () => void | Promise<void>
  onImageAutoFit?: () => void | Promise<void>
  imageToolsDisabled?: boolean
}

const iconBtn =
  'inline-flex flex-col items-center justify-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-1.5 text-[10px] font-medium leading-tight text-zinc-800 hover:bg-amber-50 hover:border-amber-200 disabled:cursor-not-allowed disabled:opacity-40'

const iconBtnPrimary = (tone: string) =>
  `${iconBtn} border-transparent text-white ${tone}`

const subtleIcon =
  'inline-flex h-8 w-full items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-50/80 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'

const comfortableTextBtn =
  'rounded-lg px-3 py-2 text-sm text-white inline-flex w-full items-center justify-center gap-1'

function TextToolMenuButton({
  variant,
  onAddText,
  textSelectItems,
  onSelectTextElement,
}: {
  variant: 'compact' | 'comfortable'
  onAddText: () => void
  textSelectItems: TextSelectItem[]
  onSelectTextElement?: (id: string) => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const hasChoices = textSelectItems.length > 0 && onSelectTextElement

  const handleButtonClick = () => {
    if (!hasChoices) {
      onAddText()
      return
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const t = event.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const rect = open && btnRef.current ? btnRef.current.getBoundingClientRect() : null

  const menu =
    open &&
    hasChoices &&
    rect &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        className="min-w-[11rem] rounded-lg border border-zinc-200 bg-white py-1 text-left shadow-xl"
        style={{
          position: 'fixed',
          top: rect.bottom + 6,
          left: rect.left,
          zIndex: 100,
        }}
      >
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-amber-50"
          onClick={() => {
            onAddText()
            setOpen(false)
          }}
        >
          新規テキスト
        </button>
        <div className="my-1 border-t border-zinc-100" />
        {textSelectItems.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-amber-50"
            onClick={() => {
              onSelectTextElement?.(item.id)
              setOpen(false)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body,
    )

  return (
    <>
      {variant === 'compact' ? (
        <button
          ref={btnRef}
          type="button"
          className={iconBtnPrimary('bg-amber-400')}
          title={hasChoices ? 'テキストを追加または選択' : 'テキスト追加'}
          onClick={handleButtonClick}
        >
          <Type size={18} strokeWidth={2} />
          テキスト
        </button>
      ) : (
        <button
          ref={btnRef}
          type="button"
          className={`${comfortableTextBtn} bg-amber-400`}
          title={hasChoices ? 'テキストを追加または選択' : 'テキスト追加'}
          onClick={handleButtonClick}
        >
          <span className="inline-flex items-center gap-1">
            <Type size={16} />
            テキスト追加
          </span>
        </button>
      )}
      {menu}
    </>
  )
}

export const EditorToolbar = ({
  density = 'compact',
  layout = 'horizontal',
  onAddText,
  textSelectItems = [],
  onSelectTextElement,
  onUploadImage,
  onDeleteElement,
  onSave,
  onExportJson,
  onOpenViewer,
  onExportPdf,
  onPreviewPdf,
  onBringToFront,
  onSendToBack,
  onMoveForward,
  onMoveBackward,
  onImageTransparency,
  onImageAutoFit,
  imageToolsDisabled = true,
}: Props) => {
  const [layerOpen, setLayerOpen] = useState(false)
  const [exportMoreOpen, setExportMoreOpen] = useState(false)

  if (density === 'compact') {
    return (
      <div className="rounded-xl bg-white p-2 shadow-sm">
        <p className="mb-1 px-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">編集</p>
        <div className="grid grid-cols-3 gap-1.5">
          <TextToolMenuButton
            variant="compact"
            onAddText={onAddText}
            textSelectItems={textSelectItems}
            onSelectTextElement={onSelectTextElement}
          />
          <button type="button" className={iconBtnPrimary('bg-sky-500')} onClick={onUploadImage} title="画像追加">
            <ImagePlus size={18} />
            画像
          </button>
          <button type="button" className={iconBtnPrimary('bg-zinc-600')} onClick={onDeleteElement} title="要素削除">
            <Trash2 size={18} />
            削除
          </button>
          {onImageTransparency && (
            <button
              type="button"
              className={iconBtnPrimary('bg-teal-600')}
              disabled={imageToolsDisabled}
              title="透過処理"
              onClick={() => void onImageTransparency()}
            >
              <Sparkles size={18} />
              透過
            </button>
          )}
          {onImageAutoFit && (
            <button
              type="button"
              className={iconBtnPrimary('bg-cyan-700')}
              disabled={imageToolsDisabled}
              title="自動サイズ合わせ"
              onClick={() => void onImageAutoFit()}
            >
              <Expand size={18} />
              合わせ
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setLayerOpen((v) => !v)}
          className="mt-1.5 flex w-full items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/80 px-2 py-1 text-[10px] font-medium text-zinc-500"
        >
          重なり順
          {layerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {layerOpen && (
          <div className="mt-1 grid grid-cols-2 gap-1">
            <button type="button" className={iconBtn} onClick={onBringToFront}>
              前面
            </button>
            <button type="button" className={iconBtn} onClick={onSendToBack}>
              背面
            </button>
            <button type="button" className={iconBtn} onClick={onMoveForward}>
              1段↑
            </button>
            <button type="button" className={iconBtn} onClick={onMoveBackward}>
              1段↓
            </button>
          </div>
        )}

        <p className="mb-1 mt-2 px-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300">書き出し</p>
        <div className="grid grid-cols-4 gap-1">
          <button type="button" className={subtleIcon} title="保存" onClick={() => void onSave()}>
            <Save size={16} />
          </button>
          <button type="button" className={subtleIcon} title="PDF出力" onClick={() => void onExportPdf()}>
            <FileDown size={16} />
          </button>
          <button type="button" className={subtleIcon} title="PDFをこの画面で確認" onClick={() => void onPreviewPdf()}>
            <FileSearch size={16} />
          </button>
          <button type="button" className={subtleIcon} title="閲覧モード" onClick={onOpenViewer}>
            <Eye size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setExportMoreOpen((v) => !v)}
          className="mt-1 flex w-full items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/80 px-2 py-1 text-[10px] font-medium text-zinc-500"
        >
          その他（バックアップ等）
          {exportMoreOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {exportMoreOpen ? (
          <div className="mt-1 space-y-1">
            <button
              type="button"
              className={`${subtleIcon} h-9 flex-row gap-1.5`}
              title="JSONをダウンロード。再読み込みはトップ画面の「JSONインポート」から同じファイルを選びます"
              onClick={onExportJson}
            >
              <Braces size={16} />
              <span className="text-[10px] font-medium text-zinc-600">JSON出力</span>
            </button>
            <p className="px-0.5 text-[9px] leading-snug text-zinc-400">バックアップ・データ移行用。普段は不要です。</p>
          </div>
        ) : null}
      </div>
    )
  }

  const isVertical = layout === 'vertical'
  const wrap = isVertical
    ? 'flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm'
    : 'flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm'
  const btn =
    'rounded-lg px-3 py-2 text-sm text-white ' +
    (isVertical ? 'inline-flex w-full items-center justify-center gap-1' : '')

  return (
    <div className={wrap}>
      <TextToolMenuButton
        variant="comfortable"
        onAddText={onAddText}
        textSelectItems={textSelectItems}
        onSelectTextElement={onSelectTextElement}
      />
      <button className={`${btn} bg-sky-500`} onClick={onUploadImage}>
        <span className="inline-flex items-center gap-1">
          <ImagePlus size={16} />
          画像追加
        </span>
      </button>
      {onImageTransparency && (
        <button
          type="button"
          className={`${btn} bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={imageToolsDisabled}
          title="画像を選択しているとき、四隅に近い色を透明にします（単色背景向け）"
          onClick={() => void onImageTransparency()}
        >
          <span className="inline-flex items-center gap-1">
            <Sparkles size={16} />
            透過処理
          </span>
        </button>
      )}
      {onImageAutoFit && (
        <button
          type="button"
          className={`${btn} bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={imageToolsDisabled}
          title="画像を選択しているとき、ページ内に収まる大きさにします"
          onClick={() => void onImageAutoFit()}
        >
          <span className="inline-flex items-center gap-1">
            <Expand size={16} />
            自動サイズ合わせ
          </span>
        </button>
      )}
      <button className={`${btn} bg-zinc-600`} onClick={onDeleteElement}>
        <span className="inline-flex items-center gap-1">
          <Trash2 size={16} />
          要素削除
        </span>
      </button>
      <button className={`${btn} bg-zinc-500`} onClick={onBringToFront}>
        前面へ
      </button>
      <button className={`${btn} bg-zinc-500`} onClick={onSendToBack}>
        背面へ
      </button>
      <button className={`${btn} bg-zinc-400`} onClick={onMoveForward}>
        1段前へ
      </button>
      <button className={`${btn} bg-zinc-400`} onClick={onMoveBackward}>
        1段後へ
      </button>

      <div className={`${isVertical ? 'w-full' : 'w-full'} mt-1 border-t border-zinc-100 pt-3`}>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">書き出し</p>
        <div className={isVertical ? 'flex w-full flex-col gap-2' : 'flex flex-wrap gap-2'}>
          <button className={`${btn} bg-emerald-500`} onClick={() => void onSave()}>
            <span className="inline-flex items-center gap-1">
              <Save size={16} />
              保存
            </span>
          </button>
          <button className={`${btn} bg-rose-500`} onClick={() => void onExportPdf()}>
            <span className="inline-flex items-center gap-1">
              <FileDown size={16} />
              PDF出力
            </span>
          </button>
          <button className={`${btn} bg-amber-600`} onClick={() => void onPreviewPdf()}>
            <span className="inline-flex items-center gap-1">
              <FileSearch size={16} />
              PDFプレビュー
            </span>
          </button>
          <button className={`${btn} bg-violet-500`} onClick={onOpenViewer}>
            <span className="inline-flex items-center gap-1">
              <Eye size={16} />
              閲覧モード
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setExportMoreOpen((v) => !v)}
          className="mt-2 flex w-full items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        >
          その他（バックアップ等）
          {exportMoreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {exportMoreOpen ? (
          <div className="mt-2 space-y-2">
            <button
              type="button"
              className={`${btn} bg-indigo-500`}
              title="JSONをダウンロード。再読み込みはトップ画面の「JSONインポート」から同じファイルを選びます"
              onClick={onExportJson}
            >
              <span className="inline-flex items-center gap-1">
                <Braces size={16} />
                JSON出力
              </span>
            </button>
            <p className="text-xs leading-relaxed text-zinc-500">バックアップ・データ移行用。普段は不要です。</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
