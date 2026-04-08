# 第二階段 OAuth 測試說明

## 背景

CHARI（轉院住院病歷整合系統）已通過衛福部第一階段審核，第二階段需驗證 **SMART on FHIR OAuth2 授權流程**。

衛福部提供了一組 OAuth 憑證（`client_id` + `client_secret`），要求整合進應用程式的 launch 流程。

### 測試要點

- **三種模式擇一**：EHR Launch、Standalone Launch、Backend Service
- 提供 [launch.smarthealthit.org](https://launch.smarthealthit.org) 自測連結，正式測試前可先自行驗證
- 正式測試使用**評審私人的 Launcher**，非 THAS Sandbox
- 測試截止期限：**2026-04-10**

---

## 新增的 OAuth 功能

對應第二階段需求，專案新增了以下實作：

### Auth 相關檔案

| 檔案 | 用途 |
|------|------|
| `src/hooks/useFhirClient.js` | 核心 auth hook — 判斷三種模式：SMART Launch (`iss`)、OAuth callback (`code`+`state`)、直連衛福部沙盒 |
| `public/launch.html` | EHR Launch 進入點 — 接收 `iss`/`launch` 參數後轉給 React app |
| `src/components/EhrLaunchInfo.jsx` | EHR Launch 頁面 — 顯示技術說明、直接啟動 OAuth 授權按鈕 |
| `src/components/SmartLaunchTest.jsx` | Standalone Launch 測試頁 — 手動輸入 Client ID/Secret 測試連線 |

### 需求與實作對應

| 需求 | 對應實作 |
|------|---------|
| 整合 client_id / client_secret | `useFhirClient.js` — 從環境變數或 sessionStorage 讀取憑證，呼叫 `FHIR.oauth2.authorize()` |
| EHR Launch 模式 | `launch.html` 作為進入點，接收 `iss`+`launch` 參數轉進 React app 啟動授權 |
| EHR Launch 頁面 + 直接啟動按鈕 | `EhrLaunchInfo.jsx` — 顯示 Launch URL / Redirect URI / Scopes，可直接對 smarthealthit.org 測試 |
| Standalone Launch 自測 | `SmartLaunchTest.jsx` — 手動輸入憑證測試，憑證存 sessionStorage 關閉即清 |
| 憑證安全性 | 正式憑證放 GitHub Secrets，build 時注入 `VITE_SMART_*` 環境變數，不進 source code |

---

## OAuth 授權流程

### 1. EHR Launch

```
外部 Launcher
  → launch.html（接收 iss + launch 參數）
  → React app（useFhirClient 偵測 iss）
  → FHIR.oauth2.authorize()（啟動 OAuth2 授權）
  → 授權伺服器（使用者登入並同意）
  → Redirect 回 CHARI（帶 code + state）
  → FHIR.oauth2.ready()（完成 token 交換，載入病患資料）
```

### 2. Standalone Launch

```
SmartLaunchTest 頁面（使用者輸入憑證）
  → 存入 sessionStorage
  → FHIR.oauth2.authorize()（帶 iss 參數）
  → 授權伺服器（使用者選擇病人並同意）
  → Redirect 回 CHARI（帶 code + state）
  → FHIR.oauth2.ready()（完成 token 交換）
```

### 3. 直連模式（無 OAuth）

```
無 SMART 參數
  → FHIR.client({ serverUrl })
  → 直接連接衛福部 THAS 沙盒（開放存取）
```

---

## 憑證管理

| 類型 | 儲存方式 | 說明 |
|------|---------|------|
| 正式憑證 | GitHub Secrets → `VITE_SMART_CLIENT_ID` / `VITE_SMART_CLIENT_SECRET` | Build 時由 Vite 注入，不出現在原始碼中 |
| 測試憑證 | 瀏覽器 sessionStorage（`CHARI_SMART_TEST`） | 關閉分頁即清除，`useFhirClient` 優先讀取 |
