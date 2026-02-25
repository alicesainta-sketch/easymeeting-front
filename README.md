# EasyMeeting

EasyMeeting 是一个基于 Electron + Vue 3 的桌面端会议演示项目，当前阶段聚焦“纯前端可运行、可演示、可迭代”的会议业务闭环。

## 最新开发进展

### 已完成能力（当前版本）

#### 1) 桌面壳与工作区切换

- 自定义窗口标题栏（最小化、最大化/还原、关闭）。
- 登录区 / 会议区工作模式切换联动。

#### 2) 登录与鉴权

- 登录/注册模式切换与表单校验（邮箱、昵称、密码、验证码）。
- 本地验证码生成与刷新（SVG）。
- 路由守卫：未登录无法进入会议模块。

#### 3) 会议管理（列表 + 详情）

- 会议中心看板：概览指标、今日安排、冲突预警、时间线视图。
- 会议列表：检索、状态筛选、排序、倒计时、卡片/时间线双视图。
- 会议操作：新建、编辑、复制、删除、复制房间号。
- 会议详情：基础信息、议程、参会人、备注、状态进度、风险提示、会前检查清单、关键里程碑。
- 冲突检测：会议室占用冲突 + 参会人时间冲突（本地计算）。
- 会前提醒：手动提醒与自动提醒（10 分钟/1 分钟）。

#### 3.1) 会议创建体验升级

- 分区式编辑弹窗：核心信息 / 权限策略 / 参会人与议程。
- 右侧实时预览：时间、时长、参会人、议程与会议策略。
- 完成度进度条：引导信息填写完整度。

#### 4) 会议房间（纯前端演示）

- 会前检查：
  - 摄像头/麦克风预览（`getUserMedia`）。
  - 设备切换、昵称设置、设备状态提示。
  - 会前设置本地持久化（昵称、设备、开关状态）。
- 房间内：
  - 主舞台 + 参会者侧栏 + 聊天侧栏。
  - 麦克风/摄像头/举手/共享屏幕（本地模拟）控制。
  - 参会者状态动态展示（麦克风、摄像头、举手、共享）。
  - 本地聊天 + 远端消息模拟 + 表情选择器。
  - 快捷键支持（`M` 麦克风、`V` 摄像头、`R` 举手）。

#### 5) 代码结构演进（已完成）

- 会议房间从单文件拆分为模块化结构：
  - 视图装配层：`src/renderer/src/views/Meeting/room.vue`
  - 房间编排逻辑：`src/renderer/src/views/Meeting/composables/useMeetingRoom.js`
  - 媒体子模块：`src/renderer/src/views/Meeting/composables/room/useRoomMedia.js`
  - 远端模拟子模块：`src/renderer/src/views/Meeting/composables/room/useRoomSimulation.js`
  - 样式模块：`src/renderer/src/views/Meeting/styles/room.scss`

#### 6) 本地持久化与回退

- Electron 环境：`electron-store`。
- Web 环境：自动回退 `localStorage`。

## 技术栈

- Electron
- Vue 3
- Element Plus
- Electron-Vite
- Vue Router
- TailwindCSS + PostCSS
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
npm run lint
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

## 目录结构（核心）

```text
src/renderer/src/
├── components/
├── mock/
├── router/
├── utils/
└── views/
    ├── Login/
    └── Meeting/
        ├── components/
        ├── composables/
        │   ├── room/
        │   │   ├── useRoomMedia.js
        │   │   └── useRoomSimulation.js
        │   └── useMeetingRoom.js
        ├── styles/
        │   └── room.scss
        ├── list.vue
        ├── detail.vue
        └── room.vue
```

## UI 设计与体验策略

- 会议中心作为“运营看板”呈现：指标 + 冲突预警 + 时间线。
- 详情页采用主副栏结构：主栏承载内容，副栏承载状态/风险/清单。
- 表单强调“即时反馈”：输入即预览，提升可解释性与完成度可视化。

## 下一阶段开发计划（会议项目路线图）

### Phase 1：会议角色与会中控制

- 角色体系：主持人 / 联席主持人 / 参会者。
- 主持人控制台：
  - 全员静音、允许/禁止参会者自行开麦。
  - 锁定会议、移出参会者、指定联席主持人。
- 举手队列面板：按时间排序、主持人一键允许发言。

### Phase 2：入会流程与会议安全

- 等候室（Waiting Room）：
  - 参会者先进入等候室，主持人批准入会。
  - 批量通过/拒绝、自动通过白名单。
- 入会策略：
  - 房间密码、昵称规则、重复昵称检测。
  - 会议开始前禁止普通参会者入会（可配置）。

### Phase 3：共享与协作能力

- 屏幕共享增强：
  - 共享源切换（窗口/屏幕）与共享状态广播。
  - 共享申请与主持人审批流程。
- 白板协作：
  - 画笔、文本、撤销/重做。
  - 白板快照导出与会后回看。

### Phase 4：消息与会后产出

- 会中聊天升级：
  - 公聊 / 私聊、@提醒、消息搜索。
  - 常用快捷回复与表情扩展包。
- 会后产出：
  - 自动生成会议纪要草稿（议题、结论、待办）。
  - 待办分配（负责人、截止时间、状态流转）。

### Phase 5：稳定性与工程化

- 会议状态事件总线（可回放时间线）。
- 异常恢复：设备断连、权限变更、页面重入恢复。
- 测试体系：
  - 会议流程单元测试与关键交互 E2E 用例。
  - 房间模块回归测试清单与发布前检查脚本。

## 说明

- 当前版本定位为纯前端演示，不依赖后端接口。
- 若演进到多人实时音视频，需要引入信令服务与 STUN/TURN。
