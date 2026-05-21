import { sendWS } from './ws.js'

let localStream = null
let peerConnection = null
let remoteAudio = null
let onRemoteStream = null
const channelPeers = {}

const STUN = { urls: 'stun:stun.l.google.com:19302' }

export function setOnRemoteStream(cb) {
  onRemoteStream = cb
}

export async function startLocalStream() {
  if (localStream) return localStream
  try {
    const savedInput = localStorage.getItem('vozz_audio_input')
    const constraints = { audio: { echoCancellation: true, noiseSuppression: true }, video: false }
    if (savedInput) {
      constraints.audio = { deviceId: { exact: savedInput }, echoCancellation: true, noiseSuppression: true }
    }
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    return localStream
    } catch (e) {
      console.warn('[WebRTC] Error getting microphone:', e)
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
      return localStream
    } catch (e2) {
      console.warn('[WebRTC] Fallback mic also failed:', e2)
      return null
    }
  }
}

export function stopLocalStream() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop())
    localStream = null
  }
}

export function createRemoteAudio() {
  if (!remoteAudio) {
    remoteAudio = new Audio()
    remoteAudio.autoplay = true
    const savedOutput = localStorage.getItem('vozz_audio_output')
    if (savedOutput && remoteAudio.setSinkId) {
      remoteAudio.setSinkId(savedOutput).catch(() => {})
    }
  }
  return remoteAudio
}

function createPC(remoteId, onIceCandidate, isChannel = false) {
  const pc = new RTCPeerConnection({ iceServers: [STUN] })
  if (localStream) {
    localStream.getTracks().forEach(track => {
      try { pc.addTrack(track, localStream) } catch {}
    })
  }
  pc.onicecandidate = (e) => {
    if (e.candidate && onIceCandidate) {
      onIceCandidate(e.candidate)
    }
  }
  pc.ontrack = (e) => {
    if (isChannel && channelPeers[remoteId]) {
      channelPeers[remoteId].audio.srcObject = e.streams[0]
      channelPeers[remoteId].audio.play().catch(() => {})
    } else if (!isChannel) {
      const audio = createRemoteAudio()
      audio.srcObject = e.streams[0]
    }
    if (onRemoteStream) onRemoteStream(e.streams[0])
  }
  return pc
}

export async function createOffer(toId) {
  const stream = await startLocalStream()
  if (!stream) return
  const pc = createPC(toId, (candidate) => {
    sendWS('webrtc:ice', toId, { candidate })
  })
  peerConnection = pc
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  sendWS('webrtc:offer', toId, { sdp: offer })
  return pc
}

export async function createAnswer(fromId, offerSdp, isChannel = false) {
  if (isChannel && channelPeers[fromId]) {
    const audio = new Audio()
    audio.autoplay = true
    audio.setAttribute('playsinline', '')
    channelPeers[fromId].audio = audio
    return channelPeers[fromId].pc
  }
  const stream = await startLocalStream()
  if (!stream) return
  const prefix = isChannel ? 'channel:' : 'webrtc:'
  const pc = createPC(fromId, (candidate) => {
    sendWS(prefix + 'ice', fromId, { candidate })
  }, isChannel)
  if (isChannel) {
    const audio = new Audio()
    audio.autoplay = true
    audio.setAttribute('playsinline', '')
    channelPeers[fromId] = { pc, audio }
  } else {
    peerConnection = pc
  }
  const offer = new RTCSessionDescription(offerSdp)
  await pc.setRemoteDescription(offer)
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  sendWS(prefix + 'answer', fromId, { sdp: answer })
  return pc
}

export async function createChannelOffer(toId) {
  if (channelPeers[toId]) return channelPeers[toId].pc
  const stream = await startLocalStream()
  if (!stream) return
  const pc = createPC(toId, (candidate) => {
    sendWS('channel:ice', toId, { candidate })
  }, true)
  const audio = new Audio()
  audio.autoplay = true
  audio.setAttribute('playsinline', '')
  channelPeers[toId] = { pc, audio }
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  sendWS('channel:offer', toId, { sdp: offer })
  return pc
}

export async function handleChannelAnswer(fromId, answerSdp) {
  const peer = channelPeers[fromId]
  if (!peer) return
  const answer = new RTCSessionDescription(answerSdp)
  await peer.pc.setRemoteDescription(answer)
}

export async function handleChannelIce(fromId, candidate) {
  const peer = channelPeers[fromId]
  if (!peer || !peer.pc) return
  try {
    await peer.pc.addIceCandidate(new RTCIceCandidate(candidate))
  } catch (e) {
    console.warn('[Channel] ICE error:', e)
  }
}

export function closeAllChannelPeers() {
  Object.keys(channelPeers).forEach(id => {
    channelPeers[id].pc.close()
    channelPeers[id].audio.srcObject = null
    channelPeers[id].audio = null
    delete channelPeers[id]
  })
}

export function removeChannelPeer(remoteId) {
  if (channelPeers[remoteId]) {
    channelPeers[remoteId].pc.close()
    channelPeers[remoteId].audio.srcObject = null
    channelPeers[remoteId].audio = null
    delete channelPeers[remoteId]
  }
}

export async function handleAnswer(answerSdp) {
  if (!peerConnection) return
  const answer = new RTCSessionDescription(answerSdp)
  await peerConnection.setRemoteDescription(answer)
}

export async function handleIce(candidate) {
  if (!peerConnection) return
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  } catch (e) {
    console.warn('[WebRTC] ICE error:', e)
  }
}

export function hangup() {
  if (peerConnection) {
    peerConnection.close()
    peerConnection = null
  }
  stopLocalStream()
  if (remoteAudio) {
    remoteAudio.srcObject = null
    remoteAudio = null
  }
}

export function applyOutputDevice(deviceId) {
  if (remoteAudio && remoteAudio.setSinkId) {
    remoteAudio.setSinkId(deviceId).catch(() => {})
  }
}

export function getChannelPeers() { return channelPeers }
