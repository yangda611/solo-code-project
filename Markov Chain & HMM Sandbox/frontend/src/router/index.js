import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ModelEditor from '../views/ModelEditor.vue'
import SteadyState from '../views/SteadyState.vue'
import ViterbiPath from '../views/ViterbiPath.vue'
import PosteriorProb from '../views/PosteriorProb.vue'
import BaumWelch from '../views/BaumWelch.vue'
import Presets from '../views/Presets.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/editor', component: ModelEditor },
  { path: '/steady-state', component: SteadyState },
  { path: '/viterbi', component: ViterbiPath },
  { path: '/posterior', component: PosteriorProb },
  { path: '/baum-welch', component: BaumWelch },
  { path: '/presets', component: Presets }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
