<script setup>
import FlowCanvas from './components/FlowCanvas.vue'
</script>

<template>
  <FlowCanvas />
</template>

<style>
body, #app {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  height: 100svh;
  width: 100svw;
}


.fc-node {
  width: 180px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 12px;
}
.fc-node__title {
  font-weight: 600;
}
.fc-node__desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
