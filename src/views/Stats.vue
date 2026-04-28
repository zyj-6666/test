<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkoutStore } from '../stores'
import { useMealStore } from '../stores'
import { useBodyStatsStore } from '../stores'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

const workoutStore = useWorkoutStore()
const mealStore = useMealStore()
const bodyStatsStore = useBodyStatsStore()

const activeTab = ref('workout')
const showBodyStatsModal = ref(false)

const bodyStatsForm = ref({
  weight: 0,
  bodyFat: 0,
  chest: 0,
  waist: 0,
  hip: 0,
  arm: 0,
  thigh: 0
})

const today = new Date()
const weekStart = startOfWeek(today, { weekStartsOn: 1 })
const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

const weeklyWorkouts = computed(() => {
  const weekDates = weekDays.map(d => format(d, 'yyyy-MM-dd'))
  return workoutStore.workouts.filter(w => weekDates.includes(w.date))
})

const weeklyWorkoutStats = computed(() => {
  const stats: Record<string, { count: number; completed: number }> = {}
  weekDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayWorkouts = workoutStore.workouts.filter(w => w.date === dateStr)
    stats[dateStr] = {
      count: dayWorkouts.length,
      completed: dayWorkouts.filter(w => w.completed).length
    }
  })
  return stats
})

const monthlyWorkouts = computed(() => {
  const thisMonth = format(today, 'yyyy-MM')
  return workoutStore.workouts.filter(w => w.date.startsWith(thisMonth))
})

const muscleGroupStats = computed(() => {
  const stats: Record<string, number> = {}
  weeklyWorkouts.value.forEach(workout => {
    workout.exercises.forEach(exercise => {
      stats[exercise.muscleGroup] = (stats[exercise.muscleGroup] || 0) + 1
    })
  })
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
})

const weeklyNutrition = computed(() => {
  const weekDates = weekDays.map(d => format(d, 'yyyy-MM-dd'))
  const weekMeals = mealStore.meals.filter(m => weekDates.includes(m.date))

  return weekMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
})

const avgDailyNutrition = computed(() => ({
  calories: Math.round(weeklyNutrition.value.calories / 7),
  protein: Math.round(weeklyNutrition.value.protein / 7),
  carbs: Math.round(weeklyNutrition.value.carbs / 7),
  fat: Math.round(weeklyNutrition.value.fat / 7)
}))

const weightHistory = computed(() => {
  return [...bodyStatsStore.bodyStats]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)
})

function addBodyStats() {
  bodyStatsStore.addBodyStats({
    date: format(new Date(), 'yyyy-MM-dd'),
    ...bodyStatsForm.value
  })
  showBodyStatsModal.value = false
  bodyStatsForm.value = {
    weight: 0,
    bodyFat: 0,
    chest: 0,
    waist: 0,
    hip: 0,
    arm: 0,
    thigh: 0
  }
}

function deleteBodyStats(id: string) {
  if (confirm('确定要删除这条身体数据吗？')) {
    bodyStatsStore.deleteBodyStats(id)
  }
}
</script>

