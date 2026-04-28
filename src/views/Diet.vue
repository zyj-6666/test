<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMealStore } from '../stores'
import type { Meal } from '../types'
import { MEAL_TYPES } from '../types'
import { format } from 'date-fns'

const mealStore = useMealStore()

const showModal = ref(false)
const editingMeal = ref<Meal | null>(null)
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'))

const mealForm = ref({
  type: 'breakfast' as Meal['type'],
  name: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  time: format(new Date(), 'HH:mm')
})

const filterDate = ref(format(new Date(), 'yyyy-MM-dd'))

const filteredMeals = computed(() => {
  return mealStore.meals
    .filter(m => m.date === filterDate.value)
    .sort((a, b) => a.time.localeCompare(b.time))
})

const dailyNutrition = computed(() => {
  return filteredMeals.value.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
})

const mealsByType = computed(() => {
  const grouped: Record<string, Meal[]> = {}
  MEAL_TYPES.forEach(t => grouped[t.value] = [])
  filteredMeals.value.forEach(meal => {
    if (grouped[meal.type]) {
      grouped[meal.type].push(meal)
    }
  })
  return grouped
})

const mealTypeLabel = (type: string) => {
  return MEAL_TYPES.find(t => t.value === type)?.label || type
}

function openAddModal() {
  editingMeal.value = null
  mealForm.value = {
    type: 'breakfast',
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    time: format(new Date(), 'HH:mm')
  }
  selectedDate.value = filterDate.value
  showModal.value = true
}

function openEditModal(meal: Meal) {
  editingMeal.value = meal
  mealForm.value = {
    type: meal.type,
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    time: meal.time
  }
  selectedDate.value = meal.date
  showModal.value = true
}

function saveMeal() {
  if (!mealForm.value.name) return

  const mealData = {
    date: selectedDate.value,
    type: mealForm.value.type,
    name: mealForm.value.name,
    calories: mealForm.value.calories,
    protein: mealForm.value.protein,
    carbs: mealForm.value.carbs,
    fat: mealForm.value.fat,
    time: mealForm.value.time
  }

  if (editingMeal.value) {
    mealStore.updateMeal(editingMeal.value.id, mealData)
  } else {
    mealStore.addMeal(mealData)
  }

  showModal.value = false
}

function deleteMeal(id: string) {
  if (confirm('确定要删除这条饮食记录吗？')) {
    mealStore.deleteMeal(id)
  }
}

function previousDay() {
  const date = new Date(filterDate.value)
  date.setDate(date.getDate() - 1)
  filterDate.value = format(date, 'yyyy-MM-dd')
}

function nextDay() {
  const date = new Date(filterDate.value)
  date.setDate(date.getDate() + 1)
  filterDate.value = format(date, 'yyyy-MM-dd')
}
</script>

<template>
  <div class="diet-page">
    <div class="page-header">
      <h2 class="page-title">饮食记录</h2>
      <button class="btn btn-primary" @click="openAddModal">添加饮食</button>
    </div>

    <div class="date-navigator">
      <button class="btn btn-secondary" @click="previousDay">前一天</button>
      <input type="date" v-model="filterDate" class="date-input" />
      <button class="btn btn-secondary" @click="nextDay">后一天</button>
    </div>

    <div class="nutrition-summary card">
      <h3 class="card-title">今日营养摄入</h3>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ dailyNutrition.calories }}</div>
          <div class="stat-label">热量 (kcal)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dailyNutrition.protein }}g</div>
          <div class="stat-label">蛋白质</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dailyNutrition.carbs }}g</div>
          <div class="stat-label">碳水化合物</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dailyNutrition.fat }}g</div>
          <div class="stat-label">脂肪</div>
        </div>
      </div>
    </div>

    <div v-if="filteredMeals.length === 0" class="card empty-state">
      <p>该日期暂无饮食记录</p>
    </div>

    <div v-else class="meals-by-type">
      <div v-for="mealType in MEAL_TYPES" :key="mealType.value" class="card">
        <div class="card-header">
          <h3 class="card-title">{{ mealType.label }}</h3>
          <span class="badge badge-info">{{ mealsByType[mealType.value].length }} 条记录</span>
        </div>

        <div v-if="mealsByType[mealType.value].length === 0" class="empty-state-small">
          <p>暂无记录</p>
        </div>

        <div v-else class="meal-list">
          <div v-for="meal in mealsByType[mealType.value]" :key="meal.id" class="meal-item">
            <div class="meal-info">
              <div class="meal-header">
                <h4>{{ meal.name }}</h4>
                <span class="meal-time">{{ meal.time }}</span>
              </div>
              <div class="meal-nutrition">
                <span>{{ meal.calories }} kcal</span>
                <span>蛋白质 {{ meal.protein }}g</span>
                <span>碳水 {{ meal.carbs }}g</span>
                <span>脂肪 {{ meal.fat }}g</span>
              </div>
            </div>
            <div class="meal-actions">
              <button class="btn btn-secondary" @click="openEditModal(meal)">编辑</button>
              <button class="btn btn-danger" @click="deleteMeal(meal.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑饮食弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingMeal ? '编辑饮食' : '添加饮食' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>

        <div class="form-group">
          <label>日期</label>
          <input type="date" v-model="selectedDate" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>餐次</label>
            <select v-model="mealForm.type">
              <option v-for="type in MEAL_TYPES" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>时间</label>
            <input type="time" v-model="mealForm.time" />
          </div>
        </div>

        <div class="form-group">
          <label>食物名称</label>
          <input v-model="mealForm.name" placeholder="例如：鸡胸肉沙拉" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>热量 (kcal)</label>
            <input type="number" v-model.number="mealForm.calories" min="0" />
          </div>
          <div class="form-group">
            <label>蛋白质 (g)</label>
            <input type="number" v-model.number="mealForm.protein" min="0" step="0.1" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>碳水化合物 (g)</label>
            <input type="number" v-model.number="mealForm.carbs" min="0" step="0.1" />
          </div>
          <div class="form-group">
            <label>脂肪 (g)</label>
            <input type="number" v-model.number="mealForm.fat" min="0" step="0.1" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveMeal">保存</button>
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

.date-navigator {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.date-input {
  width: 200px;
}

.nutrition-summary {
  margin-bottom: 24px;
}

.nutrition-summary .card-title {
  margin-bottom: 16px;
}

.meals-by-type {
  display: grid;
  gap: 16px;
}

.empty-state-small {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.meal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
}

.meal-item:last-child {
  margin-bottom: 0;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.meal-header h4 {
  font-size: 1rem;
  font-weight: 600;
}

.meal-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.meal-nutrition {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.meal-actions {
  display: flex;
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
