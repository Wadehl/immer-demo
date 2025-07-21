import { ref } from 'vue'
import { useManualHistory } from './useManualHistory'
import { useDirectPatchImmer } from './useDirectPatchImmer'

// 创建大型状态用于性能测试
const createLargeState = (size: number = 1000) => {
  return {
    users: Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `User_${i}`,
      email: `user${i}@example.com`,
      profile: {
        age: 20 + (i % 50),
        city: `City_${i % 100}`,
        interests: [`hobby_${i % 10}`, `sport_${i % 5}`],
        metadata: {
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {
            theme: i % 2 === 0 ? 'dark' : 'light',
            language: i % 3 === 0 ? 'en' : 'zh',
            notifications: {
              email: i % 2 === 0,
              sms: i % 3 === 0,
              push: i % 4 === 0
            }
          }
        }
      }
    })),
    posts: Array.from({ length: size * 2 }, (_, i) => ({
      id: i,
      title: `Post ${i}`,
      content: `This is the content of post ${i}`.repeat(10),
      authorId: i % size,
      tags: [`tag_${i % 20}`, `category_${i % 15}`],
      stats: {
        views: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100)
      }
    })),
    settings: {
      theme: 'default',
      locale: 'zh-CN',
      features: {
        realtime: true,
        notifications: true,
        analytics: false
      }
    }
  }
}

export interface PerformanceMetrics {
  operationType: string
  method: 'Stack' | 'Patches'
  executionTime: number
  memoryUsage: number
  dataSize: string
  iterations: number
  avgTimePerOp: number
  memoryCalculation: string // 添加内存计算说明
}

// 高精度时间测量函数
const measureTime = (fn: () => void, iterations: number, warmupFn?: () => void): number => {
  // 预热 - 避免JIT编译影响，使用独立的预热函数避免影响测试状态
  const actualWarmupFn = warmupFn || fn
  for (let i = 0; i < 10; i++) {
    actualWarmupFn()
  }
  
  // 实际测量
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  const end = performance.now()
  
  return end - start
}

// 精确计算字符串字节大小（UTF-8编码）
const getStringByteSize = (str: string): number => {
  return new Blob([str]).size
}

// 估算对象内存使用（更精确的方法）
const estimateObjectMemoryUsage = (obj: any): number => {
  // 使用JSON序列化来估算，但这低估了实际内存使用
  // 实际JavaScript对象会有额外的内存开销
  const jsonString = JSON.stringify(obj)
  const jsonBytes = getStringByteSize(jsonString)
  
  // JavaScript对象的内存开销估算：
  // - 对象头开销：每个对象约32-64字节
  // - 属性描述符开销：每个属性约8-16字节
  // - 字符串开销：除了内容外还有头部开销
  // - 数组开销：除了元素还有数组结构开销
  
  // 简化估算：实际内存约为JSON大小的1.5-2倍
  return Math.round(jsonBytes * 1.8)
}

