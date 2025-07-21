<template>
  <div class="tab-container">
    <div class="tab-header">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-button"
        :class="{ active: activeTab === tab.key }"
        @click="setActiveTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content">
      <slot :name="activeTab" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Tab {
  key: string
  label: string
}

interface Props {
  tabs: Tab[]
  defaultTab?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultTab: ''
})

const activeTab = ref(props.defaultTab || props.tabs[0]?.key || '')

const setActiveTab = (tabKey: string) => {
  activeTab.value = tabKey
}
</script>

<style scoped>
.tab-container {
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: visible;
}

.tab-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.tab-button {
  flex: 1;
  padding: 15px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-button:hover {
  background: #e9ecef;
  color: #495057;
}

.tab-button.active {
  background: #ffffff;
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-content {
  padding: 20px;
  min-height: 400px;
  overflow: visible;
}
</style> 