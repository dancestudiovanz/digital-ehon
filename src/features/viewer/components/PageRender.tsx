import type { BookElement } from '../../../types/element'
import { resolveFontStack } from '../../../utils/fontStacks'
import type { Page } from '../../../types/page'

export type PageRenderFrame = 'card' | 'cover' | 'spreadLeft' | 'spreadRight'

type Props = {
  page: Page
  pageWidth: number
  pageHeight: number
  scale?: number
  /** 閲覧モードの「本」レイアウト用。既定は従来のカード枠 */
  frameShape?: PageRenderFrame
}

const FRAME_CLASS: Record<PageRenderFrame, string> = {
  card: 'rounded-xl border border-zinc-200 shadow-sm',
  cover:
    'rounded-xl border border-white/80 shadow-[0_28px_56px_-14px_rgba(0,0,0,0.42)] ring-1 ring-black/10',
  spreadLeft:
    'rounded-l-xl rounded-r-none border-y border-l border-r border-zinc-500/35 shadow-[inset_-16px_0_32px_-20px_rgba(0,0,0,0.2)]',
  spreadRight:
    'rounded-r-xl rounded-l-none border-y border-r border-zinc-400/70 shadow-[inset_16px_0_32px_-20px_rgba(0,0,0,0.2)]',
}

const renderElement = (element: BookElement) => {
  if (element.type === 'text') {
    return (
      <div
        key={element.id}
        style={{
          position: 'absolute',
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          transform: `rotate(${element.rotation}deg)`,
          fontSize: element.fontSize,
          color: element.color,
          fontWeight: element.fontWeight,
          fontFamily: resolveFontStack(element.fontFamily),
          textAlign: element.textAlign,
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          zIndex: element.zIndex,
        }}
      >
        {element.text}
      </div>
    )
  }

  return (
    <img
      key={element.id}
      src={element.src}
      alt=""
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        objectFit: element.objectFit ?? 'cover',
        opacity: element.opacity,
        zIndex: element.zIndex,
      }}
    />
  )
}

export const PageRender = ({
  page,
  pageWidth,
  pageHeight,
  scale = 1,
  frameShape = 'card',
}: Props) => {
  const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex)

  // transform: scale 後も未スケールの幅・高さでレイアウトされるため、scale<1 のとき
  // 外側の overflow:hidden + 固定高さで下端・右端が切れる。負の margin でレイアウトを補正する。
  const shrinkX = scale < 1 ? pageWidth * (1 - scale) : 0
  const shrinkY = scale < 1 ? pageHeight * (1 - scale) : 0

  return (
    <div
      className={`relative overflow-hidden ${FRAME_CLASS[frameShape]}`}
      style={{
        width: pageWidth * scale,
        height: pageHeight * scale,
        background: page.backgroundColor,
        transformOrigin: 'top left',
      }}
    >
      <div
        style={{
          width: pageWidth,
          height: pageHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          marginRight: shrinkX > 0 ? -shrinkX : undefined,
          marginBottom: shrinkY > 0 ? -shrinkY : undefined,
        }}
      >
        {sorted.map(renderElement)}
      </div>
    </div>
  )
}
