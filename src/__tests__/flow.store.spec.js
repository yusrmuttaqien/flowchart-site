import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useFlowStore } from '../stores/flow.js'

// A fresh, minimal payload for every test — a factory, not a shared constant,
// so no test can poison the next one via mutation.
function makePayload() {
  return [
    { id: 1, name: 'Root', type: 'trigger', parentId: -1, data: {} },
    { id: 'd09c08', name: 'Child', type: 'sendMessage', parentId: 1, data: {} },
  ]
}

describe('flow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('init replaces nodes and clears history', () => {
    const store = useFlowStore()
    store.init(makePayload())
    expect(store.nodes).toHaveLength(2)
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
  })

  it('init deep-clones the payload (later mutation does not leak in)', () => {
    const payload = makePayload()
    const store = useFlowStore()
    store.init(payload)
    payload[0].name = 'mutated'
    expect(store.nodes[0].name).toBe('Root')
  })

  it('nodeById matches on String(id) across mixed number/string ids', () => {
    const store = useFlowStore()
    store.init(makePayload())
    expect(store.nodeById(1)?.name).toBe('Root')
    expect(store.nodeById('1')?.name).toBe('Root') // string form of a number id
    expect(store.nodeById('d09c08')?.name).toBe('Child')
    expect(store.nodeById('nope')).toBeUndefined()
  })

  it('addNode appends and becomes undoable', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 99, name: 'New', type: 'sendMessage', parentId: null, data: {} })
    expect(store.nodes).toHaveLength(3)
    expect(store.canUndo).toBe(true)
  })

  it('updateNode patches the matching node only', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.updateNode('d09c08', { name: 'Renamed' })
    expect(store.nodeById('d09c08')?.name).toBe('Renamed')
    expect(store.nodeById(1)?.name).toBe('Root')
  })

  it('updateNode is a no-op for an unknown id', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.updateNode('ghost', { name: 'x' })
    expect(store.nodes).toHaveLength(2)
    expect(store.canUndo).toBe(false) // no snapshot taken
  })

  it('updateNode saves a drag position and it is undoable', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.updateNode('d09c08', { position: { x: 123, y: 456 } })
    expect(store.nodeById('d09c08')?.position).toEqual({ x: 123, y: 456 })
    store.undo()
    expect(store.nodeById('d09c08')?.position).toBeUndefined()
  })

  it('deleteNode removes by String(id)', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.deleteNode('d09c08')
    expect(store.nodes).toHaveLength(1)
    expect(store.nodeById('d09c08')).toBeUndefined()
  })

  it('undo reverts the last mutation', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 99, name: 'New', type: 'sendMessage', parentId: null, data: {} })
    store.undo()
    expect(store.nodes).toHaveLength(2)
    expect(store.canRedo).toBe(true)
  })

  it('redo re-applies an undone mutation', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 99, name: 'New', type: 'sendMessage', parentId: null, data: {} })
    store.undo()
    store.redo()
    expect(store.nodes).toHaveLength(3)
    expect(store.canRedo).toBe(false)
  })

  it('a new mutation clears the redo stack', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 99, name: 'A', type: 'sendMessage', parentId: null, data: {} })
    store.undo()
    expect(store.canRedo).toBe(true)
    store.addNode({ id: 100, name: 'B', type: 'sendMessage', parentId: null, data: {} })
    expect(store.canRedo).toBe(false)
  })

  it('undo/redo are no-ops when their stack is empty', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.undo() // nothing to undo
    expect(store.nodes).toHaveLength(2)
    store.redo() // nothing to redo
    expect(store.nodes).toHaveLength(2)
  })
})
