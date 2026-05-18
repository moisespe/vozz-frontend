# Vozz - Sistema de Comunicación por Voz

Aplicación web de comunicación por voz y chat con canales, llamadas y mensajería en tiempo real.

## Captura

- Login/registro de usuarios
- Chat por contacto con mensajes y zumbidos
- Canales de voz con unirse/abandonar
- Perfil de contacto con llamada y descripción
- Temas: Oscuro, Claro y Alto Contraste
- Notificaciones de mensaje configurables
- Diseño responsive (móvil + escritorio)
- PWA instalable

## Tecnologías

| Tecnología | Versión |
|------------|---------|
| Vue 3 | ^3.5.34 |
| Vite | ^8.0.12 |
| Tailwind CSS | ^4.3.0 |
| Pinia | ^3.0.4 |
| Vue Router | ^4.6.4 |
| date-fns | ^4.1.0 |

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js | 20.19.5 |
| npm | 11.7.0 |
| Navegador | Chrome 90+, Edge 90+, Firefox 90+ |

## Instalación

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173

## Credenciales de prueba

- Email: `test@gmail.com`
- Contraseña: `123456`

## Estructura del proyecto

```
src/
├── main.ts              # Entry point, router, PWA
├── App.vue               # Raíz con tema
├── index.css             # Estilos globales + temas
├── components/ui/        # Componentes UI reutilizables
│   ├── Button.vue
│   ├── Card.vue
│   ├── Input.vue
│   ├── Label.vue
│   └── Badge.vue
├── views/                # Vistas de la aplicación
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   ├── DashboardView.vue # Vista principal (canales, chats, contactos)
│   └── CallView.vue
├── stores/               # Estado global (Pinia)
│   ├── auth.js           # Autenticación
│   ├── calls.js          # Contactos, canales, llamadas
│   └── chat.js           # Chats y mensajes
└── utils/                # Utilidades
    ├── sound.js          # Generación de sonido Web Audio API
    ├── buzzAudio.js      # Sonido de zumbido
    └── notify.js         # Sonido de notificación
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |

## Licencia

MIT