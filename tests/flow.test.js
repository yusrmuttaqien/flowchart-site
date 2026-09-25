import { describe, it, expect } from 'vitest'
import { toFlowNodes, toFlowEdges } from '../src/utils/flow.js'

// Minimal fixture mirroring the payload contract:
// every node has id, parentId, name, description, type, data.
const payload = [
  { id: 1, parentId: -1, name: 'Trigger', description: 't', type: 'trigger', data: {} },
  {
    id: 'a',
    parentId: 1,
    name: 'Msg',
    description: 'm',
    type: 'sendMessage',
    data: { payload: [] },
  },
  {
    id: 'b',
    parentId: 'a',
    name: 'Comment',
    description: 'c',
    type: 'addComment',
    data: { comment: 'x' },
  },
]

describe('toFlowNodes', () => {
  it('lays nodes out in depth columns (x = depth * COL_WIDTH)', () => {
    const nodes = toFlowNodes(payload)
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
    expect(byId['1'].position.x).toBe(0)
    expect(byId['a'].position.x).toBe(250)
    expect(byId['b'].position.x).toBe(500)
  })

  it('stacks siblings in rows (y increments per sibling at a depth)', () => {
    const siblings = [
      { id: 1, parentId: -1, name: 'T', description: '', type: 'trigger', data: {} },
      { id: 'x', parentId: 1, name: 'X', description: '', type: 'addComment', data: {} },
      { id: 'y', parentId: 1, name: 'Y', description: '', type: 'addComment', data: {} },
    ]
    const nodes = toFlowNodes(siblings)
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
    expect(byId['x'].position.y).toBe(0)
    expect(byId['y'].position.y).toBe(120)
  })

  it('exposes the shared envelope (name, description) to renderers', () => {
    const nodes = toFlowNodes(payload)
    const msg = nodes.find((n) => n.id === 'a')
    expect(msg.data.name).toBe('Msg')
    expect(msg.data.description).toBe('m')
  })

  it('maps payload types to vue-flow node types', () => {
    const nodes = toFlowNodes(payload)
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
    expect(byId['1'].type).toBe('trigger')
    expect(byId['a'].type).toBe('sendMessage')
    expect(byId['b'].type).toBe('addComment')
  })

  it('places a node with an unknown parent at depth 0', () => {
    const nodes = toFlowNodes([
      { id: 'orphan', parentId: 'nope', name: 'O', description: '', type: 'addComment', data: {} },
    ])
    expect(nodes[0].position.x).toBe(0)
  })
})

describe('toFlowEdges', () => {
  it('creates one edge per node with a parent (root excluded)', () => {
    const edges = toFlowEdges(payload)
    expect(edges).toHaveLength(2)
    expect(edges.map((e) => e.id)).toEqual(['e-1-a', 'e-a-b'])
  })

  it('stringifies ids (payload mixes number and string ids)', () => {
    const edges = toFlowEdges(payload)
    expect(edges[0].source).toBe('1')
    expect(edges[0].target).toBe('a')
  })

  it('excludes nodes with null parentId (new standalone nodes)', () => {
    const edges = toFlowEdges([
      { id: 'n', parentId: null, name: 'N', description: '', type: 'addComment', data: {} },
    ])
    expect(edges).toHaveLength(0)
  })
})
