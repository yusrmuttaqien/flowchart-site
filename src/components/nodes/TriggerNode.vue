<script setup>
defineProps({ data: Object })
</script>

<template>
  <div class="fc-node">
    <span class="fc-node__icon">⚡</span>
    <div>
      <div class="fc-node__title">Trigger</div>
      <div class="fc-node__desc">{{ data.raw.data.type }}</div>
    </div>
  </div>
</template>
