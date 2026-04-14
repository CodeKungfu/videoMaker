<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, FolderOpen, MoreVertical, Trash2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { showToast } = useToast()
const projects = ref<any[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const activeMenu = ref<number | null>(null)

const newProject = ref({ title: '', logline: '', type: 'STATIC' })

async function fetchProjects() {
  try {
    const res = await fetch('/api/projects')
    const json = await res.json()
    if (json.success) {
      projects.value = json.data
    }
  } catch (error) {
    console.error('Failed to fetch projects', error)
  } finally {
    loading.value = false
  }
}

async function createProject() {
  if (!newProject.value.title) return
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject.value)
    })
    const json = await res.json()
    if (json.success) {
      showCreateModal.value = false
      showToast({ message: '漫剧项目创建成功', type: 'success' })
      router.push(`/projects/${json.data.id}/script`)
    }
  } catch (error) {
    console.error('Failed to create project', error)
    showToast({ message: '创建失败，请检查网络或重试', type: 'error' })
  }
}

async function deleteProject(id: number) {
  if (!confirm('确定要删除这个项目吗？相关的分镜和资产将一并被删除。')) return
  try {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      projects.value = projects.value.filter(p => p.id !== id)
      showToast({ message: '项目已删除', type: 'success' })
    }
  } catch (error) {
    console.error('Failed to delete project', error)
    showToast({ message: '删除失败', type: 'error' })
  }
}

function toggleMenu(id: number, event: Event) {
  event.stopPropagation()
  if (activeMenu.value === id) {
    activeMenu.value = null
  } else {
    activeMenu.value = id
  }
}

// Click outside to close menu
onMounted(() => {
  fetchProjects()
  document.addEventListener('click', () => {
    activeMenu.value = null
  })
})
</script>

<template>
  <div class="max-w-6xl mx-auto p-8">
    <header class="flex items-center justify-between mb-12">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight">AI漫剧工作台</h1>
        <p class="text-zinc-400 mt-2">管理你的漫剧项目流水线</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
      >
        <Plus class="w-5 h-5" />
        新建项目
      </button>
    </header>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-56 bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-800/50 p-6 flex flex-col">
        <div class="w-3/4 h-6 bg-zinc-800 rounded mb-4"></div>
        <div class="w-full h-4 bg-zinc-800/80 rounded mb-2"></div>
        <div class="w-5/6 h-4 bg-zinc-800/80 rounded mb-auto"></div>
        <div class="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between">
          <div class="w-16 h-5 bg-zinc-800 rounded"></div>
          <div class="w-20 h-4 bg-zinc-800/50 rounded"></div>
        </div>
      </div>
    </div>

    <div v-else-if="projects.length === 0" class="text-center py-24 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
      <div class="w-16 h-16 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <FolderOpen class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-medium text-zinc-200 mb-2">暂无项目</h3>
      <p class="text-zinc-500 mb-6 max-w-sm mx-auto">你还没有创建任何漫剧项目，点击上方按钮开始你的第一部AI漫剧创作吧。</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="project in projects" 
        :key="project.id"
        @click="router.push(`/projects/${project.id}/script`)"
        class="group relative bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-900/20 overflow-hidden flex flex-col h-56"
      >
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
        
        <div class="flex justify-between items-start mb-4 relative z-10">
          <h3 class="text-xl font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate pr-4">{{ project.title }}</h3>
          
          <div class="relative" @click.stop>
            <button @click="(e) => toggleMenu(project.id, e)" class="text-zinc-500 hover:text-zinc-300 p-1 -mr-2 rounded-full hover:bg-zinc-800 transition-colors">
              <MoreVertical class="w-5 h-5" />
            </button>
            
            <div v-if="activeMenu === project.id" class="absolute right-0 top-full mt-1 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl py-1 z-10 animate-in fade-in zoom-in-95">
              <button 
                @click.stop="deleteProject(project.id)" 
                class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
              >
                <Trash2 class="w-4 h-4" /> 删除项目
              </button>
            </div>
          </div>
        </div>
        <p class="text-sm text-zinc-400 line-clamp-2 mb-auto leading-relaxed">{{ project.logline || '暂无描述' }}</p>
        <div class="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span class="bg-zinc-800 px-2 py-1 rounded text-zinc-300">{{ project.type === 'STATIC' ? '静态条漫' : project.type }}</span>
          <span>{{ new Date(project.updatedAt).toLocaleDateString() }}</span>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showCreateModal = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
        <h2 class="text-2xl font-bold text-white mb-6">新建漫剧项目</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">项目名称</label>
            <input v-model="newProject.title" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all" placeholder="例如：我的第一部修仙漫剧" />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">一句话卖点 (Logline)</label>
            <textarea v-model="newProject.logline" rows="3" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none" placeholder="一句话描述你的故事看点..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">漫剧类型</label>
            <select v-model="newProject.type" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none">
              <option value="STATIC">静态条漫 (推荐个人创作者起步)</option>
              <option value="DYNAMIC">动态漫</option>
              <option value="VOICED">配音漫剧</option>
            </select>
          </div>
        </div>
        <div class="mt-8 flex gap-3 justify-end">
          <button @click="showCreateModal = false" class="px-5 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium">取消</button>
          <button @click="createProject" :disabled="!newProject.title" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-all">创建并开始</button>
        </div>
      </div>
    </div>
  </div>
</template>
