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
