<template>
  <div class="patch-history-panel">
    <div class="state-section">
      <h2>Patch实现 - Immer Patch State Management</h2>
      <div class="implementation-info">
        <p>🔧 Immer + Patch重放 + 时间轴控制 + 内存优化</p>
      </div>
      <div class="operation-container">
        <button @click="handleUndoPatch" :disabled="!canUndoPatch">Undo Patch</button>
        <button @click="handleRedoPatch" :disabled="!canRedoPatch">Redo Patch</button>
        <button @click="handleResetPatch">Reset</button>
      </div>
      <div class="state-display">
        <JsonHighlight :data="state" />
        <!-- <p><strong>Current Index:</strong> {{ patchHistory.currentIndex }}</p>
        <p><strong>Total Patches:</strong> {{ patchHistory.patches.length }}</p> -->
      </div>
      <button @click="handleUpdatePatch" class="update-btn">更新状态</button>
    </div>
    
    <div class="history-section">
      <h2>Patch实现 History</h2>
      <div class="history-display">
        <div class="history-stats">
          <div class="base-state">
            <p><strong>Base State:</strong></p>
            <JsonHighlight :data="patchHistory.baseState" />
          </div>
          <p><strong>Current Index:</strong> {{ patchHistory.currentIndex }}</p>
          <p><strong>Can Undo:</strong> {{ canUndoPatch ? 'Yes' : 'No' }}</p>
          <p><strong>Can Redo:</strong> {{ canRedoPatch ? 'Yes' : 'No' }}</p>
        </div>
        
        <div class="patches-container">
          <h3>Patch 时间轴</h3>
          <div class="timeline-container">
            <!-- 时间轴指针 -->
            <div class="timeline-pointer-container">
              <div 
                class="timeline-pointer"
                v-if="patchHistory.patches.length > 0"
                :style="{ left: getPointerPosition() }"
              >
                <div class="pointer-arrow">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12L3 7h10z"/>
                  </svg>
                </div>
                <div class="pointer-label">Current: {{ patchHistory.currentIndex }}</div>
              </div>
            </div>
            
            <!-- 时间轴节点 -->
            <div class="timeline-track">
              <div class="timeline-line"></div>
              <div 
                v-for="(patchSet, index) in patchHistory.patches" 
                :key="index"
                class="timeline-node"
                :class="getTimelineNodeClass(index)"
                @click="handlePatchHistoryClick(patchSet, index)"
                :style="{ left: getNodePosition(index) }"
              >
                <div class="node-circle">{{ index + 1 }}</div>
                <div class="node-tooltip">
                  <div class="tooltip-content">
                    <div class="tooltip-header">
                      <strong>Patch #{{ index + 1 }}</strong>
                      <span class="patch-count-badge">{{ patchSet.length }}</span>
                    </div>
                    <div class="patch-details">
                      <div v-for="(patch, pIndex) in patchSet" :key="pIndex" class="patch-detail-item">
                        <div class="patch-operation">
                          <span class="operation-type" :class="`op-${patch.op}`">{{ patch.op.toUpperCase() }}</span>
                          <span class="operation-path">"{{ patch.path.join('.') }}"</span>
                        </div>
                        <div v-if="patch.value !== undefined" class="patch-change">
                          <span class="arrow">→</span>
                          <span class="new-value">{{ formatValue(patch.value) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Patch } from 'immer'
import { usePatchImmer } from '../hooks/usePatchImmer'
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
} = usePatchImmer({
  name: "Jane",
  age: 30
})

