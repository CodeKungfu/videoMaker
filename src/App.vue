<script setup lang="ts">
import { useRoute } from 'vue-router'
import Toast from '@/components/Toast.vue'
</script>

<template>
  <div class="min-h-screen bg-[#121212] text-zinc-300 font-sans antialiased">
    <router-view />
    <Toast />
  </div>
</template>

<style>
/* Global scrollbar styling for dark mode */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #1e1e1e;
}
::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #52525b;
}
</style>
