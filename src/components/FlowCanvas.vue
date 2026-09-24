<script setup>
import { computed, markRaw } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { VueFlow } from '@vue-flow/core'
import { toFlowNodes, toFlowEdges } from '../utils/flow.js'

import TriggerNode from './nodes/TriggerNode.vue'
import SendMessageNode from './nodes/SendMessageNode.vue'
import AddCommentNode from './nodes/AddCommentNode.vue'
import BusinessHoursNode from './nodes/BusinessHoursNode.vue'
import ConnectorNode from './nodes/ConnectorNode.vue'

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
const nodes = computed(() => toFlowNodes(data.value ?? []))
const edges = computed(() => toFlowEdges(data.value ?? []))
</script>

<template>
  <VueFlow class="vue-flow" :nodes="nodes" :edges="edges" :node-types="nodeTypes" />
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow {
  background-color: #f0f0f0;
  height: 100%;
  width: 100%;
}
</style>
