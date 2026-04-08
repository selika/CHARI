# CHARI 第二階段測試 — 給測試官的說明

## 團隊：轉院住院病歷整合系統 (CHARI)

---

### 一、測試模式

我們選擇以 **EHR Launch** 模式進行測試。

| 項目 | 值 |
|------|-----|
| Launch URL | `https://selika.github.io/CHARI/launch.html` |
| Redirect URI | `https://selika.github.io/CHARI/` |
| Scopes | `launch openid fhirUser patient/*.read` |
| Client ID | 已透過環境變數注入（使用您提供的 `cc344727-...`） |

---

### 二、原先架構與修正說明

#### 原先架構（第一階段）

在第一階段測試中，CHARI 直接連接衛福部 THAS 沙盒取得病患資料，不需要 OAuth 認證：

```
使用者 → CHARI → 直接查詢 THAS (https://thas.mohw.gov.tw/v/r4/fhir) → 取得資料
```

- 資料來源：衛福部 THAS Sandbox（開放存取）
- 認證方式：無（THAS 沙盒為公開測試環境）

#### 進入第二階段後的問題

收到第二階段通知後，我們加入了 OAuth2 授權流程。但初期的設計是：

```
測試官 Launcher → CHARI OAuth 登入（測試官的伺服器）→ 認證完成後 → 回到 CHARI 讀取 THAS 的資料
```

這個架構有誤：**OAuth Token 是由測試官的 FHIR Server 簽發的，只能存取該伺服器的資料，無法用於存取 THAS。** 等同於在 A 醫院登入，卻試圖讀 B 醫院的資料。

#### 修正後的架構（現行版本）

現在 CHARI 遵循 SMART on FHIR 標準流程 — **OAuth 登入哪台伺服器，就從哪台伺服器取資料**：

```
測試官 Launcher (iss=測試官的 FHIR Server)
  → CHARI OAuth 登入
  → Patient Picker 選擇病人
  → CHARI 用 OAuth Token 從「同一台伺服器」讀取該病人的資料
```

因此需要將測試資料上傳至測試官的 FHIR Server，才能在 OAuth 完成後看到完整的臨床資料。

---

### 三、OAuth 流程說明

1. 測試官從 Launcher 啟動 CHARI，帶入 `iss` 與 `launch` 參數至 `launch.html`
2. CHARI 自動啟動 OAuth2 授權流程（`FHIR.oauth2.authorize()`）
3. 使用者在授權頁面登入，並在 **Patient Picker 選擇病人**
4. 授權完成後 redirect 回 CHARI，系統自動完成 token 交換
5. CHARI 使用取得的 OAuth Token，從**測試官的 FHIR Server** 讀取該病人的臨床資料

---

### 四、測試資料

隨信附上 **CHARI-test-bundles.zip**，包含 3 筆測試案例的 FHIR Transaction Bundle：

| Bundle 檔案 | 病人 | 診斷 | 資源數 |
|-------------|------|------|--------|
| `TESTA-01-bundle.json` | 林小萱（女，35歲） | SLE 紅斑性狼瘡 | 52 |
| `TESTA-02-bundle.json` | 王美華（女，67歲） | 重度主動脈瓣狹窄 s/p TAVI | 52 |
| `TESTA-03-bundle.json` | 陳志明（男，68歲） | NSTEMI，住院中轉院 | 37 |

**格式說明：**
- Bundle type: `transaction`
- 所有 request 使用 `PUT`（ID 已鎖定）
- ID 皆為非純數字格式（如 `pt-testa-01`、`enc-testa02-01`）
- 資料符合 TW Core IG profile

**上傳後，在 Patient Picker 搜尋以下任一病人即可測試：**
- `pt-testa-01`（林小萱）
- `pt-testa-02`（王美華）
- `pt-testa-03`（陳志明）

---

### 五、預期測試結果

OAuth 登入並選擇病人後，CHARI 會顯示：

- 病人基本資料
- 住院紀錄（Encounter）
- 出院病摘 / 轉院病摘（Composition）
- 診斷、處置、用藥、檢驗報告等完整臨床資料

如有任何問題，歡迎隨時聯繫。謝謝！
