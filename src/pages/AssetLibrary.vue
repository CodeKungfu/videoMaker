<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Trash2, User, Image as ImageIcon, Box, Edit2, X, Check, Upload, Loader2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const projectId = route.params.id
const { showToast } = useToast()

const assets = ref<any[]>([])
const loading = ref(true)
const uploading = ref(false)

const defaultNewAsset = {
  type: 'ROLE',
  name: '',
  anchors: '',
  clothing: '',
  forbidden: '',
  referenceUrl: ''
}
const newAsset = ref({ ...defaultNewAsset })

const editingAssetId = ref<number | null>(null)
const editingAsset = ref<any>({})

const assetTypes = [
  { value: 'ROLE', label: '角色设定', icon: User },
  { value: 'SCENE', label: '场景设定', icon: ImageIcon },
  { value: 'PROP', label: '关键道具', icon: Box },
]

async function fetchAssets() {
  try {
    const res = await fetch(`/api/assets?projectId=${projectId}`)
    const json = await res.json()
    if (json.success) {
      assets.value = json.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function addAsset() {
  if (!newAsset.value.name) return
  try {
    const res = await fetch(`/api/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAsset.value, projectId })
    })
    const json = await res.json()
    if (json.success) {
      assets.value.unshift(json.data)
      newAsset.value = { ...defaultNewAsset }
    }
  } catch (e) {
    console.error(e)
  }
}

async function deleteAsset(id: number) {
  if(!confirm('确定要删除这个资产吗？')) return
  try {
    await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    assets.value = assets.value.filter(a => a.id !== id)
  } catch (e) {
    console.error(e)
  }
}

function startEdit(asset: any) {
  editingAssetId.value = asset.id
  editingAsset.value = { ...asset }
}

function cancelEdit() {
  editingAssetId.value = null
  editingAsset.value = {}
}

async function saveEdit() {
  try {
    const res = await fetch(`/api/assets/${editingAssetId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingAsset.value)
    })
    const json = await res.json()
    if (json.success) {
      const index = assets.value.findIndex(a => a.id === editingAssetId.value)
      if (index !== -1) {
        assets.value[index] = json.data
      }
      cancelEdit()
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleUpload(event: Event, target: 'new' | 'edit') {
  const targetEl = event.target as HTMLInputElement
  const file = targetEl.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  
  uploading.value = true
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const json = await res.json()
    if (json.success) {
      if (target === 'new') {
        newAsset.value.referenceUrl = json.url
      } else {
        editingAsset.value.referenceUrl = json.url
      }
      showToast({ message: '图片上传成功', type: 'success' })
    }
  } catch (e) {
    console.error(e)
    showToast({ message: '图片上传失败', type: 'error' })
  } finally {
    uploading.value = false
    targetEl.value = '' // clear input
  }
}

onMounted(() => {
  fetchAssets()
})
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">视觉Bible与资产库</h1>
      <p class="text-zinc-400 mt-1">管理项目的核心角色、场景与道具，确保生成一致性</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Add Asset Form -->
      <div class="lg:col-span-1">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl sticky top-8">
          <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Plus class="w-5 h-5 text-emerald-500" />
            添加新资产
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">资产类型</label>
              <div class="grid grid-cols-3 gap-2">
                <button 
                  v-for="t in assetTypes" 
                  :key="t.value"
                  @click="newAsset.type = t.value"
                  class="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all"
                  :class="newAsset.type === t.value ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'"
                >
                  <component :is="t.icon" class="w-4 h-4" />
                  <span class="text-[10px]">{{ t.label }}</span>
                </button>
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">资产名称</label>
              <input v-model="newAsset.name" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" placeholder="例如：男主林风 / 破庙" />
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">外形锚点 (必须出现)</label>
              <textarea v-model="newAsset.anchors" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none" placeholder="黑发，红瞳，左脸刀疤..."></textarea>
            </div>

            <div v-if="newAsset.type === 'ROLE'">
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">服装描述 (默认套装)</label>
              <textarea v-model="newAsset.clothing" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none" placeholder="黑色长袍，带金色滚边..."></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">禁用元素 (负向提示词)</label>
              <textarea v-model="newAsset.forbidden" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all resize-none" placeholder="现代服饰，眼镜，短发..."></textarea>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-zinc-400 mb-1.5">参考图 (可选)</label>
              <div class="relative w-full h-32 bg-zinc-950 border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-500 transition-all cursor-pointer overflow-hidden group">
                <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="(e) => handleUpload(e, 'new')" :disabled="uploading" />
                <div v-if="uploading && newAsset.referenceUrl === ''" class="flex flex-col items-center">
                  <Loader2 class="w-6 h-6 animate-spin mb-2 text-emerald-500" />
                  <span class="text-xs">上传中...</span>
                </div>
                <div v-else-if="newAsset.referenceUrl" class="w-full h-full relative">
                  <img :src="newAsset.referenceUrl" class="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" />
                  <div class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <Upload class="w-6 h-6 mb-2 drop-shadow-md" />
                    <span class="text-xs font-bold drop-shadow-md">点击更换</span>
                  </div>
                </div>
                <div v-else class="flex flex-col items-center">
                  <Upload class="w-6 h-6 mb-2" />
                  <span class="text-xs">点击或拖拽上传图片</span>
                </div>
              </div>
            </div>
            
            <button 
              @click="addAsset"
              :disabled="!newAsset.name"
              class="w-full py-2.5 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-lg transition-all"
            >
              保存资产
            </button>
          </div>
        </div>
      </div>

      <!-- Assets List -->
      <div class="lg:col-span-2">
        <div v-if="loading" class="grid grid-cols-2 gap-4">
          <div v-for="i in 4" :key="i" class="h-40 bg-zinc-800/50 rounded-xl animate-pulse"></div>
        </div>
        
        <div v-else-if="assets.length === 0" class="text-center py-24 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <p class="text-zinc-500">资产库空空如也，请先添加角色或场景设定。</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="asset in assets" :key="asset.id" class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group transition-all">
            <!-- Normal View -->
            <div v-if="editingAssetId !== asset.id">
              <div class="p-4 border-b border-zinc-800/50 flex justify-between items-start bg-zinc-800/20">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 bg-zinc-800 rounded-md text-emerald-400">
                    <User v-if="asset.type === 'ROLE'" class="w-4 h-4" />
                    <ImageIcon v-else-if="asset.type === 'SCENE'" class="w-4 h-4" />
                    <Box v-else class="w-4 h-4" />
                  </div>
                  <h4 class="font-bold text-zinc-100">{{ asset.name }}</h4>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="startEdit(asset)" class="text-zinc-500 hover:text-emerald-400 p-1 rounded-md hover:bg-zinc-800">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button @click="deleteAsset(asset.id)" class="text-zinc-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div class="p-4 flex gap-4">
                <div v-if="asset.referenceUrl" class="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-zinc-800">
                  <img :src="asset.referenceUrl" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 space-y-3">
                  <div v-if="asset.anchors">
                    <span class="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mb-1 block">外形锚点</span>
                    <p class="text-sm text-zinc-300">{{ asset.anchors }}</p>
                  </div>
                  <div v-if="asset.clothing && asset.type === 'ROLE'">
                    <span class="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1 block">服装设定</span>
                    <p class="text-sm text-zinc-300">{{ asset.clothing }}</p>
                  </div>
                  <div v-if="asset.forbidden">
                    <span class="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-1 block">禁用元素</span>
                    <p class="text-sm text-zinc-400 line-through decoration-red-500/30">{{ asset.forbidden }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit View -->
            <div v-else class="p-4 space-y-3 bg-zinc-900 border-2 border-emerald-500/50 rounded-xl">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-bold text-emerald-400 flex items-center gap-2"><Edit2 class="w-4 h-4" />编辑模式</span>
                <div class="flex gap-2">
                  <button @click="cancelEdit" class="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800"><X class="w-4 h-4" /></button>
                  <button @click="saveEdit" class="p-1 text-emerald-500 hover:text-emerald-400 rounded-md hover:bg-emerald-500/10"><Check class="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <label class="block text-[10px] text-zinc-500 mb-1">名称</label>
                <input v-model="editingAsset.name" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white" />
              </div>
              <div>
                <label class="block text-[10px] text-emerald-500 mb-1">外形锚点</label>
                <textarea v-model="editingAsset.anchors" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white resize-none"></textarea>
              </div>
              <div v-if="editingAsset.type === 'ROLE'">
                <label class="block text-[10px] text-blue-400 mb-1">服装设定</label>
                <textarea v-model="editingAsset.clothing" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white resize-none"></textarea>
              </div>
              <div>
                <label class="block text-[10px] text-red-400 mb-1">禁用元素</label>
                <textarea v-model="editingAsset.forbidden" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white resize-none"></textarea>
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">参考图</label>
                <div class="relative w-24 h-24 bg-zinc-950 border border-zinc-800 rounded cursor-pointer group overflow-hidden">
                  <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" @change="(e) => handleUpload(e, 'edit')" :disabled="uploading" />
                  <img v-if="editingAsset.referenceUrl" :src="editingAsset.referenceUrl" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload class="w-4 h-4 text-white mb-1" />
                    <span class="text-[10px] text-white">更换</span>
                  </div>
                  <div v-if="!editingAsset.referenceUrl" class="absolute inset-0 flex items-center justify-center text-zinc-600">
                    <Upload class="w-5 h-5" />
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
