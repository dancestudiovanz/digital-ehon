import { create } from 'zustand'
import { createNewBook } from '../services/book/bookFactoryService'
import type { Book } from '../types/book'
import type { BookElement, FontFamily, TextAlign } from '../types/element'
import { createId } from '../utils/id'
import { DEFAULT_PAGE_FORMAT, getPageSize } from '../utils/canvasConstants'
import {
  applyCornerBackgroundTransparency,
  computeImageContainOnPage,
  getNaturalImageSize,
} from '../utils/imageElementAdjustments'

type Store = {
  currentBook: Book | null
  selectedPageId: string | null
  selectedElementId: string | null
  isDirty: boolean
  createBook: (title: string, bodyPageCount: number, pageFormat: Book['pageFormat']) => Book
  loadBook: (book: Book) => void
  setSelectedPage: (pageId: string) => void
  setSelectedElement: (elementId: string | null) => void
  clearSelection: () => void
  updateBookTitle: (title: string) => void
  addTextElement: () => void
  addImageElement: (src: string) => void
  updateElement: (elementId: string, patch: Partial<BookElement>) => void
  deleteSelectedElement: () => void
  updatePageBackground: (color: string) => void
  addBodyPage: () => void
  /** 複製を本文の insertBodyIndex 位置に挿入（0＝先頭、length＝末尾） */
  duplicateSelectedPageAtBodyIndex: (insertBodyIndex: number) => void
  deleteSelectedPage: () => void
  reorderBodyPages: (activeId: string, overId: string) => void
  updateTextSettings: (patch: {
    text?: string
    fontSize?: number
    color?: string
    fontFamily?: FontFamily
    fontWeight?: 'normal' | 'bold'
    textAlign?: TextAlign
  }) => void
  bringSelectedElementToFront: () => void
  sendSelectedElementToBack: () => void
  moveSelectedElementForward: () => void
  moveSelectedElementBackward: () => void
  applySelectedImageTransparency: () => Promise<void>
  fitSelectedImageToPage: () => Promise<void>
  markSaved: () => void
}

const ensureOrder = (book: Book): Book => ({
  ...book,
  pageFormat: book.pageFormat ?? DEFAULT_PAGE_FORMAT,
  coverPage: { ...book.coverPage, order: 0, pageNumber: 1 },
  bodyPages: book.bodyPages.map((page, index) => ({
    ...page,
    order: index + 1,
    pageNumber: index + 2,
    type: 'body',
  })),
})

const updatePageInBook = (
  book: Book,
  pageId: string,
  updater: (page: Book['coverPage']) => Book['coverPage'],
): Book => {
  if (book.coverPage.id === pageId) {
    return { ...book, coverPage: updater(book.coverPage) }
  }
  return {
    ...book,
    bodyPages: book.bodyPages.map((page) =>
      page.id === pageId ? updater(page) : page,
    ),
  }
}

const getPageById = (book: Book, pageId: string) =>
  book.coverPage.id === pageId
    ? book.coverPage
    : book.bodyPages.find((item) => item.id === pageId)

