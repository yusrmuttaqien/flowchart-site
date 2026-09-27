import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFlowStore } from '../src/stores/flow.js'

// Fixture factory: a fresh payload per test so no test can poison
// the next one via mutation.
const makePayload = () => [
  { id: 1, parentId: -1, name: 'Trigger', description: 't', type: 'trigger', data: {} },
  {
    id: 'a',
    parentId: 1,
    name: 'Msg',
    description: 'm',
    type: 'sendMessage',
    data: { payload: [] },
  },
]

describe('flow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('init deep-copies the payload (store does not alias the source)', () => {
    const store = useFlowStore()
    const payload = makePayload()
    store.init(payload)
    expect(store.nodes).toHaveLength(2)
    // mutating the source must not leak into the store
    payload[0].name = 'mutated'
    expect(store.nodes[0].name).toBe('Trigger')
  })

  it('addNode appends', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 'z', parentId: null, name: 'Z', description: '', type: 'addComment', data: {} })
    expect(store.nodes).toHaveLength(3)
  })

  it('updateNode patches by id and leaves other nodes untouched', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.updateNode('a', { name: 'Renamed' })
    expect(store.nodeById('a').name).toBe('Renamed')
    expect(store.nodeById(1).name).toBe('Trigger')
  })

  it('updateNode with an unknown id is a no-op', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.updateNode('nope', { name: 'X' })
    expect(store.nodes).toHaveLength(2)
  })

  it('deleteNode removes by id (string/number agnostic)', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.deleteNode(1)
    expect(store.nodes).toHaveLength(1)
    expect(store.nodeById(1)).toBeUndefined()
  })

  it('undo restores the previous snapshot', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 'z', parentId: null, name: 'Z', description: '', type: 'addComment', data: {} })
    expect(store.canUndo).toBe(true)
    store.undo()
    expect(store.nodes).toHaveLength(2)
  })

  it('redo re-applies the undone change', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 'z', parentId: null, name: 'Z', description: '', type: 'addComment', data: {} })
    store.undo()
    expect(store.canRedo).toBe(true)
    store.redo()
    expect(store.nodes).toHaveLength(3)
  })

  it('a new mutation invalidates the redo stack', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.addNode({ id: 'z', parentId: null, name: 'Z', description: '', type: 'addComment', data: {} })
    store.undo()
    store.addNode({ id: 'w', parentId: null, name: 'W', description: '', type: 'addComment', data: {} })
    expect(store.canRedo).toBe(false)
  })

  it('undo/redo are no-ops when their stacks are empty', () => {
    const store = useFlowStore()
    store.init(makePayload())
    store.undo()
    expect(store.nodes).toHaveLength(2)
    store.redo()
    expect(store.nodes).toHaveLength(2)
  })
})
