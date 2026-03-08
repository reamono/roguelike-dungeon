import { useEffect, useState } from 'react'

export default function LevelUpFlash() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="levelup-flash">
      <div className="levelup-text">LEVEL UP!</div>
    </div>
  )
}
