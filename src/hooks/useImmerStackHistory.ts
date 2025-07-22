import { ref, shallowRef, computed, type Ref } from "vue";
import { produce, enablePatches, produceWithPatches, type Patch } from "immer";

enablePatches()

export interface StackHistoryState<T> {
  past: T[]
  present: T
  future: T[]
  patches: Patch[][]         // 每次变更的 patches
  inversePatches: Patch[][]  // 每次变更的逆向 patches
}

export interface UseImmerStackResult<T> {
  state: Ref<T>
  update: (updater: (draft: T) => void) => void
  undo: () => boolean
  redo: () => boolean
  reset: () => void
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  history: Ref<StackHistoryState<T>>
}

export const useImmerStackHistory = <T>(
  baseState: T,
  options?: {
    maxHistorySize?: number
  }
) => {
  const { maxHistorySize = 50 } = options || {}
 
  // 历史状态管理 - 使用shallowRef
  // 说明：这里使用shallowRef因为需要完整替换整个历史对象
  // 与Immer结合时，通过produceWithPatches获得完整的新状态
  const history = shallowRef<StackHistoryState<T>>({
    past: [],
    present: baseState,
    future: [],
    patches: [],
    inversePatches: []
  })
 
  // 当前状态（computed 确保响应性）
  const state = computed(() => history.value.present)
 
  // 计算属性
  const canUndo = computed(() => history.value.past.length > 0)
  const canRedo = computed(() => history.value.future.length > 0)
 
  // 更新函数 - 带 patches 记录
  const update = (updater: (draft: T) => void) => {
    // 使用 produceWithPatches 生成 patches
    const [nextState, patches, inversePatches] = produceWithPatches(
      history.value.present,
      updater
    )

    // 只有真正发生变化才记录历史
    if (patches.length > 0) {
      history.value = {
        past: [
          ...history.value.past.slice(-(maxHistorySize - 1)),
          history.value.present
        ],
        present: nextState,
        future: [], // 新操作清空 future
        patches: [
          ...history.value.patches.slice(-(maxHistorySize - 1)),
          patches
        ],
        inversePatches: [
          ...history.value.inversePatches.slice(-(maxHistorySize - 1)),
          inversePatches
        ]
      }
    }
  }
 
  // Undo 操作
  const undo = (): boolean => {
    if (!canUndo.value) {
      return false
    }
 
    const previous = history.value.past[history.value.past.length - 1]
    const newPast = history.value.past.slice(0, -1)
    const newPatches = history.value.patches.slice(0, -1)
    const newInversePatches = history.value.inversePatches.slice(0, -1)
 
    history.value = {
      past: newPast,
      present: previous,
      future: [history.value.present, ...history.value.future],
      patches: newPatches,
      inversePatches: newInversePatches
    }
 
    return true
  }
 
  // Redo 操作
  const redo = (): boolean => {
    if (!canRedo.value) return false
 
    const next = history.value.future[0]
    const newFuture = history.value.future.slice(1)
 
    // 需要重新计算当前状态到下一个状态的patches
    const [nextState, patches, inversePatches] = produceWithPatches(
      history.value.present,
      (draft) => {
        // 将next状态的属性复制到draft中
        for (const key in next as object) {
          if (Object.prototype.hasOwnProperty.call(next, key)) {
            ;(draft as any)[key] = (next as any)[key]
          }
        }
      }
    )
 
    history.value = {
      past: [...history.value.past, history.value.present],
      present: next,
      future: newFuture,
      patches: [...history.value.patches, patches],
      inversePatches: [...history.value.inversePatches, inversePatches]
    }
 
    return true
  }
 
  // 重置到初始状态
  const reset = () => {
    history.value = {
      past: [],
      present: baseState,
      future: [],
      patches: [],
      inversePatches: []
    }
  }
 
  return {
    state,
    update,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    history: computed(() => history.value)
  } as UseImmerStackResult<T>
} 