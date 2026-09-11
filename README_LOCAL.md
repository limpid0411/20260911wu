# 企業級專案管理系統 (Enterprise PMS & RFI) - 本地電腦執行指南

本專案已成功重構為**純本地電腦執行版本**，移除了雲端 AI Studio / Cloud Run 的特定環境變數限制，並完成所有相依套件安裝與建置驗證。

---

## 📁 啟動與關閉腳本清單

專案根目錄下已為您建立好以下腳本：

| 檔案名稱 | 說明 | 適用對象 |
| :--- | :--- | :--- |
| **`start.bat`** | **【推薦】標準啟動腳本**：雙擊直接執行，自動檢測相依套件、自動開啟瀏覽器並顯示伺服器即時日誌視窗。 | Windows 檔案總管雙擊 |
| **`stop.bat`** | **【推薦】一鍵關閉腳本**：雙擊直接執行，自動終止佔用 3000 連接埠的程序與伺服器視窗。 | Windows 檔案總管雙擊 |
| **`start-background.bat`** | **背景啟動腳本**：在完全背景下啟動伺服器並開啟瀏覽器，不佔用終端機視窗。 | 偏好無黑視窗使用者 |
| **`start.ps1`** | **PowerShell 啟動腳本**：適合在 VS Code 終端機或 PowerShell 中執行。 | 命令列開發者 |
| **`stop.ps1`** | **PowerShell 關閉腳本**：適合在 VS Code 終端機或 PowerShell 中執行。 | 命令列開發者 |

---

## 🚀 使用說明

### 方式一：直接雙擊執行（最推薦）
1. 打開專案資料夾 `20260911wu`。
2. **啟動**：滑鼠雙擊 **`start.bat`**
   - 系統會自動檢查是否已安裝 Node.js。
   - 若尚未安裝 `node_modules`，會自動為您執行 `npm install`。
   - 自動開啟預設瀏覽器並導向 **`http://localhost:3000`**。
   - 伺服器終端機視窗會持續顯示即時編譯日誌與熱更新狀態。
3. **關閉**：
   - 方式 A：直接雙擊 **`stop.bat`** 即可一鍵關閉服務。
   - 方式 B：直接關閉啟動時開啟的 `企業級專案管理系統 (PMS)` 視窗。

---

### 方式二：使用 PowerShell 終端機執行
在專案根目錄打開 PowerShell，執行以下指令：
```powershell
# 啟動服務
.\start.ps1

# 關閉服務
.\stop.ps1
```

---

### 方式三：手動 NPM 命令列執行
```bash
# 安裝相依套件（初次使用）
npm install

# 啟動本地開發伺服器
npm run dev

# 建置正式生產版本 (Dist)
npm run build
```

---

## ⚙️ 重構內容與優化重點

1. **`vite.config.ts` 重構**：
   - 移除雲端平台特定的 `DISABLE_HMR` 與環境變數限制，還原 Vite 原生的熱模組替換（Hot Module Replacement, HMR）功能，本地修改程式碼即時刷新。
   - 設定伺服器固定監聽連接埠 `3000` 與主機 `0.0.0.0`，支援本機（`localhost`）與區域網路裝置連線測試。
   - 規範化路徑別名 (`@`) 解析為標準 ESM 格式。
2. **`package.json` 跨平台修復**：
   - 移除 Linux 特定的 `rm -rf` 命令，確保 Windows、macOS 與 Linux 均能平穩執行 npm scripts。
   - 補齊相依套件並成功通過全專案生產版本建置 (`npm run build`)。
3. **智慧型運維腳本**：
   - 解決 Windows PowerShell 預設執行原則 (`Restricted`) 導致 `npm.ps1` 無法執行的問題。
   - 自動處理連接埠佔用衝突（自動重置 3000 連接埠舊程序，避免 `Port 3000 is in use` 報錯）。
   - 腳本全面採用 UTF-8 編碼與繁體中文介面。
