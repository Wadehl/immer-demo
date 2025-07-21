<template>
  <div class="direct-patch-history-panel">
    <div class="state-section">
      <h2>Direct Patch实现 - Direct State + InversePatches</h2>
      <div class="implementation-info">
        <p>⚡ 直接状态存储 + InversePatches回退 + O(1)性能 + 高效Undo/Redo</p>
      </div>
      <div class="operation-container">
        <button @click="handleUndoPatch" :disabled="!canUndoPatch">
          Undo (使用 InversePatches)
        </button>
        <button @click="handleRedoPatch" :disabled="!canRedoPatch">
          Redo (使用 Patches)
        </button>
        <button @click="handleResetPatch">Reset</button>
      </div>
      <div class="state-display">
        <div class="current-state-container">
          <h3>当前状态 (直接存储)</h3>
          <JsonHighlight :data="state" />
        </div>
      </div>
      <button @click="handleUpdatePatch" class="update-btn">更新状态 (生成新Patches)</button>
    </div>
    
    <div class="history-section">
      <h2>Direct Patch History 详细分析</h2>
      <div class="history-display">
        <div class="performance-stats">
          <h3>性能特点:</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">状态访问:</span>
              <span class="stat-value performance">O(1) - 直接返回</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Undo操作:</span>
              <span class="stat-value performance">O(1) - 应用InversePatches</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Redo操作:</span>
              <span class="stat-value performance">O(1) - 应用Patches</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">内存使用:</span>
              <span class="stat-value memory">双倍 - Patches + InversePatches</span>
            </div>
          </div>
        </div>
        
        <div class="patches-comparison">
          <h3>Patches vs InversePatches 对比:</h3>
          <div class="comparison-container">
            <div class="patches-column">
              <h4>正向 Patches (用于Redo)</h4>
              <div class="patches-list">
                <div 
                  v-for="(patchSet, index) in patchHistory.patches" 
                  :key="`patch-${index}`"
                  class="patch-item"
                  :class="{ 
                    'current-patch': index === patchHistory.currentIndex,
                    'future-patch': index > patchHistory.currentIndex 
                  }"
                >
                  <div class="patch-header">
                    <span class="patch-index">#{{ index + 1 }}</span>
                    <span class="patch-type">Forward Patch</span>
                  </div>
                  <div class="patch-content">
                    <JsonHighlight :data="patchSet" compact />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="inverse-patches-column">
              <h4>逆向 InversePatches (用于Undo)</h4>
              <div class="patches-list">
                <div 
                  v-for="(patchSet, index) in patchHistory.inversePatches" 
                  :key="`inverse-${index}`"
                  class="patch-item inverse-patch"
                  :class="{ 
                    'current-patch': index === patchHistory.currentIndex,
                    'future-patch': index > patchHistory.currentIndex 
                  }"
                >
                  <div class="patch-header">
                    <span class="patch-index">#{{ index + 1 }}</span>
                    <span class="patch-type">Inverse Patch</span>
                  </div>
                  <div class="patch-content">
                    <JsonHighlight :data="patchSet" compact />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="operation-flow">
          <h3>操作流程可视化:</h3>
          <div class="flow-container">
            <div class="flow-step">
              <h4>1. Update操作</h4>
              <div class="flow-description">
                <p>使用 <code>produceWithPatches</code> 生成:</p>
                <ul>
                  <li>✅ 新状态 → 直接存储</li>
                  <li>✅ Patches → 用于Redo</li>
                  <li>✅ InversePatches → 用于Undo</li>
                </ul>
              </div>
            </div>
            
            <div class="flow-step">
              <h4>2. Undo操作</h4>
              <div class="flow-description">
                <p>直接应用 InversePatches:</p>
                <code>newState = applyPatches(currentState, inversePatches[currentIndex])</code>
              </div>
            </div>
            
            <div class="flow-step">
              <h4>3. Redo操作</h4>
              <div class="flow-description">
                <p>直接应用 Patches:</p>
                <code>newState = applyPatches(currentState, patches[currentIndex + 1])</code>
              </div>
            </div>
          </div>
        </div>
        
        <div class="current-index-indicator">
          <h3>当前位置指示器:</h3>
          <div class="index-display">
            <span class="index-label">Current Index:</span>
            <span class="index-value">{{ patchHistory.currentIndex }}</span>
            <span class="index-info">({{ patchHistory.currentIndex === -1 ? 'Initial State' : `Step ${patchHistory.currentIndex + 1}` }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDirectPatchImmer } from '../hooks/useDirectPatchImmer'
import JsonHighlight from './JsonHighlight.vue'

const { 
  state, 
  update, 
  patchHistory,
  undoPatch,
  redoPatch,
  resetPatch,
  canUndoPatch,
  canRedoPatch
} = useDirectPatchImmer({
  name: "DirectPatch User",
  age: 25,
  level: 1
})

const handleUpdatePatch = () => {
  update((draft) => {
    // 生成更复杂的变化来展示patches的威力
    const actions = [
      () => { draft.age += Math.floor(Math.random() * 5) + 1 },
      () => { draft.name = `User_${Math.random().toString(36).substring(2, 7)}` },
      () => { draft.level += 1 },
      () => { 
        draft.age = Math.floor(Math.random() * 50) + 20
        draft.level = Math.floor(Math.random() * 10) + 1
      }
    ]
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)]
    randomAction()
  })
}

