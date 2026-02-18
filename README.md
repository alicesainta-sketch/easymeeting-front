# EasyMeeting

EasyMeeting 是一款基于 Electron 和 Vue 3 构建的现代化视频会议桌面客户端应用，旨在提供流畅、高效的在线会议体验。

## ✨ 特性 (Features)

- **跨平台支持**：支持 Windows、macOS 和 Linux 系统。
- **现代化 UI**：基于 Element Plus 组件库，提供简洁美观的用户界面。
- **高效开发**：使用 Vite 构建，开发体验极速响应。
- **状态管理**：集成 Pinia 进行全局状态管理。
- **多媒体支持**：内置 FFmpeg 和 Artplayer，支持丰富的多媒体处理与播放能力。
- **实时通信**：集成 WebSocket 支持实时消息与会议信令。
- **本地化**：支持农历日历 (Lunar Calendar) 和 Moment.js 时间处理。

## 🛠️ 技术栈 (Tech Stack)

- **核心框架**：[Electron](https://www.electronjs.org/) + [Vue 3](https://vuejs.org/)
- **构建工具**：[Electron-Vite](https://electron-vite.org/)
- **UI 组件库**：[Element Plus](https://element-plus.org/)
- **路由管理**：[Vue Router](https://router.vuejs.org/)
- **状态管理**：[Pinia](https://pinia.vuejs.org/)
- **HTTP 请求**：[Axios](https://axios-http.com/)
- **本地存储**：[Electron Store](https://github.com/sindresorhus/electron-store)
- **多媒体**：@ffmpeg/core, artplayer
- **其他工具**：js-md5, vue-cookies, ws

## 💻 开发环境 (Recommended IDE Setup)

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## 🚀 快速开始 (Project Setup)

### 安装依赖 (Install)

```bash
$ npm install
```

### 启动开发环境 (Development)

```bash
$ npm run dev
```

### 构建应用 (Build)

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## 📂 目录结构 (Directory Structure)

```
├── build/             # 构建资源（图标等）
├── resources/         # 静态资源
├── src/
│   ├── main/          # Electron 主进程代码
│   ├── preload/       # 预加载脚本
│   └── renderer/      # Vue 渲染进程代码
│       ├── src/
│       │   ├── assets/    # 静态资源 (CSS, Images)
│       │   ├── components/# 公共组件
│       │   ├── router/    # 路由配置
│       │   ├── store/     # Pinia 状态管理
│       │   ├── views/     # 页面视图
│       │   ├── App.vue    # 根组件
│       │   └── main.js    # 入口文件
│       └── index.html     # 渲染进程入口 HTML
├── electron.vite.config.mjs # Vite 配置文件
├── electron-builder.yml     # 打包配置文件
└── package.json             # 项目配置与依赖
```
