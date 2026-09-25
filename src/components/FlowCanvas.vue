<script setup>
import { computed, markRaw, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { VueFlow } from '@vue-flow/core'

import { toFlowNodes, toFlowEdges } from '../utils/flow.js'
import { useFlowStore } from '../stores/flow.js'

import TriggerNode from './nodes/TriggerNode.vue'
import SendMessageNode from './nodes/SendMessageNode.vue'
import AddCommentNode from './nodes/AddCommentNode.vue'
import BusinessHoursNode from './nodes/BusinessHoursNode.vue'
import ConnectorNode from './nodes/ConnectorNode.vue'

const emit = defineEmits(['node-click', 'add-child'])

const STORAGE_KEY = 'flowchart-site:nodes:v1'

const store = useFlowStore()
const { data } = useQuery({
  queryKey: ['flow'],
  queryFn: async () => {
    // Persistence: a saved copy wins over the seed payload; corrupt data
    // falls through to the fetch.
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    const res = await fetch(`${import.meta.env.BASE_URL}payload.json`)
    if (!res.ok) throw new Error(`payload fetch failed: ${res.status}`)
    return res.json()
  },
})

// Save on every change (deep — nodes are nested).
watch(
  () => store.nodes,
  (nodes) => {
    if (nodes.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
  },
  { deep: true },
)

const nodeTypes = {
  trigger: markRaw(TriggerNode),
  sendMessage: markRaw(SendMessageNode),
  addComment: markRaw(AddCommentNode),
  businessHours: markRaw(BusinessHoursNode),
  connector: markRaw(ConnectorNode),
}

watch(
  () => data.value,
  (payload) => {
    if (payload) store.init(payload)
  },
)

// Thread an add-child handler into each node's data so the + button on a
// node can ask FlowPage to open the create modal with this node as parent.
const nodes = computed(() =>
  toFlowNodes(store.nodes).map((n) => ({
    ...n,
    data: { ...n.data, onAddChild: (id) => emit('add-child', id) },
  })),
)
const edges = computed(() => toFlowEdges(store.nodes))
</script>

<template>
  <VueFlow
    class="vue-flow"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    @node-click="emit('node-click', $event)"
  />
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow {
  background-color: #f0f0f0;
  height: 100%;
  width: 100%;
}

.fc-node {
  position: relative;
  width: 180px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 12px;
}

/* The + sits centered on the node's bottom edge (the outgoing connector). */
.fc-node__add {
  position: absolute;
  bottom: -11px;
  left: 50%;
  transform: translateX(-50%);
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  background: white;
  color: #475569;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
}

.fc-node__add:hover {
  background: #f1f5f9;
  color: #0f172a;
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
