<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Save, Key, Globe, Sparkles } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { showToast } = useToast()
const saving = ref(false)

const settings = ref({
  openaiApiKey: '',
  sdWebuiUrl: 'http://127.0.0.1:7860',
  midjourneyApiToken: '',
  comfyUiUrl: 'http://127.0.0.1:8188'
})

async function fetchSettings() {
  try {
    const res = await fetch('/api/settings')
    const json = await res.json()
    if (json.success && json.data) {
      // Merge fetched settings with default structure
      Object.keys(settings.value).forEach(key => {
        if (json.data[key] !== undefined) {
          (settings.value as any)[key] = json.data[key]
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch settings', error)
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings.value)
    })
    const json = await res.json()
    if (json.success) {
      showToast({ message: '设置已保存', type: 'success' })
    } else {
      throw new Error('Save failed')
    }
  } catch (error) {
    console.error('Failed to save settings', error)
    showToast({ message: '设置保存失败', type: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="min-h-screen bg-[#121212] p-8">
    <div class="max-w-3xl mx-auto">
      <header class="flex items-center justify-between mb-12">
        <div class="flex items-center gap-4">
          <button @click="router.push('/')" class="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft class="w-6 h-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-white tracking-tight">系统设置</h1>
            <p class="text-zinc-400 mt-2">配置您的本地 AI 绘画工具地址与云端 API 凭证</p>
          </div>
        </div>
        <button 
          @click="saveSettings"
          :disabled="saving"
          class="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
        >
          <Save class="w-5 h-5" />
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </header>

      <div class="space-y-8">
        <!-- Local AI Tools -->
        <section class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div class="p-6 border-b border-zinc-800 bg-zinc-800/30 flex items-center gap-3">
            <Globe class="w-5 h-5 text-emerald-500" />
            <h2 class="text-xl font-bold text-white">本地 AI 绘画服务</h2>
          </div>
          <div class="p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">Stable Diffusion WebUI 地址</label>
              <input 
                v-model="settings.sdWebuiUrl" 
                type="text" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono" 
                placeholder="例如: http://127.0.0.1:7860" 
              />
              <p class="text-xs text-zinc-500 mt-2">确保在 WebUI 启动参数中开启了 --api 模式。</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">ComfyUI 地址</label>
              <input 
                v-model="settings.comfyUiUrl" 
                type="text" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono" 
                placeholder="例如: http://127.0.0.1:8188" 
              />
              <p class="text-xs text-zinc-500 mt-2">用于连接本地 ComfyUI 工作流以生成高可控画面。</p>
            </div>
          </div>
        </section>

        <!-- Cloud API Keys -->
        <section class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div class="p-6 border-b border-zinc-800 bg-zinc-800/30 flex items-center gap-3">
            <Key class="w-5 h-5 text-blue-400" />
            <h2 class="text-xl font-bold text-white">云端 API 凭证</h2>
          </div>
          <div class="p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">OpenAI API Key</label>
              <input 
                v-model="settings.openaiApiKey" 
                type="password" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono" 
                placeholder="sk-..." 
              />
              <p class="text-xs text-zinc-500 mt-2">用于自动润色分镜描述、智能补充提示词或多语言翻译。</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-zinc-300 mb-2">Midjourney / 其他云端绘画 API Token</label>
              <input 
                v-model="settings.midjourneyApiToken" 
                type="password" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono" 
                placeholder="输入您的 Token" 
              />
              <p class="text-xs text-zinc-500 mt-2">若使用第三方聚合中转 API 来调用 Midjourney，请在此填入 Token。</p>
            </div>
          </div>
        </section>
        
        <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
          <Sparkles class="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div class="text-sm text-emerald-400/90 leading-relaxed">
            <p class="font-bold mb-1">系统提示：</p>
            这些配置仅保存在您本地的 SQLite 数据库中，不会上传至任何云端服务器，请放心填写。配置完成后，将在“生产车间”的未来版本中调用这些服务生成画面。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>