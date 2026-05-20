import { defineStore } from 'pinia'
import { api } from '../services/api.js'

const CONTACTS_KEY = 'vozz_contacts'
const REJECTED_KEY = 'vozz_rejected'

function loadContacts() {
  try {
    localStorage.removeItem('vozz_hidden')
    return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]')
  } catch { return [] }
}

function loadRejected() {
  try { return JSON.parse(localStorage.getItem(REJECTED_KEY) || '[]') } catch { return [] }
}

export const useCallStore = defineStore('calls', {
  state: () => ({
    calls: [],
    loading: false,
    contacts: loadContacts(),
    allUsers: [],
    channels: [],
    invitations: [],
    rejectedPairs: loadRejected(),
  }),

  getters: {
    onlineContacts: (state) => state.contacts,
    offlineContacts: (state) => [],
    activeChannel: (state) => null,
    pendingInvitations: (state) => state.invitations.filter(i => !state.rejectedPairs.includes(`${i.from_id}-${i.to_id}`)),
  },

  actions: {
    _saveContacts() {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(this.contacts))
    },

    async fetchAllUsers() {
      try {
        const data = await api.listUsers()
        this.allUsers = (data.users || []).map(u => ({
          id: u.id, name: u.name || u.email?.split('@')[0] || 'Usuario', email: u.email, role: u.role
        }))
      } catch { this.allUsers = [] }
    },

    async fetchContacts(userId) {
      try {
        const data = await api.listContacts(userId)
        if (data.contacts && data.contacts.length > 0) {
          const apiContacts = data.contacts.map(c => ({
            id: c.user_id, name: c.name, email: c.email, description: ''
          }))
          for (const ac of apiContacts) {
            if (!this.contacts.find(c => c.id === ac.id)) {
              this.contacts.push(ac)
            }
          }
          this._saveContacts()
        }
      } catch {}
    },

    async fetchInvitations(userId) {
      try {
        const data = await api.listInvitations(userId)
        this.invitations = data.invitations || []
      } catch { this.invitations = [] }
    },

    async sendInvite(fromId, toId, fromName) {
      await api.inviteContact(fromId, toId, fromName)
    },

    async acceptInvite(userId, fromId, fromName) {
      await api.acceptContact(userId, fromId)
      this.invitations = this.invitations.filter(i => !(i.from_id === fromId && i.to_id === userId))
      this._addRejected(fromId, userId)
      await this.fetchContacts(userId)
      const name = fromName || this.allUsers.find(u => u.id === fromId)?.name || 'Contacto'
      if (!this.contacts.find(c => c.id === fromId)) {
        this.contacts.push({ id: fromId, name, email: '', description: '' })
        this._saveContacts()
      }
    },

    _addRejected(fromId, userId) {
      const key = `${fromId}-${userId}`
      if (!this.rejectedPairs.includes(key)) {
        this.rejectedPairs.push(key)
        localStorage.setItem(REJECTED_KEY, JSON.stringify(this.rejectedPairs))
      }
    },

    async rejectInvite(userId, fromId) {
      try { await api.rejectContact(userId, fromId) } catch {}
      this.invitations = this.invitations.filter(i => !(i.from_id === fromId && i.to_id === userId))
      this._addRejected(fromId, userId)
    },

    async removeContact(userId, targetId) {
      try { await api.removeContact(userId, targetId) } catch {}
      this.contacts = this.contacts.filter(c => c.id !== targetId)
      this._saveContacts()
      try { await api.deleteConversation(userId, targetId) } catch {}
      const { useChatStore } = await import('./chat.js')
      useChatStore().clearConversation(targetId)
    },

    // Canales de voz
    async fetchChannels() {
      try {
        const data = await api.listChannels()
        if (data.channels) {
          for (const ch of data.channels) {
            const idx = this.channels.findIndex(c => c.id === ch.id)
            if (idx >= 0) {
              this.channels[idx] = ch
            } else {
              this.channels.push(ch)
            }
          }
        }
      } catch {}
    },

    async createChannelApi(name, description, type, ownerId) {
      const data = await api.createChannel(name, description, type, ownerId)
      if (!this.channels.find(c => c.id === data.channel.id)) {
        this.channels.push(data.channel)
      }
      return data.channel
    },

    async joinChannelApi(channelId, userId) {
      const data = await api.joinChannel(channelId, userId)
      const idx = this.channels.findIndex(c => c.id === channelId)
      if (idx >= 0) this.channels[idx] = data.channel
      return data.channel
    },

    async leaveChannelApi(channelId, userId) {
      const data = await api.leaveChannel(channelId, userId)
      const idx = this.channels.findIndex(c => c.id === channelId)
      if (idx >= 0) this.channels[idx] = data.channel
      return data.channel
    },

    async deleteChannelApi(channelId, userId) {
      await api.deleteChannel(channelId, userId)
      this.channels = this.channels.filter(c => c.id !== channelId)
    },

    isInChannel(channelId, userId) {
      const ch = this.channels.find(c => c.id === channelId)
      return ch ? ch.members.includes(userId) : false
    },

    async getStats() {
      return { todayCalls: 0, totalMinutes: 0, contactsCount: this.contacts.length }
    },

    async getRecentCalls() { return [] },
  }
})
