import { defineStore } from 'pinia'
import { playBuzz } from '../utils/buzzAudio.js'
import { playNotify } from '../utils/notify.js'
import { api } from '../services/api.js'

const CHATS_KEY = 'vozz_chats'
const UNREAD_KEY = 'vozz_unread'

function loadConversations() {
  try { return JSON.parse(localStorage.getItem(CHATS_KEY) || '{}') } catch { return {} }
}

function loadUnread() {
  try { return JSON.parse(localStorage.getItem(UNREAD_KEY) || '{}') } catch { return {} }
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: loadConversations(),
    openChats: [],
    activeChatId: null,
    buzzState: {},
    unread: loadUnread(),
  }),

  getters: {
    getMessages: (state) => (contactId) => state.conversations[contactId] || [],
    getOpenChats: (state) => state.openChats,
    isChatOpen: (state) => (contactId) => state.openChats.some(c => c.id === contactId),
    isBuzzing: (state) => (contactId) => state.buzzState[contactId] || false,
    getUnread: (state) => (contactId) => state.unread[contactId] || 0,
    totalUnread: (state) => Object.values(state.unread).reduce((sum, n) => sum + n, 0),
  },

  actions: {
    _saveConversations() {
      try { localStorage.setItem(CHATS_KEY, JSON.stringify(this.conversations)) } catch {}
    },

    _saveUnread() {
      try { localStorage.setItem(UNREAD_KEY, JSON.stringify(this.unread)) } catch {}
    },

    initConversation(contactId) {
      if (!this.conversations[contactId]) {
        this.conversations[contactId] = []
      }
    },

    async loadConversation(userId, contactId) {
      this.initConversation(contactId)
      try {
        const data = await api.getConversation(userId, contactId)
        if (data.messages) {
          const localCount = this.conversations[contactId].length
          this.conversations[contactId] = data.messages.map(m => ({
            id: m.id,
            from: m.from_id === userId ? 'me' : contactId,
            text: m.text,
            time: m.created_at,
            type: 'text',
          }))
          if (this.activeChatId !== contactId && data.messages.length > localCount) {
            this.unread[contactId] = (this.unread[contactId] || 0) + (data.messages.length - localCount)
            this._saveUnread()
          }
          this._saveConversations()
        }
      } catch {}
    },

    async syncUnreadFromApi(userId, contactIds) {
      for (const contactId of contactIds) {
        if (this.activeChatId === contactId) continue
        try {
          const data = await api.getConversation(userId, contactId)
          if (data.messages && data.messages.length > 0) {
            const localCount = (this.conversations[contactId] || []).length
            if (data.messages.length > localCount) {
              this.unread[contactId] = (this.unread[contactId] || 0) + (data.messages.length - localCount)
            }
          }
        } catch {}
      }
      this._saveUnread()
    },

    openChat(contact) {
      if (!this.isChatOpen(contact.id)) {
        this.initConversation(contact.id)
        this.openChats.push({ id: contact.id, name: contact.name, online: contact.online })
      }
      this.activeChatId = contact.id
      this.unread[contact.id] = 0
      this._saveUnread()
    },

    closeChat(contactId) {
      this.openChats = this.openChats.filter(c => c.id !== contactId)
      if (this.activeChatId === contactId) {
        this.activeChatId = this.openChats.length > 0 ? this.openChats[this.openChats.length - 1].id : null
      }
    },

    setActiveChat(contactId) {
      if (this.openChats.some(c => c.id === contactId)) {
        this.activeChatId = contactId
        this.unread[contactId] = 0
        this._saveUnread()
      }
    },

    async sendMessage(contactId, text) {
      if (!text.trim()) return
      if (!this.conversations[contactId]) this.conversations[contactId] = []
      this.conversations[contactId].push({ id: Date.now(), from: 'me', text: text.trim(), time: new Date().toISOString(), type: 'text' })
      this._saveConversations()

      try {
        const { useAuthStore } = await import('./auth.js')
        const auth = useAuthStore()
        if (auth.user?.id && contactId) {
          await api.sendMessage(auth.user.id, contactId, text.trim())
        }
      } catch {}
    },

    receiveMessage(userId, contactId, text) {
      if (!this.conversations[contactId]) this.conversations[contactId] = []
      this.conversations[contactId].push({ id: Date.now(), from: contactId, text, time: new Date().toISOString(), type: 'text' })
      this._saveConversations()

      if (this.activeChatId === contactId) {
        this.unread[contactId] = 0
      } else {
        this.unread[contactId] = (this.unread[contactId] || 0) + 1
        playNotify()
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('Nuevo mensaje', { body: `${text.slice(0, 60)}`, icon: '/icons/icon-192.svg' })
        }
      }
      this._saveUnread()
    },

    clearUnread(contactId) {
      this.unread[contactId] = 0
      this._saveUnread()
    },

    sendBuzz(contactId) {
      if (!this.conversations[contactId]) this.conversations[contactId] = []
      this.conversations[contactId].push({ id: Date.now(), from: 'me', text: '🔔 Zumbido enviado', time: new Date().toISOString(), type: 'buzz' })
      this.buzzState[contactId] = Date.now() + 600
      playBuzz()
      setTimeout(() => { this.buzzState[contactId] = false }, 1500)
      import('../services/ws.js').then(ws => ws.sendWS('buzz', contactId))
    },

    receiveBuzz(contactId) {
      if (!this.conversations[contactId]) this.conversations[contactId] = []
      this.conversations[contactId].push({ id: Date.now(), from: contactId, text: '🔔 Zumbido recibido', time: new Date().toISOString(), type: 'buzz' })
      this.buzzState[contactId] = Date.now() + 600
      this.unread[contactId] = (this.unread[contactId] || 0) + 1
      this._saveUnread()
      playBuzz()
      setTimeout(() => { this.buzzState[contactId] = false }, 1500)
    },

    clearConversation(contactId) {
      delete this.conversations[contactId]
      this.openChats = this.openChats.filter(c => c.id !== contactId)
      if (this.activeChatId === contactId) {
        this.activeChatId = this.openChats.length > 0 ? this.openChats[this.openChats.length - 1].id : null
      }
      delete this.unread[contactId]
      this._saveConversations()
      this._saveUnread()
    },
  },
})
