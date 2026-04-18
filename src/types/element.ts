export type ElementType = 'text' | 'image'
export type FontFamily = 'Noto Sans JP' | 'serif' | 'sans-serif' | 'cursive'
export type TextAlign = 'left' | 'center' | 'right'

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  color: string
  fontWeight: 'normal' | 'bold'
  fontFamily: FontFamily
  textAlign: TextAlign
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  objectFit: 'cover' | 'contain'
  opacity: number
}

export type BookElement = TextElement | ImageElement
