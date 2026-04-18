import type { BookElement } from './element'

export type PageType = 'cover' | 'body' | 'blank'

export interface Page {
  id: string
  pageNumber: number
  type: PageType
  backgroundColor: string
  elements: BookElement[]
  order: number
}
