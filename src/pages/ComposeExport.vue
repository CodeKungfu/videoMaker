<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Download, Share2, Loader2, Settings2, CheckSquare } from 'lucide-vue-next'
import html2canvas from 'html2canvas'
import { useDraggable } from '@vueuse/core'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const projectId = route.params.id
const { showToast } = useToast()

const shots = ref<any[]>([])
const project = ref<any>(null)
const loading = ref(true)
const exporting = ref(false)
const comicContainer = ref<HTMLElement | null>(null)
const showChecklist = ref(false)

// Comic styles state
const comicStyle = ref({
  gap: 8, // margin bottom for each panel
  padding: 16, // outer padding
  bgColor: '#ffffff',
  bubbleStyle: 'classic' // classic, modern, thought
})

// Store individual bubble positions
const bubblePositions = ref<Record<number, { x: number, y: number }>>({})
const activeDraggableId = ref<number | null>(null)

// QA Checklist state
const qaChecks = ref([
  { id: 1, text: '同一角色跨镜头可识别（发型/标志物不漂移）', checked: false },
  { id: 2, text: '场景风格统一（光影与色调不跳跃）', checked: false },
  { id: 3, text: '手机竖屏阅读：关键冲突点 3 秒内能懂', checked: false },
  { id: 4, text: '文字全部通过排版添加，未出现 AI 画错字的乱码', checked: false },
  { id: 5, text: '对话气泡位置合理，没有遮挡人物脸部与关键动作', checked: false }
])

