export interface Workout {
  id: string
  date: string
  name: string
  exercises: Exercise[]
  notes?: string
  completed: boolean
}

export interface Exercise {
  id: string
  name: string
  sets: ExerciseSet[]
  muscleGroup: string
}

export interface ExerciseSet {
  reps: number
  weight: number
  completed: boolean
}

export interface Meal {
  id: string
  date: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
}

export interface BodyStats {
  id: string
  date: string
  weight: number
  bodyFat?: number
  chest?: number
  waist?: number
  hip?: number
  arm?: number
  thigh?: number
}

export interface Goal {
  id: string
  type: 'weight' | 'bodyFat' | 'workoutDays' | 'calories'
  target: number
  current: number
  deadline: string
  createdAt: string
}

export interface UserProfile {
  name: string
  age: number
  gender: 'male' | 'female'
  height: number
  createdAt: string
}

export const MUSCLE_GROUPS = [
  '胸部',
  '背部',
  '肩部',
  '手臂',
  '腿部',
  '核心',
  '全身',
  '有氧'
]

export const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' }
]
