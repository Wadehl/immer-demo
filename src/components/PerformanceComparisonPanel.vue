<template>
  <div class="performance-comparison-panel">
    <div class="header-section">
      <h2>性能对比 - Patches方式 vs 栈方式</h2>
      <div class="comparison-info">
        <p>🔬 高精度性能测试: 200用户+400帖子状态，2000次更新操作，1000次撤销操作</p>
        <p>⏱️ 使用预热 + 多次迭代来获得微秒级精度的平均性能数据</p>
        <p>📊 无限制模式测试: maxHistorySize=-1，消除slice操作开销影响</p>
      </div>
      
      <div class="test-controls">
        <button 
          @click="runTest" 
          :disabled="isRunning"
          class="run-test-btn"
        >
          {{ isRunning ? '测试中...' : '运行性能测试' }}
        </button>
        <div v-if="isRunning" class="loading-indicator">
          <div class="spinner"></div>
          <span>正在测试大型状态下的性能差异...</span>
        </div>
      </div>
    </div>

    <div v-if="metrics.length > 0" class="results-section">
      <div class="summary-cards">
        <div class="summary-card memory">
          <h3>💾 内存使用对比</h3>
          <div class="metric-value">
            <span class="ratio">{{ getMemoryRatio() }}</span>
            <span class="label">Patches方式 vs 栈方式</span>
          </div>
          <p class="explanation">栈方式需要存储完整状态副本，Patches只存储变更指令</p>
        </div>
        
        <div class="summary-card performance">
          <h3>⚡ 更新性能对比</h3>
          <div class="metric-value">
            <span class="ratio">{{ getPerformanceRatio('Update') }}</span>
            <span class="label">Patches方式 vs 栈方式</span>
          </div>
          <p class="explanation">栈方式需要深拷贝整个状态，Patches只记录变更</p>
        </div>
        
        <div class="summary-card undo">
          <h3>↺ Undo性能对比</h3>
          <div class="metric-value">
            <span class="ratio">{{ getPerformanceRatio('Undo') }}</span>
            <span class="label">Patches方式 vs 栈方式</span>
          </div>
          <p class="explanation">栈方式直接切换状态，Patches需要应用逆向变更</p>
        </div>
      </div>
      
      <div class="detailed-results">
        <h3>详细测试结果</h3>
        <div class="results-table">
          <table>
            <thead>
              <tr>
                <th>实现方式</th>
                <th>操作类型</th>
                <th>平均时间/操作</th>
                <th>总时间</th>
                <th>迭代次数</th>
                <th>内存占用</th>
                <th>状态大小</th>
                <!-- <th>性能评级</th> -->
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="metric in metrics" 
                :key="`${metric.method}-${metric.operationType}`"
                :class="getRowClass(metric)"
              >
                <td class="method-cell">
                  <span class="method-badge" :class="metric.method.toLowerCase()">
                    {{ metric.method }}
                  </span>
                </td>
                <td>{{ metric.operationType }}</td>
                <td>
                  <span class="time-value primary">{{ formatTime(metric.avgTimePerOp) }}</span>
                </td>
                <td>
                  <span class="time-value">{{ formatTime(metric.executionTime) }}</span>
                </td>
                <td>
                  <span class="iterations-value">{{ metric.iterations.toLocaleString() }}</span>
                </td>
                <td>
                  <div class="memory-container" @mouseenter="showTooltip" @mouseleave="hideTooltip" @mousemove="updateTooltip">
                    <span class="memory-value">{{ formatBytes(metric.memoryUsage) }}</span>
                    <div ref="tooltip" class="memory-tooltip">
                      <div class="tooltip-content">
                        <strong>内存计算详情:</strong><br>
                        {{ metric.memoryCalculation }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{{ metric.dataSize }}</td>
                <!-- <td>
                  <div class="performance-rating">
                    {{ getPerformanceRating(metric) }}
                  </div>
                </td> -->
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="analysis-section">
        <h3>📊 分析结论</h3>
        <div class="analysis-grid">
          <div class="analysis-item">
            <h4>🎯 核心差异</h4>
            <ul>
              <li><strong>存储策略:</strong> useManualHistory存储"状态快照"，useDirectPatchImmer存储"变更指令"</li>
              <li><strong>内存效率:</strong> DirectPatch在大型状态下有巨大优势</li>
              <li><strong>操作复杂度:</strong> 不同操作的性能特征差异明显</li>
              <li><strong>真实测试:</strong> 基于实际生产代码的性能表现</li>
            </ul>
          </div>
          
          <div class="analysis-item">
            <h4>📈 选择建议</h4>
            <ul>
              <li><strong>简单状态 + 少量历史:</strong> useManualHistory更简单直观</li>
              <li><strong>复杂状态 + 大量历史:</strong> useDirectPatchImmer内存效率更高</li>
              <li><strong>频繁undo/redo:</strong> DirectPatch的O(1)操作性能更好</li>
              <li><strong>开发体验:</strong> Immer提供更好的不可变性保证</li>
            </ul>
          </div>
          
          <div class="analysis-item">
            <h4>🔍 深层理解</h4>
            <ul>
              <li><strong>本质相同:</strong> 都是"双栈"结构的不同实现</li>
              <li><strong>权衡不同:</strong> 时间复杂度 vs 空间复杂度</li>
              <li><strong>场景适配:</strong> 没有银弹，需要具体分析</li>
            </ul>
          </div>
        </div>
        
        <div class="calculation-methods">
          <h4>📐 计算方法说明</h4>
          <div class="method-grid">
            <div class="method-item">
              <h5>⏱️ 平均操作时间计算</h5>
              <div class="formula">
                <code>平均时间 = 总执行时间 ÷ 迭代次数</code>
              </div>
              <ul class="method-details">
                <li><strong>预热阶段:</strong> 10次预热操作，避免JIT编译影响</li>
                <li><strong>批量测试:</strong> Update=2000次，Undo=1000次</li>
                <li><strong>时间精度:</strong> performance.now()提供亚毫秒精度</li>
                <li><strong>单位转换:</strong> &lt;1ms显示为μs，≥1ms显示为ms</li>
              </ul>
            </div>
            
            <div class="method-item">
              <h5>💾 内存占用计算</h5>
              <div class="formula">
                <strong>栈方式:</strong><br>
                <code>内存 = 当前状态 + Past栈状态数×单状态大小 + Future栈状态数×单状态大小</code><br><br>
                <strong>Patches方式:</strong><br>
                <code>内存 = 当前状态 + 所有Patches + 所有InversePatches</code>
              </div>
              <ul class="method-details">
                <li><strong>状态大小:</strong> JSON序列化后用Blob API计算UTF-8字节数</li>
                <li><strong>对象开销:</strong> 实际内存约为JSON大小的1.8倍（考虑JS对象开销）</li>
                <li><strong>栈计算:</strong> 每个历史状态都是完整状态副本</li>
                <li><strong>Patch计算:</strong> 只存储变更信息，通常比完整状态小很多</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <div class="empty-content">
        <h3>🚀 准备开始性能测试</h3>
        <p>点击"运行性能测试"按钮，我们将对比栈方式和Patches方式在大型状态下的性能差异</p>
        <ul class="test-details">
          <li>📦 测试数据: 200个用户对象 + 400个帖子对象</li>
          <li>🔄 操作次数: 2000次更新 + 1000次撤销 (全量历史管理)</li>
          <li>⏱️ 精度: 微秒级测量，包含预热阶段</li>
          <li>📊 对比维度: 平均操作时间、总执行时间、内存占用</li>
          <li>🎯 预期结果: Past栈=1000, Future栈=1000 (栈方式)</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePerformanceComparison } from '../hooks/usePerformanceComparison'

