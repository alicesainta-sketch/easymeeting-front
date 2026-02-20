import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import '@/assets/icon/iconfont.css'
import '@/assets/base.scss'

import router from '@/router'

import { createApp } from 'vue'
import App from './App.vue'

import Titlabar from '@/components/Titlebar.vue'
import Header from '@/components/Header.vue'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)

app.component('Header', Header)
app.component('Titlebar', Titlabar)

app.mount('#app')
