# TESTA-01 測試資料

## 資料來源
本資料夾包含從真實去識別化病歷轉換的 FHIR R4 測試資料，符合 [CHARI_資料規格文件_完整版.md](../../plan/CHARI_資料規格文件_完整版.md) 規範。

## 病人概要

| 項目 | 值 |
|------|-----|
| **Patient ID** | `pt-testa-01` |
| **姓名** | TESTA-01（去識別化） |
| **身分證** | F73278868 |
| **健保卡號** | 900000000101 |
| **病歷號** | 5038295838 |
| **生日** | 1991-03-15 |
| **性別** | 女 |
| **診斷** | Systemic lupus erythematosus (SLE) |

## 住院紀錄

| # | Encounter ID | 入院日 | 出院日 | 科別 | 主治醫師 |
|---|--------------|--------|--------|------|----------|
| 1 | `enc-testa01-01` | 2025-11-20 | 2025-11-22 | AIR 過敏免疫風濕科 | 陳光翰 |
| 2 | `enc-testa01-02` | 2026-01-08 | 2026-01-10 | AIR 過敏免疫風濕科 | 陳光翰 |

## 檔案列表

| 檔案 | 說明 | 資源數 |
|------|------|--------|
| `organization.json` | 臺北榮民總醫院 | 1 |
| `patient.json` | 病人基本資料 | 1 |
| `practitioners.json` | 陳光翰、陳曜瑋、曾心宜 | 3 |
| `encounters.json` | 2 次住院 | 2 |
| `conditions.json` | SLE（active）、肝酵素升高（resolved） | 2 |
| `procedures.json` | Belimumab、Anifrolumab 治療 | 3 |
| `medication-statements.json` | Myfortic 出院帶回藥 | 2 |
| `observations.json` | 檢驗數據（CBC、生化、免疫） | 30 |
| `compositions.json` | 出院病摘（LOINC 18842-5） | 2 |

## 規格符合度

### ✅ 完整符合項目
- Patient 含身分證（2.16.886.103）及病歷號
- Organization 含醫院代碼（0601160016）
- Encounter 含住院期間、主治醫師
- Condition 含 ICD-10 代碼、clinicalStatus
- MedicationStatement 使用 `category: outpatient`（出院帶回藥）
- Composition 使用 `type: 18842-5`（Discharge summary）
- Composition.section 包含標準 LOINC 段落代碼
- Observation 含 LOINC 代碼、interpretation（H/L）

### ⚠️ 本案例不適用項目（來源資料無此內容）
- DiagnosticReport（影像報告）：原始病歷無影像檢查
- DiagnosticReport（EKG）：原始病歷無心電圖
- AllergyIntolerance：病人無已知過敏（NKDA）
- CarePlan：出院計畫僅「繼續門診追蹤」

## 使用方式

```bash
# 依序 POST 到 FHIR Server
POST organization.json
POST patient.json
POST practitioners.json
POST encounters.json
POST conditions.json
POST procedures.json
POST medication-statements.json
POST observations.json
POST compositions.json
```

## 查詢範例

```http
# 查詢病人
GET /Patient?identifier=urn:oid:2.16.886.103|F73278868

# 查詢出院病摘
GET /Composition?subject=Patient/pt-testa-01&type=http://loinc.org|18842-5

# 查詢 SLE 診斷
GET /Condition?subject=Patient/pt-testa-01&code=M32.19
```
