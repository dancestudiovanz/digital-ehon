import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Layer, Rect, Stage, Text, Transformer } from 'react-konva'
import { KonvaImage } from './KonvaImage'
import type { Page } from '../../../types/page'
import type { BookElement, ImageElement, TextElement } from '../../../types/element'
import { resolveFontStack } from '../../../utils/fontStacks'

type Props = {
  page: Page
  pageWidth: number
  pageHeight: number
  selectedElementId: string | null
  onSelectElement: (elementId: string | null) => void
  onUpdateElement: (elementId: string, patch: Partial<BookElement>) => void
  /** キャンバス上のテキストオーバーレイ編集の開始・終了（右パネル表示用） */
  onInlineTextEditChange?: (active: boolean) => void
}

export const PageCanvas = ({
  page,
  pageWidth,
  pageHeight,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onInlineTextEditChange,
}: Props) => {
  const transformerRef = useRef<any>(null)
  const nodeMapRef = useRef<Record<string, any>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const draftTextRef = useRef('')
  const editingTextIdRef = useRef<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [stageScale, setStageScale] = useState(1)
  const [editorStyle, setEditorStyle] = useState<{
    left: number
    top: number
    width: number
    height: number
    fontSize: number
    fontFamily: string
    color: string
    fontWeight: 'normal' | 'bold'
    textAlign: 'left' | 'center' | 'right'
  } | null>(null)
  const elements = useMemo(
    () => [...page.elements].sort((a, b) => a.zIndex - b.zIndex),
    [page.elements],
  )

  useEffect(() => {
    draftTextRef.current = draftText
  }, [draftText])

  useEffect(() => {
    editingTextIdRef.current = editingTextId
  }, [editingTextId])

  useEffect(() => {
    if (!transformerRef.current) return
    const node = selectedElementId ? nodeMapRef.current[selectedElementId] : null
    transformerRef.current.nodes(node ? [node] : [])
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedElementId, elements])

  useEffect(() => {
    setEditingTextId(null)
    setEditorStyle(null)
    editingTextIdRef.current = null
    onInlineTextEditChange?.(false)
    // ページ切替時のみリセット（コールバック参照で毎レンダー走らせない）
    // eslint-disable-next-line react-hooks/exhaustive-deps --
  }, [page.id])

  useEffect(() => {
    const refreshScale = () => {
      const container = containerRef.current
      if (!container) return
      const pad = 24
      // 実コンテナサイズで縮小しないと、小さいビューでキャンバスが枠外にはみ出してページ全体がスクロールする
      const availableWidth = Math.max(1, container.clientWidth - pad)
      const availableHeight = Math.max(1, container.clientHeight - pad)
      const nextScale = Math.min(1, availableWidth / pageWidth, availableHeight / pageHeight)
      setStageScale(nextScale)
    }
    refreshScale()
    const observer = new ResizeObserver(refreshScale)
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', refreshScale)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', refreshScale)
    }
  }, [pageWidth, pageHeight])

  useEffect(() => {
    if (!editingTextId) return
    const editingTarget = elements.find(
      (element) => element.type === 'text' && element.id === editingTextId,
    ) as TextElement | undefined
    if (!editingTarget) return
    setEditorStyle((prev) =>
      prev
        ? {
            ...prev,
            color: editingTarget.color,
            fontSize: editingTarget.fontSize,
            fontFamily: editingTarget.fontFamily,
            fontWeight: editingTarget.fontWeight,
            textAlign: editingTarget.textAlign,
          }
        : prev,
    )
  }, [editingTextId, elements])

  useLayoutEffect(() => {
    if (!editingTextId || !editorStyle) return
    const id = requestAnimationFrame(() => {
      const el = textAreaRef.current
      if (!el) return
      const len = el.value.length
      el.focus()
      el.setSelectionRange(len, len)
    })
    return () => cancelAnimationFrame(id)
  }, [editingTextId, editorStyle])

  const handleTransformEnd = (element: BookElement) => {
    const node = nodeMapRef.current[element.id]
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const width = Math.max(30, node.width() * scaleX)
    const height = Math.max(30, node.height() * scaleY)
    node.scaleX(1)
    node.scaleY(1)
    onUpdateElement(element.id, {
      x: node.x(),
      y: node.y(),
      width,
      height,
      rotation: node.rotation(),
    })
  }

  const finishTextEdit = useCallback(() => {
    const id = editingTextIdRef.current
    if (!id) return
    onUpdateElement(id, { text: draftTextRef.current })
    editingTextIdRef.current = null
    setEditingTextId(null)
    setEditorStyle(null)
    onInlineTextEditChange?.(false)
  }, [onUpdateElement, onInlineTextEditChange])

  useEffect(() => {
    const onPointerDownCapture = (event: PointerEvent) => {
      if (!editingTextIdRef.current) return
      const el = event.target
      if (!(el instanceof HTMLElement)) return
      if (el.closest('[data-text-edit-toolbar]') || el.tagName === 'TEXTAREA') return
      const root = containerRef.current
      const viewport = root?.querySelector('[data-stage-viewport]')
      if (viewport instanceof HTMLElement && viewport.contains(el)) return
      finishTextEdit()
    }
    document.addEventListener('pointerdown', onPointerDownCapture, true)
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true)
  }, [finishTextEdit])

  const startTextEdit = (element: TextElement) => {
    const node = nodeMapRef.current[element.id]
    if (!node) return
    onSelectElement(element.id)
    editingTextIdRef.current = element.id
    setEditingTextId(element.id)
    setDraftText(element.text)
    draftTextRef.current = element.text
    setEditorStyle({
      left: node.x(),
      top: node.y(),
      width: Math.max(80, node.width()),
      height: Math.max(40, node.height()),
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      color: element.color,
      fontWeight: element.fontWeight,
      textAlign: element.textAlign,
    })
    onInlineTextEditChange?.(true)
  }

  const cancelTextEdit = () => {
    editingTextIdRef.current = null
    setEditingTextId(null)
    setEditorStyle(null)
    onInlineTextEditChange?.(false)
  }

  return (
    <div
      data-page-canvas-root
      ref={containerRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-3"
    >
      <div
        data-stage-viewport
        className="relative flex min-h-0 flex-1 w-full items-center justify-center overflow-hidden"
      >
        <Stage
          width={pageWidth}
          height={pageHeight}
          scaleX={stageScale}
          scaleY={stageScale}
          className="block rounded-lg bg-white shadow"
          onMouseDown={(event) => {
            const target = event.target as unknown as { getStage?: () => unknown }
            const stage = target.getStage?.()
            if (!stage) return
            const id = editingTextIdRef.current
            if (id) {
              const editingNode = nodeMapRef.current[id]
              if (target === stage) {
                finishTextEdit()
                onSelectElement(null)
                return
              }
              if (editingNode && target !== editingNode) {
                finishTextEdit()
              }
            }
            if (target === stage) {
              onSelectElement(null)
            }
          }}
        >
          <Layer>
            <Rect width={pageWidth} height={pageHeight} fill={page.backgroundColor} />
            {elements.map((element) => {
              if (element.type === 'text') {
                const textElement = element as TextElement
                return (
                  <Text
                    key={textElement.id}
                    ref={(node) => {
                      if (node) nodeMapRef.current[textElement.id] = node
                    }}
                    x={textElement.x}
                    y={textElement.y}
                    width={textElement.width}
                    height={textElement.height}
                    text={editingTextId === textElement.id ? '' : textElement.text}
                    fontSize={textElement.fontSize}
                    fill={textElement.color}
                    fontStyle={textElement.fontWeight === 'bold' ? 'bold' : 'normal'}
                    fontFamily={resolveFontStack(textElement.fontFamily)}
                    align={textElement.textAlign}
                    draggable={editingTextId !== textElement.id}
                    rotation={textElement.rotation}
                    onClick={() => onSelectElement(textElement.id)}
                    onTap={() => onSelectElement(textElement.id)}
                    onDblClick={() => startTextEdit(textElement)}
                    onDragEnd={(event) =>
                      onUpdateElement(textElement.id, {
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }
                    onTransformEnd={() => handleTransformEnd(textElement)}
                  />
                )
              }
              const imageElement = element as ImageElement
              return (
                <KonvaImage
                  key={imageElement.id}
                  shapeRef={(node) => {
                    if (node) nodeMapRef.current[imageElement.id] = node
                  }}
                  selected={selectedElementId === imageElement.id}
                  src={imageElement.src}
                  x={imageElement.x}
                  y={imageElement.y}
                  width={imageElement.width}
                  height={imageElement.height}
                  opacity={imageElement.opacity}
                  rotation={imageElement.rotation}
                  onClick={() => onSelectElement(imageElement.id)}
                  onDragEnd={(x, y) => onUpdateElement(imageElement.id, { x, y })}
                  onTransformEnd={() => handleTransformEnd(imageElement)}
                />
              )
            })}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              borderStroke="#f59e0b"
              anchorStroke="#f59e0b"
              enabledAnchors={[
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
                'middle-left',
                'middle-right',
                'top-center',
                'bottom-center',
              ]}
              boundBoxFunc={(_, box) => ({
                ...box,
                width: Math.max(30, box.width),
                height: Math.max(30, box.height),
              })}
            />
          </Layer>
        </Stage>
        {editingTextId && editorStyle && (
          <>
            <textarea
              ref={textAreaRef}
              autoFocus
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              onBlur={finishTextEdit}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelTextEdit()
                }
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                  event.preventDefault()
                  finishTextEdit()
                }
              }}
              className="absolute resize-none rounded border border-amber-400 bg-white/95 p-1 outline-none"
              style={{
                left: editorStyle.left * stageScale,
                top: editorStyle.top * stageScale,
                width: editorStyle.width * stageScale,
                height: editorStyle.height * stageScale,
                fontSize: editorStyle.fontSize * stageScale,
                fontFamily: resolveFontStack(editorStyle.fontFamily as TextElement['fontFamily']),
                color: editorStyle.color,
                fontWeight: editorStyle.fontWeight,
                textAlign: editorStyle.textAlign,
                lineHeight: 1.25,
              }}
            />
            <div
              data-text-edit-toolbar
              className="absolute z-10 flex gap-1"
              style={{
                left: editorStyle.left * stageScale,
                top: Math.max(0, editorStyle.top * stageScale - 30),
              }}
            >
              <button
                onMouseDown={(event) => event.preventDefault()}
                onClick={finishTextEdit}
                className="rounded bg-emerald-500 px-2 py-0.5 text-xs text-white"
              >
                確定
              </button>
              <button
                onMouseDown={(event) => event.preventDefault()}
                onClick={cancelTextEdit}
                className="rounded bg-zinc-500 px-2 py-0.5 text-xs text-white"
              >
                キャンセル
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
