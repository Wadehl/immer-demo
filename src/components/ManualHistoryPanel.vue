<template>
  <div class="manual-history-panel">
    <div class="state-section">
      <h2>手动栈实现 - Manual State Management</h2>
      <div class="implementation-info">
        <p>✋ 手动深拷贝 + 栈操作 + 自己管理不可变性</p>
      </div>
      <div class="operation-container">
        <button @click="handleUndo" :disabled="!canUndo">Undo (出栈)</button>
        <button @click="handleRedo" :disabled="!canRedo">Redo (入栈)</button>
        <button @click="handleReset">Reset</button>
      </div>
      <div class="state-display">
        <JsonHighlight :data="history.present" />
        <!-- <p><strong>Past Stack Size:</strong> {{ history.past.length }}</p>
        <p><strong>Future Stack Size:</strong> {{ history.future.length }}</p> -->
      </div>
      <button @click="handleUpdate" class="update-btn">更新状态</button>
    </div>
    
    <div class="history-section">
      <h2>手动栈 History</h2>
      <div class="history-display">
        <div class="history-stats">
          <p><strong>Past Stack:</strong> {{ history.past.length }} 个历史状态</p>
          <p><strong>Future Stack:</strong> {{ history.future.length }} 个未来状态</p>
          <!-- <div class="present-state">
            <p><strong>Present:</strong></p>
            <JsonHighlight :data="history.present" />
          </div> -->
        </div>
        
        <div class="stack-visualization">
          <h3>栈可视化:</h3>
          <div class="stacks-container">
            <div class="stack-column">
              <h4>Past Stack (LIFO)</h4>
              <div class="stack-items">
                <div 
                  v-for="(item, index) in [...history.past].reverse()" 
                  :key="index"
                  class="stack-item past-item"
                  :class="{ 'stack-top': index === 0 }"
                >
                  <span class="stack-index">{{ history.past.length - index }}</span>
                  <div class="stack-content">
                    <JsonHighlight :data="item" compact />
                  </div>
                </div>
                <div class="stack-base">Past Base</div>
              </div>
            </div>
            
            <div class="current-state">
              <h4>Present</h4>
              <div class="current-item">
                <JsonHighlight :data="history.present" />
              </div>
            </div>
            
            <div class="stack-column">
              <h4>Future Stack (FIFO)</h4>
              <div class="stack-items">
                <div 
                  v-for="(item, index) in history.future" 
                  :key="index"
                  class="stack-item future-item"
                  :class="{ 'stack-top': index === 0 }"
                >
                  <span class="stack-index">{{ index + 1 }}</span>
                  <div class="stack-content">
                    <JsonHighlight :data="item" compact />
                  </div>
                </div>
                <div class="stack-base">Future Base</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="operations-container">
          <h3>操作记录:</h3>
          <div class="operations-list">
            <div 
              v-for="(operation, index) in getOperations()" 
              :key="index"
              class="operation-item"
            >
              <span class="operation-index">#{{ index + 1 }}</span>
              <span class="operation-content">{{ operation }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useManualHistory } from '../hooks/useManualHistory'
import JsonHighlight from './JsonHighlight.vue'

const { 
  state, 
  update, 
  history, 
  undo, 
  redo, 
  reset,
  canUndo,
  canRedo,
  getOperations
} = useManualHistory({
  name: "Alice",
  age: 20
})

const handleUpdate = () => {
  update((current) => {
    // 手动创建新对象，确保不可变性
    return {
      ...current,
      name: Math.random().toString(36).substring(2, 7),
      age: Math.floor(Math.random() * 100)
    }
  })
}

const handleUndo = () => {
  undo()
}

const handleRedo = () => {
  redo()
}

const handleReset = () => {
  reset()
}
</script>

<style scoped>
.manual-history-panel {
  max-width: 100%;
}

.state-section, .history-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.implementation-info {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
}

.implementation-info p {
  margin: 0;
  color: #856404;
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
}

.operation-container button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #e67e22;
  color: white;
}

.operation-container button:hover:not(:disabled) {
  background: #d35400;
  transform: translateY(-1px);
}

.operation-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.update-btn {
  background: #f39c12;
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
  background: #e67e22;
  transform: translateY(-1px);
}

.history-stats p {
  margin: 8px 0;
  color: #495057;
}

.stack-visualization {
  margin-top: 20px;
  padding: 15px;
  background: #e9ecef;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.stacks-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  margin-top: 15px;
}

.stack-column {
  display: flex;
  flex-direction: column;
}

.stack-column h4 {
  text-align: center;
  margin-bottom: 10px;
  color: #495057;
}

.stack-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-height: 100px;
}

.stack-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.past-item {
  border-left: 4px solid #e74c3c;
}

.future-item {
  border-left: 4px solid #3498db;
}

.stack-item.stack-top {
  border-width: 2px;
  font-weight: bold;
}

.stack-index {
  background: #6c757d;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
}

.stack-content {
  flex: 1;
  margin-left: 8px;
}

.present-state p {
  margin-bottom: 8px;
  font-weight: bold;
}

.stack-base {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 5px;
  border-top: 2px solid #6c757d;
  margin-top: 5px;
}

.current-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.current-state h4 {
  margin-bottom: 10px;
  color: #28a745;
}

.current-item {
  background: #d4edda;
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  max-width: 200px;
  white-space: pre-wrap;
}

.present-state {
  margin-top: 15px;
}

.present-state p {
  margin-bottom: 8px;
  font-weight: bold;
}

.operations-container {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.operations-list {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 10px;
}

.operation-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  background: white;
  margin-bottom: 5px;
  border-radius: 4px;
  border-left: 4px solid #f39c12;
  font-size: 12px;
}

.operation-index {
  background: #f39c12;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  min-width: 30px;
  text-align: center;
}

.operation-content {
  flex: 1;
  color: #495057;
}
</style> 