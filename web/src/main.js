import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)
// 全量注册 Element Plus 图标
for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}
// 全量注册 Element Plus 组件（学习阶段最简单；生产环境可改按需引入减小体积）
app.use(ElementPlus, { locale: zhCn }).mount('#app')
