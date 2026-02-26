# Contributing

## 分支与提交规范
- 分支命名：`feature/*`、`fix/*`、`chore/*`。
- 提交信息采用 Conventional Commits：
  - `feat(scope): subject`
  - `fix(scope): subject`
  - `test(scope): subject`

## 开发约定
- 业务逻辑优先集中在 `core/meeting-engine` 和 `composables`。
- UI 只做渲染与交互，不直接写业务状态。
- 新增模块需补充注释（用途/边界/关键逻辑）。

## 测试与质量
- 修改核心逻辑必须补单测。
- 提交前运行：
  - `npm run test`
  - `npm run lint`

## 文档更新
- 新增/调整核心能力时同步更新 `docs/`。
- 设计取舍记录在 `docs/decisions.md`。
