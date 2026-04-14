<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Image as ImageIcon, Sparkles, Check, RefreshCw, Settings2, X, Save, Upload, RotateCcw } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const projectId = route.params.id
const { showToast } = useToast()

const shots = ref<any[]>([])
const assets = ref<any[]>([])
const loading = ref(true)

// store custom prompts per shot id
const customPrompts = ref<Record<number, { positive: string, negative: string }>>({})
const editingPromptId = ref<number | null>(null)

async function fetchData() {
  try {
    const [shotsRes, assetsRes] = await Promise.all([
      fetch(`/api/shots?projectId=${projectId}`),
      fetch(`/api/assets?projectId=${projectId}`)
    ])
    
    const shotsJson = await shotsRes.json()
    const assetsJson = await assetsRes.json()
    
    if (shotsJson.success) shots.value = shotsJson.data
    if (assetsJson.success) assets.value = assetsJson.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function buildPrompt(shot: any) {
  if (customPrompts.value[shot.id]) return customPrompts.value[shot.id]

  // Build positive prompt
  let positive = `best quality, masterpiece, ultra-detailed, 8k resolution, `
  positive += `(shot type: ${shot.shotType}), `
  
  // Add subjects and map assets if possible
  const subjects = shot.subject.split(/[,，、]/).map((s: string) => s.trim())
  const matchedAssets = assets.value.filter(a => subjects.some((sub: string) => a.name.includes(sub) || sub.includes(a.name)))
  
  const characters = matchedAssets.filter(a => a.type === 'ROLE')
  if (characters.length > 0) {
    characters.forEach(c => {
      positive += `1girl/1boy (${c.name}), ${c.anchors || ''}, ${c.clothing || ''}, `
    })
  } else {
    positive += `${shot.subject}, `
  }
  
  positive += `${shot.action}, ${shot.emotion}, ${shot.scene}, dramatic lighting, cinematic`
  
  // Build negative prompt
  let negative = `lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, `
  const forbiddens = matchedAssets.filter(a => a.forbidden).map(a => a.forbidden).join(', ')
  if (forbiddens) {
    negative += forbiddens
  }
  
  return { positive, negative }
}

function startEditPrompt(shot: any) {
  if (!customPrompts.value[shot.id]) {
    customPrompts.value[shot.id] = buildPrompt(shot)
  }
  editingPromptId.value = shot.id
}

function savePrompt(shotId: number) {
  editingPromptId.value = null
}

function cancelEditPrompt(shotId: number) {
  editingPromptId.value = null
  // Optionally reset to generated if they haven't saved before, but we'll just keep the draft.
}

function getCandidates(shot: any): string[] {
  if (!shot.candidates) return []
  try {
    return JSON.parse(shot.candidates)
  } catch {
    return []
  }
}

async function pickCandidate(shot: any, url: string) {
  shot.finalImageUrl = url
  shot.status = 'COMPLETED'
  try {
    await fetch(`/api/shots/${shot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED', finalImageUrl: url })
    })
    showToast({ message: '已选定此图为最终定稿', type: 'success' })
  } catch (e) {
    console.error(e)
    showToast({ message: '保存失败', type: 'error' })
  }
}

async function reroll(shot: any) {
  shot.finalImageUrl = null
  shot.candidates = null
  await simulateGenerate(shot)
}

async function simulateGenerate(shot: any) {
  shot.status = 'GENERATING'
  try {
    await fetch(`/api/shots/${shot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'GENERATING' })
    })
    
    // Simulate generation delay
    setTimeout(async () => {
      const promptData = buildPrompt(shot)
      const basePrompt = encodeURIComponent(promptData.positive)
      
      // Generate 4 mock images by appending different seeds to the prompt
      const mockUrls = [
        `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${basePrompt}&image_size=landscape_16_9&seed=1`,
        `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${basePrompt}&image_size=landscape_16_9&seed=2`,
        `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${basePrompt}&image_size=landscape_16_9&seed=3`,
        `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${basePrompt}&image_size=landscape_16_9&seed=4`
      ]
      
      shot.status = 'CANDIDATES_READY'
      shot.candidates = JSON.stringify(mockUrls)
      
      await fetch(`/api/shots/${shot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANDIDATES_READY', candidates: shot.candidates })
      })
      showToast({ message: '抽卡完成，请挑选一张定稿', type: 'info' })
    }, 3000)
  } catch (e) {
    console.error(e)
    shot.status = 'PENDING'
  }
}

async function handleManualUpload(event: Event, shot: any) {
  const targetEl = event.target as HTMLInputElement
  const file = targetEl.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  
  shot.status = 'GENERATING'
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const json = await res.json()
    if (json.success) {
      shot.status = 'COMPLETED'
      shot.finalImageUrl = json.url
      
      await fetch(`/api/shots/${shot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', finalImageUrl: json.url })
      })
      showToast({ message: '手动上传生图成功', type: 'success' })
    }
  } catch (e) {
    console.error(e)
    shot.status = 'PENDING'
    showToast({ message: '手动上传失败', type: 'error' })
  } finally {
    targetEl.value = ''
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">镜头生产车间</h1>
      <p class="text-zinc-400 mt-1">组装提示词并批量生成画面，在此处确认最终分镜图</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-32 bg-zinc-800/50 rounded-xl animate-pulse"></div>
    </div>

    <div v-else-if="shots.length === 0" class="text-center py-24 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
      <p class="text-zinc-500">剧本中还没有镜头，请先前往剧本编辑器添加分镜。</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="shot in shots" :key="shot.id" class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col md:flex-row">
        <!-- Left: Shot Info -->
        <div class="w-full md:w-1/3 p-6 border-r border-zinc-800 bg-zinc-950/50 flex flex-col">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-2 py-1 rounded">{{ shot.shotNumber }}</span>
            <span class="text-xs text-zinc-500 border border-zinc-800 px-2 py-1 rounded">{{ shot.shotType }}</span>
          </div>
          
          <div class="space-y-3 mb-6 flex-1">
            <div v-if="editingPromptId !== shot.id" class="group relative">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Positive Prompt</span>
                <button @click="startEditPrompt(shot)" class="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"><Settings2 class="w-3 h-3" /></button>
              </div>
              <p class="text-xs text-zinc-300 font-mono bg-zinc-900 p-2.5 rounded border border-emerald-900/30 leading-relaxed max-h-32 overflow-y-auto">
                {{ buildPrompt(shot).positive }}
              </p>
            </div>
            <div v-else class="group relative">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Edit Positive</span>
                <div class="flex gap-1">
                  <button @click="cancelEditPrompt(shot.id)" class="text-zinc-500 hover:text-zinc-300"><X class="w-3 h-3" /></button>
                  <button @click="savePrompt(shot.id)" class="text-emerald-500 hover:text-emerald-400"><Save class="w-3 h-3" /></button>
                </div>
              </div>
              <textarea v-model="customPrompts[shot.id].positive" rows="4" class="w-full text-xs text-zinc-300 font-mono bg-zinc-950 p-2.5 rounded border border-emerald-500/50 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"></textarea>
            </div>
            
            <div v-if="editingPromptId !== shot.id" class="group relative">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-xs font-bold text-rose-500 uppercase tracking-wider">Negative Prompt</span>
              </div>
              <p class="text-xs text-zinc-400 font-mono bg-zinc-900 p-2.5 rounded border border-rose-900/30 leading-relaxed max-h-24 overflow-y-auto">
                {{ buildPrompt(shot).negative }}
              </p>
            </div>
            <div v-else class="group relative">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-xs font-bold text-rose-500 uppercase tracking-wider">Edit Negative</span>
              </div>
              <textarea v-model="customPrompts[shot.id].negative" rows="3" class="w-full text-xs text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded border border-rose-500/50 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-rose-500"></textarea>
            </div>
          </div>
          
          <button 
            v-if="shot.status === 'PENDING' || shot.status === 'COMPLETED' || shot.status === 'CANDIDATES_READY'"
            @click="reroll(shot)"
            class="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-emerald-500 hover:text-black text-white font-medium rounded-lg transition-all border border-zinc-700 hover:border-emerald-500 group"
          >
            <Sparkles class="w-4 h-4 text-emerald-500 group-hover:text-black" />
            {{ (shot.status === 'COMPLETED' || shot.status === 'CANDIDATES_READY') ? '重新抽卡 (Re-roll)' : '开始抽卡 (Roll)' }}
          </button>
          <button 
            v-else-if="shot.status === 'GENERATING'"
            disabled
            class="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 text-emerald-500 font-medium rounded-lg border border-zinc-700 opacity-80 cursor-not-allowed"
          >
            <RefreshCw class="w-4 h-4 animate-spin" />
            抽卡生成中...
          </button>
        </div>

        <!-- Right: Generation Result -->
        <div class="w-full md:w-2/3 p-6 flex flex-col items-center justify-center bg-[#0a0a0a] min-h-[240px] relative group">
          <div v-if="shot.status === 'GENERATING'" class="grid grid-cols-2 gap-2 w-full h-full max-h-[360px]">
            <div v-for="i in 4" :key="i" class="bg-zinc-800/50 animate-pulse rounded-lg flex items-center justify-center">
              <div class="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          </div>
          
          <div v-else-if="shot.status === 'CANDIDATES_READY' && getCandidates(shot).length > 0" class="grid grid-cols-2 gap-2 w-full h-full max-h-[360px]">
            <div 
              v-for="(url, idx) in getCandidates(shot)" 
              :key="idx" 
              class="relative group/candidate rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all cursor-pointer"
            >
              <img :src="url" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/50 opacity-0 group/candidate-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                <button @click="pickCandidate(shot, url)" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transform scale-90 group/candidate-hover:scale-100 transition-all flex items-center gap-2">
                  <Check class="w-4 h-4" /> 选定此张
                </button>
              </div>
              <div class="absolute top-1 left-1 bg-black/80 text-white text-[10px] px-1.5 rounded">Seed: {{ idx + 1 }}</div>
            </div>
          </div>
          
          <div v-else-if="shot.finalImageUrl && shot.status === 'COMPLETED'" class="relative w-full h-full flex items-center justify-center">
            <img :src="shot.finalImageUrl" class="max-h-full max-w-full object-contain rounded shadow-2xl ring-1 ring-zinc-800" />
            <div class="absolute top-2 right-2 bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
              <Check class="w-3 h-3" /> 已定稿
            </div>
            
            <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button @click="reroll(shot)" class="flex items-center gap-1 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs rounded-md cursor-pointer backdrop-blur border border-zinc-700 shadow-lg">
                <RotateCcw class="w-3 h-3" /> 重新抽卡
              </button>
              <label class="flex items-center gap-1 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-white text-xs rounded-md cursor-pointer backdrop-blur border border-zinc-700 shadow-lg">
                <Upload class="w-3 h-3" /> 本地替换
                <input type="file" accept="image/*" class="hidden" @change="(e) => handleManualUpload(e, shot)" />
              </label>
            </div>
          </div>
          
          <div v-else class="text-zinc-600 flex flex-col items-center">
            <ImageIcon class="w-12 h-12 mb-3 opacity-50" />
            <p class="text-sm mb-4">等待抽卡</p>
            
            <label class="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm rounded-lg cursor-pointer transition-colors border border-zinc-800">
              <Upload class="w-4 h-4" /> 本地上传定稿
              <input type="file" accept="image/*" class="hidden" @change="(e) => handleManualUpload(e, shot)" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
