/**
 * @typedef {Object} PayloadNode
 * @property {string|number} id
 * @property {string|number} parentId  -1 for the root (trigger)
 * @property {string} [name]            absent on some nodes (e.g. trigger)
 * @property {'trigger'|'sendMessage'|'dateTime'|'addComment'|'dateTimeConnector'} type
 * @property {Object} data
 */

// Map payload type → vue-flow custom node type.
// NOTE: payload 'dateTime' is the spec's 'businessHours' node.
const NODE_TYPE_MAP = {
  trigger: 'trigger',
  sendMessage: 'sendMessage',
  dateTime: 'businessHours',
  addComment: 'addComment',
  dateTimeConnector: 'connector', // success & failure — display-only
}

const COL_WIDTH = 250
const ROW_HEIGHT = 120

/**
 * Compute each node's depth by walking its parentId chain to the root.
 * @param {PayloadNode[]} payload
 * @returns {Map<string|number, number>} id → depth
 */
function computeDepths(payload) {
  const byId = new Map(payload.map((n) => [String(n.id), n]))
  const depths = new Map()

  const depthOf = (node) => {
    if (depths.has(node.id)) return depths.get(node.id)
    if (node.parentId === -1) {
      depths.set(node.id, 0)
      return 0
    }
    const parent = byId.get(String(node.parentId))
    const d = parent ? depthOf(parent) + 1 : 0
    depths.set(node.id, d)
    return d
  }

  payload.forEach(depthOf)
  return depths
}

/**
 * Payload (flat, parentId-linked) → vue-flow nodes with a left→right tree layout.
 * @param {PayloadNode[]} payload
 */
export function toFlowNodes(payload) {
  const depths = computeDepths(payload)
  const rowAtDepth = {} // depth → how many nodes placed so far

  return payload.map((node) => {
    const depth = depths.get(node.id)
    const row = rowAtDepth[depth] ?? 0
    rowAtDepth[depth] = row + 1
    return {
      id: String(node.id),
      type: NODE_TYPE_MAP[node.type] ?? 'default',
      position: { x: depth * COL_WIDTH, y: row * ROW_HEIGHT },
      // pass the original payload through; renderers read data.name / data.data
      data: { name: node.name, raw: node },
    }
  })
}

/**
 * Payload → vue-flow edges. Every node with parentId !== -1 gets an edge
 * from its parent. The root (trigger, parentId -1) has no incoming edge.
 * @param {PayloadNode[]} payload
 */
export function toFlowEdges(payload) {
  return payload
    .filter((node) => node.parentId != null && node.parentId !== -1)
    .map((node) => ({
      id: `e-${String(node.parentId)}-${String(node.id)}`,
      source: String(node.parentId),
      target: String(node.id),
    }))
}
