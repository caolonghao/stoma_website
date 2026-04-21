# 肠造口随访与诊断管理平台设计文档

**日期：** 2026-04-21

## 1. 目标与范围

本项目是一套面向单科室使用的肠造口患者随访与诊断管理平台，一期目标是同时交付医生端与患者端，打通以下业务闭环：

1. 医生或患者登录系统
2. 医生建档与查询患者
3. 患者上传造口影像，系统按拍摄日期自动归档为一次随访
4. 系统对单张图片自动触发 AI 辅助诊断
5. 医生对一次随访完成最终人工判读和分级
6. 患者查看医生给出的最终诊断结果

## 2. 产品边界

### 2.1 一期明确纳入

- 医生端后台
- 患者端注册与登录
- 患者影像上传
- 医生端患者管理
- 医生端影像查看与 AI 辅助诊断查看
- 医生端人工综合报告填写
- 患者端查看自己的诊断结果

### 2.2 一期明确不做

- 多科室、多机构隔离
- 医生与患者绑定关系管理
- 复杂会诊流程
- AI 模型训练与模型平台管理
- 回调式 webhook 集成

当前默认前提如下：

- 系统仅服务于一个科室
- 医生可以查看所有患者信息
- 患者只能查看自己的档案、随访与诊断结果

## 3. 总体架构

一期采用单体双端 Web 方案：

- 同一个 Web 系统
- 同一个后端服务
- 同一个数据库
- 同一个文件存储
- 同一个认证体系

按角色区分两个工作区：

- 医生端：`/doctor/*`
- 患者端：`/patient/*`
- API：`/api/*`

该方案适合当前单科室、双端协同、空项目起步的场景，能够在保证结构清晰的同时尽快完成 MVP。

## 4. 用户角色与权限

### 4.1 角色

- `doctor`
- `patient`
- `admin`

### 4.2 医生端权限

- 登录系统
- 查看全部患者
- 组合条件查询患者
- 新建患者档案
- 查看患者详情与随访记录
- 查看随访中的多张影像
- 查看图片级 AI 辅助诊断结果
- 手动重新触发 AI 诊断
- 填写和修改人工最终诊断报告

### 4.3 患者端权限

- 注册与登录
- 查看自己的基础资料
- 查看自己的随访列表
- 上传自己的影像
- 查看自己的最终诊断报告

患者端不能：

- 查看他人数据
- 修改医生最终报告
- 手工修改 AI 结果

## 5. 信息架构与页面流转

### 5.1 医生端页面流

1. 登录页
2. 患者列表页
3. 新建患者弹窗或页面
4. 患者详情页
5. 随访详情页
6. 人工综合报告提交

### 5.2 患者端页面流

1. 注册页
2. 登录页
3. 我的随访页
4. 上传影像页
5. 随访结果页

### 5.3 一次随访的形成规则

本系统以“一次随访”为最终诊断单元，而不是以单张图片为最终诊断单元。

规则如下：

- 患者上传图片时填写拍摄日期与体位
- 系统按 `patient_id + 拍摄日期` 自动归档
- 同一患者同一拍摄日期的多张图片组成一次随访
- AI 对单张图片输出辅助结果
- 医生对整次随访输出一份最终综合报告

## 6. 核心数据模型

### 6.1 User

`User` 表示系统登录身份，用于认证与鉴权。

建议字段：

- `id`
- `role`
- `account` 或 `phone`
- `password_hash`
- `name`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

### 6.2 Patient

`Patient` 表示患者医疗档案，是业务主体，不等同于登录账号。

建议字段：

- `id`
- `user_id`，可为空
- `name`
- `gender`
- `birth_date`
- `phone`
- `stoma_date`
- `stoma_type`
- `medical_record_no`
- `profile_source`
- `created_at`
- `updated_at`

说明：

- `Patient` 是患者具体医疗资料
- `User` 是可登录系统的账号身份
- 医生账号只有 `User`
- 患者注册后，`Patient.user_id` 可关联到患者自己的 `User.id`
- 医生先建档、患者后注册的场景也能自然支持

### 6.3 FollowUp

`FollowUp` 表示一次随访记录，是平台的核心业务对象。

建议字段：

- `id`
- `patient_id`
- `followup_date`
- `status`
- `source`
- `created_at`
- `updated_at`

建议状态：

- `pending_ai`
- `pending_review`
- `completed`

