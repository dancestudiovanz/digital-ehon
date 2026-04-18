import type { Book } from '../../../types/book'
import type { Page } from '../../../types/page'
import { createId } from '../../../utils/id'

export type ViewerStep =
  | { type: 'cover'; key: string; pages: [Page] }
  | { type: 'spread'; key: string; pages: [Page, Page] }

const createBlankPage = (order: number): Page => ({
  id: `blank-${createId()}`,
  pageNumber: order + 1,
  type: 'blank',
  backgroundColor: '#ffffff',
  elements: [],
  order,
})

export const buildViewerSteps = (book: Book): ViewerStep[] => {
  const steps: ViewerStep[] = [
    {
      type: 'cover',
      key: `cover-${book.coverPage.id}`,
      pages: [book.coverPage],
    },
  ]

  for (let index = 0; index < book.bodyPages.length; index += 2) {
    const left = book.bodyPages[index]
    const right = book.bodyPages[index + 1] ?? createBlankPage(index + 1)
    steps.push({
      type: 'spread',
      key: `spread-${left.id}-${right.id}`,
      pages: [left, right],
    })
  }

  return steps
}
