import { defineStore } from 'pinia'

export const useFlowStore = defineStore('flow', {
  state: () => ({
    nodes: [], // array of payload nodes (original shape)
  }),
  getters: {
    nodeById(state) {
      return (id) => state.nodes.find((n) => String(n.id) === String(id))
    },
  },
  actions: {
    init(payload) {
      this.nodes = payload
    },
    addNode(node) {
      this.nodes.push(node)
    },
    updateNode(id, patch) {
      const node = this.nodeById(id)
      if (node) Object.assign(node, patch)
    },
    deleteNode(id) {
      this.nodes = this.nodes.filter((n) => String(n.id) !== String(id))
    },
  },
})
