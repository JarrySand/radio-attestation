import { createRouter, createWebHistory } from 'vue-router'
import RadioStation from '../components/RadioStation.vue'
import Home from '../components/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/:walletAddress',
    name: 'RadioStation',
    component: RadioStation,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
