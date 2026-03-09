// Web Audio API による簡易効果音
let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioCtx
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
  const ctx = getCtx()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

export function sfxAttack() {
  playTone(220, 0.08, 'square', 0.12)
  setTimeout(() => playTone(330, 0.06, 'square', 0.08), 40)
}

export function sfxHit() {
  playTone(120, 0.1, 'sawtooth', 0.1)
}

export function sfxPickup() {
  playTone(523, 0.06, 'square', 0.1)
  setTimeout(() => playTone(659, 0.06, 'square', 0.1), 60)
}

export function sfxLevelUp() {
  playTone(523, 0.1, 'square', 0.12)
  setTimeout(() => playTone(659, 0.1, 'square', 0.12), 100)
  setTimeout(() => playTone(784, 0.15, 'square', 0.12), 200)
}

export function sfxGameOver() {
  playTone(294, 0.2, 'sawtooth', 0.1)
  setTimeout(() => playTone(247, 0.2, 'sawtooth', 0.1), 200)
  setTimeout(() => playTone(196, 0.4, 'sawtooth', 0.1), 400)
}

export function sfxGold() {
  playTone(880, 0.04, 'square', 0.08)
  setTimeout(() => playTone(1100, 0.06, 'square', 0.08), 40)
}

export function sfxStairs() {
  playTone(392, 0.1, 'triangle', 0.1)
  setTimeout(() => playTone(523, 0.1, 'triangle', 0.1), 100)
  setTimeout(() => playTone(659, 0.15, 'triangle', 0.1), 200)
}

export function sfxMystery() {
  playTone(440, 0.15, 'sine', 0.08)
  setTimeout(() => playTone(554, 0.15, 'sine', 0.08), 150)
  setTimeout(() => playTone(659, 0.2, 'sine', 0.1), 300)
}

// ユーザー操作でAudioContextを起動
export function initAudio() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
}
