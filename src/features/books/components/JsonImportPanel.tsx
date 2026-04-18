import { useRef, type ChangeEvent } from 'react'

type Props = {
  onImport: (raw: string) => Promise<void>
}

export const JsonImportPanel = ({ onImport }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const raw = await file.text()
    await onImport(raw)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-zinc-700">JSONインポート</h2>
      <p className="mb-3 text-xs leading-relaxed text-zinc-600">
        エディタの「JSON出力」で保存した <code className="rounded bg-zinc-100 px-1">.json</code>{' '}
        を、ここで選ぶとこの端末のブラウザに読み込めます。
        <span className="mt-1 block">
          <strong className="font-medium text-zinc-700">スマホ・タブレット:</strong>{' '}
          ファイルは「ダウンロード」や「ファイル」アプリ（iOS の Files など）に保存されることが多いです。トップに戻ってこの欄から同じファイルを指定してください。
        </span>
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="w-full rounded-xl border border-dashed border-amber-300 p-3 text-sm"
      />
    </section>
  )
}
