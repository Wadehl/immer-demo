<template>
  <div class="immer-stack-history-panel">
    <div class="state-section">
      <h2>Immer栈实现 - Immer + Stack Management</h2>
      <div class="implementation-info">
        <p>🚀 Immer自动不可变 + 手动栈管理 + 状态快照存储</p>
      </div>
      <div class="operation-container">
        <button @click="handleUndo" :disabled="!canUndo">Undo (出栈)</button>
        <button @click="handleRedo" :disabled="!canRedo">Redo (入栈)</button>
        <button @click="handleReset">Reset</button>
      </div>
      <div class="state-display">
        <JsonHighlight :data="state" />
        <!-- <p><strong>Past Stack Size:</strong> {{ history.past.length }}</p>
        <p><strong>Future Stack Size:</strong> {{ history.future.length }}</p> -->
      </div>
      <button @click="handleUpdate" class="update-btn">更新状态</button>
    </div>
    
    <div class="history-section">
      <h2>Immer栈 History</h2>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImmerStackHistory } from '../hooks/useImmerStackHistory'
import JsonHighlight from './JsonHighlight.vue'

const { 
  state, 
  update, 
  history, 
  undo, 
  redo, 
  reset,
  canUndo,
  canRedo
} = useImmerStackHistory({
  name: "Bob",
  age: 35
})

const handleUpdate = () => {
  update((draft) => {
    draft.name = Math.random().toString(36).substring(2, 7);
    draft.age = Math.floor(Math.random() * 100);
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
.immer-stack-history-panel {
  max-width: 100%;
}

.state-section, .history-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.implementation-info {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
}

.implementation-info p {
  margin: 0;
  color: #0c5460;
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
  background: #007bff;
  color: white;
}

.operation-container button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.operation-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.update-btn {
  background: #28a745;
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
  background: #218838;
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
  border-left: 4px solid #007bff;
}

.future-item {
  border-left: 4px solid #17a2b8;
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

.current-item {
  background: #d4edda;
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  max-width: 200px;
}

.present-state {
  margin-top: 15px;
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
</style> 