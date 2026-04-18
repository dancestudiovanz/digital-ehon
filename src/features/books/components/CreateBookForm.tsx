import { useState, type FormEvent } from 'react'
import type { Book } from '../../../types/book'

type Props = {
  onSubmit: (title: string, bodyPageCount: number, pageFormat: Book['pageFormat']) => Promise<void>
}

export const CreateBookForm = ({ onSubmit }: Props) => {
  const [title, setTitle] = useState('')
  const [bodyPageCount, setBodyPageCount] = useState(8)
  const [pageFormat, setPageFormat] = useState<Book['pageFormat']>('landscape')
  const [isPageCountPickerOpen, setIsPageCountPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    await onSubmit(title, bodyPageCount, pageFormat)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-700">新規絵本を作る</h2>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-600">タイトル</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="たとえば: はじめてのぼうけん"
          className="w-full rounded-xl border border-amber-200 px-3 py-2 outline-none focus:border-amber-400"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-600">ページ数（表紙を除く）</span>
        <button
          type="button"
          onClick={() => setIsPageCountPickerOpen(true)}
          className="w-full rounded-xl border border-amber-200 px-3 py-2 text-left outline-none focus:border-amber-400"
        >
          {bodyPageCount} ページ
        </button>
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-600">成果物サイズ</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPageFormat('square')}
            className={`rounded-xl border px-3 py-2 text-sm ${
              pageFormat === 'square'
                ? 'border-amber-500 bg-amber-100 text-amber-700'
                : 'border-zinc-200 bg-white text-zinc-600'
            }`}
          >
            正方形
          </button>
          <button
            type="button"
            onClick={() => setPageFormat('landscape')}
            className={`rounded-xl border px-3 py-2 text-sm ${
              pageFormat === 'landscape'
                ? 'border-amber-500 bg-amber-100 text-amber-700'
                : 'border-zinc-200 bg-white text-zinc-600'
            }`}
          >
            横長
          </button>
        </div>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-amber-400 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-60"
      >
        {loading ? '作成中...' : '絵本を作成'}
      </button>
      {isPageCountPickerOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-bold text-zinc-700">ページ数を選択</h3>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setBodyPageCount(count)
                    setIsPageCountPickerOpen(false)
                  }}
                  className={`rounded-lg px-2 py-1.5 text-sm ${
                    bodyPageCount === count
                      ? 'bg-amber-400 text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsPageCountPickerOpen(false)}
              className="mt-4 w-full rounded-lg bg-zinc-200 px-3 py-2 text-sm text-zinc-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
