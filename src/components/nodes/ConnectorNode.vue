<script setup>
defineProps({ data: Object, id: String })
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
    <button
      class="fc-node__add"
      title="Add child node"
      aria-label="Add child node"
      @click.stop="data.onAddChild(id)"
    >
      +
    </button>
  </div>
</template>
