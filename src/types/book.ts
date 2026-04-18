import type { Page } from './page'

export interface Book {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  pageFormat: 'landscape' | 'square'
  coverPage: Page
  bodyPages: Page[]
  bodyPageCount: number
}

export interface BookSummary {
  id: string
  title: string
  updatedAt: string
  bodyPageCount: number
}
