<script setup>
import { computed, Transition, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import FlowCanvas from '../components/FlowCanvas.vue'
import NodeDetails from '../components/NodeDetails.vue'
import CreateNodeModal from '../components/CreateNodeModal.vue'

const showCreate = ref(false)

const route = useRoute()
const router = useRouter()
const selectedNodeId = computed(() => route.params.nodeId ?? null)

function onNodeClick({ node }) {
  if (node.type === 'connector') return // display-only, per spec
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

  <button class="create-btn" @click="showCreate = true">+ Create New Node</button>
  <CreateNodeModal v-if="showCreate" @close="showCreate = false" />
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

.create-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 5;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}
</style>