const { 
  metrics, 
  isRunning, 
  runComparison,
  formatBytes,
  formatTime,
  getMemoryRatio,
  getPerformanceRatio
} = usePerformanceComparison()

const tooltip = ref<HTMLElement>()

const runTest = () => {
  runComparison()
}

const getRowClass = (metric: any) => {
  return {
    'stack-row': metric.method === 'Stack',
    'patches-row': metric.method === 'Patches'
  }
}

const getPerformanceRating = (metric: any) => {
  const { method, operationType, avgTimePerOp, memoryUsage } = metric
  
  if (method === 'Stack') {
    if (operationType === 'Update') {
      return memoryUsage > 1000000 ? '❌ 内存密集' : '⚠️ 深拷贝开销'
    } else {
      return avgTimePerOp < 0.01 ? '✅ 极快切换' : '✅ 直接切换'
    }
  } else {
    if (operationType === 'Update') {
      return avgTimePerOp < 0.01 ? '✅ 极快变更' : '✅ 高效变更'
    } else {
      return avgTimePerOp < 0.01 ? '✅ 极快应用' : '✅ 轻量应用'
    }
  }
}

const showTooltip = (event: MouseEvent) => {
  const tooltipEl = (event.currentTarget as HTMLElement).querySelector('.memory-tooltip') as HTMLElement
  if (tooltipEl) {
    updateTooltipPosition(event, tooltipEl)
    tooltipEl.style.opacity = '1'
    tooltipEl.style.visibility = 'visible'
  }
}

