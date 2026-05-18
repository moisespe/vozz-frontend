<template>
  <div class="min-h-screen bg-background text-foreground">
    <router-view />
  </div>
</template>

<script setup>
const saved = localStorage.getItem('vozz_theme')
if (saved && saved !== 'dark') {
  document.documentElement.classList.add(`theme-${saved}`)
}
</script>