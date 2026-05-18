<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
      variant === 'default' && 'bg-primary/10 text-primary',
      variant === 'success' && 'bg-green-500/10 text-green-400',
      variant === 'warning' && 'bg-yellow-500/10 text-yellow-400',
      variant === 'danger' && 'bg-red-500/10 text-red-400',
      variant === 'info' && 'bg-blue-500/10 text-blue-400',
    ]"
  >
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'default' },
})
</script>