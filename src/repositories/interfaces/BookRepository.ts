import type { Book, BookSummary } from '../../types/book'

export interface BookRepository {
  save(book: Book): Promise<void>
  findById(id: string): Promise<Book | null>
  findAll(): Promise<BookSummary[]>
  delete(id: string): Promise<void>
}
