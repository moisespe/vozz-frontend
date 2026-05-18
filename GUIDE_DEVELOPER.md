# Guía para desarrolladores — Vozz

## Convenciones de código

### Componentes Vue

```vue
<template>
  <!-- HTML con clases Tailwind. Sin CSS personalizado. -->
  <div class="bg-background text-foreground">
    <slot />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props primero
defineProps({ ... })

// Estado local
const count = ref(0)

// Computed
const double = computed(() => count.value * 2)

// Funciones
const increment = () => { count.value++ }
</script>
```

### Estilos

- **Solo Tailwind CSS**. No usar CSS personalizado ni `<style>` tags.
- Las variables de color se definen en `src/index.css` usando `@theme`.
- No usar colores fijos como `bg-gray-900` o `text-blue-500`. Usar variables del tema:
  - `bg-background`, `text-foreground`, `bg-card`, `border-input`
  - `bg-primary text-primary-foreground` para botones primarios
  - `text-muted-foreground` para texto secundario
  - `bg-destructive` para acciones destructivas

### Temas

El sistema tiene 3 temas en `src/index.css`:

| Tema | Selector | Fondo | Acento |
|------|----------|-------|--------|
| Oscuro | `@theme` (default) | `#000000` | `#cccccc` |
| Claro | `.theme-light` | `#f5f5f5` | `#333333` |
| Contraste | `.theme-contrast` | `#000000` | `#ffffff` |

No modificar los valores directamente. Si se necesita un nuevo color, agregar la variable en `@theme` y en las clases `.theme-light` y `.theme-contrast`.

### Stores (Pinia)

Usar `defineStore` con la sintaxis de options API:

```javascript
export const useExampleStore = defineStore('example', {
  state: () => ({ items: [] }),
  getters: {
    activeItems: (state) => state.items.filter(i => i.active),
  },
  actions: {
    addItem(name) {
      this.items.push({ id: Date.now(), name, active: false })
    },
  },
})
```

- Nombres en camelCase
- Acciones async donde sea posible (simular latencia con setTimeout)
- Getters para filtrados y transformaciones

### Secciones del Dashboard

El DashboardView usa la variable `section` para mostrar diferentes vistas:

| section | Vista |
|---------|-------|
| `'desktop'` | Pantalla de inicio (escritorio) |
| `'contacts'` | Canales + contactos (móvil) |
| `'chats'` | Chat con pestañas (escritorio) |
| `'profile'` | Perfil de contacto |
| `'channel'` | Perfil de canal |
| `'explore-channels'` | Explorador de canales |
| `'create-channel'` | Crear canal |

Para agregar una nueva sección:

1. Elegir un nombre único para `section`
2. Agregar `v-if="section==='nombre'"` con el contenido
3. Cambiar a esa sección con `section.value = 'nombre'`

### Navegación con volver/cerrar

| Tipo | Botón | Uso |
|------|-------|-----|
| Cerrar | `✕` | Vistas principales (explorar, crear) |
| Volver | `←` | Detalles (perfil, chat) |

Para volver a la vista anterior, guardar `section.value` antes de cambiar:

```javascript
const showDetail = (item) => {
  prevSection.value = section.value
  section.value = 'detail'
}
const closeDetail = () => {
  section.value = prevSection.value
}
```

### Navegación responsive

Usar `window.innerWidth >= 1024` para diferenciar móvil de escritorio:

```javascript
section.value = window.innerWidth >= 1024 ? 'desktop' : 'contacts'
```

### Agregar un sonido

1. Colocar el archivo `.mp3` en `public/audio/`
2. Usar las funciones existentes en `src/utils/notify.js`:

```javascript
import { playNotify, setNotifySrc } from '../utils/notify.js'
playNotify()                          // Reproduce el sonido configurado
setNotifySrc('/audio/mi_sonido.mp3')  // Cambia el sonido
```

### Agregar una nueva opción en Configuración

1. Agregar una nueva pestaña en el modal de Configuración (DashboardView.vue)
2. Los tabs se manejan con `settingsTab`
3. El contenido se muestra con `v-if="settingsTab='nuevo-tab'"`
4. Guardar preferencias en `localStorage`

```javascript
const miOpcion = ref(localStorage.getItem('vozz_mi_opcion') || 'default')
watch(miOpcion, (v) => localStorage.setItem('vozz_mi_opcion', v))
```

### Agregar un contacto o canal de prueba

En `src/stores/calls.js`, modificar los arrays `contacts` o `channels`:

```javascript
contacts: [
  { id: 1, name: 'Nombre', email: 'email@ejemplo.com', description: 'Descripción' },
]
```

Cada contacto debe tener: `id`, `name`, `email`, `description`.
Cada canal debe tener: `id`, `name`, `description`, `members[]`, `active`.

### Flujo de autenticación

```
LoginView → auth.login() → token → localStorage → router.push('/dashboard')
                                                      ↓
                                              router.beforeEach (guarda)
                                                      ↓
                                              DashboardView montado
```

Para cambiar credenciales de prueba, modificar `src/stores/auth.js`:

```javascript
if (e === 'nuevo@email.com' && p === 'nueva-clave') {
```

### Buenas prácticas

1. **No duplicar código**. Si un patrón se repite, crear un componente o función.
2. **Comentarios en español** para la lógica de negocio.
3. **Nombres descriptivos** en camelCase para variables y funciones.
4. **Async/await** para operaciones simuladas (timeout).
5. **No emojis en botones de acción principales**. Usar texto descriptivo.
6. **Toda preferencia del usuario** se guarda en `localStorage` con prefijo `vozz_`.
7. **No CSS personalizado**. Todo con Tailwind utility classes.
8. **Responsive**: breakpoint `lg` (1024px) separa móvil de escritorio.

### Debugging

```bash
npm run dev       # Servidor con HMR
npm run build     # Build + typecheck
```

Abrir consola del navegador (F12) para ver errores de Vue y red.