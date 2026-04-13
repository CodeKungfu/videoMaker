<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

const { toasts, removeToast } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return AlertCircle
    default: return Info
  }
}

const getColorClass = (type: string) => {
  switch (type) {
    case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'error': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md min-w-[280px] max-w-md transform transition-all duration-300"
        :class="getColorClass(toast.type)"
      >
        <component :is="getIcon(toast.type)" class="w-5 h-5 shrink-0" />
        <p class="text-sm font-medium text-white flex-1">{{ toast.message }}</p>
        <button @click="removeToast(toast.id)" class="text-zinc-400 hover:text-white transition-colors shrink-0">
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>