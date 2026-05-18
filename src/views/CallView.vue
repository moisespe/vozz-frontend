<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-4">
    <Card class="w-full max-w-md p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-foreground">{{ callType === 'voice' ? 'Llamada de Voz' : 'Llamada de Video' }}</h2>
        <Badge :variant="statusVariant(callStatus)">{{ callStatus }}</Badge>
      </div>

      <div class="flex items-center justify-center gap-8 py-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
            {{ callerName.charAt(0).toUpperCase() }}
          </div>
          <p class="mt-2 text-sm font-medium text-foreground">{{ callerName }}</p>
          <p class="text-xs text-muted-foreground">Llamante</p>
        </div>
        <div class="text-2xl text-muted-foreground/30">→</div>
        <div class="text-center">
          <div class="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
            {{ receiverName.charAt(0).toUpperCase() }}
          </div>
          <p class="mt-2 text-sm font-medium text-foreground">{{ receiverName }}</p>
          <p class="text-xs text-muted-foreground">Receptor</p>
        </div>
      </div>

      <div class="flex justify-center gap-4 mb-6">
        <button @click="toggleMic" class="w-10 h-10 rounded-full bg-accent border border-input flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors" title="Micrófono">🎤</button>
        <Button variant="destructive" @click="endCall">Colgar</Button>
      </div>

      <div class="flex items-center justify-between text-sm text-muted-foreground border-t border-input pt-4">
        <span class="font-mono">{{ timer }}</span>
        <span>Calidad: Excelente</span>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const callId = route.params.callId
const callType = ref('voice')
const callStatus = ref('initiated')
const callerName = ref('Usuario')
const receiverName = ref(authStore.user?.email || 'Yo')

const timer = ref('00:00:00')
let interval = null

const statusVariant = (s) => {
  const map = { initiated: 'info', active: 'success', ringing: 'warning', ended: 'danger' }
  return map[s] || 'default'
}

const startTimer = () => {
  let sec = 0
  interval = setInterval(() => {
    sec++
    timer.value = [sec/3600, sec%3600/60, sec%60].map(v => String(Math.floor(v)).padStart(2,'0')).join(':')
  }, 1000)
}
const stopTimer = () => { if (interval) { clearInterval(interval); interval = null } }
const toggleMic = () => {}
const endCall = () => {
  stopTimer()
  callStatus.value = 'ended'
  setTimeout(() => router.push('/dashboard'), 1500)
}

onMounted(() => {
  callStatus.value = 'ringing'
  setTimeout(() => { callStatus.value = 'active'; startTimer() }, 2000)
})
onUnmounted(() => stopTimer())
</script>