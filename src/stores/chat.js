import { defineStore } from 'pinia'
import { playBuzz } from '../utils/buzzAudio.js'
import { playNotify } from '../utils/notify.js'
import { api } from '../services/api.js'

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: {},
    openChats: [],
    activeChatId: null,
    buzzState: {},
  }),

  getters: {
    getMessages: (state) => (contactId) => state.conversations[contactId] || [],
    getOpenChats: (state) => state.openChats,
    isChatOpen: (state) => (contactId) => state.openChats.some(c => c.id === contactId),
    isBuzzing: (state) => (contactId) => state.buzzState[contactId] || false,
  },

  actions: {
    initConversation(contactId) {
      if (!this.conversations[contactId]) {
        this.conversations[contactId] = []
      }
    },

    openChat(contact) {
      if (!this.isChatOpen(contact.id)) {
        this.initConversation(contact.id)
        this.openChats.push({ id: contact.id, name: contact.name, online: contact.online })
      }
      this.activeChatId = contact.id
    },

    closeChat(contactId) {
      this.openChats = this.openChats.filter(c => c.id !== contactId)
      if (this.activeChatId === contactId) {
        this.activeChatId = this.openChats.length > 0 ? this.openChats[this.openChats.length - 1].id : null
      }
    },

    setActiveChat(contactId) {
      if (this.openChats.some(c => c.id === contactId)) this.activeChatId = contactId
    },

    async sendMessage(contactId, text) {
      if (!text.trim()) return
      if (!this.conversations[contactId]) this.conversations[contactId] = []
      this.conversations[contactId].push({ id: Date.now(), from: 'me', text: text.trim(), time: new Date().toISOString(), type: 'text' })

      try {
        const { useAuthStore } = await import('./auth.js')
        const auth = useAuthStore()
        if (auth.user?.id && contactId) {
          await api.sendMessage(auth.user.id, contactId, text.trim())
        }
      } catch {}
    },

    receiveMessage(contactId, text) {
      if (!this.conversations[contactId]) this.conversations[contactId] = []
      this.conversations[contactId].push({ id: Date.now(), from: contactId, text, time: new Date().toISOString(), type: 'text' })
      playNotify()
    },

    sendBuzz(contactId) {
      if (!this.conversations[contactId]) this.conversations[contactId] = []
      this.conversations[contactId].push({ id: Date.now(), from: 'me', text: '🔔 Zumbido enviado', time: new Date().toISOString(), type: 'buzz' })
      this.buzzState[contactId] = Date.now() + 600
      playBuzz()
      setTimeout(() => { this.buzzState[contactId] = false }, 1500)
    },
  },
})