<script setup>
import { computed, Transition } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import FlowCanvas from '../components/FlowCanvas.vue'
import NodeDetails from '../components/NodeDetails.vue'

const route = useRoute()
const router = useRouter()
const selectedNodeId = computed(() => route.params.nodeId ?? null)

function onNodeClick({ node }) {
  // clicking the selected node again closes the drawer (toggle, per spec)
  if (node.id === selectedNodeId.value) {
    router.push('/')
  } else {
    router.push(`/${node.id}`)
  }
}
</script>

<template>
  <FlowCanvas @node-click="onNodeClick" />
  <Transition>
    <NodeDetails :node-id="selectedNodeId" v-if="selectedNodeId" />
  </Transition>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: transform 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  transform: translateX(100%);
}
</style>
