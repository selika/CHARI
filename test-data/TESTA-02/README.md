# TESTA-02 測試資料

## 資料來源
本資料夾包含從真實去識別化病歷轉換的 FHIR R4 測試資料，符合 [CHARI_資料規格文件_完整版.md](../../plan/CHARI_資料規格文件_完整版.md) 規範。

## 病人概要

| 項目 | 值 |
|------|-----|
| **Patient ID** | `pt-testa-02` |
| **姓名** | TESTA-02（去識別化） |
| **身分證** | H405481546 |
| **健保卡號** | 900000000202 |
| **病歷號** | 5141095421 |
| **生日** | 1958-05-13 |
| **性別** | 女 |
| **年齡** | 67 歲 |
| **主要診斷** | Severe aortic stenosis s/p TAVI |

## 住院紀錄

| # | Encounter ID | 入院日 | 出院日 | 科別 | 目的 |
|---|--------------|--------|--------|------|------|
| 1 | `enc-testa02-01` | 2025-08-14 | 2025-08-19 | CVS 心臟血管外科 | Pre-TAVI evaluation |
| 2 | `enc-testa02-02` | 2025-09-21 | 2025-09-27 | CVS 心臟血管外科 | TAVI procedure |

## 病史摘要

### Active Conditions
- Severe aortic stenosis → **s/p TAVI 2025/9/23 (24.5mm MyVAL)**
- Heart failure with reduced ejection fraction (LVEF 32.9%)

### Underlying Conditions
- ESRD on hemodialysis (20+ years)
- CAD s/p PCI with DES+BMS (2025/7/30)
- Diabetes mellitus
- Hepatitis B carrier (inactive)

## 檔案列表

| 檔案 | 說明 | 資源數 |
|------|------|--------|
| `patient.json` | 病人基本資料（含健保卡號） | 1 |
| `practitioners.json` | 張奕煌、陳效宏、鄭光翔 | 3 |
| `encounters.json` | 2 次住院（含 ICU 轉床記錄） | 2 |
| `conditions.json` | AS, HF, ESRD, CAD, DM, HBV | 6 |
| `procedures.json` | TAVI, PCI, 拔牙 | 3 |
| `medication-statements.json` | 出院帶回藥（DAPT, statin, etc） | 8 |
| `observations.json` | 檢驗數據（CBC、生化） | 14 |
| `diagnostic-reports.json` | EKG, CXR, CT, Doppler | 4 |
| `compositions.json` | 出院病摘（LOINC 18842-5） | 2 |

## 規格符合度

### ✅ 完整符合項目
- Patient 含身分證、健保卡號、病歷號
- Encounter 含 ICU 轉床記錄 (location array)
- Procedure: TAVI 手術記錄
- DiagnosticReport: EKG、影像報告
- MedicationStatement: 出院帶回藥使用 `category: outpatient`
- Composition type: `18842-5` (Discharge summary)

### 特殊資料項目
此病例比 TESTA-01 更複雜，包含：
- 多重共病 (6 個 Conditions)
- 手術記錄 (TAVI)
- 影像檢查報告 (CT, Doppler, CXR)
- 心電圖報告 (EKG)
- ICU 住院經過

## 使用方式

```bash
# 使用 TESTA-01 的 organization.json（同一家醫院）
POST organization.json  # 從 TESTA-01 複製

# 依序 POST
POST patient.json
POST practitioners.json
POST encounters.json
POST conditions.json
POST procedures.json
POST medication-statements.json
POST observations.json
POST diagnostic-reports.json
POST compositions.json
```

## 查詢範例

```http
# 用健保卡號查詢
GET /Patient?identifier=urn:oid:2.16.886.101.100|900000000202

# 查詢出院病摘
GET /Composition?subject=Patient/pt-testa-02&type=http://loinc.org|18842-5

# 查詢 TAVI 手術
GET /Procedure?subject=Patient/pt-testa-02&code=418824004
```
