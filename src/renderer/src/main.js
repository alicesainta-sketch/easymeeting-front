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
import { isAuthenticated, syncUserFromStore } from '@/utils/auth'

const bootstrap = async () => {
  const app = createApp(App)
  app.use(ElementPlus)
  app.use(router)

  app.component('AppHeader', Header)
  app.component('Titlebar', Titlebar)

  app.mount('#app')

  // 首屏优先渲染：先挂载应用，再异步同步持久化登录态。
  const authBeforeSync = isAuthenticated()
  try {
    await syncUserFromStore()
  } finally {
    // 如果同步前后登录态发生变化，纠正初始路由。
    const authAfterSync = isAuthenticated()
    if (authBeforeSync !== authAfterSync) {
      const targetPath = authAfterSync ? '/meetings' : '/'
      router.isReady().then(() => {
        if (router.currentRoute.value.path !== targetPath) {
          router.replace(targetPath)
        }
      })
    }
  }
}

bootstrap()
