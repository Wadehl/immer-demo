import { shallowRef, computed, type Ref } from "vue";

export interface ManualHistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export interface UseManualHistoryResult<T> {
  state: Ref<T>
  update: (updater: (current: T) => T) => void
  undo: () => boolean
  redo: () => boolean
  reset: () => void
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  history: Ref<ManualHistoryState<T>>
  getOperations: () => string[]
}

// 深拷贝函数
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T
  }
  
  if (typeof obj === "object") {
    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

export const useManualHistory = <T>(
  baseState: T,
  options?: {
    maxHistorySize?: number // -1 表示无限制
  }
) => {
  const { maxHistorySize = 50 } = options || {}
  
  // 使用shallowRef避免类型解包问题
  const history = shallowRef<ManualHistoryState<T>>({
    past: [],
    present: deepClone(baseState), // 深拷贝初始状态
    future: []
  })
  
  // 操作记录（用于展示）
  const operations = shallowRef<string[]>([])
  
  // 当前状态
  const state = computed(() => history.value.present)
  
  // 计算属性
  const canUndo = computed(() => history.value.past.length > 0)
  const canRedo = computed(() => history.value.future.length > 0)
  
  // 手动更新函数
  const update = (updater: (current: T) => T) => {
    const currentState = history.value.present
    const newState = updater(deepClone(currentState)) // 基于深拷贝进行更新
    
    // 检查状态是否真的发生了变化
    if (JSON.stringify(newState) === JSON.stringify(currentState)) {
      return // 没有变化，不记录历史
    }
    
    // 手动入栈操作
    let newPast: T[]
    if (maxHistorySize === -1) {
      // 无限制模式：直接追加
      newPast = [...history.value.past, deepClone(currentState)]
    } else {
      // 有限制模式：限制历史大小
      newPast = [
        ...history.value.past.slice(-(maxHistorySize - 1)),
        deepClone(currentState)
      ]
    }
    
    // 记录操作
    const operation = `Update: ${JSON.stringify(newState)}`
    let newOperations: string[]
    if (maxHistorySize === -1) {
      newOperations = [...operations.value, operation]
    } else {
      newOperations = [
        ...operations.value.slice(-(maxHistorySize - 1)),
        operation
      ]
    }
    operations.value = newOperations
    
    // 更新历史状态
    history.value = {
      past: newPast,
      present: deepClone(newState), // 深拷贝新状态
      future: [] // 新操作清空future栈
    }
  }
  
  // 手动撤销操作（出栈）
  const undo = (): boolean => {
    if (!canUndo.value) {
      return false
    }
    
    // 从past栈中弹出最后一个状态
    const newPast = [...history.value.past]
    const previousState = newPast.pop()! // 出栈操作
    
    // 将当前状态推入future栈
    const newFuture = [deepClone(history.value.present), ...history.value.future]
    
    // 更新历史状态
    history.value = {
      past: newPast,
      present: deepClone(previousState), // 恢复到前一个状态
      future: newFuture
    }
    
    // 记录撤销操作
    operations.value = [
      ...operations.value,
      `Undo: restored to ${JSON.stringify(previousState)}`
    ]
    
    return true
  }
  
  // 手动重做操作
  const redo = (): boolean => {
    if (!canRedo.value) {
      return false
    }
    
    // 从future栈中取出第一个状态
    const newFuture = [...history.value.future]
    const nextState = newFuture.shift()! // 从future栈顶取出
    
    // 将当前状态推入past栈
    const newPast = [...history.value.past, deepClone(history.value.present)]
    
    // 更新历史状态
    history.value = {
      past: newPast,
      present: deepClone(nextState),
      future: newFuture
    }
    
    // 记录重做操作
    operations.value = [
      ...operations.value,
      `Redo: restored to ${JSON.stringify(nextState)}`
    ]
    
    return true
  }
  
  // 重置到初始状态
  const reset = () => {
    history.value = {
      past: [],
      present: deepClone(baseState),
      future: []
    }
    
    operations.value = [`Reset: back to ${JSON.stringify(baseState)}`]
  }
  
  // 获取操作历史
  const getOperations = () => operations.value
  
  return {
    state,
    update,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    history: computed(() => history.value),
    getOperations
  } as UseManualHistoryResult<T>
} 