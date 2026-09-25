import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import TriggerNode from '../components/nodes/TriggerNode.vue'

// Every node card renders a + on its bottom edge; clicking it asks the parent
// to open the create modal with this node's id. TriggerNode stands in for the
// shared pattern across all five node components.
describe('node components — add-child button', () => {
  it('renders a + button', () => {
    const wrapper = mount(TriggerNode, {
      props: { data: { name: 'T', description: 'd', onAddChild: vi.fn() }, id: 'n1' },
    })
    expect(wrapper.find('.fc-node__add').exists()).toBe(true)
  })

  it('calls data.onAddChild with the node id when the + is clicked', () => {
    const onAddChild = vi.fn()
    const wrapper = mount(TriggerNode, {
      props: { data: { name: 'T', description: 'd', onAddChild }, id: 'n1' },
    })
    wrapper.find('.fc-node__add').trigger('click')
    expect(onAddChild).toHaveBeenCalledWith('n1')
  })
})
