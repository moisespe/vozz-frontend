let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function playBuzzSound() {
  try {
    const ctx = getCtx()
    const duration = 0.4
    const start = ctx.currentTime

    // Onda principal: tono grave vibrante
    const osc1 = ctx.createOscillator()
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(80, start)
    osc1.frequency.exponentialRampToValueAtTime(140, start + duration * 0.3)
    osc1.frequency.exponentialRampToValueAtTime(80, start + duration * 0.6)
    osc1.frequency.exponentialRampToValueAtTime(120, start + duration)

    const gain1 = ctx.createGain()
    gain1.gain.setValueAtTime(0.5, start)
    gain1.gain.exponentialRampToValueAtTime(0.2, start + duration * 0.3)
    gain1.gain.exponentialRampToValueAtTime(0.4, start + duration * 0.5)
    gain1.gain.exponentialRampToValueAtTime(0.01, start + duration)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(start)
    osc1.stop(start + duration)

    // Onda secundaria: armónico para textura
    const osc2 = ctx.createOscillator()
    osc2.type = 'square'
    osc2.frequency.setValueAtTime(60, start)
    osc2.frequency.exponentialRampToValueAtTime(90, start + duration)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0.2, start)
    gain2.gain.exponentialRampToValueAtTime(0.01, start + duration * 0.7)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(start)
    osc2.stop(start + duration)

    // Ruido tipo vibración
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.3
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const gain3 = ctx.createGain()
    gain3.gain.setValueAtTime(0.15, start)
    gain3.gain.exponentialRampToValueAtTime(0.01, start + duration)

    noise.connect(gain3)
    gain3.connect(ctx.destination)
    noise.start(start)
    noise.stop(start + duration)

  } catch (e) {
    console.warn('Audio no disponible:', e)
  }
}

export function playBuzzReceivedSound() {
  try {
    const ctx = getCtx()
    const start = ctx.currentTime

    // Doble tono: anuncio de zumbido recibido
    for (let i = 0; i < 2; i++) {
      const t = start + i * 0.25
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220 + i * 60, t)
      osc.frequency.exponentialRampToValueAtTime(440 + i * 80, t + 0.15)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.2)
    }
  } catch (e) {
    console.warn('Audio no disponible:', e)
  }
}