const hideTooltip = (event: MouseEvent) => {
  const tooltipEl = (event.currentTarget as HTMLElement).querySelector('.memory-tooltip') as HTMLElement
  if (tooltipEl) {
    tooltipEl.style.opacity = '0'
    tooltipEl.style.visibility = 'hidden'
  }
}

const updateTooltip = (event: MouseEvent) => {
  const tooltipEl = (event.currentTarget as HTMLElement).querySelector('.memory-tooltip') as HTMLElement
  if (tooltipEl && tooltipEl.style.opacity === '1') {
    updateTooltipPosition(event, tooltipEl)
  }
}

const updateTooltipPosition = (event: MouseEvent, tooltipEl: HTMLElement) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const tooltipWidth = 320
  const tooltipHeight = 100 // 估算高度
  
  let left = rect.left + rect.width / 2 - tooltipWidth / 2
  let top = rect.bottom + 8
  
  // 检查右边界
  if (left + tooltipWidth > window.innerWidth - 10) {
    left = window.innerWidth - tooltipWidth - 10
  }
  
  // 检查左边界
  if (left < 10) {
    left = 10
  }
  
  // 检查底部边界，如果超出则显示在上方
  if (top + tooltipHeight > window.innerHeight - 10) {
    top = rect.top - tooltipHeight - 8
  }
  
  tooltipEl.style.left = `${left}px`
  tooltipEl.style.top = `${top}px`
}
</script>

<style scoped>
.performance-comparison-panel {
  max-width: 100%;
  padding: 20px;
}

.header-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.comparison-info {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 10px;
  margin: 15px 0;
}

.comparison-info p {
  margin: 0;
  color: #856404;
  font-weight: 500;
}

.test-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.run-test-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.run-test-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.run-test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #dee2e6;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.summary-card.memory {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #2196f3;
}

.summary-card.performance {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border-color: #4caf50;
}

.summary-card.undo {
  background: linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%);
  border-color: #ff9800;
}

.summary-card h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
}

.metric-value .ratio {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  display: block;
}

.metric-value .label {
  font-size: 14px;
  color: #666;
  display: block;
  margin-top: 5px;
}

.summary-card .explanation {
  font-size: 13px;
  color: #555;
  margin: 10px 0 0 0;
  line-height: 1.4;
}

.detailed-results {
  margin-bottom: 30px;
}

.detailed-results h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.results-table {
  overflow-x: auto;
  position: relative;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  position: relative;
  z-index: 1;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.method-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.method-badge.stack {
  background: #ff9800;
  color: white;
}

.method-badge.patches {
  background: #4caf50;
  color: white;
}

.stack-row {
  background: #fff3e0;
}

.patches-row {
  background: #e8f5e8;
}

.time-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: bold;
}

.time-value.primary {
  color: #007bff; /* Highlight primary time value */
}

.iterations-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: bold;
  color: #6c757d;
}



.memory-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.memory-tooltip {
  position: fixed;
  background-color: #333;
  color: white;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  white-space: pre-wrap;
  width: 320px;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.memory-tooltip::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #333;
}

.memory-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: bold;
  color: #e91e63;
  cursor: pointer;
}

.performance-rating {
  font-size: 14px;
}

.analysis-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.analysis-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.analysis-item h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
}

.analysis-item ul {
  margin: 0;
  padding-left: 20px;
}

.analysis-item li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #555;
}

.empty-state {
  background: white;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  border: 1px solid #dee2e6;
}

.empty-content h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.empty-content p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.test-details {
  display: inline-block;
  text-align: left;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.test-details li {
  margin-bottom: 8px;
  color: #555;
}

.calculation-methods {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.calculation-methods h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.method-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.method-item h5 {
  margin-bottom: 10px;
  color: #495057;
  font-size: 15px;
}

.formula {
  background: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  color: #343a40;
  white-space: pre-wrap;
  word-break: break-all;
}

.method-details {
  margin-top: 10px;
  padding-left: 20px;
  list-style: disc;
}

.method-details li {
  margin-bottom: 5px;
  color: #555;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .analysis-grid {
    grid-template-columns: 1fr;
  }
  
  .test-controls {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 