import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OrientationGuard } from '../features/viewer/components/OrientationGuard'
import { PageRender } from '../features/viewer/components/PageRender'
import { ViewerNavigation } from '../features/viewer/components/ViewerNavigation'
import { buildViewerSteps } from '../features/viewer/services/viewerStepService'
import { bookService } from '../services/book/bookService'
import type { Book } from '../types/book'
import { DEFAULT_PAGE_FORMAT, getPageSize } from '../utils/canvasConstants'

export const ViewerPage = () => {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [coverScale, setCoverScale] = useState(0.78)
  const [spreadScale, setSpreadScale] = useState(0.52)
  const viewportRef = useRef<HTMLElement | null>(null)
  const swipeStartX = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!bookId) return
      const loaded = await bookService.findById(bookId)
      if (!loaded) {
        navigate('/')
        return
      }
      setBook(loaded)
      setStepIndex(0)
    }
    void load()
  }, [bookId, navigate])

  const steps = useMemo(() => (book ? buildViewerSteps(book) : []), [book])
  const step = steps[stepIndex]
  const pageSize = useMemo(
    () => getPageSize(book?.pageFormat ?? DEFAULT_PAGE_FORMAT),
    [book?.pageFormat],
  )

  useLayoutEffect(() => {
    if (!book) return
    const el = viewportRef.current
    if (!el) return

    const measure = () => {
      const w = Math.max(80, el.clientWidth)
      const h = Math.max(80, el.clientHeight)
      const pw = pageSize.width
      const ph = pageSize.height
      const inset = 0.98

      const coverByW = (w * inset) / pw
      const coverByH = (h * inset) / ph
      const nextCover = Math.min(1.2, Math.max(0.32, Math.min(coverByW, coverByH)))

      const spreadByW = (w * inset) / (pw * 2)
      const spreadByH = (h * inset) / ph
      const nextSpread = Math.min(1.25, Math.max(0.28, Math.min(spreadByW, spreadByH)))

      setCoverScale(nextCover)
      setSpreadScale(nextSpread)
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [book, pageSize.height, pageSize.width])

  const handlePrev = () => setStepIndex((prev) => Math.max(0, prev - 1))
  const handleNext = () => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))

  const swipeThresholdPx = 48
  const onSwipeAreaTouchStart = (clientX: number) => {
    swipeStartX.current = clientX
  }
  const onSwipeAreaTouchEnd = (clientX: number) => {
    const start = swipeStartX.current
    swipeStartX.current = null
    if (start === null) return
    const delta = clientX - start
    const maxIndex = steps.length - 1
    setStepIndex((prev) => {
      if (delta > swipeThresholdPx && prev > 0) return prev - 1
      if (delta < -swipeThresholdPx && prev < maxIndex) return prev + 1
      return prev
    })
  }

  const stepLabel = useMemo(() => {
    if (!book || !step) return ''
    if (step.type === 'cover') return '表紙'
    const left = step.pages[0]
    const idx = book.bodyPages.findIndex((p) => p.id === left.id)
    const n = idx >= 0 ? idx + 1 : 0
    return `${n}ページ・${n + 1}ページの見開き`
  }, [book, step])

  if (!book || !step) {
    return <div className="p-6 text-sm text-zinc-600">閲覧データを読み込み中...</div>
  }

  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-zinc-500 via-zinc-500 to-zinc-600">
      <OrientationGuard />
      <header className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-zinc-900/25 px-4 py-3 text-white backdrop-blur-sm md:px-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">{book.title}</h1>
          <p className="text-xs text-zinc-200">{stepLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/editor/${book.id}`)}
          className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/25"
        >
          編集画面へ戻る
        </button>
      </header>

      <section
        ref={viewportRef}
        className="flex min-h-0 min-w-0 w-full flex-1 touch-pan-y items-center justify-center overflow-x-hidden px-2 py-4 sm:px-3 sm:py-5 md:px-6 md:py-6"
        onTouchStart={(e) => onSwipeAreaTouchStart(e.touches[0]?.clientX ?? 0)}
        onTouchEnd={(e) => onSwipeAreaTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
      >
        <div key={step.key} className="viewer-page-enter flex max-w-full flex-col items-center justify-center">
          {step.type === 'cover' ? (
            <PageRender
              page={step.pages[0]}
              pageWidth={pageSize.width}
              pageHeight={pageSize.height}
              scale={coverScale}
              frameShape="cover"
            />
          ) : (
            <div className="flex w-full max-w-full justify-center overflow-x-hidden overflow-y-visible py-1 sm:py-2">
              <div className="mx-auto flex max-w-full overflow-visible rounded-xl shadow-[0_32px_64px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/20 [isolation:isolate]">
                <PageRender
                  page={step.pages[0]}
                  pageWidth={pageSize.width}
                  pageHeight={pageSize.height}
                  scale={spreadScale}
                  frameShape="spreadLeft"
                />
                <PageRender
                  page={step.pages[1]}
                  pageWidth={pageSize.width}
                  pageHeight={pageSize.height}
                  scale={spreadScale}
                  frameShape="spreadRight"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="shrink-0 border-t border-white/10 bg-zinc-900/20 py-4 backdrop-blur-sm">
        <ViewerNavigation
          index={stepIndex}
          total={steps.length}
          canPrev={stepIndex > 0}
          canNext={stepIndex < steps.length - 1}
          onPrev={handlePrev}
          onNext={handleNext}
        />
        <p className="mx-auto mt-3 max-w-md px-4 text-center text-[11px] leading-relaxed text-zinc-300">
          中央の表示エリアを左右にスワイプしても前後のページへ移動できます（矢印ボタンと同じ動きです）。
        </p>
      </div>
    </main>
  )
}
