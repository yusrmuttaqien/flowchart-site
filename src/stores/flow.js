import { defineStore } from 'pinia'

const HISTORY_LIMIT = 50

// Deep clone for JSON-shaped data (our payload is JSON).
function clone(nodes) {
  return JSON.parse(JSON.stringify(nodes))
}

export const useFlowStore = defineStore('flow', {
  state: () => ({
    nodes: [], // array of payload nodes (original shape)
    past: [], // undo stack: snapshots of nodes
    future: [], // redo stack
  }),
  getters: {
    nodeById(state) {
      return (id) => state.nodes.find((n) => String(n.id) === String(id))
    },
    canUndo(state) {
      return state.past.length > 0
    },
    canRedo(state) {
      return state.future.length > 0
    },
  },
  actions: {
    init(payload) {
      this.nodes = clone(payload)
      this.past = []
      this.future = []
    },
    // Snapshot before each mutation; a redo invalidates the redo stack.
    _commit() {
      this.past.push(clone(this.nodes))
      if (this.past.length > HISTORY_LIMIT) this.past.shift()
      this.future = []
    },
    addNode(node) {
      this._commit()
      this.nodes.push(node)
    },
    updateNode(id, patch) {
      const node = this.nodeById(id)
      if (!node) return
      this._commit()
      Object.assign(node, patch)
    },
    deleteNode(id) {
      this._commit()
      this.nodes = this.nodes.filter((n) => String(n.id) !== String(id))
    },
    undo() {
      if (!this.canUndo) return
      this.future.push(clone(this.nodes))
      this.nodes = this.past.pop()
    },
    redo() {
      if (!this.canRedo) return
      this.past.push(clone(this.nodes))
      this.nodes = this.future.pop()
    },
  },
})
