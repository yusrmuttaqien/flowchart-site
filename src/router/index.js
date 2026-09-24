import { createRouter, createWebHistory } from 'vue-router'
import FlowPage from '../pages/FlowPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: FlowPage },
    { path: '/:nodeId', component: FlowPage },
  ],
})

export default router
