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

const emit = defineEmits(['node-click'])

const store = useFlowStore()
const { data } = useQuery({
  queryKey: ['flow'],
  queryFn: async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}payload.json`)
    if (!res.ok) throw new Error(`payload fetch failed: ${res.status}`)
    return res.json()
  },
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
  (payload) => {
    if (payload) store.init(payload)
  },
)

const nodes = computed(() => toFlowNodes(store.nodes))
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
