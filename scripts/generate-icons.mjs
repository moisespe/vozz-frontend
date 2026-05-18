import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

const size = 512
const c = createCanvas(size, size)
const ctx = c.getContext('2d')

// Fondo
ctx.fillStyle = '#5865f2'
ctx.beginPath()
ctx.roundRect(0, 0, size, size, size * 0.16)
ctx.fill()

// Círculo tipo micrófono estilizado
ctx.fillStyle = '#fff'
ctx.beginPath()
ctx.arc(size * 0.5, size * 0.35, size * 0.18, 0, Math.PI * 2)
ctx.fill()
ctx.fillRect(size * 0.33, size * 0.48, size * 0.34, size * 0.1)

// Base del micrófono
ctx.beginPath()
ctx.arc(size * 0.5, size * 0.65, size * 0.18, 0, Math.PI)
ctx.fill()
ctx.fillRect(size * 0.45, size * 0.65, size * 0.1, size * 0.15)

// Texto
ctx.fillStyle = '#fff'
ctx.font = `bold ${size * 0.1}px system-ui, sans-serif`
ctx.textAlign = 'center'
ctx.fillText('VOZZ', size * 0.5, size * 0.88)

// Guardar
const buf = c.toBuffer('image/png')
const dir = 'public/icons'

// 192x192
const c192 = createCanvas(192, 192)
const ctx192 = c192.getContext('2d')
ctx192.drawImage(c, 0, 0, 192, 192)
writeFileSync(`${dir}/icon-192.png`, c192.toBuffer('image/png'))

// 512x512
writeFileSync(`${dir}/icon-512.png`, buf)

console.log('✅ Iconos generados en public/icons/')