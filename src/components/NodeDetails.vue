<script setup>
defineProps({ nodeId: String })
</script>

<template>
  <aside class="node-details">
    <h2>Node: {{ nodeId }}</h2>
  </aside>
</template>

<style>
.node-details {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  border-left: 1px solid #e2e8f0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.493);
}
</style>
