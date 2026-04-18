import type { Book } from '../types/book'

export const DEFAULT_PAGE_FORMAT: Book['pageFormat'] = 'landscape'

const PAGE_SIZE_MAP: Record<Book['pageFormat'], { width: number; height: number }> = {
  landscape: { width: 800, height: 500 },
  square: { width: 640, height: 640 },
}

export const getPageSize = (pageFormat: Book['pageFormat']) =>
  PAGE_SIZE_MAP[pageFormat] ?? PAGE_SIZE_MAP[DEFAULT_PAGE_FORMAT]
