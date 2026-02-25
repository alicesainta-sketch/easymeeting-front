import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import '@/assets/icon/iconfont.css'
import '@/assets/base.scss'
import '@/assets/tailwind.css'

import router from '@/router'

import { createApp } from 'vue'
import App from './App.vue'

import Titlebar from '@/components/Titlebar.vue'
import Header from '@/components/Header.vue'
import { syncUserFromStore } from '@/utils/auth'

const bootstrap = async () => {
  await syncUserFromStore()

  const app = createApp(App)
  app.use(ElementPlus)
  app.use(router)

  app.component('AppHeader', Header)
  app.component('Titlebar', Titlebar)

  app.mount('#app')
}

bootstrap()
