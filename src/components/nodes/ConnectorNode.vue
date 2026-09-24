<script setup>
import { computed } from 'vue'
const props = defineProps({ data: Object })
const name = computed(() => {
  return props.data.name ?? ''
})
const icon = computed(() => {
  return props.data.raw.data.connectorType === 'success' ? '✅' : '❌'
})
</script>

<template>
  <div class="fc-node">
    <span class="fc-node__icon">{{ icon }}</span>
    <div>
      <div class="fc-node__title">{{ name }}</div>
    </div>
  </div>
</template>
