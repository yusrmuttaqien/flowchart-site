// Simulated REST backend. There is no real server, so these async functions
// stand in for HTTP calls: `listNodes` reads the persisted state (or the seed
// payload), and the write operations simulate a round-trip. The Pinia store
// remains the client's source of truth and is what actually persists to
// localStorage (see the deep watch in FlowCanvas) — the API only simulates
// the network leg so the mutations can flow through TanStack Query.
const STORAGE_KEY = 'flowchart-site:nodes:v1'

// Simulated network latency so the UI exercises its loading states.
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

// Read the persisted "server" state. Null if nothing is saved yet.
function readDb() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

// GET /nodes — a saved copy wins over the seed payload.
export async function listNodes() {
  await delay()
  const saved = readDb()
  if (saved) return saved
  const res = await fetch(`${import.meta.env.BASE_URL}payload.json`)
  if (!res.ok) throw new Error(`payload fetch failed: ${res.status}`)
  return res.json()
}

// POST /nodes
export async function createNode(node) {
  await delay()
  return { ...node }
}

// PATCH /nodes/:id — shallow merge, matching the store's updateNode.
export async function updateNode(id, patch) {
  await delay()
  return { id, ...patch }
}

// DELETE /nodes/:id
export async function deleteNode(id) {
  await delay()
  return { id }
}
