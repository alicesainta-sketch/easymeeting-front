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
- 会议模块（纯前端）：
  - 会议列表（搜索、状态筛选、状态标签）
  - 新建会议（本地数据写入）
  - 编辑/删除会议
  - 会议倒计时（列表/详情实时刷新）
  - 本地提醒（手动提醒 + 临近开会自动提醒 + 阈值配置）
  - 会议详情（基础信息、议程、参会人、备注）
  - 登录后自动进入会议工作区，未登录限制访问会议路由
- 本地持久化：登录状态与会议数据通过 `electron-store` 持久化保存（含 web fallback）。

## 说明

- 本项目定位为纯前端项目，不对接后端服务。
- 登录/注册提交结果使用本地演示逻辑，不依赖远程接口。

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

## 后续开发计划（纯前端）

- 页面扩展：新增首页、会议列表、会议详情等页面，并完善路由结构与页面骨架。
- 本地状态：按需引入 Pinia，使用本地存储维护用户信息和界面状态。
- 本地数据：通过静态 JSON 或本地 mock 数据驱动业务流程，保持离线可演示。
