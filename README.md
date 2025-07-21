# 使用 Immer 实现记录状态管理

## 介绍

### 不可变状态（Immutable State）

不可变状态（Immutable State）是一种状态管理方式，它通过创建新的状态对象来更新状态，而不是直接修改现有的状态对象。这种方式可以避免状态的突变，从而更容易追踪状态的变化。

### Immer 是什么
> [Immer 官网](https://immerjs.github.io/immer/zh-CN/)

Immer 是一个用于管理状态的库，它可以帮助我们更方便地管理状态。
他基于 Proxy 实现，能够通过简单的 API 实现不可变状态的管理。

## 🎯 四种状态管理实现方式对比

本项目展示了四种不同的状态历史管理方式，每种都有其特定的应用场景：

### 1. 手动栈管理 (Manual Stack)
- ✋ **完全手动** - 自己实现深拷贝和栈操作
- 🔧 **适用场景** - 学习不可变性概念，小型项目
- 📊 **性能** - 深拷贝开销，但逻辑简单
- 💾 **内存** - 存储完整状态快照

### 2. Immer栈管理 (Immer Stack)
- 🚀 **Immer + 手动栈** - 自动不可变性 + 手动历史管理
- 🔧 **适用场景** - 需要Immer便利性但希望控制历史逻辑
- 📊 **性能** - Immer开销 + 状态快照存储
- 💾 **内存** - 存储完整状态快照 + patches信息

### 3. Patch管理 (Patch History)
- 🔧 **Patch重放** - 只存储patches，通过重放计算当前状态
- 🔧 **适用场景** - 内存敏感，简单状态结构
- 📊 **性能** - 重新计算开销O(n)，但patches小
- 💾 **内存** - 最优 - 只存储patches

### 4. Direct Patch管理 (Direct Patch) ⭐ **新增**
- ⚡ **高性能版本** - 直接状态存储 + InversePatches
- 🔧 **适用场景** - 高频访问，实时应用，复杂状态
- 📊 **性能** - 最优 - O(1)访问，O(1) undo/redo
- 💾 **内存** - 双倍patches存储，但状态访问极快

## 🔍 InversePatches 的作用

### 什么时候需要 InversePatches？

**Direct Patch管理**展示了`inversePatches`的真正价值：

```typescript
// Undo: 直接应用 InversePatches  
const undo = () => {
  const inversePatches = patchHistory.inversePatches[currentIndex]
  currentState = applyPatches(currentState, inversePatches)
  currentIndex--
}

// Redo: 直接应用 Patches
const redo = () => {
  currentIndex++  
  const patches = patchHistory.patches[currentIndex]
  currentState = applyPatches(currentState, patches)
}
```

**关键优势：**
- ✅ **O(1)性能** - 无需重新计算整个历史
- ✅ **实时响应** - 适合高频undo/redo操作
- ✅ **复杂状态友好** - 大型数据结构下效果显著

### 使用 Immer 实现 Undo/Redo 的状态管理

使用 Immer 实现 Undo/Redo 的状态管理，需要以下几个步骤：

#### 1. 基本概念

**Patch**: Immer 中表示状态变化的对象，包含操作类型（add/replace/remove）、路径和值。

**InversePatch**: 用于撤销操作的逆向patch，可以将状态回退到变化前。

**State History**: 管理状态历史的核心，包括过去状态、当前状态和未来状态。

#### 2. 实现方式选择

根据你的需求选择合适的实现方式：

- **学习目的** → 手动栈管理
- **一般应用** → Patch管理  
- **高性能需求** → Direct Patch管理
- **混合需求** → Immer栈管理

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📚 相关资源

- [Immer 官方文档](https://immerjs.github.io/immer/)
- [Vue 3 官方文档](https://vuejs.org/)
- [不可变性概念详解](https://github.com/immutable-js/immutable-js)
