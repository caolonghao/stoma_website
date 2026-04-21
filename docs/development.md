# 开发说明

## 1. 当前持久化方案

当前项目使用：

- Prisma Client
- SQLite
- 本地数据库文件：`prisma/dev.db`

之所以先用 SQLite，是为了让本地开发、测试和 E2E 能够零依赖启动。
如果后续进入多用户或部署阶段，更推荐切回 MySQL。

## 2. Prisma 与数据库初始化

项目当前不是完全依赖 `prisma migrate` 来准备本地数据库，而是采用双保险：

1. `pnpm dev` / `pnpm build` / `pnpm test` 会先跑 `prisma db push`
2. 运行时 `lib/db/sqlite-schema.ts` 还会确保 SQLite 库表存在

这样做的目的，是尽量减少“本地第一次运行就因数据库未准备好而失败”的情况。

相关文件：

- [lib/db/prisma.ts](/Users/tonycao/mycode/stoma_website/lib/db/prisma.ts)
- [lib/db/sqlite-schema.ts](/Users/tonycao/mycode/stoma_website/lib/db/sqlite-schema.ts)
- [prisma/schema.prisma](/Users/tonycao/mycode/stoma_website/prisma/schema.prisma)
- [prisma/schema.sqlite.sql](/Users/tonycao/mycode/stoma_website/prisma/schema.sqlite.sql)

## 3. Seed 与测试重置

测试环境里会自动重置数据库并写入基础数据。

相关文件：

- [lib/db/seed.ts](/Users/tonycao/mycode/stoma_website/lib/db/seed.ts)
- [lib/db/test-reset.ts](/Users/tonycao/mycode/stoma_website/lib/db/test-reset.ts)
- [vitest.setup.ts](/Users/tonycao/mycode/stoma_website/vitest.setup.ts)

默认基础数据包括：

- 医生：`doctor / Doctor123!`
- 患者：`13800000010 / Patient123!`
- 3 条默认患者档案

## 4. 业务模块拆分

### 认证

- JWT 生成与解析：`lib/auth/*`
- 登录注册接口：`app/api/auth/*`

### 患者档案

- 患者服务：`lib/patients/service.ts`
- 患者接口：`app/api/patients/*`
- 医生端页面：`app/doctor/patients/*`

### 随访与影像

- 随访逻辑：`lib/followups/service.ts`
- 图片逻辑：`lib/images/service.ts`
- 上传接口：`app/api/images/route.ts`
- 随访接口：`app/api/followups/route.ts`

### AI

- provider 模拟层：`lib/ai/provider.ts`
- AI task 领域逻辑：`lib/ai/service.ts`
- AI 接口：`app/api/ai/tasks/*`

### 报告

- category -> complication 映射：`lib/reports/complication-map.ts`
- 报告服务：`lib/reports/service.ts`
- 报告接口：`app/api/reports/*`

## 5. 当前 AI 集成方式

目前 AI provider 仍然是模拟层，用于跑通任务状态与页面展示。

当前行为：

- 上传图片后自动创建 `AITask`
- 查询任务状态时同步完成一次 provider 结果
- 结果写入 `AIResult`
- 医生可以手动重跑

如果接入正式 FastAPI，可以优先保留 `lib/ai/service.ts` 这一层不动，只替换 `lib/ai/provider.ts`。

## 6. 文件上传

当前上传先落本地目录：

- 默认目录：`./uploads`

文件写入封装在：

- [lib/storage/service.ts](/Users/tonycao/mycode/stoma_website/lib/storage/service.ts)

未来切到 S3 时，建议保持上传接口不变，只替换这一层。

## 7. 常见开发命令

启动开发环境：

```bash
pnpm dev
```

生成 Prisma Client：

```bash
pnpm prisma generate
```

同步数据库结构：

```bash
pnpm prisma:push
```

运行 lint：

```bash
pnpm lint
```

运行构建：

```bash
pnpm build
```

## 8. 当前已知技术债

- 仍有部分命名沿用早期内存 store 时代的文件名，比如 `lib/auth/mock-store.ts`
  现在它内部其实已经是 Prisma 实现，后续可以考虑重命名为更准确的 repository/service 名称。

- AI provider 仍是模拟结果，并不连接真实模型服务。

- 当前数据库为 SQLite，适合本地与测试，但不适合作为正式多用户部署方案。

- E2E 用例当前为了稳定性，部分登录/报告动作采用“页面 + 真实 API”的混合方式，而不是所有步骤都只靠表单点击。

## 9. 建议的下一步

如果继续开发，优先顺序建议是：

1. 接真实 FastAPI AI 服务
2. 把 SQLite 切回 MySQL
3. 扩展更多 Playwright 用例
4. 增加随访详情里的报告编辑状态与更细粒度权限控制
