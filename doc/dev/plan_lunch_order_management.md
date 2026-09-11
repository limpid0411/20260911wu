# 功能開發計畫書：午餐訂購管理系統 (plan_lunch_order_management.md)

- **功能名稱**：午餐訂購管理系統 (Lunch Order Management)
- **建立日期**：2026-09-11
- **分支名稱**：`feat/lunch-order`
- **狀態**：`[IN_PLANNING]`

---

## 1. 開發目標與背景

團隊在日常工程管理與專案協作中，常常需要在中午進行團購便當或手搖飲訂購。為提升團隊內部協作效率並整合至現有專案管理平台，預計開發「午餐訂購管理」模組。

### 核心功能需求：
1. **團購發起與管理**：同仁可發起每日午餐/飲料團購，設定店家、訂購截止時間與備註。
2. **同仁線上加單/加點**：同仁可查看進行中的團購，線上挑選餐點、備註客製需求（如去冰無糖/不加辣）。
3. **自動統計與金額計算**：自動統計各餐點數量、總金額、個人應付金額。
4. **收款與付款狀態標記**：發起人可以一鍵勾選同仁是否已完成付款/轉帳。
5. **店家與菜單維護庫**：可維護常用便當店與手搖飲店家資訊與菜單。

---

## 2. 資料庫 Schema 設計 (`data/pms.sqlite`)

將於 SQLite 資料庫新增以下 3 張實體資料表：

### `lunch_restaurants` (合作店家庫)
- `id` (TEXT, PK): 店家 ID
- `name` (TEXT): 店家名稱
- `phone` (TEXT): 聯絡電話
- `category` (TEXT): 分類（如：便當、飲料、麵食、速食）
- `menu_items` (TEXT): 菜單項目列表（JSON 格式: `[{ "id": "m1", "name": "招牌排骨飯", "price": 110 }]`）

### `lunch_orders` (團購活動主表)
- `id` (TEXT, PK): 團購單 ID
- `title` (TEXT): 團購主題（如：9/11 鼎泰豐午餐團）
- `restaurant_id` (TEXT, FK): 關聯店家 ID
- `date` (TEXT): 訂購日期 (YYYY-MM-DD)
- `cutoff_time` (TEXT): 截止時間 (HH:mm)
- `status` (TEXT): 狀態 (`OPEN` 登記中 / `CLOSED` 已截止 / `ORDERED` 已下單完成)
- `created_by` (TEXT): 發起人名稱
- `created_at` (TEXT): 建立時間 ISO 格式

### `lunch_order_items` (同仁點餐明細表)
- `id` (TEXT, PK): 明細 ID
- `order_id` (TEXT, FK): 關聯團購單 ID
- `user_id` (TEXT): 點餐同仁 ID
- `user_name` (TEXT): 點餐同仁姓名
- `item_name` (TEXT): 餐點品名
- `price` (INTEGER): 單價
- `quantity` (INTEGER): 數量
- `note` (TEXT): 客製備註（如微糖去冰、加辣）
- `is_paid` (INTEGER): 是否已付款 (0/1)
- `created_at` (TEXT): 點餐時間

---

## 3. 後端 REST API 規劃 (`server/index.ts`)

- `GET /api/lunch/restaurants`：取得店家清單
- `POST /api/lunch/restaurants`：新增店家
- `GET /api/lunch/orders`：取得所有午餐團購單
- `POST /api/lunch/orders`：發起新團購
- `PUT /api/lunch/orders/:id/status`：更新團購狀態 (OPEN/CLOSED/ORDERED)
- `POST /api/lunch/orders/:id/items`：同仁新增/點選餐點
- `PUT /api/lunch/items/:id/paid`：切換付款狀態
- `DELETE /api/lunch/items/:id`：刪除點餐項目

---

## 4. 前端 UI 設計規劃 (`src/components/LunchOrder/`)

- `LunchOrderManagement.tsx`：主要面板頁面
  - **頂部統計與操作區**：發起新團購按鈕、店家管理按鈕、當前開放訂購的團購計時器與統計卡片。
  - **團購單卡片與明細檢視**：
    - 展示團購店家資訊、電話、截止時間與進度條。
    - 快速加點表單（選擇餐點、數量、客製備註）。
    - 明細統計表格：列出點餐同仁、餐點、金額、客製備註、付款切換開關 (`已付款` / `未付款`)。
  - **店家與菜單管理 Modal**：可新增店家名稱、電話與自訂菜單品項及價格。

---

## 5. 驗證與測試計畫

1. **TypeScript 與語法檢查**：執行 `npm run lint` 確保 0 型別錯誤。
2. **生產打包測試**：執行 `npm run build` 驗證編譯無誤。
3. **SQLite 自動開表與種子資料測試**：啟動後自動灌入 2 家種子店家（如「正宗排骨便當」、「五十嵐手搖飲」）與 1 筆進行中的團購。
4. **雙腳本實測**：使用 `start.bat` / `stop.bat` 驗證前後端與午餐訂購功能的即時反應。
