<script setup>
import { computed } from 'vue'
const props = defineProps({ data: Object })
const firstText = computed(() => {
  const t = (props.data.raw.data.payload ?? []).find((p) => p.type === 'text')
  return t ? t.text : ''
})
</script>

<template>
  <div class="fc-node">
    <span class="fc-node__icon">💬</span>
    <div>
      <div class="fc-node__title">{{ props.data.name || 'Send Message' }}</div>
      <div class="fc-node__desc">{{ firstText }}</div>
    </div>
  </div>
</template>
