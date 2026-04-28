<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const currentPath = computed(() => route.path)

const navItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/workout', label: '训练计划', icon: '💪' },
  { path: '/diet', label: '饮食记录', icon: '🍽️' },
  { path: '/stats', label: '数据统计', icon: '📈' },
  { path: '/goals', label: '目标管理', icon: '🎯' },
  { path: '/profile', label: '个人中心', icon: '👤' }
]
</script>

<template>
  <div class="app-container">
    <header class="header">
      <div class="container">
        <h1 class="logo">🏋️ 健身管理系统</h1>
      </div>
    </header>

    <nav class="nav container">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['nav-link', { active: currentPath === item.path }]"
      >
        {{ item.icon }} {{ item.label }}
      </RouterLink>
    </nav>

    <main class="main container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}

.header {
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main {
  padding-top: 20px;
  padding-bottom: 40px;
}
</style>
