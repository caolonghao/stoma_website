# 测试说明

## 1. 测试分层

当前项目测试分为三层：

### 单元测试

位置：

- `tests/unit/*`

覆盖：

- JWT
- 权限守卫
- 随访归档
- AI task 领域逻辑
- 报告校验
- category -> complication 映射
- 前端小组件

### 集成测试

位置：

- `tests/integration/api/*`

覆盖：

- 认证
- 患者建档与检索
- Prisma 落库
- 上传图片与自动归档
- AI task API
- 报告 API

### 端到端测试

位置：

- `tests/e2e/*`

当前重点用例：

- [tests/e2e/full-clinical-flow.spec.ts](/Users/tonycao/mycode/stoma_website/tests/e2e/full-clinical-flow.spec.ts)

## 2. 真实测试图像

当前仓库里已经放入真实测试图像：

- [tests/data/T001322119-2022-10-11_151502-2577696.jpg](/Users/tonycao/mycode/stoma_website/tests/data/T001322119-2022-10-11_151502-2577696.jpg)

集成测试和 E2E 都会优先使用这张图，而不是只用伪造的字节流。

## 3. 如何运行

### 全部单测与集成测试

```bash
pnpm vitest run
```

### 全部测试

```bash
pnpm test
```

### 只跑某个集成测试

```bash
pnpm vitest run tests/integration/api/images-followups.test.ts
```

### 跑完整 E2E

```bash
pnpm playwright test tests/e2e/full-clinical-flow.spec.ts
```

## 4. E2E 当前策略

当前端到端测试采用“真实浏览器 + 真实 API + 局部会话注入”的策略。

原因：

- 这样仍然覆盖真实页面与真实后端
- 但可以避免个别表单交互细节导致整条临床主链路测试不稳定

例如：

- 注册和登录阶段，会通过真实 API 拿 token
- 然后把 token 注入浏览器 cookie / localStorage
- 后续页面导航、上传、查看结果仍然走真实浏览器流程

这个策略更适合当前 MVP 阶段。

## 5. 测试重置机制

Vitest 启动时会自动：

1. 重置 SQLite 数据库中的业务数据
2. 重新写入默认医生和默认患者

相关文件：

- [lib/db/test-reset.ts](/Users/tonycao/mycode/stoma_website/lib/db/test-reset.ts)
- [lib/db/seed.ts](/Users/tonycao/mycode/stoma_website/lib/db/seed.ts)

## 6. Playwright 与真实浏览器模拟

当前项目已经使用 Playwright 做浏览器级全流程模拟。
如果后续你在这个环境里接入了 `chrome devtools mcp`，也可以把它用于：

- 更细的页面交互排查
- 网络请求与 DOM 状态调试
- 多步表单流程人工复现

但在当前仓库里，最稳定的自动化主路径仍是 Playwright。

## 7. 常见问题

### 1. 为什么 Vitest 不跑 `tests/e2e`？

因为 E2E 应该由 Playwright 负责，Vitest 已经显式排除了 `tests/e2e/**`。

### 2. 为什么测试里会看到 SQLite 数据库文件？

因为当前项目已经切到 Prisma + SQLite，本地与测试都依赖它持久化业务数据。

### 3. 为什么 E2E 不完全通过页面点击登录？

当前这是有意设计。项目重点是先稳定验证临床主链路，而不是把每个登录交互细节都绑定进一条大用例里。
