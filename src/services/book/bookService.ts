import { LocalBookRepository } from '../../repositories/local/LocalBookRepository'
import type { Book, BookSummary } from '../../types/book'
import { DEFAULT_PAGE_FORMAT } from '../../utils/canvasConstants'

const repository = new LocalBookRepository()

export const bookService = {
  async save(book: Book): Promise<void> {
    const safeBook: Book = {
      ...book,
      updatedAt: new Date().toISOString(),
      bodyPageCount: book.bodyPages.length,
      pageFormat: book.pageFormat ?? DEFAULT_PAGE_FORMAT,
    }
    await repository.save(safeBook)
  },

  async findById(id: string): Promise<Book | null> {
    return repository.findById(id)
  },

  async findAll(): Promise<BookSummary[]> {
    return repository.findAll()
  },

  async delete(id: string): Promise<void> {
    return repository.delete(id)
  },
}