const handleUndoPatch = () => {
  undoPatch()
}

const handleRedoPatch = () => {
  redoPatch()
}

const handleResetPatch = () => {
  resetPatch()
}
</script>

<style scoped>
.direct-patch-history-panel {
  max-width: 100%;
}

.state-section, .history-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.implementation-info {
  background: #e1f5fe;
  border: 1px solid #b3e5fc;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
}

.implementation-info p {
  margin: 0;
  color: #01579b;
  font-weight: 500;
}

.state-display, .history-display {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  margin-top: 15px;
}

.operation-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.operation-container button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #2196f3;
  color: white;
}

.operation-container button:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-1px);
}

.operation-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.update-btn {
  background: #ff9800;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.update-btn:hover {
  background: #f57c00;
  transform: translateY(-1px);
}

.current-state-container h3 {
  margin-bottom: 10px;
  color: #2196f3;
  font-weight: 600;
}

.performance-stats {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.stat-label {
  font-weight: 500;
  color: #424242;
}

.stat-value.performance {
  color: #4caf50;
  font-weight: bold;
}

.stat-value.memory {
  color: #ff9800;
  font-weight: bold;
}

.patches-comparison {
  margin-bottom: 20px;
}

.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 15px;
}

.patches-column, .inverse-patches-column {
  background: #fafafa;
  padding: 15px;
  border-radius: 6px;
}

.patches-column h4 {
  color: #4caf50;
  margin-bottom: 10px;
}

.inverse-patches-column h4 {
  color: #f44336;
  margin-bottom: 10px;
}

.patches-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.patch-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  transition: all 0.3s ease;
}

.patch-item.current-patch {
  border-color: #2196f3;
  background: #e3f2fd;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
}

.patch-item.future-patch {
  opacity: 0.6;
}

.patch-item.inverse-patch {
  border-left: 4px solid #f44336;
}

.patch-item:not(.inverse-patch) {
  border-left: 4px solid #4caf50;
}

.patch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.patch-index {
  font-weight: bold;
  color: #666;
}

.patch-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  background: #e0e0e0;
  color: #424242;
}

.operation-flow {
  margin-bottom: 20px;
}

.flow-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.flow-step {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.flow-step h4 {
  color: #2196f3;
  margin-bottom: 10px;
}

.flow-description ul {
  margin: 10px 0;
  padding-left: 20px;
}

.flow-description code {
  background: #263238;
  color: #4fc3f7;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.current-index-indicator {
  text-align: center;
  padding: 15px;
  background: #e8f5e8;
  border-radius: 6px;
}

.index-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.index-label {
  font-weight: 500;
  color: #424242;
}

.index-value {
  font-weight: bold;
  color: #2196f3;
  font-size: 20px;
}

.index-info {
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .comparison-container {
    grid-template-columns: 1fr;
  }
  
  .flow-container {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style> 