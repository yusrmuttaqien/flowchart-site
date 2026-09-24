<script setup>
import { computed } from 'vue'
const props = defineProps({ data: Object })
const hours = computed(() => {
  return props.data.raw.data.times.length ?? 0
})
</script>

<template>
  <div class="fc-node">
    <span class="fc-node__icon">🕐</span>
    <div>
      <div class="fc-node__title">Business Hours</div>
      <div class="fc-node__desc">{{ hours }} days.</div>
    </div>
  </div>
</template>
