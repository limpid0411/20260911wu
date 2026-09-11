# 第二章：核心架構與 RBAC 權限體系

## 2.1 使用者模型 (User)
系統使用者資料結構定義於 `src/types/pms.ts`：

```typescript
export type UserRole = 'SUPER_ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'REVIEWER_CLIENT';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  department: string;
}
```

---

## 2.2 角色權限矩陣 (RolePermission Matrix)

系統實作完整的 RBAC 權限體系，於 `src/utils/rbac.ts` 中統一定義：

| 權限欄位 | 系統管理員<br>(SUPER_ADMIN) | 專案經理<br>(PROJECT_MANAGER) | 一般成員<br>(MEMBER) | 外部審查員/業主<br>(REVIEWER_CLIENT) |
| :--- | :---: | :---: | :---: | :---: |
| **canManageProject** (專案基本資訊維護) | ✅ | ✅ | ❌ | ❌ |
| **canEditBoardColumns** (新增/調整看板欄位與 WIP) | ✅ | ✅ | ❌ | ❌ |
| **canCreateTask** (建立任務卡片) | ✅ | ✅ | ✅ | ❌ |
| **canMoveAnyTask** (拖曳移動任意任務卡片) | ✅ | ✅ | ✅ | ❌ |
| **canAssignTask** (指派任務負責人) | ✅ | ✅ | ❌ | ❌ |
| **canCreateRFI** (發起 RFI 詢答單) | ✅ | ✅ | ✅ | ❌ |
| **canOfficialReplyRFI** (填寫官方正式審核回覆) | ✅ | ✅ | ❌ | ✅ |
| **canCloseRFI** (強制結案 RFI) | ✅ | ✅ | ❌ | ❌ |
| **canManageUsers** (管理帳號與團隊名單) | ✅ | ❌ | ❌ | ❌ |

---

## 2.3 權限判定函式 (checkPermission)
系統提供通用權限判定函式：
```typescript
export function checkPermission(role: UserRole, permission: keyof RolePermission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? Boolean(perms[permission]) : false;
}
```
UI 組件需依據目前切換的使用者角色，動態禁用或隱藏未被授權的操作按鈕（如：外部審查員不能拖曳卡片、一般成員不能結案 RFI）。

---

## 2.4 本地儲存與事件總線 (Storage Service & Pub/Sub)
- **單一資料來源**：`storageService` 封裝所有 LocalStorage 讀寫。
- **響應式機制**：內建簡易發布/訂閱（Pub/Sub）模式。任何組件修改資料後觸發 `notify()`，促使所有監聽中的視圖（App、看板、統計）同步更新，無需依賴重型狀態管理庫。
---

## 2.5 SQLite 實體關聯資料庫架構與 REST API 規格 (feat/sqlite-backend)

為解決前端純 `localStorage` 無法多客戶端持久化與跨裝置保存之限制，系統後端已升級為 **SQLite 關聯式資料庫** + **Express REST API**：

### 1. 資料庫引擎與檔案規範
- **引擎**：採用 Node.js 24 原生內建的高效能 `node:sqlite`（`DatabaseSync`），零外部 C++ 編譯依賴。
- **檔案路徑**：`data/pms.sqlite`（自動納入 `.gitignore`）。
- **並行日誌**：開啟 `PRAGMA journal_mode = WAL;`，實現讀寫非阻塞並行。
- **種子資料**：初次啟動時自動遷移注入 `src/mock/initialData.ts` 預設資料。

### 2. 資料庫綱要 (Database Schema - 9 大核心表)
1. `users`：`id (PK), email, full_name, role, avatar_url, department`
2. `projects`：`id (PK), code, name, description, created_by, created_at`
3. `boards`：`id (PK), project_id, title, position, description`
4. `columns`：`id (PK), board_id, name, wip_limit, position`
5. `tasks`：`id (PK), column_id, title, description, priority, assignee_id, collaborators, position, due_date, estimated_hours, tags, module_category, created_at`
6. `rfis`：`id (PK), project_id, rfi_number, subject, question, suggested_solution, official_reply, status, priority, reference_spec_no, cost_impact, schedule_impact, schedule_days_impact, author_id, assigned_reviewer_id, due_date, answered_at, answered_by, closed_at, closed_by, created_at`
7. `rfi_audit_logs`：`id (PK), rfi_id, action, user_id, user_name, user_role, details, timestamp`
8. `attachments`：`id (PK), target_type, target_id, file_name, file_size, file_url, mime_type, uploader_id, uploader_name, created_at, is_clipboard`
9. `comments`：`id (PK), task_id, author_id, author_name, content, created_at`
10. `notifications`：`id (PK), user_id, type, title, message, is_read, created_at`

### 3. REST API 端點清單
| 方法 | 端點路徑 | 說明 |
| :--- | :--- | :--- |
| **GET** | `/api/health` | 健康檢查（回應引擎與時間戳） |
| **GET** | `/api/all` | 全系統資料單次快速啟動拉取 |
| **POST** | `/api/projects` | 新增專案（自動產生預設看板與 4 欄位） |
| **POST** / **PUT** / **DELETE** | `/api/columns`, `/api/columns/:id` | 看板欄位維護與 WIP 限額調整 |
| **POST** / **PUT** / **DELETE** | `/api/tasks`, `/api/tasks/:id` | 任務卡片新增、拖曳移動、指派與刪除 |
| **POST** / **PUT** | `/api/rfis`, `/api/rfis/:id` | RFI 提案、審查、回覆與結案 |
| **POST** | `/api/rfi-audit-logs` | 寫入不可竄改的 RFI 歷程審計紀錄 |
| **POST** / **DELETE** | `/api/attachments`, `/api/attachments/:id` | 附件與剪貼簿截圖儲存記錄 |
| **POST** | `/api/comments` | 任務卡片留言評論 |
| **POST** / **PUT** | `/api/notifications`, `/api/notifications/:id/read` | 告警通知與標記已讀 |

### 4. 前端資料同步機制 (Optimistic Cache + Background Sync)
前端 `storageService.ts` 採用「記憶體樂觀快取 + 背景 SQLite 雙向同步」策略：
- 啟動時透過 `/api/all` 自動拉取 SQLite 最新資料。
- 任何卡片拖曳或狀態變更立即在記憶體完成並廣播 Pub/Sub 事件（0ms 延遲），同時非同步寫回後端 SQLite。
- 保證使用者介面極致流暢，且所有修改在刷新或重開後永久保存。
