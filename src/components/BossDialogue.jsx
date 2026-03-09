export default function BossDialogue({ text }) {
  if (!text) return null

  return (
    <div className="boss-dialogue">
      <div className="boss-dialogue-text">{`"${text}"`}</div>
    </div>
  )
}
