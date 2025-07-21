import { shallowRef, computed, type Ref } from "vue";
import { produce, produceWithPatches, applyPatches, type Patch } from "immer";

/**
 * 这个版本展示了inversePatches的真正用途：
 * 当你需要直接修改当前状态而不是重新计算时，inversePatches很有用
 */

export interface DirectPatchHistoryState<T> {
  currentState: T // 直接存储当前状态
  patches: Patch[][]
  inversePatches: Patch[][]
  currentIndex: number
}

export interface UseDirectPatchImmerResult<T> {
  state: Ref<T>
  update: (updater: (draft: T) => void) => void
  undoPatch: () => boolean
  redoPatch: () => boolean
  resetPatch: () => void
  canUndoPatch: Ref<boolean>
  canRedoPatch: Ref<boolean>
  patchHistory: Ref<DirectPatchHistoryState<T>>
}

export const useDirectPatchImmer = <T>(
  baseState: T,
  options?: {
    maxHistorySize?: number // -1 表示无限制，不使用slice操作
  }
) => {
  const { maxHistorySize = 50 } = options || {}
 
  // 直接状态修改版本 - 这里inversePatches很有用！
  const patchHistory = shallowRef<DirectPatchHistoryState<T>>({
    currentState: baseState,
    patches: [],
    inversePatches: [],
    currentIndex: -1
  })
 
  // 直接返回当前状态，无需重新计算
  const state = computed(() => patchHistory.value.currentState)
 
  // 计算属性
  const canUndoPatch = computed(() => patchHistory.value.currentIndex >= 0)
  const canRedoPatch = computed(() => 
    patchHistory.value.currentIndex < patchHistory.value.patches.length - 1
  )
 
  // 更新函数
  const update = (updater: (draft: T) => void) => {
    const [nextState, patches, inversePatches] = produceWithPatches(
      patchHistory.value.currentState,
      updater
    )
 
    if (patches.length > 0) {
      // 如果当前不在最新位置，删除后面的历史
      const newPatches = patchHistory.value.patches.slice(0, patchHistory.value.currentIndex + 1)
      const newInversePatches = patchHistory.value.inversePatches.slice(0, patchHistory.value.currentIndex + 1)
      
      if (maxHistorySize === -1) {
        // 无限制模式：直接追加，不使用slice操作
        patchHistory.value = {
          currentState: nextState,
          patches: [...newPatches, patches],
          inversePatches: [...newInversePatches, inversePatches],
          currentIndex: newPatches.length
        }
      } else {
        // 有限制模式：使用slice操作限制大小
        patchHistory.value = {
          currentState: nextState,
          patches: [
            ...newPatches.slice(-(maxHistorySize - 1)),
            patches
          ],
          inversePatches: [
            ...newInversePatches.slice(-(maxHistorySize - 1)),
            inversePatches
          ],
          currentIndex: Math.min(newPatches.length, maxHistorySize - 1)
        }
      }
    }
  }
 
  // 基于inversePatches的直接Undo！
  const undoPatch = (): boolean => {
    if (!canUndoPatch.value) return false
    
    // 🎯 关键：使用inversePatches直接回退状态，无需重新计算
    const currentInversePatches = patchHistory.value.inversePatches[patchHistory.value.currentIndex]
    const newState = applyPatches(patchHistory.value.currentState as any, currentInversePatches) as T
    
    patchHistory.value = {
      ...patchHistory.value,
      currentState: newState, // 直接设置新状态
      currentIndex: patchHistory.value.currentIndex - 1
    }
    
    return true
  }
 
  // 基于patches的直接Redo！
  const redoPatch = (): boolean => {
    if (!canRedoPatch.value) return false
    
    // 🎯 关键：使用patches直接前进状态，无需重新计算
    const nextPatches = patchHistory.value.patches[patchHistory.value.currentIndex + 1]
    const newState = applyPatches(patchHistory.value.currentState as any, nextPatches) as T
    
    patchHistory.value = {
      ...patchHistory.value,
      currentState: newState, // 直接设置新状态
      currentIndex: patchHistory.value.currentIndex + 1
    }
    
    return true
  }
 
  // 重置
  const resetPatch = () => {
    patchHistory.value = {
      currentState: baseState,
      patches: [],
      inversePatches: [],
      currentIndex: -1
    }
  }
 
  return {
    state,
    update,
    undoPatch,
    redoPatch,
    resetPatch,
    canUndoPatch,
    canRedoPatch,
    patchHistory: computed(() => patchHistory.value)
  } as UseDirectPatchImmerResult<T>
} 