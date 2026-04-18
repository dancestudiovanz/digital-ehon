export type ImageObjectFitMode = 'cover' | 'contain'

/**
 * HTML の object-fit（cover / contain）に相当する、ソース画像上の切り抜きと描画サイズ
 */
export const computeImageObjectFitLayout = (
  naturalWidth: number,
  naturalHeight: number,
  boxWidth: number,
  boxHeight: number,
  objectFit: ImageObjectFitMode,
): (
  | { mode: 'cover'; cropX: number; cropY: number; cropWidth: number; cropHeight: number }
  | { mode: 'contain'; offsetX: number; offsetY: number; drawWidth: number; drawHeight: number }
  | { mode: 'stretch' }
) => {
  if (!naturalWidth || !naturalHeight || !boxWidth || !boxHeight) {
    return { mode: 'stretch' }
  }
  if (objectFit === 'contain') {
    const scale = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight)
    const drawWidth = naturalWidth * scale
    const drawHeight = naturalHeight * scale
    return {
      mode: 'contain',
      offsetX: (boxWidth - drawWidth) / 2,
      offsetY: (boxHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    }
  }
  const scale = Math.max(boxWidth / naturalWidth, boxHeight / naturalHeight)
  const cropWidth = boxWidth / scale
  const cropHeight = boxHeight / scale
  const cropX = Math.max(0, (naturalWidth - cropWidth) / 2)
  const cropY = Math.max(0, (naturalHeight - cropHeight) / 2)
  return { mode: 'cover', cropX, cropY, cropWidth, cropHeight }
}
