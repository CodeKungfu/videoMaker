import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import ProjectLayout from '@/components/ProjectLayout.vue'
import ScriptEditor from '@/pages/ScriptEditor.vue'
import AssetLibrary from '@/pages/AssetLibrary.vue'
import ProductionRoom from '@/pages/ProductionRoom.vue'
import ComposeExport from '@/pages/ComposeExport.vue'
import Settings from '@/pages/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
  },
  {
    path: '/projects/:id',
    component: ProjectLayout,
    children: [
      { path: '', redirect: to => `/projects/${to.params.id}/script` },
      { path: 'script', name: 'script', component: ScriptEditor },
      { path: 'assets', name: 'assets', component: AssetLibrary },
      { path: 'production', name: 'production', component: ProductionRoom },
      { path: 'compose', name: 'compose', component: ComposeExport },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
