<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-4">
    <Card class="w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <div class="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v3m0 0H8m4 0h4m-4-7a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-foreground">Vozz</h1>
        <p class="text-sm text-muted-foreground mt-1">Sistema de comunicación por voz</p>
      </div>

      <!-- Estado del servidor -->
      <div class="flex items-center justify-center gap-2 mb-6 text-xs">
        <span class="w-2 h-2 rounded-full" :class="backendStatus === 'online' ? 'bg-green-500' : backendStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'"></span>
        <span class="text-muted-foreground">Servidor: {{ backendStatus === 'online' ? 'Conectado' : backendStatus === 'checking' ? 'Verificando...' : 'Sin conexión (modo local)' }}</span>
      </div>

      <form class="space-y-5" @submit.prevent>
        <div class="space-y-2">
          <Label for="email">Correo electrónico</Label>
          <input id="email" type="email" v-model="email" placeholder="Ingrese su correo" required
            class="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" />
        </div>

        <div class="space-y-2">
          <Label for="password">Contraseña</Label>
          <input id="password" type="password" v-model="password" placeholder="Ingrese su contraseña" required
            class="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" />
        </div>

        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" class="rounded border-input bg-card text-primary focus:ring-primary h-4 w-4" />
            Recordarme
          </label>
          <a href="#" class="text-muted-foreground hover:text-foreground transition-colors">Olvidé mi contraseña</a>
        </div>

        <button type="button" :disabled="loading" @click="handleLogin"
          class="w-full inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/80">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <p class="text-center text-sm text-muted-foreground mt-6">
        ¿No tienes cuenta?
        <router-link to="/register" class="text-muted-foreground hover:text-foreground font-medium transition-colors">
          Regístrate aquí
        </router-link>
      </p>

      <p v-if="error" class="text-sm text-destructive text-center mt-4 bg-destructive/10 rounded-lg py-2">{{ error }}</p>

      <button @click="installApp" v-if="showInstall"
        class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors h-10 px-4 py-2 border border-input text-muted-foreground hover:text-foreground hover:bg-accent/50">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        Instalar app
      </button>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api.js'
import Card from '../components/ui/Card.vue'
import Label from '../components/ui/Label.vue'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const backendStatus = ref('checking')
const showInstall = ref(false)
const deferredPrompt = ref(null)

const installApp = () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    deferredPrompt.value.userChoice.then(() => { deferredPrompt.value = null; showInstall.value = false })
  }
}

const checkBackend = async () => {
  try {
    const res = await api.health()
    if (res.status === 'ok') backendStatus.value = 'online'
    else backendStatus.value = 'offline'
  } catch {
    backendStatus.value = 'offline'
  }
}

const handleLogin = async () => {
  console.log('[LOGIN] Button clicked!')
  console.log('[LOGIN] Email:', email.value)
  error.value = ''
  loading.value = true
  try {
    localStorage.setItem('vozz_login_email', email.value.trim().toLowerCase())
    console.log('[LOGIN] Calling authStore.login...')
    await authStore.login(email.value, password.value)
    console.log('[LOGIN] Login successful, redirecting...')
    router.push('/dashboard')
  } catch (err) {
    console.error('[LOGIN] Error:', err)
    error.value = String(err)
    console.log('[LOGIN] Error displayed:', error.value)
  } finally {
    loading.value = false
    console.log('[LOGIN] Loading set to false')
  }
}

onMounted(() => {
  checkBackend()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstall.value = true
  })
})
</script>