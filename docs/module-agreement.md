# 页面与数据模块接口约定

A 负责报修表单、列表、详情、状态操作及页面样式，主要修改 `app/page.jsx` 和 `app/globals.css`。B 负责登录、数据库和接口，主要修改 `app/api/`、`lib/` 和 `supabase/`。改动跨模块时在 PR 中说明，由另一方审查。

报修字段为 `id`、`reporterName`、`officeArea`、`deviceType`、`description`、`status`、`createdAt` 和 `suggestions`。状态为待处理、处理中或已完成。时间使用 ISO 8601。尚未生成的建议用空数组表示。

| 方法与路径 | 请求 | 成功响应 |
| --- | --- | --- |
| GET /api/repairs | 无 | 200，`{ repairs }` |
| POST /api/repairs | 姓名、办公区、设备、描述对应的四个字段 | 201，`{ repair }` |
| GET /api/repairs/:id | 路径中的报修编号 | 200，`{ repair }` |
| PATCH /api/repairs/:id | `{ status }` | 200，`{ repair }` |
| POST /api/suggest | `{ repairId, deviceType, description }` | 200，`{ suggestions }`，包含三条字符串 |

接口根据登录身份限制访问范围。建议服务以已保存的报修数据为准，将成功生成的建议写回同一条记录。统一错误格式为 `{ error: { code, message } }`。未登录返回 401，无效输入返回 400，找不到记录或记录对当前用户不可见时返回 404。页面显示错误信息，生成建议失败时允许重试。

模块分支先合并到 `work`，通过联调和双方验收后再提交 `work → main` PR。
