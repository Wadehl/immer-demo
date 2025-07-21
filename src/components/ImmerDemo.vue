<template>
  <div class="immer-demo">
    <h1>State Management 实现方式对比</h1>
    <p class="description">对比手动栈管理、Immer栈管理、Patch管理、Direct Patch管理和性能对比五种不同的状态历史管理方式</p>
    
    <TabContainer 
      :tabs="tabs" 
      defaultTab="manual"
    >
      <template #manual>
        <ManualHistoryPanel />
      </template>
      
      <template #immer>
        <ImmerStackHistoryPanel />
      </template>
      
      <template #patch>
        <PatchHistoryPanel />
      </template>
      
      <template #direct>
        <DirectPatchHistoryPanel />
      </template>
      
      <template #performance>
        <PerformanceComparisonPanel />
      </template>
    </TabContainer>
  </div>
</template>

<script setup lang="ts">
import TabContainer from './TabContainer.vue'
import ManualHistoryPanel from './ManualHistoryPanel.vue'
import ImmerStackHistoryPanel from './ImmerStackHistoryPanel.vue'
import PatchHistoryPanel from './PatchHistoryPanel.vue'
import DirectPatchHistoryPanel from './DirectPatchHistoryPanel.vue'
import PerformanceComparisonPanel from './PerformanceComparisonPanel.vue'

const tabs = [
  { key: 'manual', label: '手动栈管理' },
  { key: 'immer', label: 'Immer栈管理' },
  { key: 'patch', label: 'Patch管理' },
  { key: 'direct', label: 'Direct Patch管理' },
  { key: 'performance', label: '性能对比' }
]
</script>

<style scoped>
.immer-demo {
  max-width: 90%;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  text-align: center;
}

.description {
  text-align: center;
  color: #6c757d;
  margin-bottom: 30px;
  font-size: 16px;
}
</style>
