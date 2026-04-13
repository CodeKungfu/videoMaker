<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clapperboard, Users, Image as ImageIcon, LayoutTemplate, ArrowLeft, Video, Mic } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id

const project = ref<any>(null)

onMounted(async () => {
  try {
    const res = await fetch(`/api/projects/${projectId}`)
    const json = await res.json()
    if (json.success) {
      project.value = json.data
    }
  } catch (error) {
    console.error(error)
  }
})

// Dynamic tabs based on project type
const tabs = computed(() => {
  const baseTabs = [
    { name: '剧本与分镜', path: 'script', icon: Clapperboard },
    { name: '视觉Bible与资产', path: 'assets', icon: Users },
  ]
  
  if (project.value?.type === 'STATIC') {
    return [
      ...baseTabs,
      { name: '镜头生产车间', path: 'production', icon: ImageIcon },
      { name: '排版与合成', path: 'compose', icon: LayoutTemplate }
    ]
  } else if (project.value?.type === 'DYNAMIC') {
    return [
      ...baseTabs,
      { name: '动态关键帧生产', path: 'production', icon: ImageIcon },
      { name: '动效时间轴与导出', path: 'compose', icon: Video }
    ]
  } else if (project.value?.type === 'VOICED') {
    return [
      ...baseTabs,
      { name: '配音与镜头生产', path: 'production', icon: Mic },
      { name: '音视频混音导出', path: 'compose', icon: Video }
    ]
  }
  
  return baseTabs
})

const progressMap: Record<string, { percent: number, label: string }> = {
  'script': { percent: 25, label: 'Step 1: 分镜设计中' },
  'assets': { percent: 50, label: 'Step 2: 资产配置中' },
  'production': { percent: 75, label: 'Step 3: 镜头生产中' },
  'compose': { percent: 100, label: 'Step 4: 合成与质检' }
}

const currentProgress = computed(() => {
  const pathParts = route.path.split('/')
  const currentTab = pathParts[pathParts.length - 1]
  return progressMap[currentTab] || progressMap['script']
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#121212]">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      <div class="p-6 border-b border-zinc-800 flex items-center gap-3">
        <button @click="router.push('/')" class="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <h2 class="text-sm font-medium text-zinc-400">当前项目</h2>
          <p class="text-white font-bold truncate">{{ project?.title || '加载中...' }}</p>
        </div>
      </div>
      
      <nav class="flex-1 p-4 space-y-2">
        <router-link
          v-for="tab in tabs"
          :key="tab.path"
          :to="`/projects/${projectId}/${tab.path}`"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          :class="[
            route.path.endsWith(tab.path)
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          ]"
        >
          <component :is="tab.icon" class="w-5 h-5" />
          {{ tab.name }}
        </router-link>
      </nav>

      <div class="p-6 border-t border-zinc-800 space-y-4">
        <div class="flex items-center justify-between text-xs text-zinc-500 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
          <div class="text-center">
            <div class="font-bold text-zinc-300 text-lg leading-none mb-1">{{ project?._count?.shots || 0 }}</div>
            <div>分镜</div>
          </div>
          <div class="w-px h-6 bg-zinc-800"></div>
          <div class="text-center">
            <div class="font-bold text-zinc-300 text-lg leading-none mb-1">{{ project?._count?.assets || 0 }}</div>
            <div>资产</div>
          </div>
        </div>

        <div class="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div class="text-xs text-zinc-500 mb-1">制作进度</div>
          <div class="w-full bg-zinc-800 rounded-full h-1.5 mb-2 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500 ease-out" 
              :style="`width: ${currentProgress.percent}%`"
            ></div>
          </div>
          <div class="text-xs text-emerald-400 font-medium">{{ currentProgress.label }}</div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-[#121212] relative">
      <router-view />
    </main>
  </div>
</template>
