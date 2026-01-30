# CHARI：轉院住院病歷整合系統

> **SMART on FHIR App** - 跨院病摘雙向交換平台

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![FHIR](https://img.shields.io/badge/FHIR-R4-orange.svg)](https://hl7.org/fhir/R4/)
[![Platform](https://img.shields.io/badge/Platform-衛福部%20SMART-green.svg)](https://thas.mohw.gov.tw/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://selika.github.io/CHARI/)

---

## 專案簡介

**CHARI** (Cross-Hospital Admission Record Integration) 是一個 SMART on FHIR App，用於解決跨院轉診時的病歷整合問題。讓接收醫院能快速查閱轉出醫院的病摘，並選擇性導入至本院病歷系統。

**Live Demo**: https://selika.github.io/CHARI/

### 解決的問題

| 痛點 | 現況 | CHARI 解決方案 |
|------|------|----------------|
| 資料取得困難 | 紙本傳真、PDF 掃描 | FHIR 標準化查詢 |
| 無法直接利用 | 人工逐項抄寫 | 一鍵選擇性導入 |
| 資訊可能遺漏 | 過敏史、用藥未被注意 | 結構化呈現與警示 |

---

## 系統架構

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  A 醫院（轉出端） │     │  衛福部 FHIR Server  │     │  B 醫院（接收端） │
│                 │     │                     │     │                 │
│  ┌───────────┐  │     │  ┌───────────────┐  │     │  ┌───────────┐  │
│  │    HIS    │  │     │  │  Composition  │  │     │  │    HIS    │  │
│  └─────┬─────┘  │     │  │    Bundle     │  │     │  └─────┬─────┘  │
│        │        │     │  └───────────────┘  │     │        │        │
│  ┌─────▼─────┐  │     │                     │     │  ┌─────▼─────┐  │
│  │ CHARI App │──┼────►│  POST 出院/轉院病摘  │     │  │ CHARI App │  │
│  └───────────┘  │     │                     │◄────┼──│ GET 病摘   │  │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
```

---

## 核心功能

### Encounter-Based Timeline（就診時間軸）

以「就診紀錄 (Encounter)」為主軸，整合顯示：
- 出院病摘（藍色主題）
- 轉院病摘（橘色主題，標註「住院中轉院」）
- 門診記錄（綠色主題）

### 病摘導入功能

| 項目 | 說明 |
|------|------|
| 過敏註記 | 預設導入，高風險過敏紅色警示 |
| 主訴 / 現病史 | 可選擇導入，以 FHIR DocumentReference 格式 |
| 診斷 | Condition 資源，含 ICD 代碼 |
| 用藥記錄 | MedicationStatement，區分住院用藥/出院帶回 |
| 手術處置 | Procedure 資源 |
| 檢驗報告 | Observation 資源，異常值紅字標示 |

### 支援的 FHIR Resources

- `Composition` - 出院/轉院病摘
- `Encounter` - 就醫紀錄（住院/門診）
- `Condition` - 診斷
- `MedicationStatement` - 用藥紀錄
- `AllergyIntolerance` - 過敏史
- `Procedure` - 手術/處置
- `Observation` - 檢驗數據
- `DiagnosticReport` - 影像/EKG 報告

---

## 測試案例

本專案提供 AI 生成符合臨床實務的 3 位測試病人：

| 病人 | 診斷 | 情境 | 來源醫院 |
|------|------|------|----------|
| 林小萱 | SLE 紅斑性狼瘡 | 出院後轉院 | 臺北榮民總醫院 |
| 王美華 | Severe AS s/p TAVI | 出院後轉院 | 臺北榮民總醫院 |
| 陳志明 | NSTEMI 三支血管疾病 | 住院中轉院 | 關渡醫院 |

**FHIR Server**: `https://thas.mohw.gov.tw/v/r4/fhir`

---

## 技術規格

| 項目 | 規格 |
|------|------|
| FHIR 版本 | R4 |
| Profile | TW Core IG |
| 認證方式 | OAuth 2.0 (SMART App Launch) |
| 前端框架 | React 18 + Vite |
| FHIR Client | fhirclient.js |
| UI 框架 | Tailwind CSS + Lucide Icons |
| 部署方式 | GitHub Pages |

### 環境設定

| 環境 | URL |
|------|-----|
| Demo | `https://selika.github.io/CHARI/` |
| FHIR Server | `https://thas.mohw.gov.tw/v/r4/fhir` |
| Patient Browser | `https://thas.mohw.gov.tw/patient-browser/` |

---

## 專案結構

```
CHARI/
├── README.md                 # 本文件
├── LICENSE                   # Apache 2.0
├── package.json              # 專案設定
├── vite.config.js            # Vite 設定
├── src/
│   ├── App.jsx               # 主應用程式
│   ├── main.jsx              # 進入點
│   ├── components/
│   │   ├── PatientSearch.jsx     # 病人查詢
│   │   ├── CompositionList.jsx   # 病摘時間軸
│   │   ├── CompositionDetail.jsx # 病摘導入
│   │   └── Layout.jsx            # 頁面布局
│   └── services/
│       └── fhirQueries.js        # FHIR 查詢封裝
├── test-data/
│   ├── TESTA-01/             # 林小萱測試資料
│   ├── TESTA-02/             # 王美華測試資料
│   └── TESTA-03/             # 陳志明測試資料
├── scripts/
│   └── upload-*.cjs          # 資料上傳腳本
└── plan/
    └── 提案大綱_CHARI_完整版.md  # 專案提案書
```

---

## 開發與部署

```bash
# 安裝依賴
npm install

# 本地開發
npm run dev

# 建置
npm run build

# 部署至 GitHub Pages
npm run deploy
```

---

## 開發進度

| 階段 | 狀態 |
|------|------|
| Phase 1: 病摘查詢與時間軸 | ✅ 完成 |
| Phase 2: 病摘導入功能 | ✅ 完成 |
| Phase 3: 測試資料建立 | ✅ 完成 |

---

## 開源授權

本專案採用 **Apache License 2.0** 授權。

---

## 作者

**蔡世能** - 臺北榮民總醫院 教學部教師培育科 資訊工程師

---

## 參考資料

- [HL7 FHIR R4](https://hl7.org/fhir/R4/)
- [SMART App Launch IG](https://docs.smarthealthit.org/)
- [TW Core IG](https://twcore.mohw.gov.tw/)
- [fhirclient.js](https://docs.smarthealthit.org/client-js/)
- [衛福部 SMART 平台](https://thas.mohw.gov.tw/)
