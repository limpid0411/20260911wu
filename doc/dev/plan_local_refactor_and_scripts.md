# [開發計畫] 本地電腦執行重構與啟動關閉雙腳本 (Local Execution Refactor & Server Control Scripts)

> **檔案命名慣例**：`doc/dev/plan_local_refactor_and_scripts.md`  
> **建立日期**：2026-09-11  
> **負責人 / Agent**：Antigravity (Code Reviewer & Senior Engineer)  
> **狀態**：已完成開發、測試驗證並已回寫規格 (Completed & Spec Synchronized)  

---

## 1. 需求背景與現況分析

### 1.1 使用者需求
- 將專案完整重構為「本地電腦可穩定執行」的版本。
- 建立兩支標準腳本：
  1. **啟動伺服器腳本**（`start.bat`）：一鍵啟動本地服務、自動檢查環境與開啟瀏覽器。
  2. **關閉伺服器腳本**（`stop.bat`）：一鍵停止伺服器、釋放連接埠。

### 1.2 現況盤點與優化痛點
- **專案現狀**：根目錄已有早期初版的 `start.bat` 與 `stop.bat`，但存在以下問題：
  1. **依賴 PowerShell 執行權限**：目前 `stop.bat` 內部呼叫 `stop.ps1`。在許多 Windows 系統中，PowerShell 預設安全原則為 `Restricted`，容易因安全性原則無法載入腳本而導致關閉失敗。
  2. **套件設定雜訊**：`package.json` 中的專案名稱仍為預設 `react-example`，且存在雲端殘留套件依賴（如 `express`, `dotenv`, `@google/genai`），但實際前端代碼均使用瀏覽器純本地儲存（`storageService`），可清理為純淨本地版本。
  3. **視窗與程序殘留**：需要確保 `stop.bat` 能乾淨終止佔用 3000 連接埠的 Node/Vite 程序，並自動關閉殘留的伺服器黑視窗。

---

## 2. 重構與腳本架構設計

### 2.1 啟動腳本 (`start.bat`) 設計
- **編碼規範**：開頭設定 `chcp 65001 >nul`（UTF-8），避免中文提示出現亂碼。
- **視窗識別**：明確指定視窗標題 `title 企業級專案管理系統 (PMS) 伺服器`，便於停止腳本精準識別與關閉。
- **Node.js 環境檢測**：利用 `where node` 檢測，若未安裝則輸出友善繁體中文提示與官方下載指引。
- **相依套件檢測與自動安裝**：檢查是否存在 `node_modules/`，若無則自動呼叫 `npm.cmd install`。
- **連接埠防衝突**：啟動前先檢查 3000 連接埠，若已被佔用則自動釋放，避免 `Port 3000 is in use`。
- **自動化體驗**：自動喚醒預設瀏覽器開啟 `http://localhost:3000`，並執行 `npm.cmd run dev` 顯示即時日誌。

### 2.2 關閉腳本 (`stop.bat`) 設計
- **零外部依賴（純原生 Windows Batch）**：
  - 不透過 PowerShell，改用 Windows 內建的 `netstat -ano` 找出所有佔用 `3000` 連接埠之 PID，直接以 `taskkill /F /PID <pid>` 強制釋放。
  - 同時使用 `taskkill /F /FI "WINDOWTITLE eq 企業級專案管理系統*" 2>nul` 關閉伺服器視窗。
  - 完全避開 PowerShell ExecutionPolicy 受限的問題，保證任何 Windows 電腦上「雙擊即關閉」。

### 2.3 專案配置優化 (`package.json`)
- 專案名稱更新為 `enterprise-pms-rfi`。
- 保持 `dev`（`vite`）、`build`（`vite build`）、`lint`（`tsc --noEmit`）標準腳本。

---

## 3. 預計變更檔案清單

| 操作類型 | 檔案路徑 | 變更說明 |
| :--- | :--- | :--- |
| **[NEW]** | `doc/dev/plan_local_refactor_and_scripts.md` | 本重構計畫書 |
| **[MODIFY]** | `start.bat` | 強化環境檢測、連接埠釋放與 UTF-8 中文視窗標題 |
| **[MODIFY]** | `stop.bat` | 改寫為純原生 Batch 腳本，移除 PowerShell 依賴，確保雙擊 100% 成功關閉 |
| **[MODIFY]** | `package.json` | 規範化專案名稱，優化本地執行設定 |
| **[MODIFY]** | `doc/spec/00_系統規格總覽與架構導引.md` | 回寫本地執行與運維雙腳本之正式規格 |

---

## 4. 安全性與效能評估
- **安全性 (Security)**：
  - 僅針對 3000 連接埠程序與特定標題之伺服器視窗進行終止，不誤殺作業系統或其他無關程序。
- **效能與相容性 (Performance & Compatibility)**：
  - 純 Batch 執行速度在毫秒級完成。
  - 完全相容 Windows 10 / Windows 11，無需管理員提權即可正常運行與終止使用者層級的本地 Vite 伺服器。

---

## 5. 驗證與測試計畫
- [x] 執行 `start.bat` 驗證：
  - 自動偵測環境
  - 自動開啟瀏覽器導向 `http://localhost:3000`
  - 檢查網頁正常呈現且看板/RFI 功能可用
- [x] 執行 `stop.bat` 驗證：
  - 連接埠 3000 成功釋放
  - 伺服器終端機視窗自動關閉
- [x] 程式碼建置驗證：
  - `cmd /c npm run lint` 通過無錯誤
  - `cmd /c npm run build` 成功輸出正式產物

---

## 6. 規格回寫檢核表 (Spec Synchronization)
- [x] 將本地運維腳本與執行環境說明寫回 `doc/spec/00_系統規格總覽與架構導引.md`
- [x] 在本計畫標記為「已完成回寫規格」
