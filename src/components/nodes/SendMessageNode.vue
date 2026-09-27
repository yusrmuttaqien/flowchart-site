<script setup>
defineProps({ data: Object, id: String })
</script>

<template>
  <div class="fc-node">
    <span class="fc-node__icon">💬</span>
    <div>
      <div class="fc-node__title">{{ data.name || 'Send Message' }}</div>
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
