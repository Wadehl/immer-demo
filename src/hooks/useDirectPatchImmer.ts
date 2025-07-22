import { shallowReactive, computed, type Ref } from "vue";
import { produce, produceWithPatches, applyPatches, type Patch } from "immer";

/**
 * 这个版本展示了inversePatches的真正用途：
 * 当你需要直接修改当前状态而不是重新计算时，inversePatches很有用
 * 同时展示了shallowReactive相比shallowRef的优势
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
 
  // 直接状态修改版本 - 使用shallowReactive
  // 🔄 shallowReactive最佳实践：直接修改属性，避免深度响应式开销
  const patchHistory = shallowReactive<DirectPatchHistoryState<T>>({
    currentState: baseState,
    patches: [],
    inversePatches: [],
    currentIndex: -1
  })
  
  // 备选方案对比：
  // 方案二 - 使用 shallowRef：
  // const patchHistory = shallowRef<DirectPatchHistoryState<T>>({
  //   currentState: baseState,
  //   patches: [],
  //   inversePatches: [],
  //   currentIndex: -1
  // })
  // 
  // 方案三 - 使用 ref（不推荐，性能开销大）：
  // const patchHistory = ref<DirectPatchHistoryState<T>>({
  //   currentState: baseState,
  //   patches: [],
  //   inversePatches: [],
  //   currentIndex: -1
  // })
 
  // 直接返回当前状态，无需重新计算
  const state = computed(() => patchHistory.currentState)
 
  // 计算属性
  const canUndoPatch = computed(() => patchHistory.currentIndex >= 0)
  const canRedoPatch = computed(() => 
    patchHistory.currentIndex < patchHistory.patches.length - 1
  )
 
  // 更新函数 - shallowReactive支持直接属性修改
  const update = (updater: (draft: T) => void) => {
    const [nextState, patches, inversePatches] = produceWithPatches(
      patchHistory.currentState,
      updater
    )
 
    if (patches.length > 0) {
      // 如果当前不在最新位置，删除后面的历史
      const newPatches = patchHistory.patches.slice(0, patchHistory.currentIndex + 1)
      const newInversePatches = patchHistory.inversePatches.slice(0, patchHistory.currentIndex + 1)
      
      if (maxHistorySize === -1) {
        // 无限制模式：直接修改属性 - shallowReactive优势
        patchHistory.currentState = nextState
        patchHistory.patches = [...newPatches, patches]
        patchHistory.inversePatches = [...newInversePatches, inversePatches]
        patchHistory.currentIndex = newPatches.length
        
        // 备选方案对比：
        // 方案二 - shallowRef 方式：
        // patchHistory.value = {
        //   currentState: nextState,
        //   patches: [...newPatches, patches],
        //   inversePatches: [...newInversePatches, inversePatches],
        //   currentIndex: newPatches.length
        // }
        //
        // 方案三 - ref 方式（性能开销最大）：
        // patchHistory.value = {
        //   currentState: nextState,
        //   patches: [...newPatches, patches],
        //   inversePatches: [...newInversePatches, inversePatches],
        //   currentIndex: newPatches.length
        // }
      } else {
        // 有限制模式：使用slice操作限制大小
        patchHistory.currentState = nextState
        patchHistory.patches = [
          ...newPatches.slice(-(maxHistorySize - 1)),
          patches
        ]
        patchHistory.inversePatches = [
          ...newInversePatches.slice(-(maxHistorySize - 1)),
          inversePatches
        ]
        patchHistory.currentIndex = Math.min(newPatches.length, maxHistorySize - 1)
        
        // 备选方案对比：
        // 方案二 - shallowRef 方式：
        // patchHistory.value = {
        //   currentState: nextState,
        //   patches: [...newPatches.slice(-(maxHistorySize - 1)), patches],
        //   inversePatches: [...newInversePatches.slice(-(maxHistorySize - 1)), inversePatches],
        //   currentIndex: Math.min(newPatches.length, maxHistorySize - 1)
        // }
      }
    }
  }
 
  // 基于inversePatches的直接Undo
  const undoPatch = (): boolean => {
    if (!canUndoPatch.value) return false
    
    // 🎯 关键：使用inversePatches直接回退状态，无需重新计算
    const currentInversePatches = patchHistory.inversePatches[patchHistory.currentIndex]
    const newState = applyPatches(patchHistory.currentState as any, currentInversePatches) as T
    
    // shallowReactive: 直接修改属性
    patchHistory.currentState = newState
    patchHistory.currentIndex = patchHistory.currentIndex - 1
    
    // 备选方案对比：
    // 方案二 - shallowRef 方式：
    // patchHistory.value = {
    //   ...patchHistory.value,
    //   currentState: newState,
    //   currentIndex: patchHistory.value.currentIndex - 1
    // }
    
    return true
  }
 
  // 基于patches的直接Redo
  const redoPatch = (): boolean => {
    if (!canRedoPatch.value) return false
    
    // 🎯 关键：使用patches直接前进状态，无需重新计算
    const nextPatches = patchHistory.patches[patchHistory.currentIndex + 1]
    const newState = applyPatches(patchHistory.currentState as any, nextPatches) as T
    
    // shallowReactive: 直接修改属性
    patchHistory.currentState = newState
    patchHistory.currentIndex = patchHistory.currentIndex + 1
    
    // 备选方案对比：
    // 方案二 - shallowRef 方式：
    // patchHistory.value = {
    //   ...patchHistory.value,
    //   currentState: newState,
    //   currentIndex: patchHistory.value.currentIndex + 1
    // }
    
    return true
  }
 
  // 重置
  const resetPatch = () => {
    // shallowReactive: 支持Object.assign批量更新
    Object.assign(patchHistory, {
      currentState: baseState,
      patches: [],
      inversePatches: [],
      currentIndex: -1
    })
    
    // 备选方案对比：
    // 方案二 - shallowRef 方式：
    // patchHistory.value = {
    //   currentState: baseState,
    //   patches: [],
    //   inversePatches: [],
    //   currentIndex: -1
    // }
  }
 
  return {
    state,
    update,
    undoPatch,
    redoPatch,
    resetPatch,
    canUndoPatch,
    canRedoPatch,
    patchHistory: computed(() => patchHistory)
  } as UseDirectPatchImmerResult<T>
}