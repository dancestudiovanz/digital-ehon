import type { Book, BookSummary } from '../../types/book'
import type { BookRepository } from '../interfaces/BookRepository'
import { DEFAULT_PAGE_FORMAT } from '../../utils/canvasConstants'

const BOOKS_KEY = 'digital-picture-book/books'

type BookMap = Record<string, Book>

const safeParse = (raw: string | null): BookMap => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as BookMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    console.error('保存データの読み込みに失敗しました', error)
    return {}
  }
}

const readAll = (): BookMap => safeParse(localStorage.getItem(BOOKS_KEY))

const withDefaults = (book: Book): Book => ({
  ...book,
  pageFormat: book.pageFormat ?? DEFAULT_PAGE_FORMAT,
  bodyPageCount: book.bodyPageCount ?? book.bodyPages.length,
})

const writeAll = (data: BookMap): void => {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(data))
}

export class LocalBookRepository implements BookRepository {
  async save(book: Book): Promise<void> {
    const books = readAll()
    books[book.id] = withDefaults(book)
    writeAll(books)
  }

  async findById(id: string): Promise<Book | null> {
    const books = readAll()
    const book = books[id]
    return book ? withDefaults(book) : null
  }

  async findAll(): Promise<BookSummary[]> {
    const books = readAll()
    return Object.values(books)
      .map(withDefaults)
      .map((book) => ({
        id: book.id,
        title: book.title,
        updatedAt: book.updatedAt,
        bodyPageCount: book.bodyPages.length,
      }))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }

  async delete(id: string): Promise<void> {
    const books = readAll()
    delete books[id]
    writeAll(books)
  }
}
