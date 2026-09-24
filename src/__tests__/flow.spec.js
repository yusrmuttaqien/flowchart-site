import { describe, it, expect } from 'vitest'
import { toFlowNodes, toFlowEdges } from '../utils/flow.js'

const payload = [
  { id: 1, parentId: -1, type: 'trigger', data: { type: 'conversationOpened' } },
  { name: 'Business Hours', id: 'd09c08', type: 'dateTime', parentId: 1, data: {} },
  {
    name: 'Success',
    id: '161f52',
    type: 'dateTimeConnector',
    parentId: 'd09c08',
    data: { connectorType: 'success' },
  },
  {
    name: 'Failure',
    id: '28c4b9',
    type: 'dateTimeConnector',
    parentId: 'd09c08',
    data: { connectorType: 'failure' },
  },
  { name: 'Welcome Message', id: 'b0653a', type: 'sendMessage', parentId: '161f52', data: {} },
]

describe('toFlowNodes', () => {
  it('places the trigger at depth 0', () => {
    const nodes = toFlowNodes(payload)
    expect(nodes.find((n) => n.id === '1').position.x).toBe(0)
  })

  it('produces unique positions', () => {
    const nodes = toFlowNodes(payload)
    const keys = nodes.map((n) => `${n.position.x},${n.position.y}`)
    expect(new Set(keys).size).toBe(nodes.length)
  })

  it('maps dateTimeConnector (success/failure) to the display-only connector type', () => {
    const nodes = toFlowNodes(payload)
    const connectors = nodes.filter((n) => n.id === '161f52' || n.id === '28c4b9')
    expect(connectors).toHaveLength(2)
    expect(connectors.every((n) => n.type === 'connector')).toBe(true)
  })

  it('maps dateTime to businessHours', () => {
    const nodes = toFlowNodes(payload)
    expect(nodes.find((n) => n.id === 'd09c08').type).toBe('businessHours')
  })
})

describe('toFlowEdges', () => {
  it('creates one edge per non-root node, none into the trigger', () => {
    const edges = toFlowEdges(payload)
    expect(edges).toHaveLength(4)
    expect(edges.every((e) => e.target !== '1')).toBe(true)
  })

  it('every edge endpoint exists in the payload', () => {
    const ids = payload.map((n) => String(n.id))
    const edges = toFlowEdges(payload)
    edges.forEach((e) => {
      expect(ids).toContain(e.source)
      expect(ids).toContain(e.target)
    })
  })
})
