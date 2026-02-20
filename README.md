# EasyMeeting

EasyMeeting 是一个基于 Electron + Vue 3 的桌面端项目，目前主要完成了登录/注册页面的 UI 与交互演示。

## 当前实现

- 自定义窗口标题栏（最小化、最大化/还原、关闭）。
- 登录/注册模式切换（含窗口高度切换）。
- 表单校验：
  - 邮箱格式校验
  - 昵称长度校验
  - 密码长度校验
  - 二次密码一致性校验
  - 验证码校验
- 本地验证码生成与刷新（前端 SVG，无后端依赖）。
- 登录/注册提交流程的前端演示（含 loading 与提示）。

## 说明

- 当前登录/注册接口未接入后端，提交结果为前端演示逻辑。
- 如果后续接入接口，可直接在 `src/renderer/src/views/Login/login.vue` 的提交逻辑中替换。

## 技术栈

- Electron
- Vue 3
- Element Plus
- Electron-Vite
- Vue Router
- ESLint + Prettier

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 代码检查

```bash
npx eslint . --no-cache --config eslint.config.mjs
```

### 构建

```bash
npm run build
```

### 平台打包

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## 目录结构

```text
├── build/
├── resources/
├── src/
│   ├── main/
│   ├── preload/
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── assets/
│           ├── components/
│           ├── router/
│           ├── views/
│           ├── App.vue
│           └── main.js
├── electron-builder.yml
├── electron.vite.config.mjs
└── package.json
```

## 后续开发计划（接接口/状态管理/页面路由）

- 接接口：抽离 `auth` 模块，统一封装登录、注册、验证码相关 API，请求层集中处理错误码与超时，并在登录页替换当前演示逻辑。
- 状态管理：引入 Pinia 用户模块，维护登录态、用户信息与 token，同步持久化到本地存储，应用启动时自动恢复会话。
- 页面路由：基于业务拆分路由（登录、首页、会议列表、会议详情等），补充路由守卫（未登录重定向登录）与基础页面骨架。
