<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGoalStore } from '../stores'
import type { Goal } from '../types'
import { format, parseISO } from 'date-fns'

const goalStore = useGoalStore()

const showModal = ref(false)
const editingGoal = ref<Goal | null>(null)

const goalForm = ref({
  type: 'weight' as Goal['type'],
  target: 0,
  current: 0,
  deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
})

const goalTypes = [
  { value: 'weight', label: '体重目标', unit: 'kg' },
  { value: 'bodyFat', label: '体脂目标', unit: '%' },
  { value: 'workoutDays', label: '训练天数', unit: '天' },
  { value: 'calories', label: '热量控制', unit: 'kcal' }
]

const goalsWithProgress = computed(() => {
  return goalStore.goals.map(goal => ({
    ...goal,
    progress: Math.min(100, Math.round((goal.current / goal.target) * 100)),
    typeLabel: goalTypes.find(t => t.value === goal.type)?.label || goal.type,
    unit: goalTypes.find(t => t.value === goal.type)?.unit || '',
    daysLeft: Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }))
})

function openAddModal() {
  editingGoal.value = null
  goalForm.value = {
    type: 'weight',
    target: 0,
    current: 0,
    deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  }
  showModal.value = true
}

function openEditModal(goal: Goal) {
  editingGoal.value = goal
  goalForm.value = {
    type: goal.type,
    target: goal.target,
    current: goal.current,
    deadline: goal.deadline
  }
  showModal.value = true
}

function saveGoal() {
  if (goalForm.value.target <= 0) return

  const goalData = {
    type: goalForm.value.type,
    target: goalForm.value.target,
    current: goalForm.value.current,
    deadline: goalForm.value.deadline
  }

  if (editingGoal.value) {
    goalStore.updateGoal(editingGoal.value.id, goalData)
  } else {
    goalStore.addGoal(goalData)
  }

  showModal.value = false
}

function updateProgress(goal: Goal, delta: number) {
  const newCurrent = Math.max(0, goal.current + delta)
  goalStore.updateGoal(goal.id, { current: newCurrent })
}

function deleteGoal(id: string) {
  if (confirm('确定要删除这个目标吗？')) {
    goalStore.deleteGoal(id)
  }
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return '#10b981'
  if (progress >= 70) return '#667eea'
  if (progress >= 40) return '#f59e0b'
  return '#ef4444'
}
</script>

<template>
  <div class="goals-page">
    <div class="page-header">
      <h2 class="page-title">目标管理</h2>
      <button class="btn btn-primary" @click="openAddModal">添加目标</button>
    </div>

    <div v-if="goalsWithProgress.length === 0" class="card empty-state">
      <p>暂无目标，点击"添加目标"开始设定你的健身目标吧！</p>
    </div>

    <div v-else class="goals-grid">
      <div v-for="goal in goalsWithProgress" :key="goal.id" class="card goal-card">
        <div class="goal-header">
          <h3 class="goal-title">{{ goal.typeLabel }}</h3>
          <div class="goal-actions">
            <button class="btn btn-secondary" @click="openEditModal(goal)">编辑</button>
            <button class="btn btn-danger" @click="deleteGoal(goal.id)">删除</button>
          </div>
        </div>

        <div class="goal-progress-section">
          <div class="progress-numbers">
            <span class="current">{{ goal.current }}</span>
            <span class="separator">/</span>
            <span class="target">{{ goal.target }} {{ goal.unit }}</span>
          </div>

          <div class="progress-bar-large">
            <div
              class="progress-fill-large"
              :style="{
                width: goal.progress + '%',
                background: getProgressColor(goal.progress)
              }"
            ></div>
          </div>

          <div class="progress-percentage" :style="{ color: getProgressColor(goal.progress) }">
            {{ goal.progress }}%
          </div>
        </div>

        <div class="goal-meta">
          <div class="meta-item">
            <span class="meta-label">截止日期</span>
            <span class="meta-value">{{ format(parseISO(goal.deadline), 'yyyy-MM-dd') }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">剩余天数</span>
            <span class="meta-value" :class="{ warning: goal.daysLeft <= 7, danger: goal.daysLeft <= 0 }">
              {{ goal.daysLeft > 0 ? goal.daysLeft + ' 天' : '已过期' }}
            </span>
          </div>
        </div>

        <div class="goal-quick-actions">
          <button class="btn btn-secondary" @click="updateProgress(goal, -1)">-1</button>
          <button class="btn btn-secondary" @click="updateProgress(goal, 1)">+1</button>
          <button class="btn btn-secondary" @click="updateProgress(goal, 5)">+5</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑目标弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingGoal ? '编辑目标' : '添加目标' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>

        <div class="form-group">
          <label>目标类型</label>
          <select v-model="goalForm.type">
            <option v-for="type in goalTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>目标值</label>
            <input type="number" v-model.number="goalForm.target" min="0" step="0.1" />
          </div>
          <div class="form-group">
            <label>当前值</label>
            <input type="number" v-model.number="goalForm.current" min="0" step="0.1" />
          </div>
        </div>

        <div class="form-group">
          <label>截止日期</label>
          <input type="date" v-model="goalForm.deadline" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveGoal">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.goal-card {
  transition: transform 0.3s ease;
}

.goal-card:hover {
  transform: translateY(-4px);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.goal-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.goal-actions {
  display: flex;
  gap: 8px;
}

.goal-progress-section {
  text-align: center;
  padding: 20px 0;
}

.progress-numbers {
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.progress-numbers .current {
  font-weight: 700;
  font-size: 2rem;
}

.progress-numbers .separator {
  margin: 0 8px;
  color: rgba(255, 255, 255, 0.5);
}

.progress-numbers .target {
  color: rgba(255, 255, 255, 0.7);
}

.progress-bar-large {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill-large {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-percentage {
  font-size: 1.25rem;
  font-weight: 600;
}

.goal-meta {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin: 16px 0;
}

.meta-item {
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.meta-value {
  font-weight: 600;
}

.meta-value.warning {
  color: #f59e0b;
}

.meta-value.danger {
  color: #ef4444;
}

.goal-quick-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
