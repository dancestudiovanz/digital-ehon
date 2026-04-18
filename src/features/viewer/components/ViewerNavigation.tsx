type Props = {
  index: number
  total: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
}

export const ViewerNavigation = ({
  index,
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: Props) => {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="rounded-xl bg-white/15 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/25 disabled:opacity-40"
      >
        前へ
      </button>
      <div className="min-w-36 rounded-xl bg-black/20 px-4 py-2 text-center text-sm text-zinc-100 ring-1 ring-white/15">
        {index + 1} / {total}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300 disabled:opacity-40"
      >
        次へ
      </button>
    </div>
  )
}
