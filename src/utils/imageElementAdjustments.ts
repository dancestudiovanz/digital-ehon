/**
 * 画像要素向けの簡易加工（角の色を背景とみなして近い色を透明化、ページ内に収まるよう配置計算）
 */

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = src
  })

const colorDistance = (a: readonly [number, number, number], b: readonly [number, number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/**
 * 四隅の色から背景色を推定し、近い色のピクセルを透明にする（PNG として返す）
 * 完全な切り抜きではなく、白〜単色背景向けの簡易処理
 */
export const applyCornerBackgroundTransparency = async (src: string): Promise<string> => {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) throw new Error('画像サイズが不正です')

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas が利用できません')

  ctx.drawImage(img, 0, 0)
  let imageData: ImageData
  try {
    imageData = ctx.getImageData(0, 0, w, h)
  } catch {
    throw new Error('この画像はセキュリティ制限で加工できません（別ドメインのURLなど）')
  }

  const d = imageData.data
  const inset = Math.min(4, Math.floor(Math.min(w, h) / 8) || 1)
  const sample = (x: number, y: number): [number, number, number] => {
    const i = (Math.min(h - 1, y) * w + Math.min(w - 1, x)) * 4
    return [d[i], d[i + 1], d[i + 2]]
  }

  const corners: [number, number, number][] = [
    sample(inset, inset),
    sample(w - 1 - inset, inset),
    sample(inset, h - 1 - inset),
    sample(w - 1 - inset, h - 1 - inset),
  ]

  const avg: [number, number, number] = [
    corners.reduce((s, c) => s + c[0], 0) / 4,
    corners.reduce((s, c) => s + c[1], 0) / 4,
    corners.reduce((s, c) => s + c[2], 0) / 4,
  ]

  const spread = Math.max(...corners.map((c) => colorDistance(c, avg)))
  const bg: [number, number, number] = spread <= 48 ? avg : [255, 255, 255]

  const threshold = 42
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    if (colorDistance([r, g, b], bg) < threshold) {
      d[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const getNaturalImageSize = async (src: string): Promise<{ width: number; height: number }> => {
  const img = await loadImage(src)
  return { width: img.naturalWidth, height: img.naturalHeight }
}

/** ページ矩形内に収まるよう contain で中央配置する { x, y, width, height } */
export const computeImageContainOnPage = (
  naturalWidth: number,
  naturalHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin = 20,
): { x: number; y: number; width: number; height: number } => {
  if (!naturalWidth || !naturalHeight) {
    return { x: margin, y: margin, width: pageWidth - margin * 2, height: pageHeight - margin * 2 }
  }
  const maxW = Math.max(40, pageWidth - margin * 2)
  const maxH = Math.max(40, pageHeight - margin * 2)
  const scale = Math.min(maxW / naturalWidth, maxH / naturalHeight)
  const width = naturalWidth * scale
  const height = naturalHeight * scale
  const x = (pageWidth - width) / 2
  const y = (pageHeight - height) / 2
  return { x, y, width, height }
}