### 6.4 Image

`Image` 表示随访下的单张影像。

建议字段：

- `id`
- `followup_id`
- `shot_date`
- `position_type`
- `storage_key`
- `file_url`
- `thumbnail_url`
- `uploaded_by_user_id`
- `created_at`

体位枚举：

- `端坐正位`
- `端坐侧位`
- `平卧位`

### 6.5 AIResult

`AIResult` 表示单张图片的 AI 辅助诊断结果，主关联应挂在 `image_id` 下。

建议字段：

- `id`
- `image_id`
- `category`
- `label`，可为空
- `confidence`，可为空
- `labels_version`
- `raw_result_json`
- `is_current`
- `created_at`

五类大类结果：

- 肠管及系膜并发症
- 腹壁切口并发症
- 腹壁隧道并发症
- 周围皮肤并发症
- 正常

当前约束说明：

- AI 服务端当前只能输出到 `category` 这一层级
- 细分并发症类型暂不由 AI 直接返回
- 因此 `label` 字段应视为预留字段，可为空
- 医生人工报告仍然是最终细分类结果的唯一来源

### 6.6 DiagnosisReport

`DiagnosisReport` 表示医生对整次随访做出的最终人工综合报告。

建议字段：

- `id`
- `followup_id`
- `has_complication`
- `complication_types`
- `severity_grade`
- `doctor_comment`
- `reviewed_by_user_id`
- `reviewed_at`
- `status`
- `created_at`
- `updated_at`

并发症类型支持：

- 刺激性皮炎
- 过敏性皮炎
- 真菌性皮炎
- 撕脱性皮肤损伤
- 坏疽性脓皮病
- 黏膜肉芽肿
- 假疣性增生
- 毛囊炎
- 非感染性愈合不良
- 感染性愈合不良
- 造口脱垂
- 造口回缩
- 造口凹陷
- 造口狭窄
- 造口旁疝
- 造口水肿
- 造口出血
- 造口旁瘘
- 造口坏死

分级支持：

- `Ia`
- `Ib`
- `IIa`
- `IIb`
- `III`

### 6.7 AITask

为支持异步 AI 执行，建议新增 `AITask` 表。

建议字段：

- `id`
- `image_id`
- `trigger_source`
- `status`
- `retry_count`
- `requested_by_user_id`
- `provider_task_id`
- `error_message`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

状态建议：

- `queued`
- `running`
- `succeeded`
- `failed`

说明：

- `AITask` 保留任务执行历史
- `AIResult` 保存当前有效诊断结果
- 医生手动重跑时应新建一条 `AITask`，不覆盖历史任务

## 7. API 设计边界

API 统一按资源分组，由后端基于 JWT 做角色校验。

### 7.1 Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### 7.2 Patients

- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/:id`
- `PATCH /api/patients/:id`

### 7.3 FollowUps

- `GET /api/followups`
- `GET /api/followups/:id`

### 7.4 Images

- `POST /api/images`
- `GET /api/images/:id`
- `DELETE /api/images/:id`

### 7.5 AI

- `POST /api/ai/tasks`
- `GET /api/ai/tasks/:id`
- `POST /api/ai/tasks/:id/retry`

### 7.6 Reports

- `GET /api/reports/:followupId`
- `POST /api/reports`
- `PATCH /api/reports/:id`

## 8. 认证与鉴权

一期采用 JWT。

原则：

- 登录成功后签发 token
- 前端请求时携带 token
- 后端解析 token 并识别角色
- 患者只能查询自己的资源
- 医生可查询全科室资源

JWT 的优势：

- 适合后续扩展小程序或 App
- 前后端分布式部署更自然
- 后续若引入独立 AI 服务或其他子系统，更容易衔接

## 9. 文件上传与存储

建议将图片存放在 S3 兼容对象存储中，数据库仅保存元数据。

上传流程：

1. 患者或医生上传图片
2. 后端保存文件到对象存储
3. 创建 `Image`
4. 根据 `patient_id + shot_date` 归入 `FollowUp`
5. 自动创建 `AITask`

建议统一封装：

- 文件类型校验
- 文件大小限制
- 缩略图生成
- 存储 key 规则

## 10. AI 异步集成契约

### 10.1 设计原则

- 主系统不阻塞上传流程
- AI 服务专注模型推理
- 主系统维护业务状态和主键
- FastAPI 维护自己的 provider 任务 ID

推荐做法：

- 主系统生成本地 `AITask.id`
- 调用 FastAPI 创建任务
- FastAPI 返回 `provider_task_id`
- 主系统后台 worker 轮询任务状态
- 成功后写入 `AIResult`

### 10.2 FastAPI 最小接口

#### 创建任务

`POST /ai/tasks`

请求体示例：

```json
{
  "image_id": "img_123",
  "image_url": "https://storage.example.com/path/file.jpg",
  "labels_version": "v1"
}
```

返回示例：

```json
{
  "task_id": "provider_task_456",
  "status": "queued"
}
```

#### 查询任务

`GET /ai/tasks/{task_id}`

返回示例：

```json
{
  "task_id": "provider_task_456",
  "status": "succeeded",
  "result": {
    "category": "周围皮肤并发症",
    "label": null,
    "confidence": 0.93,
    "raw_result": {}
  },
  "error": null
}
```

### 10.3 AI 时序

#### 自动触发

1. 上传图片成功
2. 主系统创建 `AITask(status=queued, trigger_source=auto)`
3. Worker 调用 FastAPI 创建任务
4. Worker 轮询 FastAPI 状态
5. 成功后写入 `AIResult`
6. 更新 `FollowUp` 状态

#### 医生手动重跑

1. 医生点击重跑
2. 主系统新建 `AITask(status=queued, trigger_source=manual)`
3. 重复异步流程
4. 新结果写入 `AIResult`，旧结果保留历史

### 10.4 一期建议

一期先使用“主系统轮询 FastAPI 任务状态”的方式，不做 webhook 回调。

原因：

- 实现简单
- 排查容易
- 对部署环境要求低

## 11. 错误处理与状态展示

### 11.1 上传失败

- 前端提示上传失败
- 不创建图片记录
- 不创建 AI 任务

### 11.2 AI 失败

- `AITask.status = failed`
- 页面显示 AI 失败状态
- 医生端可手动重跑

### 11.3 报告未完成

- 随访状态保持 `pending_review`
- 患者端可显示“待医生判读”

### 11.4 权限越权

- 后端直接返回 401 或 403
- 前端跳转登录页或展示无权限提示

## 12. 测试策略

### 12.1 单元测试

- 权限判断逻辑
- 随访自动归档逻辑
- AI 任务状态流转逻辑
- 报告表单校验逻辑

### 12.2 集成测试

- 注册登录流程
- 患者上传图片并归档为随访
- 上传后自动创建 AI 任务
- 医生填写并提交人工诊断报告
- 患者查看最终报告

### 12.3 Mock 策略

AI 接口在正式接入前，建议先用 mock FastAPI 或本地 mock handler 返回固定结构，以便先把主流程打通。

## 13. 技术栈建议

推荐一期技术栈：

- 前端：Next.js + React + Tailwind CSS
- 后端：Next.js Route Handlers
- 数据库：MySQL
- ORM：Prisma
- 鉴权：JWT
- 文件存储：S3 兼容对象存储
- AI 服务：FastAPI

## 14. 目录结构建议

```text
/app
  /(auth)/login
  /(auth)/register
  /doctor/patients
  /doctor/patients/[id]
  /doctor/followups/[id]
  /patient/dashboard
  /patient/followups/[id]
  /api/auth/*
  /api/patients/*
  /api/followups/*
  /api/images/*
  /api/ai/*
  /api/reports/*

/components
/lib
  /auth
  /db
  /permissions
  /storage
  /ai
/prisma
  schema.prisma
```

## 15. MVP 实施顺序

建议按以下顺序推进：

1. 初始化项目骨架、数据库、JWT、角色权限
2. 优先完成医生端登录、患者列表、患者建档、患者详情
3. 完成患者端注册登录、我的随访、影像上传
4. 完成随访自动归档与图片管理
5. 接入 AI 异步任务占位流程
6. 完成医生端人工报告填写
7. 完成患者端结果查看

## 16. 设计结论

本项目一期采用单体双端 Web 架构，以 `FollowUp` 作为核心业务对象，以 `Image` 作为 AI 输入单元，以 `DiagnosisReport` 作为最终医疗结论，以 `AITask + AIResult` 支撑可追踪的异步 AI 诊断流程。

该设计既能够快速支撑当前单科室 MVP，也为后续扩展更多角色、更多终端和正式 AI 服务集成预留了稳定边界。
