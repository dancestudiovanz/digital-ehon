import { Image } from 'react-konva'
import useImage from 'use-image'

type Props = {
  src: string
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
  shapeRef?: (node: any) => void
  selected?: boolean
  onDblClick?: () => void
}

export const KonvaImage = ({
  src,
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
  return (
    <Image
      ref={shapeRef}
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
