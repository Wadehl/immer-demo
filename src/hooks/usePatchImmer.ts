import { shallowReactive, computed, type Ref } from "vue";
import { produce, produceWithPatches, applyPatches, type Patch } from "immer";

export interface PatchHistoryState<T> {
  baseState: T
  patches: Patch[][]
  currentIndex: number
}

export interface UsePatchImmerResult<T> {
  state: Ref<T>
  update: (updater: (draft: T) => void) => void
  undoPatch: () => boolean
  redoPatch: () => boolean
  resetPatch: () => void
  canUndoPatch: Ref<boolean>
  canRedoPatch: Ref<boolean>
  patchHistory: Ref<PatchHistoryState<T>>
}

export const usePatchImmer = <T>(
  baseState: T,
  options?: {
    maxHistorySize?: number // -1 表示无限制
  }
) => {
  const { maxHistorySize = 50 } = options || {}
 
  // 基于Patch的历史状态管理 - 使用shallowReactive
  // 🔄 shallowReactive最佳实践：
  // - 直接修改属性 patchHistory.currentIndex = newValue
  // - 避免深度响应式开销，完美配合Immer
  // - 提供最佳的性能表现
  const patchHistory = shallowReactive<PatchHistoryState<T>>({
    baseState,
    patches: [],
    currentIndex: -1
  })
  
  // 说明：shallowReactive vs ref
  // shallowReactive: 浅层响应式，性能最优，与Immer完美配合
  // ref: 深度响应式，需要.value访问，性能开销较大
 
  // 计算当前状态 - 从baseState应用patches
  const state = computed(() => {
    if (patchHistory.currentIndex < 0) {
      return patchHistory.baseState
    }
    
    const allPatches = patchHistory.patches
      .slice(0, patchHistory.currentIndex + 1)
      .flat()
    
    // 一次性应用所有patches
    return allPatches.length > 0 
      ? applyPatches(patchHistory.baseState as any, allPatches) as T
      : patchHistory.baseState
  })
 
  // 计算属性
  const canUndoPatch = computed(() => patchHistory.currentIndex >= 0)
  const canRedoPatch = computed(() => 
    patchHistory.currentIndex < patchHistory.patches.length - 1
  )
 
  // 更新函数 - shallowReactive支持直接属性修改
  const update = (updater: (draft: T) => void) => {
    const [_nextState, patches] = produceWithPatches(
      state.value,
      updater
    )

    if (patches.length > 0) {
      // 如果当前不在最新位置，删除后面的历史
      const newPatches = patchHistory.patches.slice(0, patchHistory.currentIndex + 1)
      
      if (maxHistorySize === -1) {
        // 无限制模式：直接修改属性 - shallowReactive优势
        patchHistory.patches = [...newPatches, patches]
        patchHistory.currentIndex = newPatches.length
      } else {
        // 有限制模式：使用slice限制大小
        patchHistory.patches = [
          ...newPatches.slice(-(maxHistorySize - 1)),
          patches
        ]
        patchHistory.currentIndex = Math.min(newPatches.length, maxHistorySize - 1)
      }
    }
  }

  // 基于Patch的Undo - 直接修改属性
  const undoPatch = (): boolean => {
    if (!canUndoPatch.value) return false
    
    // shallowReactive: 直接修改属性
    patchHistory.currentIndex = patchHistory.currentIndex - 1
    
    return true
  }

  // 基于Patch的Redo - 直接修改属性
  const redoPatch = (): boolean => {
    if (!canRedoPatch.value) return false
    
    // shallowReactive: 直接修改属性
    patchHistory.currentIndex = patchHistory.currentIndex + 1
    
    return true
  }

  // 重置
  const resetPatch = () => {
    // shallowReactive: 支持Object.assign批量更新
    Object.assign(patchHistory, {
      baseState,
      patches: [],
      currentIndex: -1
    })
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
  } as UsePatchImmerResult<T>
} 