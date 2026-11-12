# B 的数据与 AI 实施计划

本分支从 `work` 的框架提交 `46cef90` 建立。B 负责数据库、登录、权限、报修接口和 AI 建议服务。页面结构由 A 负责。

## 待 A 和 B 确认的接口

| 操作 | 拟用接口 | 数据 |
| --- | --- | --- |
| 查看列表 | `GET /api/repairs` | 返回本组报修列表 |
| 创建报修 | `POST /api/repairs` | `reporterName`、`officeArea`、`deviceType`、`description` |
| 查看详情 | `GET /api/repairs/:id` | 返回单条报修及已保存的 `suggestions` |
| 修改状态 | `PATCH /api/repairs/:id` | `status` 为待处理、处理中或已完成 |
| 生成建议 | `POST /api/suggest` | 请求包含 `repairId`、`deviceType`、`description`，返回三条 `suggestions` |

报修记录还需要 `id` 和 `createdAt`。接口错误拟统一返回 `{ error: { code, message } }`，供页面直接显示。未登录返回 401，输入无效返回 400，记录不存在或对当前组不可见返回 404。双方确认后将正式约定写入 `docs/module-agreement.md`。

## 实施顺序

1. 等 A 的页面模块合并到 `work` 后更新 `b-data`。确认课堂使用的 Supabase 项目和两名测试用户，建立报修表和组成员表。
2. 启用行级安全。由登录身份和数据库中的成员关系确定组归属，限制读写为同组，初始状态设为待处理。
3. 实现报修数据接口并提交 `b-data → work` PR。用两名测试用户验证 A 提交、B 查看和修改、A 刷新后看到变更，以及退出登录后读写被拒绝。
4. 数据验收后从最新 `work` 建立 `b-ai`，先提交 `docs/ai-agreement.md` 供 A 核对。随后实现建议服务：校验登录及报修归属，从已保存记录读取故障信息，生成并保存三条建议。服务失败时保留原报修，页面可重试。

Supabase 配置由授权用户填入部署环境。DeepSeek 密钥仅供服务端读取。验收使用虚构报修内容。
