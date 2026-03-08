import { useRef, useEffect, useState } from 'react'
import { MAP_WIDTH, MAP_HEIGHT, TILE } from '../utils/constants'

const MINI_TILE = 3
const EXPANDED_TILE = 6

export default function Minimap({ tiles, revealed, visible, player, enemies, boss, stairs }) {
  const canvasRef = useRef(null)
  const [expanded, setExpanded] = useState(false)

  const tileSize = expanded ? EXPANDED_TILE : MINI_TILE

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const w = MAP_WIDTH * tileSize
    const h = MAP_HEIGHT * tileSize
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    // Background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)

    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (!revealed[y][x]) continue

        const px = x * tileSize
        const py = y * tileSize
        const tile = tiles[y][x]

        if (tile === TILE.WALL) {
          ctx.fillStyle = visible[y][x] ? '#333355' : '#1a1a2e'
        } else if (tile === TILE.FLOOR || tile === TILE.CORRIDOR) {
          ctx.fillStyle = visible[y][x] ? '#444466' : '#222233'
        } else if (tile === TILE.STAIRS) {
          ctx.fillStyle = '#44aa66'
        }

        ctx.fillRect(px, py, tileSize, tileSize)
      }
    }

    // Stairs
    if (stairs && revealed[stairs.y]?.[stairs.x]) {
      ctx.fillStyle = '#44aa66'
      ctx.fillRect(stairs.x * tileSize, stairs.y * tileSize, tileSize, tileSize)
    }

    // Enemies (visible only)
    if (enemies) {
      for (const e of enemies) {
        if (e.hp <= 0) continue
        if (!visible[e.y]?.[e.x]) continue
        ctx.fillStyle = '#cc4444'
        ctx.fillRect(e.x * tileSize, e.y * tileSize, tileSize, tileSize)
      }
    }

    // Boss (visible only)
    if (boss && boss.hp > 0) {
      const bv = visible[boss.y]?.[boss.x] || visible[boss.y]?.[boss.x + 1]
      if (bv) {
        ctx.fillStyle = '#ff4444'
        ctx.fillRect(boss.x * tileSize, boss.y * tileSize, tileSize * 2, tileSize * 2)
      }
    }

    // Player
    ctx.fillStyle = '#ffcc44'
    ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize)

  }, [tiles, revealed, visible, player, enemies, boss, stairs, tileSize])

  return (
    <div
      className={`minimap ${expanded ? 'minimap-expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <canvas ref={canvasRef} className="minimap-canvas" />
    </div>
  )
}
