import { ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EditorToolbar } from '../features/editor/components/EditorToolbar'
import { PageCanvas } from '../features/editor/components/PageCanvas'
import { PropertyPanel } from '../features/editor/components/PropertyPanel'
import { bookSerializationService } from '../services/book/bookSerializationService'
import { bookService } from '../services/book/bookService'
import { pdfExportService } from '../services/pdf/pdfExportService'
import { useBookEditorStore } from '../store/useBookEditorStore'
import { DEFAULT_PAGE_FORMAT, getPageSize } from '../utils/canvasConstants'
import { circledNumber } from '../utils/circledNumber'
import type { TextElement } from '../types/element'

export const EditorPage = () => {
  const params = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfPreviewUrlRef = useRef<string | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [activeDialog, setActiveDialog] = useState<'pageActions' | null>(null)
  const [duplicateInsertBodyIndex, setDuplicateInsertBodyIndex] = useState(0)
  const [inlineTextEditing, setInlineTextEditing] = useState(false)
  const {
    currentBook,
    selectedPageId,
    selectedElementId,
    isDirty,
    loadBook,
    setSelectedPage,
    setSelectedElement,
    clearSelection,
    addTextElement,
    addImageElement,
    updateElement,
    deleteSelectedElement,
    updatePageBackground,
    addBodyPage,
    duplicateSelectedPageAtBodyIndex,
    deleteSelectedPage,
    updateTextSettings,
    bringSelectedElementToFront,
    sendSelectedElementToBack,
    moveSelectedElementForward,
    moveSelectedElementBackward,
    applySelectedImageTransparency,
    fitSelectedImageToPage,
    updateBookTitle,
    markSaved,
  } = useBookEditorStore()

  useEffect(() => {
    const load = async () => {
      if (!params.bookId) return
      if (currentBook?.id === params.bookId) return
      const book = await bookService.findById(params.bookId)
      if (!book) {
        navigate('/')
        return
      }
      loadBook(book)
    }
    void load()
  }, [params.bookId, currentBook?.id, loadBook, navigate])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') deleteSelectedElement()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteSelectedElement])

  useEffect(() => {
    if (!currentBook || !isDirty) return
    const timer = setTimeout(async () => {
      await bookService.save(currentBook)
      markSaved()
    }, 1200)
    return () => clearTimeout(timer)
  }, [currentBook, isDirty, markSaved])

  const selectedPage = useMemo(() => {
    if (!currentBook || !selectedPageId) return null
    if (currentBook.coverPage.id === selectedPageId) return currentBook.coverPage
    return currentBook.bodyPages.find((page) => page.id === selectedPageId) ?? null
  }, [currentBook, selectedPageId])

  const selectedElement = useMemo(() => {
    if (!selectedPage || !selectedElementId) return null
    return selectedPage.elements.find((element) => element.id === selectedElementId) ?? null
  }, [selectedPage, selectedElementId])

  const pageSize = useMemo(
    () => getPageSize(currentBook?.pageFormat ?? DEFAULT_PAGE_FORMAT),
    [currentBook?.pageFormat],
  )

  const pageChoices = useMemo(() => {
    if (!currentBook) return []
    return [
      { id: currentBook.coverPage.id, label: '表紙' },
      ...currentBook.bodyPages.map((page, index) => ({
        id: page.id,
        label: `${index + 1}ページ`,
      })),
    ]
  }, [currentBook])

  const orderedPageIds = useMemo(
    () => (currentBook ? [currentBook.coverPage.id, ...currentBook.bodyPages.map((p) => p.id)] : []),
    [currentBook],
  )

  const pageNav = useMemo(() => {
    const idx = selectedPageId ? orderedPageIds.indexOf(selectedPageId) : -1
    const label = pageChoices.find((c) => c.id === selectedPageId)?.label ?? '—'
    return {
      index: idx,
      label,
      canPrev: idx > 0,
      canNext: idx >= 0 && idx < orderedPageIds.length - 1,
      prevId: idx > 0 ? orderedPageIds[idx - 1] : null,
      nextId: idx >= 0 && idx < orderedPageIds.length - 1 ? orderedPageIds[idx + 1] : null,
    }
  }, [orderedPageIds, pageChoices, selectedPageId])

  /** 「Nページへコピー」＝その位置に挿入（新しい N ページになる）。末尾は (L+1)ページへ */
  const duplicatePlacementOptions = useMemo(() => {
    if (!currentBook) return [] as { insertBodyIndex: number; label: string }[]
    const L = currentBook.bodyPages.length
    const opts: { insertBodyIndex: number; label: string }[] = [
      { insertBodyIndex: 0, label: '表紙へコピー' },
    ]
    for (let slot = 2; slot <= L + 1; slot++) {
      opts.push({
        insertBodyIndex: slot - 1,
        label: `${slot}ページへコピー`,
      })
    }
    return opts
  }, [currentBook])

  useEffect(() => {
    if (activeDialog !== 'pageActions' || !currentBook || !selectedPageId) return
    if (currentBook.coverPage.id === selectedPageId) {
      setDuplicateInsertBodyIndex(0)
      return
    }
    const bi = currentBook.bodyPages.findIndex((p) => p.id === selectedPageId)
    if (bi >= 0) setDuplicateInsertBodyIndex(bi + 1)
  }, [activeDialog, selectedPageId, currentBook])

  const textSelectItems = useMemo(() => {
    if (!selectedPage) return []
    const texts = selectedPage.elements.filter((e): e is TextElement => e.type === 'text')
    const sorted = [...texts].sort((a, b) => b.zIndex - a.zIndex)
    return sorted.map((el, i) => ({
      id: el.id,
      label: `テキスト${circledNumber(i + 1)}`,
    }))
  }, [selectedPage])

  const handleSave = async () => {
    if (!currentBook) return
    await bookService.save(currentBook)
    markSaved()
  }

  const handleExportJson = () => {
    if (!currentBook) return
    const raw = bookSerializationService.exportJson(currentBook)
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${currentBook.title}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = async () => {
    if (!currentBook) return
    await pdfExportService.exportBookAsPdf(currentBook)
  }

  const closePdfPreview = () => {
    if (pdfPreviewUrlRef.current) {
      URL.revokeObjectURL(pdfPreviewUrlRef.current)
      pdfPreviewUrlRef.current = null
    }
    setPdfPreviewUrl(null)
  }

  const handlePreviewPdf = async () => {
    if (!currentBook) return
    try {
      const blob = await pdfExportService.buildBookPdfBlob(currentBook)
      const url = URL.createObjectURL(blob)
      if (pdfPreviewUrlRef.current) URL.revokeObjectURL(pdfPreviewUrlRef.current)
      pdfPreviewUrlRef.current = url
      setPdfPreviewUrl(url)
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : 'PDFの生成に失敗しました')
    }
  }

  useEffect(() => () => {
    if (pdfPreviewUrlRef.current) URL.revokeObjectURL(pdfPreviewUrlRef.current)
  }, [])

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    addImageElement(dataUrl)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImageTransparency = async () => {
    try {
      await applySelectedImageTransparency()
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : '透過処理に失敗しました'
      window.alert(message)
    }
  }

  const handleImageAutoFit = async () => {
    try {
      await fitSelectedImageToPage()
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : '自動サイズ合わせに失敗しました'
      window.alert(message)
    }
  }

  const imageToolsDisabled = selectedElement?.type !== 'image'

  if (!currentBook || !selectedPage) {
    return <div className="p-6 text-sm text-zinc-600">読み込み中...</div>
  }

  return (
    <main className="flex h-dvh max-h-dvh min-h-0 flex-row gap-3 overflow-hidden p-2 md:p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />
      <section className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-center gap-2 px-1 pb-2">
          <button
            type="button"
            title="前のページ"
            disabled={!pageNav.canPrev}
            onClick={() => pageNav.prevId && setSelectedPage(pageNav.prevId)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            <span className="sr-only">前のページ</span>
          </button>
          <div className="min-w-0 rounded-full border border-amber-200 bg-white px-4 py-1.5 text-center shadow-sm">
            <span className="text-xs text-zinc-500">編集中</span>
            <p className="truncate text-sm font-bold text-zinc-800">{pageNav.label}</p>
          </div>
          <button
            type="button"
            title="ページ操作（複製・追加・削除など）"
            onClick={() => setActiveDialog('pageActions')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-900 shadow-sm hover:bg-amber-100"
          >
            <Copy className="h-4 w-4" aria-hidden />
            <span className="sr-only">ページ操作を開く</span>
          </button>
          <button
            type="button"
            title="次のページ"
            disabled={!pageNav.canNext}
            onClick={() => pageNav.nextId && setSelectedPage(pageNav.nextId)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
            <span className="sr-only">次のページ</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <PageCanvas
            page={selectedPage}
            pageWidth={pageSize.width}
            pageHeight={pageSize.height}
            selectedElementId={selectedElementId}
            onSelectElement={(id) => (id ? setSelectedElement(id) : clearSelection())}
            onUpdateElement={updateElement}
            onInlineTextEditChange={setInlineTextEditing}
          />
        </div>
      </section>
      <aside className="relative z-20 flex w-[min(17rem,34vw)] shrink-0 flex-col gap-2 overflow-hidden overscroll-contain md:w-72 min-h-0">
        <header className="shrink-0 rounded-xl bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <input
              value={currentBook.title}
              onChange={(event) => updateBookTitle(event.target.value)}
              className="w-full rounded-lg border border-amber-200 px-2 py-1.5 text-sm font-bold outline-none"
            />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full rounded-md bg-zinc-200 px-2 py-1.5 text-xs"
            >
              トップへ戻る
            </button>
          </div>
        </header>
        <EditorToolbar
          density="compact"
          onAddText={() => addTextElement()}
          textSelectItems={textSelectItems}
          onSelectTextElement={(id) => setSelectedElement(id)}
          onUploadImage={() => fileInputRef.current?.click()}
          onDeleteElement={deleteSelectedElement}
          onSave={handleSave}
          onExportJson={handleExportJson}
          onOpenViewer={() => navigate(`/viewer/${currentBook.id}`)}
          onExportPdf={handleExportPdf}
          onPreviewPdf={handlePreviewPdf}
          onBringToFront={bringSelectedElementToFront}
          onSendToBack={sendSelectedElementToBack}
          onMoveForward={moveSelectedElementForward}
          onMoveBackward={moveSelectedElementBackward}
          onImageTransparency={handleImageTransparency}
          onImageAutoFit={handleImageAutoFit}
          imageToolsDisabled={imageToolsDisabled}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin]">
          <PropertyPanel
            compact
            className="min-h-0"
            inlineTextEditing={inlineTextEditing}
            page={selectedPage}
            selectedElement={selectedElement}
            onChangeBackground={updatePageBackground}
            onUpdateText={updateTextSettings}
          />
        </div>
      </aside>

      <ActionDialog
        title="ページ操作"
        open={activeDialog === 'pageActions'}
        onClose={() => setActiveDialog(null)}
      >
        <div className="grid gap-3">
          <button
            type="button"
            onClick={addBodyPage}
            className="rounded-lg bg-amber-400 px-3 py-2 text-sm text-white"
          >
            ページを追加
          </button>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 space-y-2">
            <p className="text-xs font-medium text-zinc-600">現在のページをコピー</p>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">コピー先</span>
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm outline-none"
                value={String(
                  duplicatePlacementOptions.some((o) => o.insertBodyIndex === duplicateInsertBodyIndex)
                    ? duplicateInsertBodyIndex
                    : (duplicatePlacementOptions[0]?.insertBodyIndex ?? 0),
                )}
                onChange={(event) => setDuplicateInsertBodyIndex(Number(event.target.value))}
              >
                {duplicatePlacementOptions.map((opt) => (
                  <option key={`${opt.insertBodyIndex}-${opt.label}`} value={String(opt.insertBodyIndex)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                duplicateSelectedPageAtBodyIndex(duplicateInsertBodyIndex)
                setActiveDialog(null)
              }}
              className="w-full rounded-lg bg-zinc-700 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              コピーを実行
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              deleteSelectedPage()
              setActiveDialog(null)
            }}
            className="rounded-lg bg-rose-500 px-3 py-2 text-sm text-white"
          >
            選択中ページを削除
          </button>
        </div>
      </ActionDialog>

      {pdfPreviewUrl ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/55 p-3 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-preview-title"
          onClick={closePdfPreview}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-zinc-100 shadow-2xl ring-1 ring-black/10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-2">
              <h2 id="pdf-preview-title" className="text-sm font-semibold text-zinc-800">
                PDFプレビュー（配布用の見た目）
              </h2>
              <button
                type="button"
                onClick={closePdfPreview}
                className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300"
              >
                閉じる
              </button>
            </div>
            <iframe
              title="PDFプレビュー"
              src={pdfPreviewUrl}
              className="min-h-[65vh] w-full flex-1 border-0 bg-zinc-200"
            />
            <p className="shrink-0 border-t border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-500">
              ブラウザ組み込みのPDFビューアで表示しています。多くの環境ではページが上から下へ縦に並びます（見開き1枚＝横長の1ページとしてPDF化しているため）。端末によっては表示されない場合があります。
            </p>
          </div>
        </div>
      ) : null}
    </main>
  )
}

const ActionDialog = ({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4" onClick={onClose}>
      <section
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-700">{title}</h3>
          <button onClick={onClose} className="rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-600">
            閉じる
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
