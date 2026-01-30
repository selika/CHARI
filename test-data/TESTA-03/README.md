# TESTA-03 測試資料

## 資料來源
本資料夾包含依據 [病人故事說明](../source/CHARI_TestData/README_病人故事說明.md) 中的「病人1：陳志明」生成的 FHIR R4 測試資料，符合 [CHARI_資料規格文件_完整版.md](../../plan/CHARI_資料規格文件_完整版.md) 規範。

## 病人概要

| 項目 | 值 |
|------|-----|
| **Patient ID** | `pt-testa-03` |
| **姓名** | 陳志明 |
| **身分證** | A123456789 |
| **健保卡號** | 900000000303 |
| **病歷號（關渡）** | 4015714025 |
| **生日** | 1957-03-15 |
| **年齡** | 68 歲 |
| **性別** | 男 |
| **血型** | O型 Rh+ |
| **過敏史** | ⚠️ **Penicillin**（皮疹）、**Arcoxia**（濕疹） |

## 住院紀錄

| # | Encounter ID | 入院日 | 出院日 | 狀態 | 醫院 | 說明 |
|---|--------------|--------|--------|------|------|------|
| 1 | `enc-testa03-01` | 2025-07-25 | 2025-08-04 | finished | 關渡醫院 | NSTEMI s/p LAD PCI |
| 2 | `enc-testa03-02` | 2025-12-22 | — | **in-progress** | 關渡醫院 | 三支血管疾病，**準備轉院 CABG** |

## 臨床情境

### 💡 CHARI 系統使用情境
這是一個「**住院中轉院**」案例。病人目前在關渡醫院住院中，需轉至臺北榮總心臟外科接受 CABG 手術。

關渡醫院透過 CHARI 系統上傳 **轉院病摘 (LOINC 18761-7)**，讓臺北榮總能在病人到院前掌握：
- 完整病史：NSTEMI、PCI 病史、心衰竭
- ⚠️ **藥物過敏**：Penicillin、Arcoxia
- 目前用藥：包含 Heparin drip
- 最新檢驗：心臟指標 (Troponin, BNP)、腎功能

## 檔案列表

| 檔案 | 說明 | 資源數 |
|------|------|--------|
| `organization-kdgh.json` | 臺北榮民總醫院關渡分院 | 1 |
| `patient.json` | 病人基本資料（含健保卡號、緊急聯絡人） | 1 |
| `practitioners.json` | 林妘奕（過敏註記）、心臟內科醫師 | 2 |
| `allergy-intolerance.json` | Penicillin、Arcoxia 過敏 | 2 |
| `encounters.json` | 2 次住院（含 in-progress 轉院案例） | 2 |
| `conditions.json` | NSTEMI, TVD, ISR, HF, HTN, DM, 高血脂 | 7 |
| `procedures.json` | LAD PCI with DES、心導管檢查 | 2 |
| `medication-statements.json` | 住院用藥（含 Heparin drip） | 8 |
| `observations.json` | 檢驗（CBC, 心臟指標, 糖化血色素） | 9 |
| `compositions.json` | 出院病摘 + **轉院病摘** | 2 |

## 規格符合度

### ✅ 完整符合項目
- Patient 含身分證、健保卡號、病歷號、緊急聯絡人
- **AllergyIntolerance 過敏記錄**（重要！）
- Encounter status `in-progress`（住院中轉院）
- Composition type `18761-7`（**Transfer summary note** 轉院病摘）
- MedicationStatement category `inpatient`（住院用藥）

### 特殊資料項目
此病例是**轉院案例**，與 TESTA-01/02 的出院案例不同：
- ✅ 使用 Transfer Summary (18761-7) 而非 Discharge Summary
- ✅ Encounter status 為 `in-progress`
- ✅ AllergyIntolerance 過敏記錄
- ✅ 住院用藥含 IV drip (Heparin)
- ✅ 轉院目的地資訊

## 使用方式

```bash
# 先 POST Organization（如果 org-vghtpe 已存在，只需 POST 關渡醫院）
POST organization-kdgh.json

# 依序 POST
POST patient.json
POST practitioners.json
POST allergy-intolerance.json  # 重要！
POST encounters.json
POST conditions.json
POST procedures.json
POST medication-statements.json
POST observations.json
POST compositions.json
```

## 查詢範例

```http
# 用健保卡號查詢
GET /Patient?identifier=urn:oid:2.16.886.101.100|900000000303

# 查詢過敏記錄（重要！）
GET /AllergyIntolerance?patient=Patient/pt-testa-03

# 查詢轉院病摘
GET /Composition?subject=Patient/pt-testa-03&type=http://loinc.org|18761-7

# 查詢目前住院（in-progress）
GET /Encounter?subject=Patient/pt-testa-03&status=in-progress
```

---

*測試情境*：住院中轉院（關渡醫院 → 臺北榮民總醫院心臟外科 CABG）
