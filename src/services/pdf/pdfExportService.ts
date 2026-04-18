import { PDFDocument, PDFPage, degrees, rgb } from 'pdf-lib'
import { buildViewerSteps } from '../../features/viewer/services/viewerStepService'
import type { Book } from '../../types/book'
import type { Page } from '../../types/page'
import type { FontFamily, TextAlign } from '../../types/element'
import { resolveFontStack } from '../../utils/fontStacks'
import { DEFAULT_PAGE_FORMAT, getPageSize } from '../../utils/canvasConstants'

const MARGIN = 16

/** 紙の落下影：右下方向へのオフセット（pt） */
const PAPER_SHADOW_OFFSET = 2.8
const PAPER_SHADOW_OPACITY = 0.17
const PAPER_SHADOW_COLOR = rgb(0.42, 0.43, 0.46)

/** 活字域の細枠（各辺の太さ pt） */
const TYPE_FRAME_STROKE = 0.55
const TYPE_FRAME_COLOR = rgb(0.66, 0.66, 0.69)

/** 見開き中央の折り目風の縦帯 */
const FOLD_SHADOW_COLOR = rgb(0.16, 0.16, 0.18)

const toPdfColor = (hex: string) => {
  const safe = hex.replace('#', '')
  if (safe.length !== 6) return rgb(1, 1, 1)
  const r = parseInt(safe.slice(0, 2), 16) / 255
  const g = parseInt(safe.slice(2, 4), 16) / 255
  const b = parseInt(safe.slice(4, 6), 16) / 255
  return rgb(r, g, b)
}

const loadImageBytes = async (src: string): Promise<Uint8Array> => {
  if (src.startsWith('data:')) {
    const base64 = src.split(',')[1]
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  }
  const response = await fetch(src)
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

const blobToBytes = async (blob: Blob): Promise<Uint8Array> => {
  const arrayBuffer = await blob.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const lines: string[] = []
  const paragraphList = text.split('\n')
  for (const paragraph of paragraphList) {
    if (!paragraph) {
      lines.push('')
      continue
    }
    let line = ''
    for (const char of paragraph) {
      const test = line + char
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = char
      } else {
        line = test
      }
    }
    lines.push(line)
  }
  return lines
}

const createTextImageBytes = async (
  text: string,
  width: number,
  height: number,
  fontSize: number,
  color: string,
  fontFamily: string,
  fontWeight: 'normal' | 'bold',
  textAlign: TextAlign,
): Promise<Uint8Array> => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width))
  canvas.height = Math.max(1, Math.ceil(height))
  const context = canvas.getContext('2d')
  if (!context) return new Uint8Array()

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = color
  const stack = resolveFontStack(fontFamily as FontFamily)
  context.font = `${fontWeight} ${Math.max(8, fontSize)}px ${stack}`
  context.textBaseline = 'top'
  context.textAlign = textAlign

  const maxTextWidth = Math.max(4, canvas.width - 4)
  const lines = wrapText(context, text, maxTextWidth)
  const lineHeight = Math.max(12, fontSize * 1.25)

  lines.forEach((line, index) => {
    const y = index * lineHeight
    if (y + lineHeight > canvas.height) return
    const x =
      textAlign === 'left'
        ? 2
        : textAlign === 'center'
          ? canvas.width / 2
          : canvas.width - 2
    context.fillText(line, x, y)
  })

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/png'),
  )
  if (!blob) return new Uint8Array()
  return blobToBytes(blob)
}

