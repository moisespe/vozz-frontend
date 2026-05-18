# Changelog Frontend - Vozz

## [1.0.0] - 2026-05-17

### Añadido
- Proyecto Vue 3 con Vite y Tailwind CSS v4
- Pinia para gestión de estado (auth, calls, chat stores)
- Vue Router con protección de rutas (requiresAuth)
- PWA: manifest.json, service worker, instalable

### Vistas
- LoginView: formulario de inicio de sesión con indicador de estado del servidor
- RegisterView: registro de nuevo usuario
- DashboardView: vista principal con secciones (canales, contactos, perfil, llamada)
- CallView: vista de llamada independiente

### Dashboard - Secciones
- Canales: explorar, crear, unirse/abandonar
- Contactos: lista slim, buscar, agregar (invitación), eliminar
- Perfil de contacto: información, descripción, llamar
- Perfil de canal: descripción, miembros, unirse/abandonar
- Chat: pestañas independientes por contacto, mensajes, zumbido
- Llamada: vista de dos participantes, mute, volumen, indicador de habla

### Configuración
- Perfil: nickname, descripción, guardar
- Apariencia: tema Oscuro/Claro/Alto Contraste
- Dispositivos: selector de micrófono y altavoz con solicitud de permisos
- Notificaciones: selector de sonido para mensajes

### Comunicación
- API Service (api.js): cliente HTTP con JWT en headers
- WebSocket Service (ws.js): conexión con reconexión automática
- WebRTC Service (webrtc.js): peer-to-peer con STUN público
- Señalización WebRTC via WebSocket (offer, answer, ICE)

### Sonidos
- ring_call.mp3: tono de llamada (loop para el que llama)
- ring_tone.mp3: tono de llamada entrante (loop para el receptor)
- connect_call.mp3: sonido de conexión de llamada
- notify_001.mp3: notificación de mensaje
- zumbido.mp3: sonido de zumbido

### WebSocket Handlers
- call:initiate → modal de llamada entrante + notificación escritorio
- call:answer → conectar llamada + iniciar WebRTC
- call:reject / call:end → limpiar estado
- webrtc:offer/answer/ice → señalización peer-to-peer
- contact:invite → modal de invitación + actualizar lista
- contact:accepted → refrescar contactos

### Persistencia
- Token en localStorage
- Contactos en localStorage (caché con fallback a API)
- Preferencias en localStorage (tema, sonido, volumen)
- Reconexión WebSocket automática cada 3s

### Estilos
- Tema oscuro por defecto (fondo #000000)
- 3 temas: Oscuro, Claro, Alto Contraste
- Tailwind CSS utility-first sin CSS personalizado
- Diseño responsive con breakpoint lg (1024px)
- Barra inferior móvil con 4 botones