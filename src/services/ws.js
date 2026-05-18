const BASE = import.meta.env.VITE_API_URL || window.location.origin
const WS_URL = BASE.replace(/^http/, 'ws') + '/ws'

let socket = null
let reconnectTimer = null
let listeners = {}

export function connectWS(userId) {
  if (socket && socket.readyState === WebSocket.OPEN) return

  const url = `${WS_URL}?user_id=${userId}`
  socket = new WebSocket(url)

  socket.onopen = () => {
    console.log('WS connected')
    emit('connected')
  }

  socket.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      emit(msg.type, msg)
    } catch {}
  }

  socket.onclose = () => {
    console.log('WS disconnected')
    socket = null
    reconnectTimer = setTimeout(() => connectWS(userId), 3000)
  }

  socket.onerror = () => {
    socket && socket.close()
  }
}

export function disconnectWS() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (socket) {
    socket.onclose = null
    socket.close()
    socket = null
  }
}

export function sendWS(type, toId, data = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify({ type, to_id: toId, ...data }))
}

export function onWS(event, callback) {
  if (!listeners[event]) listeners[event] = []
  listeners[event].push(callback)
  return () => {
    listeners[event] = listeners[event].filter(c => c !== callback)
  }
}

function emit(event, data) {
  (listeners[event] || []).forEach(cb => cb(data))
}