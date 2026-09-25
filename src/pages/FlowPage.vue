<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlowStore } from '../stores/flow.js'

import FlowCanvas from '../components/FlowCanvas.vue'
import NodeDetails from '../components/NodeDetails.vue'
import CreateNodeModal from '../components/CreateNodeModal.vue'

const showCreate = ref(false)
const createParentId = ref(null)
const store = useFlowStore()

// The + on a node opens the create modal with that node locked in as parent.
function onAddChild(parentId) {
  createParentId.value = parentId
  showCreate.value = true
}
function closeCreate() {
  showCreate.value = false
  createParentId.value = null
}

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
  <FlowCanvas @node-click="onNodeClick" @add-child="onAddChild" />
  <Transition>
    <NodeDetails :node-id="selectedNodeId" v-if="selectedNodeId" />
  </Transition>

  <button class="create-btn" @click="onAddChild(null)">+ Create New Node</button>

  <div class="toolbar">
    <button :disabled="!store.canUndo" @click="store.undo()">↩ Undo</button>
    <button :disabled="!store.canRedo" @click="store.redo()">↪ Redo</button>
  </div>
  <CreateNodeModal v-if="showCreate" :parent-id="createParentId" @close="closeCreate" />
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

.toolbar {
  position: absolute;
  top: 16px;
  left: 170px;
  z-index: 5;
  display: flex;
  gap: 8px;
}

.toolbar button {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.toolbar button:disabled {
  color: #94a3b8;
  cursor: default;
}
</style>
