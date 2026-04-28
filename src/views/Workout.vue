<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkoutStore } from '../stores'
import { useBodyStatsStore } from '../stores'
import type { Workout, Exercise, ExerciseSet } from '../types'
import { MUSCLE_GROUPS } from '../types'
import { format } from 'date-fns'

const workoutStore = useWorkoutStore()
const bodyStatsStore = useBodyStatsStore()

const showModal = ref(false)
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'))
const editingWorkout = ref<Workout | null>(null)

const workoutForm = ref({
  name: '',
  notes: '',
  exercises: [] as Exercise[]
})

const newExercise = ref({
  name: '',
  muscleGroup: MUSCLE_GROUPS[0],
  sets: [] as ExerciseSet[]
})

const newSet = ref({
  reps: 10,
  weight: 0
})

const filterDate = ref(format(new Date(), 'yyyy-MM-dd'))
const showDatePicker = ref(false)

const filteredWorkouts = computed(() => {
  return workoutStore.workouts
    .filter(w => w.date === filterDate.value)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

function openAddModal() {
  editingWorkout.value = null
  workoutForm.value = {
    name: '',
    notes: '',
    exercises: []
  }
  selectedDate.value = format(new Date(), 'yyyy-MM-dd')
  showModal.value = true
}

function openEditModal(workout: Workout) {
  editingWorkout.value = workout
  workoutForm.value = {
    name: workout.name,
    notes: workout.notes || '',
    exercises: [...workout.exercises]
  }
  selectedDate.value = workout.date
  showModal.value = true
}

function addExerciseToWorkout() {
  if (!newExercise.value.name) return

  const exercise: Exercise = {
    id: Date.now().toString(),
    name: newExercise.value.name,
    muscleGroup: newExercise.value.muscleGroup,
    sets: [...newExercise.value.sets]
  }

  workoutForm.value.exercises.push(exercise)

  newExercise.value = {
    name: '',
    muscleGroup: MUSCLE_GROUPS[0],
    sets: []
  }
  newSet.value = { reps: 10, weight: 0 }
}

function addSetToExercise() {
  newExercise.value.sets.push({
    ...newSet.value,
    completed: false
  })
  newSet.value = { reps: 10, weight: 0 }
}

function removeSetFromExercise(index: number) {
  newExercise.value.sets.splice(index, 1)
}

function removeExerciseFromWorkout(index: number) {
  workoutForm.value.exercises.splice(index, 1)
}

function saveWorkout() {
  if (!workoutForm.value.name || workoutForm.value.exercises.length === 0) return

  const workoutData = {
    date: selectedDate.value,
    name: workoutForm.value.name,
    notes: workoutForm.value.notes,
    exercises: workoutForm.value.exercises,
    completed: false
  }

  if (editingWorkout.value) {
    workoutStore.updateWorkout(editingWorkout.value.id, workoutData)
  } else {
    workoutStore.addWorkout(workoutData)
  }

  showModal.value = false
}

function toggleComplete(workout: Workout) {
  workoutStore.updateWorkout(workout.id, { completed: !workout.completed })
}

function deleteWorkout(id: string) {
  if (confirm('确定要删除这个训练记录吗？')) {
    workoutStore.deleteWorkout(id)
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
  <div class="workout-page">
    <div class="page-header">
      <h2 class="page-title">训练计划</h2>
      <button class="btn btn-primary" @click="openAddModal">添加训练</button>
    </div>

    <div class="date-navigator">
      <button class="btn btn-secondary" @click="previousDay">前一天</button>
      <input type="date" v-model="filterDate" class="date-input" />
      <button class="btn btn-secondary" @click="nextDay">后一天</button>
    </div>

    <div v-if="filteredWorkouts.length === 0" class="card empty-state">
      <p>该日期暂无训练记录</p>
    </div>

    <div v-else class="workout-list">
      <div v-for="workout in filteredWorkouts" :key="workout.id" class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">{{ workout.name }}</h3>
            <span class="badge" :class="workout.completed ? 'badge-success' : 'badge-warning'">
              {{ workout.completed ? '已完成' : '进行中' }}
            </span>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary" @click="toggleComplete(workout)">
              {{ workout.completed ? '取消完成' : '标记完成' }}
            </button>
            <button class="btn btn-secondary" @click="openEditModal(workout)">编辑</button>
            <button class="btn btn-danger" @click="deleteWorkout(workout.id)">删除</button>
          </div>
        </div>

        <div class="exercises-list">
          <div v-for="exercise in workout.exercises" :key="exercise.id" class="exercise-item">
            <div class="exercise-header">
              <h4>{{ exercise.name }}</h4>
              <span class="badge badge-info">{{ exercise.muscleGroup }}</span>
            </div>
            <table class="sets-table">
              <thead>
                <tr>
                  <th>组数</th>
                  <th>次数</th>
                  <th>重量(kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(set, index) in exercise.sets" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ set.reps }}</td>
                  <td>{{ set.weight }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p v-if="workout.notes" class="workout-notes">
          <strong>备注：</strong>{{ workout.notes }}
        </p>
      </div>
    </div>

    <!-- 添加/编辑训练弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingWorkout ? '编辑训练' : '添加训练' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>

        <div class="form-group">
          <label>日期</label>
          <input type="date" v-model="selectedDate" />
        </div>

        <div class="form-group">
          <label>训练名称</label>
          <input v-model="workoutForm.name" placeholder="例如：胸部训练日" />
        </div>

        <div class="form-group">
          <label>备注</label>
          <textarea v-model="workoutForm.notes" rows="2" placeholder="可选"></textarea>
        </div>

        <hr class="divider" />

        <h4>添加动作</h4>
        <div class="add-exercise-form">
          <div class="form-row">
            <div class="form-group">
              <label>动作名称</label>
              <input v-model="newExercise.name" placeholder="例如：卧推" />
            </div>
            <div class="form-group">
              <label>肌肉群</label>
              <select v-model="newExercise.muscleGroup">
                <option v-for="group in MUSCLE_GROUPS" :key="group" :value="group">
                  {{ group }}
                </option>
              </select>
            </div>
          </div>

          <div class="sets-section">
            <h5>组数设置</h5>
            <div class="form-row">
              <div class="form-group">
                <label>次数</label>
                <input type="number" v-model.number="newSet.reps" min="1" />
              </div>
              <div class="form-group">
                <label>重量(kg)</label>
                <input type="number" v-model.number="newSet.weight" min="0" step="0.5" />
              </div>
              <button type="button" class="btn btn-secondary add-set-btn" @click="addSetToExercise">
                添加组
              </button>
            </div>

            <div v-if="newExercise.sets.length > 0" class="preview-sets">
              <div v-for="(set, index) in newExercise.sets" :key="index" class="preview-set">
                <span>第{{ index + 1 }}组: {{ set.reps }}次 × {{ set.weight }}kg</span>
                <button class="btn-remove" @click="removeSetFromExercise(index)">×</button>
              </div>
            </div>
          </div>

          <button type="button" class="btn btn-secondary" @click="addExerciseToWorkout">
            添加到训练
          </button>
        </div>

        <div v-if="workoutForm.exercises.length > 0" class="exercise-preview">
          <h4>已添加的动作</h4>
          <div v-for="(exercise, index) in workoutForm.exercises" :key="exercise.id" class="preview-exercise">
            <div class="preview-exercise-header">
              <span>{{ exercise.name }} ({{ exercise.muscleGroup }})</span>
              <button class="btn-remove" @click="removeExerciseFromWorkout(index)">×</button>
            </div>
            <span class="preview-sets-count">{{ exercise.sets.length }}组</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveWorkout">保存</button>
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

.card-actions {
  display: flex;
  gap: 8px;
}

.exercises-list {
  margin-top: 16px;
}

.exercise-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.exercise-item:last-child {
  margin-bottom: 0;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.exercise-header h4 {
  font-size: 1rem;
  font-weight: 600;
}

.sets-table {
  width: 100%;
  font-size: 14px;
}

.sets-table th, .sets-table td {
  padding: 8px;
  text-align: center;
}

.workout-notes {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 20px 0;
}

.add-exercise-form {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.add-exercise-form h4, .add-exercise-form h5 {
  margin-bottom: 12px;
  font-size: 1rem;
}

.add-set-btn {
  align-self: flex-end;
  height: fit-content;
}

.sets-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-sets {
  margin-top: 12px;
}

.preview-set {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 14px;
}

.btn-remove {
  background: none;
  border: none;
  color: #f5576c;
  font-size: 18px;
  cursor: pointer;
  padding: 0 8px;
}

.exercise-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.exercise-preview h4 {
  margin-bottom: 12px;
}

.preview-exercise {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.preview-exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.preview-sets-count {
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
</style>
