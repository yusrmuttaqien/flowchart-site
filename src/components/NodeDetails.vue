<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFlowStore } from '../stores/flow.js'

const props = defineProps({ nodeId: String })
const store = useFlowStore()
const router = useRouter()

const node = computed(() => store.nodeById(props.nodeId))

function deleteNode() {
  store.deleteNode(props.nodeId)
  router.push('/') // node gone → route no longer valid → drawer closes
}
</script>

<template>
  <aside v-if="node" class="node-details">
    <h2>Node Details</h2>

    <label class="field">
      Title
      <input v-model="node.name" type="text" />
    </label>

    <label class="field">
      Description
      <textarea v-model="node.description" rows="3"></textarea>
    </label>

    <!-- type-specific sections: Task 8b -->

    <button class="delete" @click="deleteNode">Delete Node</button>
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
  background: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.node-details .field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.node-details .field input,
.node-details .field textarea {
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}
.node-details .delete {
  margin-top: auto;
  color: #dc2626;
  border: 1px solid #dc2626;
  background: white;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
