import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue')
    },
    {
      path: '/workout',
      name: 'workout',
      component: () => import('../views/Workout.vue')
    },
    {
      path: '/diet',
      name: 'diet',
      component: () => import('../views/Diet.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/Stats.vue')
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('../views/Goals.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue')
    }
  ]
})

export default router
