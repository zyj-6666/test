<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutStore } from '../stores'
import { useMealStore } from '../stores'
import { useBodyStatsStore } from '../stores'
import { useGoalStore } from '../stores'
import { format } from 'date-fns'

const workoutStore = useWorkoutStore()
const mealStore = useMealStore()
const bodyStatsStore = useBodyStatsStore()
const goalStore = useGoalStore()

const today = format(new Date(), 'yyyy-MM-dd')

const workoutCount = computed(() => workoutStore.todayWorkouts.length)
const todayNutrition = computed(() => mealStore.todayNutrition)
const latestStats = computed(() => bodyStatsStore.latestStats)

const weeklyWorkouts = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return workoutStore.workouts.filter(w =>
    new Date(w.date) >= weekAgo
  ).length
})

const goalsProgress = computed(() => {
  return goalStore.goals.map(goal => ({
    ...goal,
    progress: Math.min(100, Math.round((goal.current / goal.target) * 100))
  }))
})
</script>

<template>
  <div class="dashboard">
    <h2 class="page-title">今日概览</h2>
    <p class="date-display">{{ format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: undefined }) }}</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{ workoutCount }}</div>
        <div class="stat-label">今日训练</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ todayNutrition.calories }}</div>
        <div class="stat-label">今日热量 (kcal)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ weeklyWorkouts }}</div>
        <div class="stat-label">本周训练次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ latestStats?.weight || '--' }}</div>
        <div class="stat-label">当前体重 (kg)</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">今日饮食</h3>
          <RouterLink to="/diet" class="btn btn-secondary">查看详情</RouterLink>
        </div>
        <div class="nutrition-bars">
          <div class="nutrition-item">
            <div class="nutrition-label">
              <span>蛋白质</span>
              <span>{{ todayNutrition.protein }}g</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, (todayNutrition.protein / 150) * 100) + '%' }"></div>
            </div>
          </div>
          <div class="nutrition-item">
            <div class="nutrition-label">
              <span>碳水化合物</span>
              <span>{{ todayNutrition.carbs }}g</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, (todayNutrition.carbs / 300) * 100) + '%' }"></div>
            </div>
          </div>
          <div class="nutrition-item">
            <div class="nutrition-label">
              <span>脂肪</span>
              <span>{{ todayNutrition.fat }}g</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, (todayNutrition.fat / 65) * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">目标进度</h3>
          <RouterLink to="/goals" class="btn btn-secondary">管理目标</RouterLink>
        </div>
        <div v-if="goalsProgress.length === 0" class="empty-state">
          <p>暂无目标，去添加一个吧！</p>
        </div>
        <div v-else class="goals-list">
          <div v-for="goal in goalsProgress" :key="goal.id" class="goal-item">
            <div class="goal-info">
              <span class="goal-type">
                {{ goal.type === 'weight' ? '体重目标' :
                   goal.type === 'bodyFat' ? '体脂目标' :
                   goal.type === 'workoutDays' ? '训练天数' : '热量目标' }}
              </span>
              <span class="goal-progress">{{ goal.current }} / {{ goal.target }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: goal.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">今日训练计划</h3>
        <RouterLink to="/workout" class="btn btn-primary">添加训练</RouterLink>
      </div>
      <div v-if="workoutStore.todayWorkouts.length === 0" class="empty-state">
        <p>今天还没有训练计划，开始记录吧！</p>
      </div>
      <div v-else class="workout-list">
        <div v-for="workout in workoutStore.todayWorkouts" :key="workout.id" class="workout-item">
          <div class="workout-info">
            <h4>{{ workout.name }}</h4>
            <span class="badge" :class="workout.completed ? 'badge-success' : 'badge-warning'">
              {{ workout.completed ? '已完成' : '进行中' }}
            </span>
          </div>
          <p class="workout-exercises">{{ workout.exercises.length }} 个动作</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.75rem;
  margin-bottom: 8px;
}

.date-display {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.nutrition-item {
  margin-bottom: 16px;
}

.nutrition-item:last-child {
  margin-bottom: 0;
}

.nutrition-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.goal-item {
  margin-bottom: 16px;
}

.goal-item:last-child {
  margin-bottom: 0;
}

.goal-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.goal-type {
  font-size: 14px;
}

.goal-progress {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.workout-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 12px;
}

.workout-item:last-child {
  margin-bottom: 0;
}

.workout-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.workout-info h4 {
  font-size: 1rem;
  font-weight: 600;
}

.workout-exercises {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
