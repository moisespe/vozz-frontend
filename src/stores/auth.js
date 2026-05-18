import { defineStore } from 'pinia'
import { api } from '../services/api.js'

const USER_NAMES = {
  'test@gmail.com': 'Admin',
  'ana@example.com': 'Ana García',
  'carlos@example.com': 'Carlos López',
  'maria@example.com': 'María Rodríguez',
  'pedro@example.com': 'Pedro Martínez',
  'laura@example.com': 'Laura Fernández',
  'diego@example.com': 'Diego Sánchez',
  'sofia@example.com': 'Sofía Torres',
}

export function getUserData(email) {
  const name = USER_NAMES[email] || email?.split('@')[0] || 'Usuario'
  const role = email === 'test@gmail.com' ? 'admin' : 'user'
  return { name, role }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, token: localStorage.getItem('token') || '' }),
  getters: { isAuthenticated: (state) => !!state.token },

  actions: {
    async login(email, password) {
      const e = email.trim().toLowerCase()
      const data = await api.login(e, password.trim())
      this.user = { id: data.user.id, name: data.user.name || getUserData(e).name, email: e, role: data.user.role }
      this.token = data.token
      localStorage.setItem('token', this.token)
      return this.user
    },

    async register(email, password) {
      const e = email.trim().toLowerCase()
      const name = email.split('@')[0]
      const data = await api.register(e, password, name, 'user')
      this.user = data.user
      this.token = data.token
      localStorage.setItem('token', this.token)
      return this.user
    },

    async fetchUser() {
      if (!this.user && this.token) {
        const email = localStorage.getItem('vozz_login_email')
        const info = getUserData(email)
        this.user = { id: 0, name: info.name, email: email || 'test@gmail.com', role: info.role }
      }
      return this.user
    },

    async logout() {
      this.user = null; this.token = ''
      try { localStorage.clear() } catch {}
      try { sessionStorage.clear() } catch {}
      try { document.cookie.split(';').forEach(c => { document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/') }) } catch {}
      if ('caches' in window) { try { const k = await caches.keys(); await Promise.all(k.map(x => caches.delete(x))) } catch {} }
      if ('serviceWorker' in navigator) { try { const r = await navigator.serviceWorker.getRegistrations(); await Promise.all(r.map(x => x.unregister())) } catch {} }
    }
  }
})