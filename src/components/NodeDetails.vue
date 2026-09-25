<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFlowStore } from '../stores/flow.js'

const props = defineProps({ nodeId: String })
const store = useFlowStore()
const router = useRouter()

const node = computed(() => store.nodeById(props.nodeId))

// Text fields are local state, committed to the store on change (blur/Enter).
// This keeps undo/redo granularity at "user intent", not per keystroke.
const title = ref('')
const description = ref('')
const comment = ref('')
const messageText = ref('')

watch(
  node,
  (n) => {
    if (!n) return
    title.value = n.name ?? ''
    description.value = n.description ?? ''
    comment.value = n.type === 'addComment' ? (n.data.comment ?? '') : ''
    const t =
      n.type === 'sendMessage'
        ? (n.data.payload ?? []).find((p) => p.type === 'text')
        : null
    messageText.value = t ? t.text : ''
  },
  { immediate: true },
)

function commitTitle() {
  store.updateNode(node.value.id, { name: title.value })
}
function commitDescription() {
  store.updateNode(node.value.id, { description: description.value })
}
function commitComment() {
  store.updateNode(node.value.id, { data: { ...node.value.data, comment: comment.value } })
}
// Commits the text part of the payload, preserving every non-text part
// (attachments) via .map.
function commitMessage() {
  const n = node.value
  const payload = (n.data.payload ?? []).map((p) =>
    p.type === 'text' ? { ...p, text: messageText.value } : p,
  )
  store.updateNode(n.id, { data: { ...n.data, payload } })
}

// ---- sendMessage: attachments ----
const attachments = computed(() =>
  (node.value?.data.payload ?? []).filter((p) => p.type === 'attachment'),
)

function removeAttachment(url) {
  const n = node.value
  store.updateNode(n.id, {
    data: {
      ...n.data,
      payload: n.data.payload.filter(
        (p) => !(p.type === 'attachment' && p.attachment === url),
      ),
    },
  })
}

// Files are read as data URLs so attachments survive localStorage persistence.
function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const n = node.value
    store.updateNode(n.id, {
      data: {
        ...n.data,
        payload: [
          ...(n.data.payload ?? []),
          { type: 'attachment', attachment: reader.result },
        ],
      },
    })
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// ---- dateTime: business hours ----
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const times = computed(() => node.value?.data.times ?? [])
const newTime = reactive({ day: 'mon', startTime: '09:00', endTime: '17:00' })

function addTime() {
  const n = node.value
  store.updateNode(n.id, {
    data: { ...n.data, times: [...n.data.times, { ...newTime }] },
  })
}

function removeTime(i) {
  const n = node.value
  store.updateNode(n.id, {
    data: { ...n.data, times: n.data.times.filter((_, j) => j !== i) },
  })
}

// ---- shared ----
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
      <input v-model="title" type="text" @change="commitTitle" />
    </label>

    <label class="field">
      Description
      <textarea v-model="description" rows="3" @change="commitDescription"></textarea>
    </label>

    <!-- type-specific sections -->

    <section v-if="node.type === 'sendMessage'" class="section">
      <label class="field">
        Message Content
        <textarea v-model="messageText" rows="3" @change="commitMessage"></textarea>
      </label>

      <div class="attachments">
        <div v-for="a in attachments" :key="a.attachment" class="attachment">
          <img :src="a.attachment" alt="attachment" />
          <button type="button" @click="removeAttachment(a.attachment)">
            Remove
          </button>
        </div>
        <label class="upload">
          Upload Attachment
          <input type="file" accept="image/*" @change="onFileChange" />
        </label>
      </div>
    </section>

    <section v-else-if="node.type === 'addComment'" class="section">
      <label class="field">
        Comment
        <textarea v-model="comment" rows="3" @change="commitComment"></textarea>
      </label>
    </section>

    <section v-else-if="node.type === 'dateTime'" class="section">
      <ul class="times">
        <li v-for="(t, i) in times" :key="i" class="time-row">
          <span>{{ t.day }}: {{ t.startTime }}–{{ t.endTime }}</span>
          <button type="button" @click="removeTime(i)">✕</button>
        </li>
        <li v-if="!times.length" class="time-row empty">No hours set</li>
      </ul>

      <div class="picker">
        <select v-model="newTime.day">
          <option v-for="d in DAYS" :key="d" :value="d">{{ d }}</option>
        </select>
        <input v-model="newTime.startTime" type="time" />
        <input v-model="newTime.endTime" type="time" />
        <button type="button" @click="addTime">Add</button>
      </div>
    </section>

    <p v-else class="readonly-note">
      {{ node.type === 'dateTimeConnector' ? 'Connector nodes are display-only.' : 'This node has no editable content.' }}
    </p>

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
  overflow-y: auto;
}
.node-details .field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.node-details .field input,
.node-details .field textarea,
.node-details .field select {
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}
.node-details .section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.node-details .attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.node-details .attachment {
  display: flex;
  align-items: center;
  gap: 8px;
}
.node-details .attachment img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}
.node-details .attachment button {
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}
.node-details .upload {
  font-size: 12px;
  color: #475569;
  cursor: pointer;
}
.node-details .times {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.node-details .time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 4px 6px;
  background: #f8fafc;
  border-radius: 4px;
}
.node-details .time-row.empty {
  color: #94a3b8;
}
.node-details .time-row button {
  border: none;
  background: none;
  cursor: pointer;
  color: #64748b;
}
.node-details .picker {
  display: flex;
  gap: 6px;
}
.node-details .picker select,
.node-details .picker input {
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
}
.node-details .picker button {
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #f8fafc;
  cursor: pointer;
}
.node-details .readonly-note {
  font-size: 13px;
  color: #64748b;
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
