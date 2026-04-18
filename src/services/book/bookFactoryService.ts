import { createId } from '../../utils/id'
import type { Book } from '../../types/book'
import type { Page } from '../../types/page'
import { DEFAULT_PAGE_FORMAT } from '../../utils/canvasConstants'

const createPage = (type: Page['type'], index: number): Page => ({
  id: createId(),
  pageNumber: index + 1,
  type,
  backgroundColor: '#ffffff',
  elements: [],
  order: index,
})

export const createNewBook = (
  title: string,
  bodyPageCount: number,
  pageFormat: Book['pageFormat'] = DEFAULT_PAGE_FORMAT,
): Book => {
  const now = new Date().toISOString()
  const count = Math.max(1, bodyPageCount)
  const coverPage = createPage('cover', 0)
  const bodyPages = Array.from({ length: count }, (_, index) =>
    createPage('body', index + 1),
  )

  return {
    id: createId(),
    title: title.trim() || '無題の絵本',
    createdAt: now,
    updatedAt: now,
    pageFormat,
    coverPage,
    bodyPages,
    bodyPageCount: count,
  }
}
