import { useMemo } from 'react'
import { Group, Image, Rect } from 'react-konva'
import useImage from 'use-image'
import type { ImageObjectFitMode } from '../../../utils/imageObjectFitLayout'
import { computeImageObjectFitLayout } from '../../../utils/imageObjectFitLayout'

type Props = {
  src: string
  objectFit: ImageObjectFitMode
  x: number
  y: number
  width: number
  height: number
  opacity?: number
  rotation?: number
  draggable?: boolean
  onClick?: () => void
  onDragEnd?: (x: number, y: number) => void
  onTransformEnd?: () => void
  shapeRef?: (node: unknown) => void
  selected?: boolean
  onDblClick?: () => void
}

export const KonvaImage = ({
  src,
  objectFit,
  x,
  y,
  width,
  height,
  opacity = 1,
  rotation = 0,
  draggable = true,
  onClick,
  onDragEnd,
  onTransformEnd,
  shapeRef,
  selected = false,
  onDblClick,
}: Props) => {
  const [image] = useImage(src, 'anonymous')

  const layout = useMemo(() => {
    if (!image) return null
    const nw = image.naturalWidth || image.width
    const nh = image.naturalHeight || image.height
    return computeImageObjectFitLayout(nw, nh, width, height, objectFit)
  }, [image, width, height, objectFit])

  if (!image || !layout || layout.mode === 'stretch') {
    return (
      <Image
        ref={shapeRef as (node: unknown) => void}
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
        rotation={rotation}
        draggable={draggable}
        onClick={onClick}
        onTap={onClick}
        onDblClick={onDblClick}
        onDragEnd={(event) => onDragEnd?.(event.target.x(), event.target.y())}
        onTransformEnd={onTransformEnd}
        stroke={selected ? '#f59e0b' : undefined}
        strokeWidth={selected ? 2 : 0}
        shadowColor={selected ? '#f59e0b' : undefined}
        shadowBlur={selected ? 8 : 0}
      />
    )
  }

  if (layout.mode === 'cover') {
    return (
      <Image
        ref={shapeRef as (node: unknown) => void}
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
        rotation={rotation}
        draggable={draggable}
        cropX={layout.cropX}
        cropY={layout.cropY}
        cropWidth={layout.cropWidth}
        cropHeight={layout.cropHeight}
        onClick={onClick}
        onTap={onClick}
        onDblClick={onDblClick}
        onDragEnd={(event) => onDragEnd?.(event.target.x(), event.target.y())}
        onTransformEnd={onTransformEnd}
        stroke={selected ? '#f59e0b' : undefined}
        strokeWidth={selected ? 2 : 0}
        shadowColor={selected ? '#f59e0b' : undefined}
        shadowBlur={selected ? 8 : 0}
      />
    )
  }

  return (
    <Group
      ref={shapeRef as (node: unknown) => void}
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDblClick={onDblClick}
      onDragEnd={(event) => onDragEnd?.(event.target.x(), event.target.y())}
      onTransformEnd={onTransformEnd}
      shadowColor={selected ? '#f59e0b' : undefined}
      shadowBlur={selected ? 8 : 0}
    >
      <Rect
        name="imageFrame"
        width={width}
        height={height}
        stroke={selected ? '#f59e0b' : undefined}
        strokeWidth={selected ? 2 : 0}
        listening={false}
      />
      <Image
        image={image}
        x={layout.offsetX}
        y={layout.offsetY}
        width={layout.drawWidth}
        height={layout.drawHeight}
        opacity={opacity}
        listening
      />
    </Group>
  )
}
