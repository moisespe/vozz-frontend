import { playBuzzSound, playBuzzReceivedSound } from './sound.js'

let buzzAudio = null
let buzzReceivedAudio = null

function preloadAudio(src) {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.oncanplaythrough = () => resolve(audio)
    audio.onerror = () => resolve(null)
    audio.src = src
    audio.load()
  })
}

// Intentar cargar mp3, si falla se usará Web Audio API
let mp3Loaded = false

export async function initBuzzAudio() {
  const mp3 = await preloadAudio('/audio/zumbido.mp3')
  if (mp3) {
    buzzAudio = mp3
    buzzReceivedAudio = mp3
    mp3Loaded = true
  }
}

export function playBuzz() {
  if (mp3Loaded && buzzAudio) {
    buzzAudio.currentTime = 0
    buzzAudio.play().catch(() => playBuzzSound())
  } else {
    playBuzzSound()
  }
}

export function playBuzzReceived() {
  if (mp3Loaded && buzzReceivedAudio) {
    buzzReceivedAudio.currentTime = 0
    buzzReceivedAudio.play().catch(() => playBuzzReceivedSound())
  } else {
    playBuzzReceivedSound()
  }
}