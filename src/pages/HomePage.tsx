import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateBookForm } from '../features/books/components/CreateBookForm'
import { JsonImportPanel } from '../features/books/components/JsonImportPanel'
import { SavedBookList } from '../features/books/components/SavedBookList'
import { bookSerializationService } from '../services/book/bookSerializationService'
import { bookService } from '../services/book/bookService'
import { useBookEditorStore } from '../store/useBookEditorStore'
import type { BookSummary } from '../types/book'

export const HomePage = () => {
  const navigate = useNavigate()
  const createBook = useBookEditorStore((state) => state.createBook)
  const loadBookToStore = useBookEditorStore((state) => state.loadBook)
  const [books, setBooks] = useState<BookSummary[]>([])

  const refresh = async () => {
    const items = await bookService.findAll()
    setBooks(items)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleCreate = async (
    title: string,
    bodyPageCount: number,
    pageFormat: 'landscape' | 'square',
  ) => {
    const book = createBook(title, bodyPageCount, pageFormat)
    await bookService.save(book)
    useBookEditorStore.getState().markSaved()
    navigate(`/editor/${book.id}`)
  }

  const handleOpen = async (bookId: string) => {
    const book = await bookService.findById(bookId)
    if (!book) return
    loadBookToStore(book)
    navigate(`/editor/${book.id}`)
  }

  const handleDelete = async (bookId: string) => {
    await bookService.delete(bookId)
    await refresh()
  }

  const handleImport = async (raw: string) => {
    const parsed = bookSerializationService.importJson(raw)
    await bookService.save(parsed)
    await refresh()
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-4 md:p-8">
      <header className="mb-6 rounded-2xl bg-amber-100 p-5">
        <h1 className="text-2xl font-black text-zinc-700">デジタル絵本エディタ</h1>
        <p className="mt-1 text-sm text-zinc-600">MVP: 作成・編集・保存・JSON入出力</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <CreateBookForm onSubmit={handleCreate} />
        <div className="space-y-4">
          <JsonImportPanel onImport={handleImport} />
          <SavedBookList books={books} onOpen={handleOpen} onDelete={handleDelete} />
        </div>
      </div>
    </main>
  )
}
