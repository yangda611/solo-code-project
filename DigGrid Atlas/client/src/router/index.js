import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ExcavationView from '../views/ExcavationView.vue'
import SquareListView from '../views/SquareListView.vue'
import LogView from '../views/LogView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/squares',
    name: 'squares',
    component: SquareListView
  },
  {
    path: '/excavation/:id',
    name: 'excavation',
    component: ExcavationView
  },
  {
    path: '/logs/:id',
    name: 'logs',
    component: LogView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router