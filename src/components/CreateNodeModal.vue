<script setup>
import { reactive, computed, ref, onMounted } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useFlowStore } from '../stores/flow.js'
import * as api from '../api/flow.js'

// parentId is the node the + was clicked on (null for the top-level button).
const props = defineProps({
  parentId: { type: [String, Number], default: null },
})

const emit = defineEmits(['close'])
const store = useFlowStore()
const firstFieldRef = ref(null)

// Hits the simulated API, then mirrors the new node into the store.
const { mutate: createNode } = useMutation({
  mutationFn: (node) => api.createNode(node),
  onSuccess: (node) => store.addNode(node),
})

// Keyboard a11y: focus the first field on open; Escape dismisses.
onMounted(() => firstFieldRef.value?.focus())
function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

const NODE_TYPES = [
  { value: 'sendMessage', label: 'Send Message' },
  { value: 'addComment', label: 'Add Comments' },
  { value: 'dateTime', label: 'Business Hours' }, // payload type for spec's 'businessHours',
]

const form = reactive({ title: '', description: '', type: 'sendMessage' })

const errors = computed(() => {
  const e = {}
  if (!form.title.trim()) e.title = 'Title is required'
  if (!form.description.trim()) e.description = 'Description is required'
  return e
})

function createPayloadNode(f) {
  const base = {
    id: crypto.randomUUID(),
    name: f.title.trim(),
    description: f.description.trim(),
    parentId: props.parentId ?? null,
  }

  if (f.type === 'sendMessage')
    return {
      ...base,
      type: 'sendMessage',
      data: { payload: [{ type: 'text', text: f.description.trim() }] },
    }
  if (f.type === 'addComment')
    return { ...base, type: 'addComment', data: { comment: f.description.trim() } }
  return {
    ...base,
    type: 'dateTime',
    data: { times: [], timezone: 'UTC', action: 'businessHours', connectors: [] },
  }
}

function submit() {
  if (Object.keys(errors.value).length) return
  createNode(createPayloadNode(form))
  emit('close')
}
</script>

<template>
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-node-title"
    @click.self="emit('close')"
    @keydown="onKeydown"
  >
    <form class="modal" @submit.prevent="submit">
      <h2 id="create-node-title">Create New Node</h2>

      <label>
        Title
        <input ref="firstFieldRef" v-model="form.title" type="text" />
        <span v-if="errors.title" class="error">{{ errors.title }}</span>
      </label>

      <label>
        Description
        <textarea v-model="form.description" rows="3"></textarea>
        <span v-if="errors.description" class="error">{{ errors.description }}</span>
      </label>

      <label>
        Type of Node
        <select v-model="form.type">
          <option v-for="t in NODE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </label>

      <div class="actions">
        <button type="button" @click="emit('close')">Cancel</button>
        <button type="submit">Create</button>
      </div>
    </form>
  </div>
</template>

<style>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.modal {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.modal .error {
  color: #dc2626;
  font-size: 12px;
}
.modal input,
.modal textarea,
.modal select {
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}
.modal .actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
