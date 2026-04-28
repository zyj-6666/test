<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProfileStore } from '../stores'
import { useWorkoutStore } from '../stores'
import { useMealStore } from '../stores'
import { useBodyStatsStore } from '../stores'
import { useGoalStore } from '../stores'
import { format } from 'date-fns'

const profileStore = useProfileStore()
const workoutStore = useWorkoutStore()
const mealStore = useMealStore()
const bodyStatsStore = useBodyStatsStore()
const goalStore = useGoalStore()

const showEditModal = ref(false)

const profileForm = ref({
  name: '',
  age: 25,
  gender: 'male' as 'male' | 'female',
  height: 170
})

const stats = computed(() => ({
  totalWorkouts: workoutStore.workouts.length,
  totalMeals: mealStore.meals.length,
  bodyStatsRecords: bodyStatsStore.bodyStats.length,
  activeGoals: goalStore.goals.length
}))

function openEditModal() {
  if (profileStore.profile) {
    profileForm.value = {
      name: profileStore.profile.name,
      age: profileStore.profile.age,
      gender: profileStore.profile.gender,
      height: profileStore.profile.height
    }
  }
  showEditModal.value = true
}

function saveProfile() {
  profileStore.updateProfile(profileForm.value)
  showEditModal.value = false
}

function exportData() {
  const data = {
    profile: profileStore.profile,
    workouts: workoutStore.workouts,
    meals: mealStore.meals,
    bodyStats: bodyStatsStore.bodyStats,
    goals: goalStore.goals,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitness-data-${format(new Date(), 'yyyy-MM-dd')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function clearAllData() {
  if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    localStorage.clear()
    location.reload()
  }
}
</script>

<template>
  <div class="profile-page">
    <h2 class="page-title">个人中心</h2>

    <div class="profile-section card">
      <div class="profile-header">
        <div class="avatar">
          {{ (profileStore.profile?.name || '用')[0] }}
        </div>
        <div class="profile-info">
          <h3>{{ profileStore.profile?.name || '未设置' }}</h3>
          <p v-if="profileStore.profile">
            {{ profileStore.profile.gender === 'male' ? '男' : '女' }} ·
            {{ profileStore.profile.age }}岁 ·
            {{ profileStore.profile.height }}cm
          </p>
          <p v-else class="no-profile">点击编辑设置个人信息</p>
        </div>
        <button class="btn btn-primary" @click="openEditModal">编辑</button>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">数据统计</h3>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalWorkouts }}</div>
          <div class="stat-label">训练记录</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalMeals }}</div>
          <div class="stat-label">饮食记录</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.bodyStatsRecords }}</div>
          <div class="stat-label">身体数据</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.activeGoals }}</div>
          <div class="stat-label">目标数量</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">数据管理</h3>
      <div class="data-actions">
        <button class="btn btn-secondary" @click="exportData">
          导出数据
        </button>
        <button class="btn btn-danger" @click="clearAllData">
          清除所有数据
        </button>
      </div>
      <p class="data-hint">
        数据存储在浏览器本地存储中，清除浏览器缓存会导致数据丢失。建议定期导出备份。
      </p>
    </div>

    <div class="card">
      <h3 class="card-title">关于</h3>
      <div class="about-content">
        <p><strong>健身管理系统</strong> v1.0.0</p>
        <p>一个简洁的健身自我管理工具，帮助你记录训练计划和饮食计划。</p>
        <p class="tech-stack">
          技术栈：Vue 3 + TypeScript + Pinia + Vue Router
        </p>
      </div>
    </div>

    <!-- 编辑个人信息弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>编辑个人信息</h3>
          <button class="modal-close" @click="showEditModal = false">&times;</button>
        </div>

        <div class="form-group">
          <label>姓名</label>
          <input v-model="profileForm.name" placeholder="请输入姓名" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>年龄</label>
            <input type="number" v-model.number="profileForm.age" min="1" max="150" />
          </div>
          <div class="form-group">
            <label>性别</label>
            <select v-model="profileForm.gender">
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>身高 (cm)</label>
          <input type="number" v-model.number="profileForm.height" min="50" max="250" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" @click="saveProfile">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.75rem;
  margin-bottom: 24px;
}

.profile-section {
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.profile-info {
  flex: 1;
}

.profile-info h3 {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.profile-info p {
  color: rgba(255, 255, 255, 0.7);
}

.no-profile {
  color: rgba(255, 255, 255, 0.5);
}

.data-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.data-hint {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.about-content {
  margin-top: 16px;
  line-height: 1.8;
}

.about-content p {
  margin-bottom: 8px;
}

.tech-stack {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 480px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .data-actions {
    flex-direction: column;
  }
}
</style>
