<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Trash2, GripVertical, Check } from 'lucide-vue-next'

const route = useRoute()
const projectId = route.params.id

const shots = ref<any[]>([])
const loading = ref(true)

const newShot = ref({
  shotNumber: '',
  shotType: '近景',
  subject: '',
  action: '',
  emotion: '',
  scene: '',
  dialog: ''
})

async function fetchShots() {
  try {
    const res = await fetch(`/api/shots?projectId=${projectId}`)
    const json = await res.json()
    if (json.success) {
      shots.value = json.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function addShot() {
  if (!newShot.value.shotNumber || !newShot.value.subject) return
  try {
    const res = await fetch(`/api/shots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newShot.value, projectId })
    })
    const json = await res.json()
    if (json.success) {
      shots.value.push(json.data)
      newShot.value = { shotNumber: '', shotType: '近景', subject: '', action: '', emotion: '', scene: '', dialog: '' }
    }
  } catch (e) {
    console.error(e)
  }
}

async function deleteShot(id: number) {
  try {
    await fetch(`/api/shots/${id}`, { method: 'DELETE' })
    shots.value = shots.value.filter(s => s.id !== id)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchShots()
})
</script>

<template>
  <div class="p-8 max-w-5xl mx-auto">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">剧本与分镜编辑器</h1>
        <p class="text-zinc-400 mt-1">按照“场-镜头”拆解剧本，生成每一格的可视化参数</p>
      </div>
    </div>

    <!-- Skeleton Loader -->
    <div v-if="loading" class="space-y-6 mb-12">
      <div v-for="i in 3" :key="i" class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg animate-pulse flex gap-4">
        <div class="w-8 h-8 rounded-full bg-zinc-800 shrink-0"></div>
        <div class="flex-1 space-y-4">
          <div class="flex gap-4">
            <div class="w-16 h-6 bg-zinc-800 rounded"></div>
            <div class="w-12 h-6 bg-zinc-800 rounded"></div>
          </div>
          <div class="grid grid-cols-4 gap-4">
            <div class="h-16 bg-zinc-800/50 rounded-lg"></div>
            <div class="h-16 bg-zinc-800/50 rounded-lg"></div>
            <div class="h-16 bg-zinc-800/50 rounded-lg"></div>
            <div class="h-16 bg-zinc-800/50 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shot List -->
    <div v-else class="space-y-6 mb-12">
      <div v-for="(shot, index) in shots" :key="shot.id" class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg group">
        <div class="flex gap-4">
          <div class="flex flex-col items-center pt-1 cursor-grab text-zinc-600 hover:text-zinc-400">
            <GripVertical class="w-5 h-5 mb-2" />
            <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 border border-zinc-700">
              {{ index + 1 }}
            </div>
          </div>
          
          <div class="flex-1 grid grid-cols-12 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-medium text-zinc-500 mb-1">镜头编号</label>
              <div class="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-2 py-1 rounded inline-block">{{ shot.shotNumber }}</div>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-medium text-zinc-500 mb-1">景别</label>
              <div class="text-zinc-300 text-sm">{{ shot.shotType }}</div>
            </div>
            <div class="col-span-8 flex justify-end">
              <button @click="deleteShot(shot.id)" class="text-zinc-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
              <div class="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
                <span class="text-xs text-zinc-500 block mb-1">画面主体</span>
                <p class="text-zinc-200 text-sm">{{ shot.subject }}</p>
              </div>
              <div class="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
                <span class="text-xs text-zinc-500 block mb-1">动作描述</span>
                <p class="text-zinc-200 text-sm">{{ shot.action }}</p>
              </div>
              <div class="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
                <span class="text-xs text-zinc-500 block mb-1">角色情绪</span>
                <p class="text-zinc-200 text-sm">{{ shot.emotion }}</p>
              </div>
              <div class="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
                <span class="text-xs text-zinc-500 block mb-1">场景环境</span>
                <p class="text-zinc-200 text-sm">{{ shot.scene }}</p>
              </div>
            </div>
            
            <div class="col-span-12 mt-2" v-if="shot.dialog">
              <div class="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50 border-l-2 border-l-emerald-500">
                <span class="text-xs text-zinc-500 block mb-1">对白 / 旁白</span>
                <p class="text-zinc-300 text-sm italic">"{{ shot.dialog }}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="shots.length === 0" class="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
        <p class="text-zinc-500">暂无分镜数据，请在下方添加第一个镜头。</p>
      </div>
    </div>

    <!-- Add Shot Form -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      <div class="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
      <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Plus class="w-5 h-5 text-emerald-500" />
        添加新镜头
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div class="md:col-span-3">
          <label class="block text-xs font-medium text-zinc-400 mb-1.5">镜头编号</label>
          <input v-model="newShot.shotNumber" type="text" placeholder="S01-01" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-mono" />
        </div>
        <div class="md:col-span-3">
          <label class="block text-xs font-medium text-zinc-400 mb-1.5">景别</label>
          <select v-model="newShot.shotType" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none">
            <option>特写</option>
            <option>近景</option>
            <option>中景</option>
            <option>全景</option>
            <option>远景</option>
          </select>
        </div>
        <div class="md:col-span-6">
          <label class="block text-xs font-medium text-zinc-400 mb-1.5">画面主体 (谁)</label>
          <input v-model="newShot.subject" type="text" placeholder="例如：男主林风" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
        </div>
        
        <div class="md:col-span-4">
          <label class="block text-xs font-medium text-zinc-400 mb-1.5">动作 (做什么)</label>
          <input v-model="newShot.action" type="text" placeholder="拔出长剑" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
        </div>
        <div class="md:col-span-4">
          <label class="block text-xs font-medium text-zinc-400 mb-1.5">情绪 (表情)</label>
          <input v-model="newShot.emotion" type="text" placeholder="愤怒、咬牙切齿" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
        </div>
        <div class="md:col-span-4">
          <label class="block text-xs font-medium text-zinc-400 mb-1.5">场景 (地点/光影)</label>
          <input v-model="newShot.scene" type="text" placeholder="雨夜、破庙、冷色调" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
        </div>

        <div class="md:col-span-10">
          <label class="block text-xs font-medium text-zinc-400 mb-1.5">对白/旁白 (可选)</label>
          <input v-model="newShot.dialog" type="text" placeholder="“今天就是你的死期！”" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
        </div>
        <div class="md:col-span-2 flex items-end mt-4 md:mt-0">
          <button 
            @click="addShot"
            :disabled="!newShot.shotNumber || !newShot.subject"
            class="w-full h-[38px] flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-lg transition-all"
          >
            <Check class="w-4 h-4" /> 保存镜头
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
