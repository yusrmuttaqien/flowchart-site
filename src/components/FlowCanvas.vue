<script setup>
import { computed, markRaw, watch, ref, onMounted, nextTick } from 'vue'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { VueFlow } from '@vue-flow/core'

import { toFlowNodes, toFlowEdges } from '../utils/flow.js'
import { useFlowStore } from '../stores/flow.js'
import * as api from '../api/flow.js'

import TriggerNode from './nodes/TriggerNode.vue'
import SendMessageNode from './nodes/SendMessageNode.vue'
import AddCommentNode from './nodes/AddCommentNode.vue'
import BusinessHoursNode from './nodes/BusinessHoursNode.vue'
import ConnectorNode from './nodes/ConnectorNode.vue'

const emit = defineEmits(['node-click', 'add-child'])
const vueFlowRef = ref(null)

const STORAGE_KEY = 'flowchart-site:nodes:v1'
const VIEWPORT_KEY = 'flowchart-site:viewport:v1'

const store = useFlowStore()
// Server state: the simulated API reads the persisted copy (or the seed).
const { data } = useQuery({
  queryKey: ['flow'],
  queryFn: api.listNodes,
})

// Single persistence path: a deep watch catches every store change —
// mutations AND undo/redo — and writes it to localStorage.
watch(
  () => store.nodes,
  (nodes) => {
    if (nodes.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
  },
  { deep: true },
)

// Dragged-node position: hit the simulated API, then mirror the result into
// the store (which toFlowNodes and the persistence watch both read).
const updatePosition = useMutation({
  mutationFn: ({ id, position }) => api.updateNode(id, { position }),
  onSuccess: (_node, { id, position }) => store.updateNode(id, { position }),
})

const nodeTypes = {
  trigger: markRaw(TriggerNode),
  sendMessage: markRaw(SendMessageNode),
  addComment: markRaw(AddCommentNode),
  businessHours: markRaw(BusinessHoursNode),
  connector: markRaw(ConnectorNode),
}

watch(
  () => data.value,
  async (payload) => {
    if (!payload) return
    store.init(payload)
    await nextTick()
    // Center the tree on first load (no saved viewport); otherwise the
    // saved viewport is restored in onMounted.
    if (!savedViewport && vueFlowRef.value) {
      vueFlowRef.value.fitView()
    }
  },
)

// Load the saved viewport (synchronously) so we can restore it on mount.
let savedViewport = null
try {
  const raw = localStorage.getItem(VIEWPORT_KEY)
  if (raw) savedViewport = JSON.parse(raw)
} catch {
  localStorage.removeItem(VIEWPORT_KEY)
}

onMounted(() => {
  if (savedViewport && vueFlowRef.value) {
    vueFlowRef.value.setViewport(savedViewport)
  }
})

// Persist the canvas pan/zoom on move-end.
function onMoveEnd({ flowTransform }) {
  const { x, y, zoom } = flowTransform
  localStorage.setItem(VIEWPORT_KEY, JSON.stringify({ x, y, zoom }))
}

// Thread an add-child handler into each node's data so the + button on a
// node can ask FlowPage to open the create modal with this node as parent.
const nodes = computed(() =>
  toFlowNodes(store.nodes).map((n) => ({
    ...n,
    data: { ...n.data, onAddChild: (id) => emit('add-child', id) },
  })),
)

// Persist a dragged node's position: vue-flow reports the final position on
// drag-stop; saving it to the store makes toFlowNodes (and localStorage) keep it.
function onDragStop({ node }) {
  updatePosition.mutate({ id: node.id, position: { ...node.position } })
}
const edges = computed(() => toFlowEdges(store.nodes))

// Reset the canvas pan/zoom to the default. Exposed so FlowPage's reset
// button can call it.
function resetViewport() {
  if (vueFlowRef.value) vueFlowRef.value.setViewport({ x: 0, y: 0, zoom: 1 })
}
defineExpose({ resetViewport })
</script>

<template>
  <VueFlow
    ref="vueFlowRef"
    class="vue-flow"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    @node-click="emit('node-click', $event)"
    @node-drag-stop="onDragStop"
    @move-end="onMoveEnd"
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