export const useBookEditorStore = create<Store>((set, get) => ({
  currentBook: null,
  selectedPageId: null,
  selectedElementId: null,
  isDirty: false,

  createBook: (title, bodyPageCount, pageFormat) => {
    const book = createNewBook(title, bodyPageCount, pageFormat)
    set({
      currentBook: book,
      selectedPageId: book.coverPage.id,
      selectedElementId: null,
      isDirty: true,
    })
    return book
  },

  loadBook: (book) =>
    set({
      currentBook: ensureOrder(book),
      selectedPageId: book.coverPage.id,
      selectedElementId: null,
      isDirty: false,
    }),

  setSelectedPage: (pageId) =>
    set({ selectedPageId: pageId, selectedElementId: null }),

  setSelectedElement: (elementId) => set({ selectedElementId: elementId }),
  clearSelection: () => set({ selectedElementId: null }),

  updateBookTitle: (title) => {
    const book = get().currentBook
    if (!book) return
    set({ currentBook: { ...book, title }, isDirty: true })
  },

  addTextElement: () => {
    const { currentBook, selectedPageId } = get()
    if (!currentBook || !selectedPageId) return
    const element: BookElement = {
      id: createId(),
      type: 'text',
      x: 80,
      y: 80,
      width: 240,
      height: 80,
      rotation: 0,
      zIndex: 1,
      text: 'テキストを編集',
      fontSize: 28,
      color: '#1f2937',
      fontWeight: 'normal',
      fontFamily: 'Noto Sans JP',
      textAlign: 'left',
    }
    const nextBook = updatePageInBook(currentBook, selectedPageId, (page) => ({
      ...page,
      elements: [...page.elements, element],
    }))
    set({
      currentBook: nextBook,
      selectedElementId: element.id,
      isDirty: true,
    })
  },

  addImageElement: (src) => {
    const { currentBook, selectedPageId } = get()
    if (!currentBook || !selectedPageId) return
    const element: BookElement = {
      id: createId(),
      type: 'image',
      x: 100,
      y: 100,
      width: 240,
      height: 180,
      rotation: 0,
      zIndex: 1,
      src,
      objectFit: 'cover',
      opacity: 1,
    }
    const nextBook = updatePageInBook(currentBook, selectedPageId, (page) => ({
      ...page,
      elements: [...page.elements, element],
    }))
    set({
      currentBook: nextBook,
      selectedElementId: element.id,
      isDirty: true,
    })
  },

  updateElement: (elementId, patch) => {
    const { currentBook, selectedPageId } = get()
    if (!currentBook || !selectedPageId) return
    const nextBook = updatePageInBook(currentBook, selectedPageId, (page) => ({
      ...page,
      elements: page.elements.map((element) =>
        element.id === elementId ? ({ ...element, ...patch } as BookElement) : element,
      ),
    }))
    set({ currentBook: nextBook, isDirty: true })
  },

  deleteSelectedElement: () => {
    const { currentBook, selectedPageId, selectedElementId } = get()
    if (!currentBook || !selectedPageId || !selectedElementId) return
    const nextBook = updatePageInBook(currentBook, selectedPageId, (page) => ({
      ...page,
      elements: page.elements.filter((element) => element.id !== selectedElementId),
    }))
    set({ currentBook: nextBook, selectedElementId: null, isDirty: true })
  },

  updatePageBackground: (color) => {
    const { currentBook, selectedPageId } = get()
    if (!currentBook || !selectedPageId) return
    const nextBook = updatePageInBook(currentBook, selectedPageId, (page) => ({
      ...page,
      backgroundColor: color,
    }))
    set({ currentBook: nextBook, isDirty: true })
  },

  addBodyPage: () => {
    const book = get().currentBook
    if (!book) return
    const page = {
      id: createId(),
      pageNumber: book.bodyPages.length + 2,
      type: 'body' as const,
      backgroundColor: '#ffffff',
      elements: [],
      order: book.bodyPages.length + 1,
    }
    set({
      currentBook: ensureOrder({ ...book, bodyPages: [...book.bodyPages, page] }),
      selectedPageId: page.id,
      selectedElementId: null,
      isDirty: true,
    })
  },

  duplicateSelectedPageAtBodyIndex: (insertBodyIndex) => {
    const { currentBook, selectedPageId } = get()
    if (!currentBook || !selectedPageId) return

    const { coverPage, bodyPages } = currentBook
    const maxIndex = bodyPages.length
    const insertIndex = Math.max(0, Math.min(Math.floor(insertBodyIndex), maxIndex))

    const cloneElements = (elements: BookElement[]) =>
      elements.map((element) => ({ ...element, id: createId() }))

    let clone: (typeof bodyPages)[number]
    if (coverPage.id === selectedPageId) {
      const src = coverPage
      clone = {
        ...src,
        id: createId(),
        type: 'body',
        elements: cloneElements(src.elements),
      }
    } else {
      const index = bodyPages.findIndex((page) => page.id === selectedPageId)
      if (index < 0) return
      const src = bodyPages[index]
      clone = {
        ...src,
        id: createId(),
        elements: cloneElements(src.elements),
      }
    }

    const next = [...bodyPages]
    next.splice(insertIndex, 0, clone)
    set({
      currentBook: ensureOrder({ ...currentBook, bodyPages: next }),
      selectedPageId: clone.id,
      selectedElementId: null,
      isDirty: true,
    })
  },

  deleteSelectedPage: () => {
    const { currentBook, selectedPageId } = get()
    if (!currentBook || !selectedPageId || currentBook.coverPage.id === selectedPageId) return
    if (currentBook.bodyPages.length === 1) return
    const nextBody = currentBook.bodyPages.filter((page) => page.id !== selectedPageId)
    set({
      currentBook: ensureOrder({ ...currentBook, bodyPages: nextBody }),
      selectedPageId: nextBody[0]?.id ?? currentBook.coverPage.id,
      selectedElementId: null,
      isDirty: true,
    })
  },

  reorderBodyPages: (activeId, overId) => {
    const book = get().currentBook
    if (!book || activeId === overId) return
    const activeIndex = book.bodyPages.findIndex((page) => page.id === activeId)
    const overIndex = book.bodyPages.findIndex((page) => page.id === overId)
    if (activeIndex < 0 || overIndex < 0) return
    const updated = [...book.bodyPages]
    const [removed] = updated.splice(activeIndex, 1)
    updated.splice(overIndex, 0, removed)
    set({ currentBook: ensureOrder({ ...book, bodyPages: updated }), isDirty: true })
  },

  updateTextSettings: (patch) => {
    const { selectedElementId, currentBook, selectedPageId } = get()
    if (!selectedElementId || !currentBook || !selectedPageId) return
    const page =
      currentBook.coverPage.id === selectedPageId
        ? currentBook.coverPage
        : currentBook.bodyPages.find((item) => item.id === selectedPageId)
    const target = page?.elements.find((element) => element.id === selectedElementId)
    if (!target || target.type !== 'text') return
    get().updateElement(selectedElementId, patch as Partial<BookElement>)
  },

  bringSelectedElementToFront: () => {
    const { currentBook, selectedPageId, selectedElementId } = get()
    if (!currentBook || !selectedPageId || !selectedElementId) return
    const page = getPageById(currentBook, selectedPageId)
    if (!page) return
    const maxZ = page.elements.reduce((max, element) => Math.max(max, element.zIndex), 0)
    get().updateElement(selectedElementId, { zIndex: maxZ + 1 })
  },

  sendSelectedElementToBack: () => {
    const { currentBook, selectedPageId, selectedElementId } = get()
    if (!currentBook || !selectedPageId || !selectedElementId) return
    const page = getPageById(currentBook, selectedPageId)
    if (!page) return
    const nextElements = page.elements
      .map((element) =>
        element.id === selectedElementId
          ? { ...element, zIndex: 0 }
          : { ...element, zIndex: element.zIndex + 1 },
      )
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((element, index) => ({ ...element, zIndex: index + 1 }))

    const nextBook = updatePageInBook(currentBook, selectedPageId, (target) => ({
      ...target,
      elements: nextElements,
    }))
    set({ currentBook: nextBook, isDirty: true })
  },

  moveSelectedElementForward: () => {
    const { currentBook, selectedPageId, selectedElementId } = get()
    if (!currentBook || !selectedPageId || !selectedElementId) return
    const page = getPageById(currentBook, selectedPageId)
    if (!page) return
    const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex)
    const index = sorted.findIndex((element) => element.id === selectedElementId)
    if (index < 0 || index >= sorted.length - 1) return
    const target = sorted[index]
    const next = sorted[index + 1]
    const nextElements = sorted.map((element) => {
      if (element.id === target.id) return { ...element, zIndex: next.zIndex }
      if (element.id === next.id) return { ...element, zIndex: target.zIndex }
      return element
    })
    const nextBook = updatePageInBook(currentBook, selectedPageId, (targetPage) => ({
      ...targetPage,
      elements: nextElements,
    }))
    set({ currentBook: nextBook, isDirty: true })
  },

  moveSelectedElementBackward: () => {
    const { currentBook, selectedPageId, selectedElementId } = get()
    if (!currentBook || !selectedPageId || !selectedElementId) return
    const page = getPageById(currentBook, selectedPageId)
    if (!page) return
    const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex)
    const index = sorted.findIndex((element) => element.id === selectedElementId)
    if (index <= 0) return
    const target = sorted[index]
    const prev = sorted[index - 1]
    const nextElements = sorted.map((element) => {
      if (element.id === target.id) return { ...element, zIndex: prev.zIndex }
      if (element.id === prev.id) return { ...element, zIndex: target.zIndex }
      return element
    })
    const nextBook = updatePageInBook(currentBook, selectedPageId, (targetPage) => ({
      ...targetPage,
      elements: nextElements,
    }))
    set({ currentBook: nextBook, isDirty: true })
  },

  applySelectedImageTransparency: async () => {
    const { currentBook, selectedPageId, selectedElementId } = get()
    if (!currentBook || !selectedPageId || !selectedElementId) return
    const page = getPageById(currentBook, selectedPageId)
    const el = page?.elements.find((e) => e.id === selectedElementId)
    if (!el || el.type !== 'image') return
    const nextSrc = await applyCornerBackgroundTransparency(el.src)
    get().updateElement(selectedElementId, { src: nextSrc, objectFit: 'contain' })
  },

  fitSelectedImageToPage: async () => {
    const { currentBook, selectedPageId, selectedElementId } = get()
    if (!currentBook || !selectedPageId || !selectedElementId) return
    const page = getPageById(currentBook, selectedPageId)
    const el = page?.elements.find((e) => e.id === selectedElementId)
    if (!el || el.type !== 'image') return
    const { width: pw, height: ph } = getPageSize(currentBook.pageFormat ?? DEFAULT_PAGE_FORMAT)
    const { width: nw, height: nh } = await getNaturalImageSize(el.src)
    const box = computeImageContainOnPage(nw, nh, pw, ph, 20)
    get().updateElement(selectedElementId, {
      ...box,
      objectFit: 'contain',
      rotation: 0,
    })
  },

  markSaved: () => set({ isDirty: false }),
}))
