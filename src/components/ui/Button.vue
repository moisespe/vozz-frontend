<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
      variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/80',
      variant === 'secondary' && 'bg-accent text-accent-foreground border border-input hover:bg-accent/80',
      variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90',
      variant === 'ghost' && 'hover:bg-accent/50 hover:text-accent-foreground',
      size === 'default' && 'h-10 px-4 py-2',
      size === 'sm' && 'h-9 px-3',
      size === 'lg' && 'h-11 px-8',
    ]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'default' },
})
</script>