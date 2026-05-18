<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-4">
    <Card class="w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <div class="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-foreground">Crear Cuenta</h1>
        <p class="text-sm text-muted-foreground mt-1">Únete a Vozz</p>
      </div>

      <form class="space-y-5" @submit.prevent="handleRegister">
        <div class="space-y-2">
          <Label for="email">Correo electrónico</Label>
          <Input id="email" type="email" v-model="email" placeholder="Ingrese su correo" required />
        </div>

        <div class="space-y-2">
          <Label for="password">Contraseña</Label>
          <Input id="password" type="password" v-model="password" placeholder="Mínimo 6 caracteres" required />
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
        </Button>
      </form>

      <p class="text-center text-sm text-muted-foreground mt-6">
        ¿Ya tienes cuenta?
        <router-link to="/login" class="text-muted-foreground hover:text-foreground font-medium transition-colors">
          Inicia sesión aquí
        </router-link>
      </p>

      <p v-if="error" class="text-sm text-destructive text-center mt-4 bg-destructive/10 rounded-lg py-2">{{ error }}</p>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Card from '../components/ui/Card.vue'
import Input from '../components/ui/Input.vue'
import Label from '../components/ui/Label.vue'
import Button from '../components/ui/Button.vue'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.register(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'Error al registrar'
  } finally {
    loading.value = false
  }
}
</script>