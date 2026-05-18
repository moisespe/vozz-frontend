import { sendWS } from './ws.js'

let localStream = null
let peerConnection = null
let remoteAudio = null
let onRemoteStream = null

const STUN = { urls: 'stun:stun.l.google.com:19302' }

export function setOnRemoteStream(cb) {
  onRemoteStream = cb
}

export async function startLocalStream() {
  if (localStream) return localStream
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    return localStream
  } catch (e) {
    console.warn('[WebRTC] Error getting microphone:', e)
    return null
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
  }
  return remoteAudio
}

export async function createOffer(toId) {
  const stream = await startLocalStream()
  if (!stream) return

  const pc = new RTCPeerConnection({ iceServers: [STUN] })
  peerConnection = pc

  stream.getTracks().forEach(track => pc.addTrack(track, stream))

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      sendWS('webrtc:ice', toId, { candidate: e.candidate })
    }
  }

  pc.ontrack = (e) => {
    const audio = createRemoteAudio()
    audio.srcObject = e.streams[0]
    if (onRemoteStream) onRemoteStream(e.streams[0])
  }

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  sendWS('webrtc:offer', toId, { sdp: offer })
  return pc
}

export async function createAnswer(fromId, offerSdp) {
  const stream = await startLocalStream()
  if (!stream) return

  const pc = new RTCPeerConnection({ iceServers: [STUN] })
  peerConnection = pc

  stream.getTracks().forEach(track => pc.addTrack(track, stream))

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      sendWS('webrtc:ice', fromId, { candidate: e.candidate })
    }
  }

  pc.ontrack = (e) => {
    const audio = createRemoteAudio()
    audio.srcObject = e.streams[0]
    if (onRemoteStream) onRemoteStream(e.streams[0])
  }

  const offer = new RTCSessionDescription(offerSdp)
  await pc.setRemoteDescription(offer)
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  sendWS('webrtc:answer', fromId, { sdp: answer })
  return pc
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