<script setup>
defineProps({ data: Object })
</script>

<template>
  <div class="fc-node">
    <span class="fc-node__icon">
      {{ data.raw.data.connectorType === 'success' ? '✅' : '❌' }}
    </span>
    <div>
      <div class="fc-node__title">{{ data.name || 'Connector' }}</div>
      <div class="fc-node__desc">{{ data.description }}</div>
    </div>
  </div>
</template>
