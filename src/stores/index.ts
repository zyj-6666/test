import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Workout, Meal, BodyStats, Goal, UserProfile } from '../types'

const STORAGE_KEYS = {
  workouts: 'fitness_workouts',
  meals: 'fitness_meals',
  bodyStats: 'fitness_bodyStats',
  goals: 'fitness_goals',
  profile: 'fitness_profile'
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useWorkoutStore = defineStore('workout', () => {
  const workouts = ref<Workout[]>(loadFromStorage(STORAGE_KEYS.workouts, []))

  const todayWorkouts = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return workouts.value.filter(w => w.date === today)
  })

  const workoutsByMonth = computed(() => {
    const grouped: Record<string, Workout[]> = {}
    workouts.value.forEach(w => {
      const month = w.date.substring(0, 7)
      if (!grouped[month]) grouped[month] = []
      grouped[month].push(w)
    })
    return grouped
  })

  function addWorkout(workout: Omit<Workout, 'id'>) {
    const newWorkout = { ...workout, id: generateId() }
    workouts.value.push(newWorkout)
    saveToStorage(STORAGE_KEYS.workouts, workouts.value)
  }

  function updateWorkout(id: string, updates: Partial<Workout>) {
    const index = workouts.value.findIndex(w => w.id === id)
    if (index !== -1) {
      workouts.value[index] = { ...workouts.value[index], ...updates }
      saveToStorage(STORAGE_KEYS.workouts, workouts.value)
    }
  }

  function deleteWorkout(id: string) {
    workouts.value = workouts.value.filter(w => w.id !== id)
    saveToStorage(STORAGE_KEYS.workouts, workouts.value)
  }

  return { workouts, todayWorkouts, workoutsByMonth, addWorkout, updateWorkout, deleteWorkout }
})

export const useMealStore = defineStore('meal', () => {
  const meals = ref<Meal[]>(loadFromStorage(STORAGE_KEYS.meals, []))

  const todayMeals = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return meals.value.filter(m => m.date === today)
  })

  const todayNutrition = computed(() => {
    return todayMeals.value.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  })

  function addMeal(meal: Omit<Meal, 'id'>) {
    const newMeal = { ...meal, id: generateId() }
    meals.value.push(newMeal)
    saveToStorage(STORAGE_KEYS.meals, meals.value)
  }

  function updateMeal(id: string, updates: Partial<Meal>) {
    const index = meals.value.findIndex(m => m.id === id)
    if (index !== -1) {
      meals.value[index] = { ...meals.value[index], ...updates }
      saveToStorage(STORAGE_KEYS.meals, meals.value)
    }
  }

  function deleteMeal(id: string) {
    meals.value = meals.value.filter(m => m.id !== id)
    saveToStorage(STORAGE_KEYS.meals, meals.value)
  }

  return { meals, todayMeals, todayNutrition, addMeal, updateMeal, deleteMeal }
})

export const useBodyStatsStore = defineStore('bodyStats', () => {
  const bodyStats = ref<BodyStats[]>(loadFromStorage(STORAGE_KEYS.bodyStats, []))

  const latestStats = computed(() => {
    const sorted = [...bodyStats.value].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return sorted[0] || null
  })

  function addBodyStats(stats: Omit<BodyStats, 'id'>) {
    const newStats = { ...stats, id: generateId() }
    bodyStats.value.push(newStats)
    saveToStorage(STORAGE_KEYS.bodyStats, bodyStats.value)
  }

  function deleteBodyStats(id: string) {
    bodyStats.value = bodyStats.value.filter(s => s.id !== id)
    saveToStorage(STORAGE_KEYS.bodyStats, bodyStats.value)
  }

  return { bodyStats, latestStats, addBodyStats, deleteBodyStats }
})

export const useGoalStore = defineStore('goal', () => {
  const goals = ref<Goal[]>(loadFromStorage(STORAGE_KEYS.goals, []))

  function addGoal(goal: Omit<Goal, 'id' | 'createdAt'>) {
    const newGoal = {
      ...goal,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    goals.value.push(newGoal)
    saveToStorage(STORAGE_KEYS.goals, goals.value)
  }

  function updateGoal(id: string, updates: Partial<Goal>) {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value[index] = { ...goals.value[index], ...updates }
      saveToStorage(STORAGE_KEYS.goals, goals.value)
    }
  }

  function deleteGoal(id: string) {
    goals.value = goals.value.filter(g => g.id !== id)
    saveToStorage(STORAGE_KEYS.goals, goals.value)
  }

  return { goals, addGoal, updateGoal, deleteGoal }
})

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(loadFromStorage(STORAGE_KEYS.profile, null))

  function updateProfile(updates: Partial<UserProfile>) {
    if (profile.value) {
      profile.value = { ...profile.value, ...updates }
    } else {
      profile.value = {
        name: updates.name || '用户',
        age: updates.age || 25,
        gender: updates.gender || 'male',
        height: updates.height || 170,
        createdAt: new Date().toISOString(),
        ...updates
      }
    }
    saveToStorage(STORAGE_KEYS.profile, profile.value)
  }

  return { profile, updateProfile }
})