export const usePerformanceComparison = () => {
  const metrics = ref<PerformanceMetrics[]>([])
  const isRunning = ref(false)
  
  // 栈方式性能测试 - 使用真实的useManualHistory
  const testStackMethod = (iterations: number = 1000) => {
    const baseState = createLargeState(200)
    
    // 使用真实的手动历史管理
    const manualHistory = useManualHistory(baseState, { maxHistorySize: -1 }) // 无限制，公平对比
    
    // 计算单个状态对象的大小
    const singleStateSize = estimateObjectMemoryUsage(baseState)
    
    // 测试Update操作 - 真实的深拷贝性能
    const updateTime = measureTime(() => {
      // 使用真实的update方法
      manualHistory.update((current) => ({
        ...current,
        users: current.users.map((user, index) => 
          index === 0 
            ? { ...user, name: `Updated_${Date.now()}` }
            : user
        ),
        settings: {
          ...current.settings,
          theme: current.settings.theme === 'dark' ? 'light' : 'dark'
        }
      }))
    }, iterations, () => {
      // 预热函数：不影响实际测试状态
      const tempState = { users: [{ name: 'temp' }], settings: { theme: 'temp' } }
      JSON.parse(JSON.stringify(tempState))
    })
    
    // 执行1000次Undo操作
    const requestedUndoIterations = 1000
    let actualUndoCount = 0
    
    const undoTime = measureTime(() => {
      if (manualHistory.undo()) {
        actualUndoCount++
      }
    }, requestedUndoIterations, () => {
      // 预热函数：不影响测试状态
      const temp = { test: true }
      JSON.stringify(temp)
    })
    
    // 获取真实的历史状态
    const historyState = manualHistory.history.value
    
    // 栈方式内存使用计算：基于真实数据
    const currentStateMemory = singleStateSize
    const pastMemory = historyState.past.length * singleStateSize
    const futureMemory = historyState.future.length * singleStateSize
    const totalMemory = currentStateMemory + pastMemory + futureMemory
    
    const memoryCalculation = `当前状态(${formatBytes(currentStateMemory)}) + Past栈×${historyState.past.length}(${formatBytes(pastMemory)}) + Future栈×${historyState.future.length}(${formatBytes(futureMemory)})`
    
    return {
      updateTime,
      undoTime,
      memoryUsage: totalMemory,
      stateSize: formatBytes(singleStateSize),
      iterations,
      memoryCalculation,
      actualUndoIterations: actualUndoCount,
      finalPastLength: historyState.past.length,
      finalFutureLength: historyState.future.length
    }
  }
  
  // Patches方式性能测试 - 使用真实的useDirectPatchImmer
  const testPatchesMethod = (iterations: number = 1000) => {
    const baseState = createLargeState(200)
    
    // 使用真实的Direct Patch Immer管理
    const directPatchImmer = useDirectPatchImmer(baseState, { maxHistorySize: -1 }) // 无限制，避免slice开销
    
    // 测试Update操作 - 真实的patch生成性能
    const updateTime = measureTime(() => {
      // 使用真实的update方法
      directPatchImmer.update((draft) => {
        draft.users[0].name = `Updated_${Date.now()}`
        draft.settings.theme = draft.settings.theme === 'dark' ? 'light' : 'dark'
      })
    }, iterations, () => {
      // 预热函数：不影响实际测试状态
      const tempPatch = [{ op: 'replace', path: ['temp'], value: 'temp' }]
      JSON.stringify(tempPatch)
    })
    
    // 执行1000次Undo操作
    const requestedUndoIterations = 1000
    let actualUndoCount = 0
    
    const undoTime = measureTime(() => {
      if (directPatchImmer.undoPatch()) {
        actualUndoCount++
      }
    }, requestedUndoIterations, () => {
      // 预热函数：不影响测试状态
      const temp = { test: true }
      JSON.stringify(temp)
    })
    
    // 获取真实的patch历史状态
    const patchHistoryState = directPatchImmer.patchHistory.value
    
    // Patches方式内存使用计算：基于真实数据
    const currentStateMemory = estimateObjectMemoryUsage(patchHistoryState.currentState)
    const patchesMemory = estimateObjectMemoryUsage(patchHistoryState.patches)
    const inversePatchesMemory = estimateObjectMemoryUsage(patchHistoryState.inversePatches)
    const totalMemory = currentStateMemory + patchesMemory + inversePatchesMemory
    
    const memoryCalculation = `当前状态(${formatBytes(currentStateMemory)}) + Patches×${patchHistoryState.patches.length}(${formatBytes(patchesMemory)}) + InversePatches×${patchHistoryState.inversePatches.length}(${formatBytes(inversePatchesMemory)})`
    
    return {
      updateTime,
      undoTime,
      memoryUsage: totalMemory,
      stateSize: formatBytes(currentStateMemory),
      iterations,
      memoryCalculation,
      actualUndoIterations: actualUndoCount,
      finalPatchesLength: patchHistoryState.patches.length,
      finalInversePatchesLength: patchHistoryState.inversePatches.length
    }
  }
  
  const runComparison = async () => {
    if (isRunning.value) return
    
    isRunning.value = true
    metrics.value = []
    
    try {
      // 使用更多迭代次数以获得可测量的时间差异
      const updateIterations = 2000
      const undoIterations = 1000
      
      console.log('开始栈方式测试...')
      // 测试栈方式
      const stackResults = await new Promise<any>(resolve => {
        setTimeout(() => {
          resolve(testStackMethod(updateIterations))
        }, 10)
      })
      
      console.log('栈方式结果:', {
        updateTime: stackResults.updateTime,
        undoTime: stackResults.undoTime,
        finalPastLength: stackResults.finalPastLength,
        finalFutureLength: stackResults.finalFutureLength,
        actualUndoIterations: stackResults.actualUndoIterations,
        memoryCalculation: stackResults.memoryCalculation,
        // 添加验证信息
        expectedPast: 1000,
        expectedFuture: 1000,
        isCorrect: stackResults.finalPastLength === 1000 && stackResults.finalFutureLength === 1000,
        // 性能分析提示
        performanceNote: 'ManualHistory无限制模式：纯深拷贝开销'
      })
      
      metrics.value.push({
        operationType: 'Update',
        method: 'Stack',
        executionTime: stackResults.updateTime,
        memoryUsage: stackResults.memoryUsage,
        dataSize: stackResults.stateSize,
        iterations: updateIterations,
        avgTimePerOp: stackResults.updateTime / updateIterations,
        memoryCalculation: stackResults.memoryCalculation
      })
      
      metrics.value.push({
        operationType: 'Undo',
        method: 'Stack', 
        executionTime: stackResults.undoTime,
        memoryUsage: stackResults.memoryUsage,
        dataSize: stackResults.stateSize,
        iterations: 1000, // 显示请求的迭代次数
        avgTimePerOp: stackResults.undoTime / 1000, // 基于请求的迭代次数计算
        memoryCalculation: stackResults.memoryCalculation
      })
      
      console.log('开始Patches方式测试...')
      // 测试Patches方式
      const patchesResults = await new Promise<any>(resolve => {
        setTimeout(() => {
          resolve(testPatchesMethod(updateIterations))
        }, 10)
      })
      
      console.log('Patches方式结果:', {
        updateTime: patchesResults.updateTime,
        undoTime: patchesResults.undoTime,
        finalPatchesLength: patchesResults.finalPatchesLength,
        finalInversePatchesLength: patchesResults.finalInversePatchesLength,
        actualUndoIterations: patchesResults.actualUndoIterations,
        memoryCalculation: patchesResults.memoryCalculation,
        // 添加验证信息
        expectedPatches: 1000,
        expectedInversePatches: 1000,
        isCorrect: patchesResults.finalPatchesLength === 1000 && patchesResults.finalInversePatchesLength === 1000,
        // 性能分析提示
        performanceNote: 'DirectPatch无限制模式：消除slice开销，展现真实patch优势'
      })
      
      metrics.value.push({
        operationType: 'Update',
        method: 'Patches',
        executionTime: patchesResults.updateTime,
        memoryUsage: patchesResults.memoryUsage,
        dataSize: patchesResults.stateSize,
        iterations: updateIterations,
        avgTimePerOp: patchesResults.updateTime / updateIterations,
        memoryCalculation: patchesResults.memoryCalculation
      })
      
      metrics.value.push({
        operationType: 'Undo',
        method: 'Patches',
        executionTime: patchesResults.undoTime,
        memoryUsage: patchesResults.memoryUsage,
        dataSize: patchesResults.stateSize,
        iterations: 1000, // 显示请求的迭代次数
        avgTimePerOp: patchesResults.undoTime / 1000, // 基于请求的迭代次数计算
        memoryCalculation: patchesResults.memoryCalculation
      })
      
    } finally {
      isRunning.value = false
    }
  }
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const formatTime = (ms: number): string => {
    if (ms < 0.001) {
      return `${(ms * 1000).toFixed(3)}μs`
    } else if (ms < 1) {
      return `${ms.toFixed(3)}ms`
    } else {
      return `${ms.toFixed(2)}ms`
    }
  }
  
  const getMemoryRatio = (): string => {
    const stackMemory = metrics.value.find(m => m.method === 'Stack')?.memoryUsage || 0
    const patchesMemory = metrics.value.find(m => m.method === 'Patches')?.memoryUsage || 0
    
    if (patchesMemory === 0) return 'N/A'
    const ratio = stackMemory / patchesMemory
    return `${ratio.toFixed(1)}x`
  }
  
  const getPerformanceRatio = (operation: string): string => {
    const stackTime = metrics.value.find(m => m.method === 'Stack' && m.operationType === operation)?.avgTimePerOp || 0
    const patchesTime = metrics.value.find(m => m.method === 'Patches' && m.operationType === operation)?.avgTimePerOp || 0

    if (patchesTime === 0) return '∞x';
    const ratio = stackTime / patchesTime
    return `${ratio.toFixed(1)}x`
  }
  
  return {
    metrics,
    isRunning,
    runComparison,
    formatBytes,
    formatTime,
    getMemoryRatio,
    getPerformanceRatio
  }
} 