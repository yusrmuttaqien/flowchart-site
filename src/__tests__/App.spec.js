import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import App from '../App.vue'
import FlowPage from '../pages/FlowPage.vue'

describe('App', () => {
  it('renders the flow page for the root route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: FlowPage }],
    })
    const queryClient = new QueryClient()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia(), [VueQueryPlugin, { queryClient }]],
      },
    })
    await router.isReady()

    expect(wrapper.text()).toContain('Create New Node')
  })
})
