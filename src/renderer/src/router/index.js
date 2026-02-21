import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

const router = createRouter({
  mode: 'hash',
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '登录',
      component: () => import('@/views/Login/login.vue')
    },
    {
      path: '/meetings',
      name: '会议列表',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/Meeting/list.vue')
    },
    {
      path: '/meetings/:id',
      name: '会议详情',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/Meeting/detail.vue')
    },
    {
      path: '/meetings/:id/room',
      name: '会议房间',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/Meeting/room.vue')
    }
  ]
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return '/'
  }
  if (to.path === '/' && isAuthenticated()) {
    return '/meetings'
  }
  return true
})

export default router
