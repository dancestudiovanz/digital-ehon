import type { Book } from '../../types/book'
import { DEFAULT_PAGE_FORMAT } from '../../utils/canvasConstants'

export const bookSerializationService = {
  exportJson(book: Book): string {
    return JSON.stringify(book, null, 2)
  },
  importJson(raw: string): Book {
    const parsed = JSON.parse(raw) as Partial<Book>
    if (!parsed.id || !parsed.title || !parsed.coverPage || !parsed.bodyPages) {
      throw new Error('不正な絵本JSONです')
    }
    return {
      ...parsed,
      pageFormat: parsed.pageFormat ?? DEFAULT_PAGE_FORMAT,
      bodyPageCount: parsed.bodyPageCount ?? parsed.bodyPages.length,
    } as Book
  },
}
