import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import NodeDetails from '../components/NodeDetails.vue'
import { useFlowStore } from '../stores/flow.js'

// The mutations hit a simulated API; mock it to resolve immediately so the
// tests don't wait on the simulated network delay.
vi.mock('../api/flow.js', () => ({
  listNodes: () => Promise.resolve([]),
  createNode: (node) => Promise.resolve(node),
  updateNode: (id, patch) => Promise.resolve({ id, ...patch }),
  deleteNode: (id) => Promise.resolve({ id }),
}))

// Mount NodeDetails against a real memory router so router.push is exercised.
// One pinia instance is shared between the test and the component.
function mountDetails(node, nodeId) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useFlowStore()
  store.init([node])

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/:id', component: { template: '<div/>' } },
    ],
  })

  const queryClient = new QueryClient()
  const wrapper = mount(NodeDetails, {
    props: { nodeId },
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return { wrapper, store, router }
}

const sendMsg = {
  id: 'd09c08',
  name: 'Welcome',
  description: 'Welcome message',
  type: 'sendMessage',
  parentId: 1,
  data: { payload: [{ type: 'text', text: 'Hi' }, { type: 'attachment', attachment: 'data:image/png;base64,abc' }] },
}

describe('NodeDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the shared title + description for a node', () => {
    const { wrapper } = mountDetails(sendMsg, 'd09c08')
    expect(wrapper.text()).toContain('Node Details')
    expect(wrapper.find('input').element.value).toBe('Welcome')
  })

  it('shows the message + attachments section for sendMessage', () => {
    const { wrapper } = mountDetails(sendMsg, 'd09c08')
    expect(wrapper.text()).toContain('Message Content')
    expect(wrapper.find('.attachment img').exists()).toBe(true)
  })

  it('shows the comment section for addComment', () => {
    const node = { id: 'c1', name: 'C', description: 'd', type: 'addComment', parentId: 1, data: { comment: 'Hello' } }
    const { wrapper } = mountDetails(node, 'c1')
    expect(wrapper.text()).toContain('Comment')
    // First textarea is the shared description; the comment is the second.
    expect(wrapper.findAll('textarea')[1].element.value).toBe('Hello')
  })

  it('shows the business hours section for dateTime', () => {
    const node = {
      id: 'b1', name: 'B', description: 'd', type: 'dateTime', parentId: 1,
      data: { times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }], timezone: 'UTC', action: 'businessHours', connectors: [] },
    }
    const { wrapper } = mountDetails(node, 'b1')
    expect(wrapper.text()).toContain('mon: 09:00–17:00')
  })

  it('shows a read-only note for connector nodes', () => {
    const node = { id: 'x1', name: 'X', description: 'd', type: 'dateTimeConnector', parentId: 1, data: { connectorType: 'success' } }
    const { wrapper } = mountDetails(node, 'x1')
    expect(wrapper.text()).toContain('Connector nodes are display-only')
  })

  it('commits a title edit to the store on change', async () => {
    const { wrapper, store } = mountDetails(sendMsg, 'd09c08')
    wrapper.find('input').setValue('Renamed')
    await wrapper.find('input').trigger('change')
    await vi.waitFor(() => expect(store.nodeById('d09c08')?.name).toBe('Renamed'))
  })

  it('commits a message edit while preserving attachments', async () => {
    const { wrapper, store } = mountDetails(sendMsg, 'd09c08')
    // The message textarea is the second textarea (first is description).
    const textareas = wrapper.findAll('textarea')
    textareas[1].setValue('Updated')
    await textareas[1].trigger('change')
    await vi.waitFor(() => {
      const payload = store.nodeById('d09c08').data.payload
      expect(payload.find((p) => p.type === 'text').text).toBe('Updated')
      expect(payload.find((p) => p.type === 'attachment')).toBeTruthy() // attachment survives
    })
  })

  it('removes an attachment', async () => {
    const { wrapper, store } = mountDetails(sendMsg, 'd09c08')
    wrapper.find('.attachment button').trigger('click')
    await vi.waitFor(() => {
      const payload = store.nodeById('d09c08').data.payload
      expect(payload.find((p) => p.type === 'attachment')).toBeUndefined()
    })
  })

  it('adds a business-hours time row', async () => {
    const node = { id: 'b1', name: 'B', description: 'd', type: 'dateTime', parentId: 1, data: { times: [], timezone: 'UTC', action: 'businessHours', connectors: [] } }
    const { wrapper, store } = mountDetails(node, 'b1')
    wrapper.find('.picker button').trigger('click')
    await vi.waitFor(() => expect(store.nodeById('b1').data.times).toHaveLength(1))
  })

  it('Delete Node removes the node and navigates to /', async () => {
    const { wrapper, store, router } = mountDetails(sendMsg, 'd09c08')
    await router.isReady()
    router.push('/d09c08')
    await router.isReady()

    wrapper.find('.delete').trigger('click')
    await router.isReady()

    await vi.waitFor(() => expect(store.nodes).toHaveLength(0))
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('Escape key closes the drawer (navigates to /)', async () => {
    const { wrapper, router } = mountDetails(sendMsg, 'd09c08')
    await router.isReady()
    router.push('/d09c08')
    await router.isReady()

    await wrapper.find('.node-details').trigger('keydown', { key: 'Escape' })
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('focuses the title field on open', () => {
    const spy = vi.spyOn(HTMLInputElement.prototype, 'focus')
    mountDetails(sendMsg, 'd09c08')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
