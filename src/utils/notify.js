let notifyAudio = null
let ringAudio = null
let connectAudio = null
let incomingAudio = null

export async function initNotify() {
  const src = localStorage.getItem('vozz_notify_sound') || '/audio/notify_001.mp3'
  if (src !== 'none') {
    try {
      const a = new Audio(); a.preload = 'auto'; a.src = src
      await new Promise((res, rej) => { a.oncanplaythrough = res; a.onerror = rej; setTimeout(rej, 2000) })
      notifyAudio = a
    } catch { notifyAudio = null }
  }
  try {
    const r = new Audio(); r.preload = 'auto'; r.src = '/audio/ring_call.mp3'; r.loop = true
    await new Promise((res, rej) => { r.oncanplaythrough = res; r.onerror = rej; setTimeout(rej, 2000) })
    ringAudio = r
  } catch { ringAudio = null }
  try {
    const c = new Audio(); c.preload = 'auto'; c.src = '/audio/connect_call.mp3'
    await new Promise((res, rej) => { c.oncanplaythrough = res; c.onerror = rej; setTimeout(rej, 2000) })
    connectAudio = c
  } catch { connectAudio = null }
  try {
    const i = new Audio(); i.preload = 'auto'; i.src = '/audio/ring_tone.mp3'; i.loop = true
    await new Promise((res, rej) => { i.oncanplaythrough = res; i.onerror = rej; setTimeout(rej, 2000) })
    incomingAudio = i
  } catch { incomingAudio = null }
}

export function playNotify() {
  const src = localStorage.getItem('vozz_notify_sound')
  if (src === 'none' || !notifyAudio) return
  try { notifyAudio.currentTime = 0; notifyAudio.play() } catch {}
}

export function playRing() {
  if (!ringAudio) return
  try { ringAudio.currentTime = 0; ringAudio.play() } catch {}
}

export function stopRing() {
  if (!ringAudio) return
  try { ringAudio.pause(); ringAudio.currentTime = 0 } catch {}
}

export function playConnect() {
  stopRing(); stopIncoming()
  if (!connectAudio) return
  try { connectAudio.currentTime = 0; connectAudio.play() } catch {}
}

export function playIncoming() {
  if (!incomingAudio) return
  try { incomingAudio.currentTime = 0; incomingAudio.play() } catch {}
}

export function stopIncoming() {
  if (!incomingAudio) return
  try { incomingAudio.pause(); incomingAudio.currentTime = 0 } catch {}
}

export function stopAll() {
  stopRing(); stopIncoming()
  if (connectAudio) try { connectAudio.pause(); connectAudio.currentTime = 0 } catch {}
}

export function setNotifySrc(src) {
  localStorage.setItem('vozz_notify_sound', src)
  notifyAudio = null
  if (src !== 'none') initNotify()
}