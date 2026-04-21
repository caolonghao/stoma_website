# 肠造口随访与诊断管理平台

一个面向单科室使用的肠造口患者随访与诊断 Web 系统，包含医生端与患者端两套工作区，覆盖以下主流程：

1. 患者注册 / 登录
2. 医生登录
3. 医生建档与患者检索
4. 患者上传影像
5. 系统按拍摄日期自动归档为一次随访
6. AI 对单张图像生成 `category` 级辅助结果
7. 医生完成最终人工诊断与分级
8. 患者查看最终报告

## 当前状态

当前仓库已经实现：

- 医生端登录、患者检索、患者建档、患者详情、随访详情
- 患者端注册、登录、随访列表、影像上传、随访结果查看
- 本地文件存储上传
- Prisma 持久化
- AI 异步任务占位流程
- 医生端人工综合报告
- 患者端报告只读展示
- 单测、集成测试、Playwright 全流程测试

当前仍是 MVP，主要限制如下：

- 当前数据库为 `Prisma + SQLite`
- AI provider 仍是本地模拟层，不是正式 FastAPI 服务
- AI 只返回 5 分类 `category`，不返回细粒度并发症类型
- 文件存储当前使用本地目录，不是 S3

## 技术栈

- Next.js App Router
- React
- TypeScript
- Prisma
- SQLite
- Tailwind CSS
- Vitest
- Playwright

## 快速启动

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发环境

```bash
pnpm dev
```

默认地址：

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

`pnpm dev` 会先执行 `prisma db push --skip-generate`，确保本地数据库和 schema 对齐。

## 默认账号

系统启动后会自动准备一组基础数据：

- 医生账号
  - 账号：`doctor`
  - 密码：`Doctor123!`

- 默认患者账号
  - 手机号：`13800000010`
  - 密码：`Patient123!`

测试里也会自动重置并写入这组数据。

## 目录概览

```text
app/
  (auth)/                登录与注册页面
  api/                   后端接口
  doctor/                医生端页面
  patient/               患者端页面

components/
  auth/                  登录注册组件
  doctor/                医生端组件
  patient/               患者端组件
  shared/                共享展示组件

lib/
  ai/                    AI provider 与 AI task 逻辑
  auth/                  JWT 与当前用户解析
  db/                    Prisma 与本地 SQLite schema bootstrap
  followups/             随访逻辑
  images/                图片元数据逻辑
  patients/              患者档案逻辑
  reports/               报告逻辑与 category -> complication 映射
  storage/               本地文件存储
  validators/            Zod 校验

prisma/
  schema.prisma          Prisma schema
  schema.sqlite.sql      SQLite 自建表 SQL

tests/
  data/                  真实测试图像
  integration/           API 集成测试
  unit/                  单元测试
  e2e/                   Playwright 全流程测试
```

## 核心业务规则

### 随访归档

- 随访是最终诊断单元
- 系统按 `patient + shotDate` 自动归档
- 同一患者同一天的多张图片归为一次随访

### AI 结果

AI 当前只输出以下 5 类：

1. 肠管及系膜并发症
2. 腹壁切口并发症
3. 腹壁隧道并发症
4. 周围皮肤并发症
5. 正常

AI 不直接输出最终具体并发症类型。

### category 到具体并发症的对应关系

- 肠管及系膜并发症
  - 造口水肿
  - 造口出血
  - 造口旁瘘
  - 造口坏死

- 腹壁切口并发症
  - 非感染性愈合不良
  - 感染性愈合不良

- 腹壁隧道并发症
  - 造口脱垂
  - 造口回缩
  - 造口凹陷
  - 造口狭窄
  - 造口旁疝

- 周围皮肤并发症
  - 刺激性皮炎
  - 过敏性皮炎
  - 真菌性皮炎
  - 撕脱性皮肤损伤
  - 坏疽性脓皮病
  - 黏膜肉芽肿
  - 假疣性增生
  - 毛囊炎

- 正常
  - 不对应具体并发症

医生端报告表单会根据当前随访中的 AI `category` 自动收窄候选类型，但最终选择仍由医生人工决定。

## 测试

### 单元 + 集成测试

```bash
pnpm vitest run
```

### 端到端测试

```bash
pnpm playwright test tests/e2e/full-clinical-flow.spec.ts
```

这条 E2E 会覆盖：

- 患者注册
- 患者上传真实测试图像
- 医生登录并检索该患者
- 医生进入随访详情
- 医生提交最终报告
- 患者查看最终结果

## 环境变量

见 [`.env.example`](/Users/tonycao/mycode/stoma_website/.env.example)。

当前主要变量：

- `DATABASE_URL`
- `JWT_SECRET`
- `UPLOAD_DIR`
- `AI_PROVIDER_BASE_URL`
- `AI_PROVIDER_TOKEN`

## 相关文档

- 设计文档：
  [docs/superpowers/specs/2026-04-21-stoma-followup-platform-design.md](/Users/tonycao/mycode/stoma_website/docs/superpowers/specs/2026-04-21-stoma-followup-platform-design.md)
- 实施计划：
  [docs/superpowers/plans/2026-04-21-stoma-followup-platform.md](/Users/tonycao/mycode/stoma_website/docs/superpowers/plans/2026-04-21-stoma-followup-platform.md)
- 开发说明：
  [docs/development.md](/Users/tonycao/mycode/stoma_website/docs/development.md)
- 测试说明：
  [docs/testing.md](/Users/tonycao/mycode/stoma_website/docs/testing.md)
