import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import CreateNodeModal from '../components/CreateNodeModal.vue'
import { useFlowStore } from '../stores/flow.js'

// The create mutation hits a simulated API; mock it to resolve immediately.
vi.mock('../api/flow.js', () => ({
  listNodes: () => Promise.resolve([]),
  createNode: (node) => Promise.resolve(node),
  updateNode: (id, patch) => Promise.resolve({ id, ...patch }),
  deleteNode: (id) => Promise.resolve({ id }),
}))

function mountModal() {
  return mount(CreateNodeModal, {
    global: { plugins: [createPinia(), [VueQueryPlugin, { queryClient: new QueryClient() }]] },
  })
}

describe('CreateNodeModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the form with the three creatable types', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Create New Node')
    const options = wrapper.findAll('option').map((o) => o.attributes('value'))
    expect(options).toEqual(['sendMessage', 'addComment', 'dateTime'])
  })

  it('shows a validation error for an empty title and description', async () => {
    const wrapper = mountModal()
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(wrapper.text()).toContain('Title is required')
    expect(wrapper.text()).toContain('Description is required')
  })

  it('does not create a node while validation fails', async () => {
    const wrapper = mountModal()
    const store = useFlowStore()
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(store.nodes).toHaveLength(0)
  })

  it('creates a sendMessage node and closes on valid submit', async () => {
    const wrapper = mountModal()
    const store = useFlowStore()
    wrapper.find('input[type="text"]').setValue('My Message')
    wrapper.find('textarea').setValue('Hello there')
    await wrapper.find('button[type="submit"]').trigger('submit')

    await vi.waitFor(() => expect(store.nodes).toHaveLength(1))
    const node = store.nodes[0]
    expect(node.type).toBe('sendMessage')
    expect(node.name).toBe('My Message')
    expect(node.data.payload).toEqual([{ type: 'text', text: 'Hello there' }])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('creates an addComment node with the comment in data', async () => {
    const wrapper = mountModal()
    const store = useFlowStore()
    wrapper.find('input[type="text"]').setValue('Note')
    wrapper.find('textarea').setValue('A comment')
    wrapper.find('select').setValue('addComment')
    await wrapper.find('button[type="submit"]').trigger('submit')

    await vi.waitFor(() => expect(store.nodes).toHaveLength(1))
    const node = store.nodes[0]
    expect(node.type).toBe('addComment')
    expect(node.data.comment).toBe('A comment')
  })

  it('creates a dateTime (business hours) node', async () => {
    const wrapper = mountModal()
    const store = useFlowStore()
    wrapper.find('input[type="text"]').setValue('Hours')
    wrapper.find('textarea').setValue('Office hours')
    wrapper.find('select').setValue('dateTime')
    await wrapper.find('button[type="submit"]').trigger('submit')

    await vi.waitFor(() => expect(store.nodes).toHaveLength(1))
    const node = store.nodes[0]
    expect(node.type).toBe('dateTime')
    expect(node.data.timezone).toBe('UTC')
  })

  it('Cancel emits close without creating a node', async () => {
    const wrapper = mountModal()
    const store = useFlowStore()
    wrapper.find('button[type="button"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(store.nodes).toHaveLength(0)
  })

  it('Escape key emits close', async () => {
    const wrapper = mountModal()
    await wrapper.find('.modal-overlay').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('focuses the title field on open', () => {
    // VTU mounts into a detached node, so document.activeElement is unreliable;
    // spy on the focus call instead.
    const spy = vi.spyOn(HTMLInputElement.prototype, 'focus')
    mountModal()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('sets the parentId from the + that opened it', async () => {
    const wrapper = mount(CreateNodeModal, {
      props: { parentId: 'd09c08' },
      global: { plugins: [createPinia(), [VueQueryPlugin, { queryClient: new QueryClient() }]] },
    })
    const store = useFlowStore()
    wrapper.find('input[type="text"]').setValue('Child')
    wrapper.find('textarea').setValue('A child message')
    await wrapper.find('button[type="submit"]').trigger('submit')

    await vi.waitFor(() => expect(store.nodes).toHaveLength(1))
    expect(store.nodes[0].parentId).toBe('d09c08')
  })
})
