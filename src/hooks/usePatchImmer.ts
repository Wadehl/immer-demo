import { shallowRef, computed, type Ref } from "vue";
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
    maxHistorySize?: number
  }
) => {
  const { maxHistorySize = 50 } = options || {}
 
  // 基于Patch的历史状态管理 - 简化版本，只需要patches！
  const patchHistory = shallowRef<PatchHistoryState<T>>({
    baseState,
    patches: [],
    currentIndex: -1
  })
 
  // 计算当前状态 - 从baseState应用patches
  // 🔍 关键：我们通过重放所有patches到currentIndex来计算状态
  // 这种方式下，只需要patches即可实现完整的undo/redo！
  const state = computed(() => {
    let currentState = patchHistory.value.baseState
    for (let i = 0; i <= patchHistory.value.currentIndex; i++) {
      const patches = patchHistory.value.patches[i]
      if (patches && patches.length > 0) {
        currentState = applyPatches(currentState as any, patches) as T;
      }
    }
    return currentState
  })
 
  // 计算属性
  const canUndoPatch = computed(() => patchHistory.value.currentIndex >= 0)
  const canRedoPatch = computed(() => 
    patchHistory.value.currentIndex < patchHistory.value.patches.length - 1
  )
 
  // 更新函数 - 简化版本
  const update = (updater: (draft: T) => void) => {
    const [_nextState, patches] = produceWithPatches(
      state.value,
      updater
    )
 
    if (patches.length > 0) {
      // 如果当前不在最新位置，删除后面的历史
      const newPatches = patchHistory.value.patches.slice(0, patchHistory.value.currentIndex + 1)
      
      patchHistory.value = {
        ...patchHistory.value,
        patches: [
          ...newPatches.slice(-(maxHistorySize - 1)),
          patches
        ],
        currentIndex: Math.min(newPatches.length, maxHistorySize - 1)
      }
    }
  }
 
  // 基于Patch的Undo - 只需要减少currentIndex！
  const undoPatch = (): boolean => {
    if (!canUndoPatch.value) return false
    
    patchHistory.value = {
      ...patchHistory.value,
      currentIndex: patchHistory.value.currentIndex - 1
    }
    
    return true
  }
 
  // 基于Patch的Redo - 只需要增加currentIndex！  
  const redoPatch = (): boolean => {
    if (!canRedoPatch.value) return false
    
    patchHistory.value = {
      ...patchHistory.value,
      currentIndex: patchHistory.value.currentIndex + 1
    }
    
    return true
  }
 
  // 重置
  const resetPatch = () => {
    patchHistory.value = {
      baseState,
      patches: [],
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
  } as UsePatchImmerResult<T>
} 