const normalizeImageToPngBytes = async (src: string): Promise<Uint8Array> => {
  if (src.startsWith('data:image/png') || src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
    return loadImageBytes(src)
  }
  const image = await loadImageElement(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  if (!context) return new Uint8Array()
  context.drawImage(image, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/png'),
  )
  if (!blob) return new Uint8Array()
  return blobToBytes(blob)
}

const drawPageContent = async (
  pdfDoc: PDFDocument,
  pdfPage: PDFPage,
  targetPage: Page,
  baseWidth: number,
  baseHeight: number,
  offsetX: number,
  offsetY: number,
  pageWidth: number,
  pageHeight: number,
) => {
  pdfPage.drawRectangle({
    x: offsetX,
    y: offsetY,
    width: pageWidth,
    height: pageHeight,
    color: toPdfColor(targetPage.backgroundColor),
  })

  const xScale = pageWidth / baseWidth
  const yScale = pageHeight / baseHeight
  const sorted = [...targetPage.elements].sort((a, b) => a.zIndex - b.zIndex)

  for (const element of sorted) {
    if (element.type === 'text') {
      const textBytes = await createTextImageBytes(
        element.text ?? '',
        element.width * xScale,
        element.height * yScale,
        Math.max(8, element.fontSize * yScale),
        element.color,
        element.fontFamily,
        element.fontWeight,
        element.textAlign,
      )
      if (textBytes.length > 0) {
        const textImage = await pdfDoc.embedPng(textBytes)
        pdfPage.drawImage(textImage, {
          x: offsetX + element.x * xScale,
          y: offsetY + pageHeight - (element.y * yScale + element.height * yScale),
          width: element.width * xScale,
          height: element.height * yScale,
          rotate: degrees(element.rotation || 0),
        })
      }
      continue
    }

    try {
      const bytes = await normalizeImageToPngBytes(element.src)
      const image = await pdfDoc.embedPng(bytes)
      pdfPage.drawImage(image, {
        x: offsetX + element.x * xScale,
        y: offsetY + pageHeight - (element.y * yScale + element.height * yScale),
        width: element.width * xScale,
        height: element.height * yScale,
        opacity: element.opacity,
        rotate: degrees(element.rotation || 0),
      })
    } catch (error) {
      console.error('画像のPDF埋め込みに失敗しました', error)
    }
  }
}

const drawPaperDropShadow = (
  pdfPage: PDFPage,
  offsetX: number,
  offsetY: number,
  pageWidth: number,
  pageHeight: number,
) => {
  const d = PAPER_SHADOW_OFFSET
  pdfPage.drawRectangle({
    x: offsetX + d,
    y: offsetY - d,
    width: pageWidth,
    height: pageHeight,
    color: PAPER_SHADOW_COLOR,
    opacity: PAPER_SHADOW_OPACITY,
  })
}

const drawTypeAreaFrame = (
  pdfPage: PDFPage,
  offsetX: number,
  offsetY: number,
  pageWidth: number,
  pageHeight: number,
) => {
  const t = TYPE_FRAME_STROKE
  const c = TYPE_FRAME_COLOR
  pdfPage.drawRectangle({
    x: offsetX,
    y: offsetY + pageHeight - t,
    width: pageWidth,
    height: t,
    color: c,
  })
  pdfPage.drawRectangle({
    x: offsetX,
    y: offsetY,
    width: pageWidth,
    height: t,
    color: c,
  })
  pdfPage.drawRectangle({
    x: offsetX,
    y: offsetY,
    width: t,
    height: pageHeight,
    color: c,
  })
  pdfPage.drawRectangle({
    x: offsetX + pageWidth - t,
    y: offsetY,
    width: t,
    height: pageHeight,
    color: c,
  })
}

/** 左右の境（ノミ）付近に薄い縦帯を重ねて折り目の落ち影に近づける */
const drawSpreadFoldShadow = (pdfPage: PDFPage, pageWidth: number, pageHeight: number) => {
  const bottom = MARGIN
  const centerX = MARGIN + pageWidth
  const strips: { x: number; w: number; opacity: number }[] = [
    { x: centerX - 4.8, w: 2.2, opacity: 0.09 },
    { x: centerX - 2.6, w: 1.9, opacity: 0.14 },
    { x: centerX - 0.75, w: 1.5, opacity: 0.26 },
    { x: centerX + 0.6, w: 1.9, opacity: 0.14 },
    { x: centerX + 2.6, w: 2.2, opacity: 0.09 },
  ]
  for (const s of strips) {
    pdfPage.drawRectangle({
      x: s.x,
      y: bottom,
      width: s.w,
      height: pageHeight,
      color: FOLD_SHADOW_COLOR,
      opacity: s.opacity,
    })
  }
}

const drawSinglePagePanel = async (
  pdfDoc: PDFDocument,
  pdfPage: PDFPage,
  targetPage: Page,
  baseWidth: number,
  baseHeight: number,
  offsetX: number,
  offsetY: number,
  pageWidth: number,
  pageHeight: number,
) => {
  drawPaperDropShadow(pdfPage, offsetX, offsetY, pageWidth, pageHeight)
  await drawPageContent(
    pdfDoc,
    pdfPage,
    targetPage,
    baseWidth,
    baseHeight,
    offsetX,
    offsetY,
    pageWidth,
    pageHeight,
  )
  drawTypeAreaFrame(pdfPage, offsetX, offsetY, pageWidth, pageHeight)
}

const buildBookPdfDocument = async (book: Book): Promise<PDFDocument> => {
  const pdfDoc = await PDFDocument.create()
  const steps = buildViewerSteps(book)
  const pageSize = getPageSize(book.pageFormat ?? DEFAULT_PAGE_FORMAT)

  const coverW = pageSize.width + MARGIN * 2
  const coverH = pageSize.height + MARGIN * 2
  const coverStep = steps[0]
  const coverPage = pdfDoc.addPage([coverW, coverH])
  await drawSinglePagePanel(
    pdfDoc,
    coverPage,
    coverStep.pages[0],
    pageSize.width,
    pageSize.height,
    MARGIN,
    MARGIN,
    pageSize.width,
    pageSize.height,
  )

  const spreadW = pageSize.width * 2 + MARGIN * 2
  const spreadH = pageSize.height + MARGIN * 2

  for (let index = 1; index < steps.length; index += 1) {
    const spread = steps[index]
    if (spread.type !== 'spread') continue
    const spreadPage = pdfDoc.addPage([spreadW, spreadH])
    await drawSinglePagePanel(
      pdfDoc,
      spreadPage,
      spread.pages[0],
      pageSize.width,
      pageSize.height,
      MARGIN,
      MARGIN,
      pageSize.width,
      pageSize.height,
    )
    await drawSinglePagePanel(
      pdfDoc,
      spreadPage,
      spread.pages[1],
      pageSize.width,
      pageSize.height,
      MARGIN + pageSize.width,
      MARGIN,
      pageSize.width,
      pageSize.height,
    )
    drawSpreadFoldShadow(spreadPage, pageSize.width, pageSize.height)
  }

  return pdfDoc
}

export const pdfExportService = {
  /** 同一セッション内のプレビュー・共有などに使う */
  async buildBookPdfBlob(book: Book): Promise<Blob> {
    const pdfDoc = await buildBookPdfDocument(book)
    const bytes = await pdfDoc.save()
    return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  },

  async exportBookAsPdf(book: Book): Promise<void> {
    const blob = await pdfExportService.buildBookPdfBlob(book)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${book.title}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}
