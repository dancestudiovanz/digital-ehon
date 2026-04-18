import type { BookSummary } from '../../../types/book'

type Props = {
  books: BookSummary[]
  onOpen: (bookId: string) => void
  onDelete: (bookId: string) => Promise<void>
}

export const SavedBookList = ({ books, onOpen, onDelete }: Props) => {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-zinc-700">保存済み絵本</h2>
      <div className="space-y-3">
        {books.length === 0 && <p className="text-sm text-zinc-500">まだ保存された絵本はありません。</p>}
        {books.map((book) => (
          <article key={book.id} className="rounded-xl border border-amber-100 p-3">
            <p className="font-semibold text-zinc-700">{book.title}</p>
            <p className="text-xs text-zinc-500">
              {book.bodyPageCount}ページ / 更新 {new Date(book.updatedAt).toLocaleString()}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onOpen(book.id)}
                className="rounded-lg bg-emerald-500 px-3 py-1 text-sm text-white"
              >
                開く
              </button>
              <button
                onClick={() => onDelete(book.id)}
                className="rounded-lg bg-zinc-200 px-3 py-1 text-sm text-zinc-700"
              >
                削除
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