async function fetchShots() {
  try {
    const [projectRes, shotsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/shots?projectId=${projectId}`)
    ])
    
    const projectJson = await projectRes.json()
    const shotsJson = await shotsRes.json()
    
    if (projectJson.success) {
      project.value = projectJson.data
    }
    
    if (shotsJson.success) {
      shots.value = shotsJson.data.filter((s: any) => s.finalImageUrl)
      
      // Initialize default bubble positions (bottom-left area)
      shots.value.forEach(shot => {
        if (shot.dialog && !bubblePositions.value[shot.id]) {
          bubblePositions.value[shot.id] = { x: 16, y: 16 } // Initial offset from bottom-left
        }
      })
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openExportFlow() {
  // Always prompt checklist first
  showChecklist.value = true
}

async function proceedToExport() {
  showChecklist.value = false
  await handleExport()
}

async function handleExport() {
  if (!comicContainer.value) return
  
  exporting.value = true
  try {
    const canvas = await html2canvas(comicContainer.value, {
      useCORS: true,
      scale: 2,
      backgroundColor: comicStyle.value.bgColor
    })
    
    const url = canvas.toDataURL('image/jpeg', 0.9)
    const link = document.createElement('a')
    link.download = `comic-export-${projectId}-${Date.now()}.jpg`
    link.href = url
    link.click()
    
    showToast({ message: '长图导出成功', type: 'success' })
  } catch (e) {
    console.error('Export failed', e)
    showToast({ message: '导出长图失败，请稍后重试', type: 'error' })
  } finally {
    exporting.value = false
  }
}

// Dragging logic handlers
let isDragging = false
let startX = 0
let startY = 0
let initialBubbleX = 0
let initialBubbleY = 0

function startDrag(event: MouseEvent | TouchEvent, shotId: number) {
  isDragging = true
  activeDraggableId.value = shotId
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  startX = clientX
  startY = clientY
  initialBubbleX = bubblePositions.value[shotId].x || 16
  initialBubbleY = bubblePositions.value[shotId].y || 16
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchend', stopDrag)
}

function onDrag(event: MouseEvent | TouchEvent) {
  if (!isDragging || activeDraggableId.value === null) return
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const deltaX = clientX - startX
  const deltaY = clientY - startY
  
  bubblePositions.value[activeDraggableId.value].x = initialBubbleX + deltaX
  // We negate deltaY because our coordinate system for the bubble originates from bottom (bottom-left)
  bubblePositions.value[activeDraggableId.value].y = initialBubbleY - deltaY
}

function stopDrag() {
  isDragging = false
  activeDraggableId.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
}

onMounted(() => {
  fetchShots()
})
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto" v-if="project?.type !== 'STATIC'">
    <div class="text-center py-32 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
      <div class="w-16 h-16 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Loader2 class="w-8 h-8 animate-spin" />
      </div>
      <h3 class="text-xl font-medium text-zinc-200 mb-2">正在开发中</h3>
      <p class="text-zinc-500 max-w-md mx-auto">
        当前项目类型为 <strong>{{ project?.type === 'DYNAMIC' ? '动态漫' : '配音漫剧' }}</strong>。
        <br/>
        针对这类项目，我们正在加紧接入 I2V 视频生成、时间轴轨道控制以及配音模型能力，敬请期待！
      </p>
    </div>
  </div>

  <div class="p-8 max-w-4xl mx-auto" v-else>
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">排版与合成</h1>
        <p class="text-zinc-400 mt-1">预览最终的条漫效果，调整气泡并导出</p>
      </div>
      <div class="flex gap-3">
        <button class="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700">
          <Share2 class="w-4 h-4" />
          分享预览
        </button>
        <button 
          @click="openExportFlow"
          :disabled="exporting || shots.length === 0"
          class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
        >
          <Loader2 v-if="exporting" class="w-4 h-4 animate-spin" />
          <Download v-else class="w-4 h-4" />
          {{ exporting ? '导出中...' : '导出长图' }}
        </button>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 items-start">
      <!-- Main Preview Area -->
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-8 shadow-2xl min-h-[600px] flex justify-center w-full lg:flex-1">
        <div v-if="loading" class="w-full max-w-md space-y-4 animate-pulse">
          <div v-for="i in 3" :key="i" class="w-full h-64 bg-zinc-800/50 rounded"></div>
        </div>

        <div v-else-if="shots.length === 0" class="text-center py-32">
          <p class="text-zinc-500">没有已定稿的镜头。请先在生产车间生成画面。</p>
        </div>

        <!-- Comic Strip Preview -->
        <div 
          v-else 
          ref="comicContainer" 
          class="w-full max-w-md flex flex-col shadow-2xl relative overflow-hidden transition-colors"
          :style="{ backgroundColor: comicStyle.bgColor, padding: `${comicStyle.padding}px` }"
        >
          <!-- Watermark -->
          <div class="absolute top-4 left-4 z-10 text-xs font-bold text-black/30 tracking-widest pointer-events-none mix-blend-overlay">AI COMIC PREVIEW</div>
          
          <div 
            v-for="(shot, index) in shots" 
            :key="shot.id"
            class="relative w-full overflow-hidden"
            :style="{ marginBottom: index !== shots.length - 1 ? `${comicStyle.gap}px` : '0' }"
          >
            <img :src="shot.finalImageUrl" class="w-full h-auto block rounded-sm shadow-inner select-none pointer-events-none" />
            
            <!-- Dialogue Bubble Overlay -->
            <div 
              v-if="shot.dialog && bubblePositions[shot.id]" 
              class="absolute z-20 cursor-move"
              :style="{ 
                left: `${bubblePositions[shot.id].x}px`, 
                bottom: `${bubblePositions[shot.id].y}px` 
              }"
              @mousedown="(e) => startDrag(e, shot.id)"
              @touchstart.prevent="(e) => startDrag(e, shot.id)"
            >
              <div 
                class="px-4 py-3 text-sm font-medium relative group"
                :class="[
                  comicStyle.bubbleStyle === 'classic' ? 'bg-white text-black rounded-2xl rounded-tl-sm border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : '',
                  comicStyle.bubbleStyle === 'modern' ? 'bg-black/80 backdrop-blur text-white rounded-lg border border-white/20 shadow-lg' : '',
                  comicStyle.bubbleStyle === 'thought' ? 'bg-white text-black rounded-full border-2 border-black px-6 py-4 italic shadow-[4px_4px_0px_rgba(0,0,0,1)]' : '',
                ]"
              >
                <!-- Classic bubble tail -->
                <div v-if="comicStyle.bubbleStyle === 'classic'" class="absolute -top-2 -left-0.5 w-3 h-3 bg-white border-l-2 border-t-2 border-black transform rotate-45"></div>
                
                <!-- Thought bubble tail -->
                <div v-if="comicStyle.bubbleStyle === 'thought'" class="absolute -bottom-3 left-4 w-4 h-4 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)]"></div>
                <div v-if="comicStyle.bubbleStyle === 'thought'" class="absolute -bottom-6 left-2 w-2 h-2 bg-white border-2 border-black rounded-full shadow-[1px_1px_0px_rgba(0,0,0,1)]"></div>
                
                <!-- Modern bubble tail -->
                <div v-if="comicStyle.bubbleStyle === 'modern'" class="absolute -bottom-1.5 left-6 w-3 h-3 bg-black/80 border-b border-r border-white/20 transform rotate-45"></div>

                {{ shot.dialog }}
                
                <!-- Drag Handle Indicator (visible on hover/active) -->
                <div class="absolute inset-0 border-2 border-dashed border-blue-500 rounded opacity-0 group-hover:opacity-100 pointer-events-none" :class="{ 'opacity-100': activeDraggableId === shot.id }"></div>
              </div>
            </div>
          </div>
          
          <div 
            class="mt-8 p-6 text-center text-xs font-bold tracking-widest border-t border-black/10"
            :class="comicStyle.bgColor === '#000000' ? 'text-zinc-500' : 'text-zinc-400'"
          >
            TO BE CONTINUED...
          </div>
        </div>
      </div>

      <!-- Controls Panel -->
      <div class="w-full lg:w-72 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl sticky top-8">
        <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Settings2 class="w-5 h-5 text-emerald-500" />
          样式设置
        </h3>
        
        <div class="space-y-6">
          <div>
            <label class="block text-xs font-medium text-zinc-400 mb-2 flex justify-between">
              <span>面板间距 (Gap)</span>
              <span class="text-emerald-500">{{ comicStyle.gap }}px</span>
            </label>
            <input type="range" v-model="comicStyle.gap" min="0" max="40" class="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1" />
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-400 mb-2 flex justify-between">
              <span>外边距 (Padding)</span>
              <span class="text-emerald-500">{{ comicStyle.padding }}px</span>
            </label>
            <input type="range" v-model="comicStyle.padding" min="0" max="40" class="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1" />
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-400 mb-2">背景颜色</label>
            <div class="flex gap-2">
              <button @click="comicStyle.bgColor = '#ffffff'" class="w-8 h-8 rounded-full bg-white border-2 border-zinc-700" :class="{'ring-2 ring-emerald-500 border-transparent': comicStyle.bgColor === '#ffffff'}"></button>
              <button @click="comicStyle.bgColor = '#000000'" class="w-8 h-8 rounded-full bg-black border-2 border-zinc-700" :class="{'ring-2 ring-emerald-500 border-transparent': comicStyle.bgColor === '#000000'}"></button>
              <button @click="comicStyle.bgColor = '#1e1e1e'" class="w-8 h-8 rounded-full bg-[#1e1e1e] border-2 border-zinc-700" :class="{'ring-2 ring-emerald-500 border-transparent': comicStyle.bgColor === '#1e1e1e'}"></button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-400 mb-2">气泡风格</label>
            <select v-model="comicStyle.bubbleStyle" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all">
              <option value="classic">日漫经典 (黑白+粗边框)</option>
              <option value="modern">现代毛玻璃 (黑底白字)</option>
              <option value="thought">内心独白 (圆润+云朵尾巴)</option>
            </select>
          </div>
          
          <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 leading-relaxed mt-4">
            💡 提示：将鼠标/手指放在画面上的文字气泡上，可以自由拖拽调整位置，以防遮挡重要画面内容。
          </div>
        </div>
      </div>
    </div>

    <!-- QA Checklist Modal -->
    <div v-if="showChecklist" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showChecklist = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl">
        <div class="flex items-center gap-3 mb-2">
          <CheckSquare class="w-6 h-6 text-emerald-500" />
          <h2 class="text-2xl font-bold text-white">发布前质检清单</h2>
        </div>
        <p class="text-zinc-400 text-sm mb-6">为了保证漫剧质量，建议在最终导出发布前逐项核对以下标准：</p>
        
        <div class="space-y-3 mb-8">
          <label 
            v-for="check in qaChecks" 
            :key="check.id"
            class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
            :class="check.checked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'"
          >
            <input type="checkbox" v-model="check.checked" class="mt-1 accent-emerald-500 w-4 h-4 rounded border-zinc-700" />
            <span class="text-sm leading-tight">{{ check.text }}</span>
          </label>
        </div>
        
        <div class="flex gap-3 justify-end items-center">
          <span class="text-xs text-zinc-500 mr-auto">
            已勾选 {{ qaChecks.filter(c => c.checked).length }} / {{ qaChecks.length }} 项
          </span>
          <button @click="showChecklist = false" class="px-5 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium text-sm">再检查一下</button>
          <button 
            @click="proceedToExport" 
            class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <Download class="w-4 h-4" />
            确认无误，导出
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