const handleUpdatePatch = () => {
  update((draft) => {
    // draft.age += 1
    // 获取随机的字符串组合，长度为 5
    const randomString = Math.random().toString(36).substring(2, 7);
    draft.name = randomString;
    draft.age = Math.floor(Math.random() * 100);
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

const handlePatchHistoryClick = (patchSet: Patch[], index: number) => {
  console.log('Clicked patch set in patch history:', patchSet, 'at index:', index)
}

// Removed old patch card styling function

const getPointerPosition = () => {
  const currentIndex = patchHistory.value.currentIndex;
  const totalPatches = patchHistory.value.patches.length;
  if (totalPatches === 0 || currentIndex < 0) {
    return '0%';
  }
  if (totalPatches === 1) {
    return '50%';
  }
  const pointerPosition = (currentIndex / (totalPatches - 1)) * 100;
  return `${Math.min(100, Math.max(0, pointerPosition))}%`;
};

const getNodePosition = (index: number) => {
  const totalPatches = patchHistory.value.patches.length;
  if (totalPatches === 0) {
    return '0%';
  }
  if (totalPatches === 1) {
    return '50%';
  }
  const nodePosition = (index / (totalPatches - 1)) * 100;
  return `${nodePosition}%`;
};

const getTimelineNodeClass = (index: number) => {
  const isActive = index <= patchHistory.value.currentIndex;
  return isActive ? 'active-node' : 'inactive-node';
};

const formatValue = (value: any) => {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  return JSON.stringify(value);
};
</script>

<style scoped>
.patch-history-panel {
  max-width: 100%;
}

.state-section, .history-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
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
  background: #6f42c1;
  color: white;
}

.operation-container button:hover:not(:disabled) {
  background: #5a2d91;
  transform: translateY(-1px);
}

.operation-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.implementation-info {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
}

.implementation-info p {
  margin: 0;
  color: #721c24;
  font-weight: 500;
}

.update-btn {
  background: #fd7e14;
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
  background: #e8590c;
  transform: translateY(-1px);
}

.history-stats p {
  margin: 8px 0;
  color: #495057;
}

.patches-container {
  margin-top: 20px;
  padding: 15px;
  background: #e9ecef;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

/* Timeline styles replace old patch card styles */

.timeline-container {
  position: relative;
  height: 80px;
  background-color: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 15px;
  padding: 20px;
  overflow: visible;
}

.timeline-pointer-container {
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 100%;
  display: flex;
  align-items: flex-start;
  pointer-events: none;
}

.timeline-pointer {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  z-index: 2;
  pointer-events: none;
}

.pointer-arrow {
  font-size: 18px;
  color: #dc3545;
  font-weight: bold;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  filter: drop-shadow(0 2px 4px rgba(220, 53, 69, 0.3));
}

.pointer-label {
  font-size: 11px;
  color: #dc3545;
  font-weight: bold;
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
  background: rgba(220, 53, 69, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #dc3545;
}

.timeline-track {
  position: absolute;
  top: 50%;
  left: 20px;
  right: 20px;
  height: 40px;
  transform: translateY(-50%);
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #6f42c1 0%, #9561e2 50%, #6f42c1 100%);
  transform: translateY(-50%);
  z-index: 0;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(111, 66, 193, 0.2);
}

.timeline-node {
  position: absolute;
  top: 50%;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
  z-index: 1;
  cursor: pointer;
  transition: all 0.3s ease;
}

.timeline-node:hover {
  transform: translate(-50%, -50%) scale(1.3);
}

.timeline-node.active-node .node-circle {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border: 3px solid #ffffff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.timeline-node.inactive-node .node-circle {
  background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%);
  border: 3px solid #ffffff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.node-circle {
  font-size: 12px;
  font-weight: bold;
}

.node-tooltip {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: linear-gradient(135deg, #343a40 0%, #495057 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 12px;
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.node-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -6px;
  border-width: 6px;
  border-style: solid;
  border-color: #343a40 transparent transparent transparent;
}

.timeline-node:hover .node-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-100%) translateY(-8px);
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.patch-count-badge {
  background: rgba(111, 66, 193, 0.8);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
}

.patch-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.patch-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.patch-operation {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operation-type {
  font-weight: bold;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
}

.operation-type.op-replace {
  background: #ffc107;
  color: #000;
}

.operation-type.op-add {
  background: #28a745;
  color: white;
}

.operation-type.op-remove {
  background: #dc3545;
  color: white;
}

.operation-path {
  color: #adb5bd;
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.patch-change {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}

.arrow {
  color: #17a2b8;
  font-weight: bold;
  font-size: 14px;
}

.new-value {
  color: #20c997;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  background: rgba(32, 201, 151, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.base-state {
  margin-bottom: 15px;
}

.base-state p {
  margin-bottom: 8px;
  font-weight: bold;
}
</style> 