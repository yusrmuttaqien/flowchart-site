<script setup>
import { computed } from 'vue'
const props = defineProps({ data: Object })
const comment = computed(() => {
  return props.data.raw.data.comment ?? ''
})
</script>

<template>
  <div class="fc-node">
    <span class="fc-node__icon">📝</span>
    <div>
      <div class="fc-node__title">Add Comment</div>
      <div class="fc-node__desc">{{ comment }}</div>
    </div>
  </div>
</template>
