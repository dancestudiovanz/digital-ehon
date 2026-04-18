import { useEffect, useState } from 'react'

export const OrientationGuard = () => {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isPortrait) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 p-6 text-center text-white">
      <p className="rounded-2xl bg-zinc-800 p-6 text-lg font-bold">横向きでご利用ください</p>
    </div>
  )
}
