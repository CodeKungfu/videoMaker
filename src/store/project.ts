import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const currentProjectId = ref<number | null>(null)
  
  function setCurrentProject(id: number) {
    currentProjectId.value = id
  }

  return { currentProjectId, setCurrentProject }
})