<template>
  <div class="stats-page">
    <h2 class="page-title">数据统计</h2>

    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'workout' }]"
        @click="activeTab = 'workout'"
      >
        训练统计
      </button>
      <button
        :class="['tab', { active: activeTab === 'diet' }]"
        @click="activeTab = 'diet'"
      >
        饮食统计
      </button>
      <button
        :class="['tab', { active: activeTab === 'body' }]"
        @click="activeTab = 'body'"
      >
        身体数据
      </button>
    </div>

    <!-- 训练统计 -->
    <div v-if="activeTab === 'workout'" class="stats-content">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ weeklyWorkouts.length }}</div>
          <div class="stat-label">本周训练次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ monthlyWorkouts.length }}</div>
          <div class="stat-label">本月训练次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ weeklyWorkouts.filter(w => w.completed).length }}</div>
          <div class="stat-label">本周完成训练</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ workoutStore.workouts.length }}</div>
          <div class="stat-label">总训练次数</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">本周训练日历</h3>
        <div class="week-calendar">
          <div v-for="day in weekDays" :key="day.toISOString()" class="calendar-day">
            <div class="day-name">{{ format(day, 'EEE') }}</div>
            <div class="day-date">{{ format(day, 'd') }}</div>
            <div
              class="day-indicator"
              :class="{
                hasWorkout: weeklyWorkoutStats[format(day, 'yyyy-MM-dd')]?.count > 0,
                completed: weeklyWorkoutStats[format(day, 'yyyy-MM-dd')]?.completed > 0
              }"
            >
              {{ weeklyWorkoutStats[format(day, 'yyyy-MM-dd')]?.count || 0 }}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">本周训练部位分布</h3>
        <div v-if="muscleGroupStats.length === 0" class="empty-state">
          <p>暂无训练数据</p>
        </div>
        <div v-else class="muscle-chart">
          <div v-for="[group, count] in muscleGroupStats" :key="group" class="muscle-bar">
            <div class="muscle-label">{{ group }}</div>
            <div class="muscle-progress">
              <div
                class="muscle-fill"
                :style="{ width: (count / (muscleGroupStats[0]?.[1] || 1)) * 100 + '%' }"
              ></div>
            </div>
            <div class="muscle-count">{{ count }} 次</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 饮食统计 -->
    <div v-if="activeTab === 'diet'" class="stats-content">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ avgDailyNutrition.calories }}</div>
          <div class="stat-label">日均热量 (kcal)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ avgDailyNutrition.protein }}g</div>
          <div class="stat-label">日均蛋白质</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ avgDailyNutrition.carbs }}g</div>
          <div class="stat-label">日均碳水</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ avgDailyNutrition.fat }}g</div>
          <div class="stat-label">日均脂肪</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">本周营养摄入</h3>
        <div class="nutrition-summary">
          <div class="nutrition-item">
            <span class="label">总热量</span>
            <span class="value">{{ weeklyNutrition.calories }} kcal</span>
          </div>
          <div class="nutrition-item">
            <span class="label">总蛋白质</span>
            <span class="value">{{ weeklyNutrition.protein }}g</span>
          </div>
          <div class="nutrition-item">
            <span class="label">总碳水化合物</span>
            <span class="value">{{ weeklyNutrition.carbs }}g</span>
          </div>
          <div class="nutrition-item">
            <span class="label">总脂肪</span>
            <span class="value">{{ weeklyNutrition.fat }}g</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 身体数据 -->
    <div v-if="activeTab === 'body'" class="stats-content">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">记录身体数据</h3>
          <button class="btn btn-primary" @click="showBodyStatsModal = true">添加记录</button>
        </div>

        <div v-if="bodyStatsStore.bodyStats.length === 0" class="empty-state">
          <p>暂无身体数据记录</p>
        </div>

        <div v-else class="body-stats-list">
          <table class="table">
            <thead>
              <tr>
                <th>日期</th>
                <th>体重(kg)</th>
                <th>体脂率(%)</th>
                <th>胸围(cm)</th>
                <th>腰围(cm)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stats in [...bodyStatsStore.bodyStats].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )" :key="stats.id">
                <td>{{ stats.date }}</td>
                <td>{{ stats.weight }}</td>
                <td>{{ stats.bodyFat || '--' }}</td>
                <td>{{ stats.chest || '--' }}</td>
                <td>{{ stats.waist || '--' }}</td>
                <td>
                  <button class="btn btn-danger" @click="deleteBodyStats(stats.id)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="weightHistory.length > 1" class="card">
        <h3 class="card-title">体重变化趋势</h3>
        <div class="weight-chart">
          <div class="chart-container">
            <div
              v-for="(stats, index) in weightHistory"
              :key="stats.id"
              class="chart-bar"
              :style="{
                height: ((stats.weight - (Math.min(...weightHistory.map(s => s.weight)) - 2)) /
                  (Math.max(...weightHistory.map(s => s.weight)) - Math.min(...weightHistory.map(s => s.weight)) + 4)) * 100 + '%'
              }"
            >
              <span class="chart-value">{{ stats.weight }}</span>
            </div>
          </div>
          <div class="chart-labels">
            <span v-for="stats in weightHistory" :key="stats.id" class="chart-label">
              {{ format(new Date(stats.date), 'MM/dd') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加身体数据弹窗 -->
    <div v-if="showBodyStatsModal" class="modal-overlay" @click.self="showBodyStatsModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>添加身体数据</h3>
          <button class="modal-close" @click="showBodyStatsModal = false">&times;</button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>体重 (kg) *</label>
            <input type="number" v-model.number="bodyStatsForm.weight" step="0.1" />
          </div>
          <div class="form-group">
            <label>体脂率 (%)</label>
            <input type="number" v-model.number="bodyStatsForm.bodyFat" step="0.1" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>胸围 (cm)</label>
            <input type="number" v-model.number="bodyStatsForm.chest" step="0.1" />
          </div>
          <div class="form-group">
            <label>腰围 (cm)</label>
            <input type="number" v-model.number="bodyStatsForm.waist" step="0.1" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>臀围 (cm)</label>
            <input type="number" v-model.number="bodyStatsForm.hip" step="0.1" />
          </div>
          <div class="form-group">
            <label>臂围 (cm)</label>
            <input type="number" v-model.number="bodyStatsForm.arm" step="0.1" />
          </div>
        </div>

        <div class="form-group">
          <label>大腿围 (cm)</label>
          <input type="number" v-model.number="bodyStatsForm.thigh" step="0.1" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showBodyStatsModal = false">取消</button>
          <button class="btn btn-primary" @click="addBodyStats">保存</button>
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

.stats-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.week-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.calendar-day {
  text-align: center;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.day-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.day-date {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.day-indicator {
  width: 24px;
  height: 24px;
  margin: 0 auto;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.day-indicator.hasWorkout {
  background: rgba(102, 126, 234, 0.3);
  color: white;
}

.day-indicator.completed {
  background: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.muscle-chart {
  margin-top: 16px;
}

.muscle-bar {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.muscle-label {
  font-size: 14px;
}

.muscle-progress {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.muscle-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.muscle-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
}

.nutrition-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.nutrition-item .label {
  color: rgba(255, 255, 255, 0.7);
}

.nutrition-item .value {
  font-weight: 600;
}

.body-stats-list {
  margin-top: 16px;
  overflow-x: auto;
}

.weight-chart {
  margin-top: 16px;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
  padding: 0 10px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  min-height: 20px;
  position: relative;
  transition: height 0.3s ease;
}

.chart-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.chart-labels {
  display: flex;
  gap: 4px;
  padding: 8px 10px 0;
  margin-top: 4px;
}

.chart-label {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
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
