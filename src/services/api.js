const BASE = import.meta.env.VITE_API_URL || ''

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Error del servidor')
  }
  return res.json()
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/api/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email, password, name, role) =>
    request('/api/users/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) }),

  getUser: (id) => request(`/api/users/${id}`),

  updateUser: (id, data) =>
    request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  listUsers: () => request('/api/users/'),

  // Calls
  initiateCall: (callerId, receiverId, callType) =>
    request('/api/calls/initiate', { method: 'POST', body: JSON.stringify({ caller_id: callerId, receiver_id: receiverId, call_type: callType }) }),

  answerCall: (callId) =>
    request('/api/calls/answer', { method: 'POST', body: JSON.stringify({ call_id: callId }) }),

  endCall: (callId) =>
    request('/api/calls/end', { method: 'POST', body: JSON.stringify({ call_id: callId }) }),

  getCallHistory: (userId) => request(`/api/calls/history/${userId}`),

  sendMessage: (fromId, toId, text) =>
    request('/api/messages/send', { method: 'POST', body: JSON.stringify({ from_id: fromId, to_id: toId, text }) }),

  getConversation: (uid1, uid2) =>
    request(`/api/messages/conversation?uid1=${uid1}&uid2=${uid2}`),

  deleteConversation: (uid1, uid2) =>
    request('/api/messages/delete-conversation', { method: 'POST', body: JSON.stringify({ uid1, uid2 }) }),

  inviteContact: (fromId, toId, fromName) =>
    request('/api/contacts/invite', { method: 'POST', body: JSON.stringify({ from_id: fromId, to_id: toId, from_name: fromName }) }),

  acceptContact: (userId, fromId) =>
    request('/api/contacts/accept', { method: 'POST', body: JSON.stringify({ user_id: userId, from_id: fromId }) }),

  rejectContact: (userId, fromId) =>
    request('/api/contacts/reject', { method: 'POST', body: JSON.stringify({ user_id: userId, from_id: fromId }) }),

  listContacts: (userId) => request(`/api/contacts/list?user_id=${userId}`),

  removeContact: (userId, targetId) =>
    request('/api/contacts/remove', { method: 'POST', body: JSON.stringify({ user_id: userId, target_id: targetId }) }),

  listInvitations: (userId) => request(`/api/contacts/invitations?user_id=${userId}`),

  health: () => request('/health'),

  listChannels: () => request('/api/channels'),

  createChannel: (name, description, type, ownerId) =>
    request('/api/channels/create', { method: 'POST', body: JSON.stringify({ name, description, type, owner_id: ownerId }) }),

  joinChannel: (channelId, userId) =>
    request('/api/channels/join', { method: 'POST', body: JSON.stringify({ channel_id: channelId, user_id: userId }) }),

  leaveChannel: (channelId, userId) =>
    request('/api/channels/leave', { method: 'POST', body: JSON.stringify({ channel_id: channelId, user_id: userId }) }),

  deleteChannel: (channelId, userId) =>
    request('/api/channels/delete', { method: 'POST', body: JSON.stringify({ channel_id: channelId, user_id: userId }) }),
}