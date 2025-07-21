<template>
  <div class="json-highlight-container" :class="{ compact: compact }">
    <pre class="json-highlight"><code ref="codeRef" class="language-json">{{ formattedJson }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'

interface Props {
  data: any
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const codeRef = ref<HTMLElement>()

const formattedJson = computed(() => {
  try {
    if (props.compact) {
      return JSON.stringify(props.data)
    } else {
      return JSON.stringify(props.data, null, 2)
    }
  } catch (error) {
    return String(props.data)
  }
})

const highlightCode = async () => {
  await nextTick()
  if (codeRef.value) {
    try {
      // 确保Prism已经正确加载
      if (typeof Prism !== 'undefined' && Prism.highlightElement) {
        Prism.highlightElement(codeRef.value)
      } else if (window.Prism && window.Prism.highlightElement) {
        window.Prism.highlightElement(codeRef.value)
      } else {
        console.warn('Prism is not available for highlighting')
      }
    } catch (error) {
      console.warn('Prism highlighting failed:', error)
    }
  }
}

onMounted(() => {
  // 延迟一点再初始化，确保DOM完全就绪
  setTimeout(() => {
    // 确保Prism正确初始化
    if (typeof window !== 'undefined') {
      // 设置Prism到window对象
      window.Prism = window.Prism || Prism
      
      // 禁用自动高亮，我们手动控制
      if (window.Prism) {
        window.Prism.manual = true
      }
      
      // 确保JSON语言已加载
      if (window.Prism && window.Prism.languages) {
        if (!window.Prism.languages.json) {
          // 如果JSON语言未加载，尝试重新导入
          import('prismjs/components/prism-json').then(() => {
            highlightCode()
          }).catch(err => {
            console.warn('Failed to load Prism JSON component:', err)
            // 即使加载失败，也尝试高亮
            highlightCode()
          })
        } else {
          highlightCode()
        }
      } else {
        // Prism.languages不存在，直接尝试高亮
        highlightCode()
      }
    } else {
      // 非浏览器环境，直接尝试高亮
      highlightCode()
    }
  }, 50) // 50ms延迟确保组件完全挂载
})

watch(() => props.data, () => {
  highlightCode()
}, { deep: true })
</script>

<style scoped>
.json-highlight-container {
  border-radius: 6px;
  overflow: hidden;
  background: #2d3748;
  border: 1px solid #4a5568;
}

.json-highlight {
  margin: 0;
  padding: 12px 16px;
  background: transparent;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.json-highlight code {
  background: transparent;
  color: #e2e8f0;
  font-family: inherit;
  font-size: inherit;
}

/* 自定义JSON语法高亮颜色 */
:deep(.token.property) {
  color: #81e6d9; /* 属性名 - 青色 */
}

:deep(.token.string) {
  color: #90cdf4; /* 字符串值 - 蓝色 */
}

:deep(.token.number) {
  color: #f6ad55; /* 数字 - 橙色 */
}

:deep(.token.boolean) {
  color: #68d391; /* 布尔值 - 绿色 */
}

:deep(.token.null) {
  color: #a0aec0; /* null - 灰色 */
}

:deep(.token.punctuation) {
  color: #cbd5e0; /* 标点符号 - 浅灰 */
}

/* 紧凑模式样式 */
.json-highlight-container.compact {
  background: #1a202c;
  border: 1px solid #2d3748;
}

.json-highlight-container.compact .json-highlight {
  padding: 6px 10px;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .json-highlight {
    font-size: 12px;
    padding: 8px 12px;
  }
}
</style> 