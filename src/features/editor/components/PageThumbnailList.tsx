import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Book } from '../../../types/book'

type Props = {
  book: Book
  selectedPageId: string | null
  onSelect: (pageId: string) => void
  onReorderBodyPages: (activeId: string, overId: string) => void
}

const SortableBodyItem = ({
  id,
  label,
  selected,
  onClick,
}: {
  id: string
  label: string
  selected: boolean
  onClick: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`w-full rounded-xl border p-2 text-left text-sm ${
        selected ? 'border-amber-500 bg-amber-50' : 'border-zinc-200 bg-white'
      }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {label}
    </button>
  )
}

export const PageThumbnailList = ({
  book,
  selectedPageId,
  onSelect,
  onReorderBodyPages,
}: Props) => {
  const sensors = useSensors(useSensor(PointerSensor))
  const bodyIds = book.bodyPages.map((page) => page.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorderBodyPages(String(active.id), String(over.id))
  }

  return (
    <aside className="w-full space-y-3 rounded-2xl bg-white p-3 shadow-sm lg:w-72">
      <h3 className="text-sm font-bold text-zinc-700">ページ</h3>
      <button
        onClick={() => onSelect(book.coverPage.id)}
        className={`w-full rounded-xl border p-2 text-left text-sm ${
          selectedPageId === book.coverPage.id
            ? 'border-violet-500 bg-violet-50'
            : 'border-zinc-200 bg-white'
        }`}
      >
        表紙
      </button>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={bodyIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {book.bodyPages.map((page, index) => (
              <SortableBodyItem
                key={page.id}
                id={page.id}
                label={`${index + 1}ページ`}
                selected={selectedPageId === page.id}
                onClick={() => onSelect(page.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  )
}
