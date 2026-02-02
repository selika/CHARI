# CHARI 資料規格文件（完整版）
## Cross-Hospital Admission Record Integration

---

## 文件資訊

| 項目 | 內容 |
|------|------|
| **文件版本** | v1.0 |
| **建立日期** | 2026-01-29 |
| **適用專案** | CHARI - 轉院住院病歷整合系統 |
| **基礎標準** | HL7 FHIR R4、TW Core IG |
| **授權條款** | Apache 2.0 |

---

## 目錄

1. [臨床情境與需求分析](#一臨床情境與需求分析)
2. [文件類型標準代碼](#二文件類型標準代碼)
3. [資料項目規格](#三資料項目規格)
4. [用藥記錄分類策略](#四用藥記錄分類策略)
5. [Composition 結構設計](#五composition-結構設計)
6. [FHIR 查詢範例](#六fhir-查詢範例)
7. [標準依據與參考資料](#七標準依據與參考資料)

---

## 一、臨床情境與需求分析

### 1.1 兩種轉院情境

CHARI 系統針對兩種常見的跨院轉診情境設計：

| 情境 | 說明 | 臨床範例 |
|------|------|----------|
| **出院後轉院** | 病人於 A 院完成急性治療出院後，轉至 B 院接受後續照護 | 心肌梗塞治療後轉復健醫院 |
| **住院中轉院** | 病人於 A 院住院中，因病情需要直接轉至 B 院繼續治療 | 區域醫院轉醫學中心手術 |

### 1.2 為什麼區分這兩種情境對臨床很重要？

#### 出院後轉院
- 病人**已完成急性治療**，病情相對穩定
- 用藥是「**出院帶回藥**」— 回家後要繼續吃的藥
- 接收端需要知道：出院診斷、出院用藥、後續追蹤計畫

#### 住院中轉院
- 病人**病情進行中**，可能仍在急性期
- 用藥是「**住院中用藥**」— 正在打的點滴、正在吃的藥
- 接收端需要知道：目前診斷、**目前用藥**、最新檢驗/影像結果
- **時間緊迫**：醫師需要快速掌握病情，可能需要立即處置

> ⚠️ **臨床關鍵差異**：住院中轉院的用藥記錄代表「病人現在正在使用的藥」，接收端醫師需要決定是否繼續、調整或停用。出院帶回藥則是「回家要吃的藥」，性質完全不同。

### 1.3 轉院資料需求分析

根據臨床實務，以下是兩種情境的資料需求差異：

| 資料類型 | 出院後轉院 | 住院中轉院 | 說明 |
|----------|:----------:|:----------:|------|
| **診斷** | ✅ 出院診斷 | ✅ 目前診斷 | 轉院原因、主要診斷 |
| **用藥** | ✅ 出院帶回藥 | ✅ 住院中用藥 | **性質不同，需明確區分** |
| **過敏史** | ✅ | ✅ | 病人安全，必備 |
| **檢驗報告** | ✅ 重要結果 | ✅ 最新結果 | 血液、生化、病毒檢驗 |
| **影像報告** | ✅ 重要結果 | ✅ 最新結果 | MRI、X-ray、CT 判讀 |
| **EKG** | ✅ 異常結果 | ✅ 最新結果 | 心臟相關病人特別重要 |
| **手術/處置** | ✅ 已完成 | ✅ 已完成 | 避免重複、了解病史 |
| **Vital Signs** | ❌ | ❌ | 救護車會測、護理站入院評估會重測 |
| **住院經過** | ✅ 完整 | ✅ 摘要 | 治療過程說明 |

---

## 二、文件類型標準代碼

### 2.1 Composition.type 選用

CHARI 根據臨床情境選用不同的 LOINC 文件類型代碼：

| 情境 | LOINC Code | Display | 中文 |
|------|------------|---------|------|
| **出院後轉院** | `18842-5` | Discharge summary | 出院病摘 |
| **住院中轉院** | `18761-7` | Transfer summary note | 轉院病摘 |

### 2.2 為什麼選用 LOINC 18761-7？

#### TW Core IG 現況
台灣 EMR-IG (v0.2.0) 目前定義的電子病歷表單包含：
- 出院病摘 ✅
- 門診病歷 ✅
- 檢驗檢查 ✅
- 醫療影像及報告 ✅
- 電子處方箋 ✅
- 調劑單張 ✅
- **轉院病摘 ❌ 尚未定義**

#### CHARI 的選擇
由於 TW Core IG 尚未定義轉院病摘，CHARI 依據**國際 LOINC Document Ontology 標準**，採用 `18761-7` (Transfer summary note) 作為住院中轉院的文件類型。

#### 選用理由
1. **語意明確**：明確區分「出院病摘」與「轉院病摘」
2. **國際標準**：HL7 C-CDA 及 FHIR 國際標準認可
3. **向下相容**：未來 TW Core IG 納入時可平順銜接
4. **互通性**：利於跨國系統整合

### 2.3 相關 LOINC 代碼一覽

| LOINC Code | Display | 說明 | 適用角色 |
|------------|---------|------|----------|
| `18761-7` | Transfer summary note | 通用轉院病摘 | 不限 |
| `18842-5` | Discharge summary | 出院病摘 | 不限 |
| `28616-1` | Physician Transfer note | 醫師轉院紀錄 | 醫師 |
| `68482-9` | Nurse Hospital Transfer summary note | 護理轉院病摘 | 護理師 |
| `34770-8` | General medicine Transfer summary note | 一般內科轉院病摘 | 內科醫師 |

---

## 三、資料項目規格

### 3.1 FHIR Resource 對照表

| 資料類型 | FHIR Resource | TW Core Profile | 操作 | 備註 |
|----------|---------------|-----------------|------|------|
| 診斷 | `Condition` | Condition-twcore | GET/POST | |
| 用藥記錄 | `MedicationStatement` | MedicationStatement-twcore | GET/POST | 需設定 category |
| 過敏史 | `AllergyIntolerance` | AllergyIntolerance-twcore | GET/POST | |
| 檢驗報告 | `Observation` | Observation-twcore | GET | 數值結果 |
| 檢驗報告 | `DiagnosticReport` | DiagnosticReport-twcore | GET | 報告文件 |
| 影像報告 | `DiagnosticReport` | DiagnosticReport-twcore | GET | **僅文字判讀** |
| EKG | `DiagnosticReport` | DiagnosticReport-twcore | GET | **僅文字判讀** |
| 手術/處置 | `Procedure` | Procedure-twcore | GET/POST | |
| 就醫紀錄 | `Encounter` | Encounter-twcore | GET/PATCH | |
| 病摘主結構 | `Composition` | Composition-twcore | GET/POST | |
| 病摘打包 | `Bundle` | Bundle-twcore | GET/POST | type=document |

### 3.2 檢驗報告規格

#### 處理原則
- 傳輸**數值結果**（Observation）
- 傳輸**報告結論**（DiagnosticReport）
- 涵蓋：血液、生化、病毒檢驗等

#### 範例
```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/observation-category",
      "code": "laboratory",
      "display": "Laboratory"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "2093-3",
      "display": "Cholesterol [Mass/volume] in Serum or Plasma"
    }]
  },
  "valueQuantity": {
    "value": 185,
    "unit": "mg/dL",
    "system": "http://unitsofmeasure.org",
    "code": "mg/dL"
  }
}
```

### 3.3 影像報告規格

#### 處理原則（MVP 版本）
- ✅ 傳輸**文字判讀報告**（DiagnosticReport）
- ✅ 傳輸**影像元數據**（ImagingStudy）— 讓接收端知道做過什麼檢查
- ❌ **不傳輸 DICOM 影像本身**

#### 為什麼不傳 DICOM 影像？
1. DICOM 影像檔案龐大（數百 MB ~ 數 GB）
2. 需要 WADO-RS server 支援
3. 臨床急用時，**文字判讀結論**才是醫師最需要的
4. 接收端可透過健保雲端或 PACS 自行調閱影像

#### 影像報告範例
```json
{
  "resourceType": "DiagnosticReport",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
      "code": "RAD",
      "display": "Radiology"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "30746-2",
      "display": "CT Head W contrast IV"
    }]
  },
  "conclusion": "No acute intracranial hemorrhage. No midline shift.",
  "conclusionCode": [{
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "260385009",
      "display": "Negative"
    }]
  }]
}
```

### 3.4 EKG 報告規格

#### 處理原則（MVP 版本）
- ✅ 傳輸**文字判讀報告**（DiagnosticReport）
- ❌ **不傳輸 HL7 aECG XML 波形檔案**

#### 為什麼不傳 EKG 波形？
1. 需要專用軟體開啟 XML 波形
2. 臨床急用時，**判讀結論**才是關鍵
3. 文字報告已包含：心率、節律、PR/QRS/QTc、判讀結論

#### EKG 報告範例
```json
{
  "resourceType": "DiagnosticReport",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
      "code": "EC",
      "display": "Electrocardiogram"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "11524-6",
      "display": "EKG study"
    }]
  },
  "conclusion": "Heart rate: 78 bpm. Sinus rhythm. PR interval: 160 ms. QRS duration: 90 ms. QTc: 420 ms. Interpretation: Normal sinus rhythm, no acute ST changes."
}
```

---

## 四、用藥記錄分類策略

### 4.1 臨床問題

> **問題**：接收端醫師收到一堆用藥記錄，如何快速區分「出院帶回藥」和「住院中正在使用的藥」？

### 4.2 解決方案：MedicationStatement.category

FHIR 提供標準的 `category` 欄位，使用 `medication-statement-category` 代碼系統：

| Code | Display | 中文 | 適用情境 |
|------|---------|------|----------|
| `inpatient` | Inpatient | 住院用藥 | **住院中轉院** |
| `outpatient` | Outpatient | 門診用藥 | 出院帶回藥 |
| `community` | Community | 社區用藥 | 出院帶回藥 |
| `patientspecified` | Patient Specified | 病人自述 | 入院前用藥 |

### 4.3 分類規則

#### 出院後轉院（出院帶回藥）
```json
{
  "resourceType": "MedicationStatement",
  "status": "active",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/medication-statement-category",
      "code": "outpatient",
      "display": "Outpatient"
    }]
  }],
  "medication": {
    "concept": {
      "coding": [{
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "1049221",
        "display": "Acetaminophen 325 MG Oral Tablet"
      }]
    }
  },
  "subject": { "reference": "Patient/patient-001" },
  "effectivePeriod": {
    "start": "2026-01-20"
  },
  "dosage": [{
    "text": "1 tablet QID PRN for pain"
  }]
}
```

#### 住院中轉院（住院中用藥）
```json
{
  "resourceType": "MedicationStatement",
  "status": "active",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/medication-statement-category",
      "code": "inpatient",
      "display": "Inpatient"
    }]
  }],
  "medication": {
    "concept": {
      "coding": [{
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "854228",
        "display": "Heparin sodium, porcine 1000 UNT/ML Injectable Solution"
      }]
    }
  },
  "subject": { "reference": "Patient/patient-001" },
  "effectivePeriod": {
    "start": "2026-01-25"
  },
  "dosage": [{
    "text": "1000 units/hr IV continuous infusion"
  }]
}
```

### 4.4 接收端快速識別

| 判斷依據 | 出院後轉院 | 住院中轉院 |
|----------|-----------|-----------|
| **Composition.type** | `18842-5` | `18761-7` |
| **MedicationStatement.category** | `outpatient` / `community` | `inpatient` |
| **臨床意義** | 出院帶回藥，回家要吃的 | 住院中正在打/吃的藥 |
| **接收端處置** | 參考用，評估是否繼續 | **需立即決定**是否繼續 |

### 4.5 為什麼這對臨床很重要？

#### 情境：45歲女性，急性主動脈剝離，從區域醫院轉醫學中心

**住院中用藥（category = inpatient）**：
- Labetalol 200mg IV q6h（控制血壓）
- Morphine 2mg IV PRN（止痛）
- Normal saline 100ml/hr（維持體液）

**接收端醫師需要立即知道**：
1. 病人現在血壓用什麼藥控制？→ 繼續或調整
2. 止痛藥用了什麼？效果如何？→ 評估疼痛程度
3. 點滴速度多少？→ 避免過量或不足

如果混在一堆「出院帶回藥」裡，醫師很難快速找到**目前正在使用的藥**。

---

## 五、Composition 結構設計

### 5.1 出院病摘結構（LOINC 18842-5）

```json
{
  "resourceType": "Composition",
  "status": "final",
  "type": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "18842-5",
      "display": "Discharge summary"
    }]
  },
  "category": [{
    "coding": [{
      "system": "http://loinc.org",
      "code": "11490-0",
      "display": "Physician Discharge summary"
    }]
  }],
  "subject": { "reference": "Patient/patient-001" },
  "encounter": { "reference": "Encounter/encounter-001" },
  "date": "2026-01-29T10:30:00+08:00",
  "author": [{ "reference": "Practitioner/dr-wang" }],
  "title": "出院病摘",
  "custodian": { "reference": "Organization/source-hospital" },
  "section": [
    {
      "title": "入院診斷",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "46241-6" }] }
    },
    {
      "title": "住院經過",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "8648-8" }] }
    },
    {
      "title": "出院診斷",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "11535-2" }] }
    },
    {
      "title": "出院用藥",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "10183-2" }] }
    },
    {
      "title": "過敏史",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "48765-2" }] }
    },
    {
      "title": "出院計畫",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "18776-5" }] }
    }
  ]
}
```

### 5.2 轉院病摘結構（LOINC 18761-7）

```json
{
  "resourceType": "Composition",
  "status": "final",
  "type": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "18761-7",
      "display": "Transfer summary note"
    }]
  },
  "category": [{
    "coding": [{
      "system": "http://loinc.org",
      "code": "11503-0",
      "display": "Medical records"
    }]
  }],
  "subject": { "reference": "Patient/patient-001" },
  "encounter": { "reference": "Encounter/encounter-001" },
  "date": "2026-01-29T10:30:00+08:00",
  "author": [{ "reference": "Practitioner/dr-wang" }],
  "title": "轉院病摘",
  "custodian": { "reference": "Organization/source-hospital" },
  "section": [
    {
      "title": "入院診斷",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "46241-6" }] }
    },
    {
      "title": "住院經過",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "8648-8" }] }
    },
    {
      "title": "目前診斷",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "11535-2" }] }
    },
    {
      "title": "住院中用藥",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "42346-7", "display": "Medications on admission" }] }
    },
    {
      "title": "過敏史",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "48765-2" }] }
    },
    {
      "title": "檢驗結果",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "30954-2", "display": "Relevant diagnostic tests/laboratory data" }] }
    },
    {
      "title": "影像檢查結果",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "18726-0", "display": "Radiology studies" }] }
    },
    {
      "title": "EKG 結果",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "11524-6", "display": "EKG study" }] }
    },
    {
      "title": "轉院原因與計畫",
      "code": { "coding": [{ "system": "http://loinc.org", "code": "42349-1", "display": "Reason for referral" }] }
    }
  ]
}
```

### 5.3 Section LOINC 代碼對照表

| 段落名稱 | LOINC Code | Display | TW Core 有定義 |
|----------|------------|---------|:--------------:|
| 入院診斷 | `46241-6` | Hospital admission diagnosis | ✅ |
| 住院經過 | `8648-8` | Hospital course | ✅ |
| 出院診斷 | `11535-2` | Hospital discharge diagnosis | ✅ |
| 出院用藥 | `10183-2` | Hospital discharge medications | ✅ |
| 過敏史 | `48765-2` | Allergies and adverse reactions | ✅ |
| 出院計畫 | `18776-5` | Plan of care | ✅ |
| 住院中用藥 | `42346-7` | Medications on admission | ⚠️ 借用 |
| 檢驗結果 | `30954-2` | Relevant diagnostic tests/laboratory data | ⚠️ 補充 |
| 影像檢查 | `18726-0` | Radiology studies | ⚠️ 補充 |
| EKG 結果 | `11524-6` | EKG study | ⚠️ 補充 |
| 轉院原因 | `42349-1` | Reason for referral | ⚠️ 補充 |

---

## 六、FHIR 查詢範例

### 6.1 查詢病人的轉院病摘

```http
GET [base]/Composition
    ?subject=Patient/{patient-id}
    &type=http://loinc.org|18761-7
    &_sort=-date
    &_include=Composition:author
    &_include=Composition:custodian
```

### 6.2 查詢病人的出院病摘

```http
GET [base]/Composition
    ?subject=Patient/{patient-id}
    &type=http://loinc.org|18842-5
    &_sort=-date
```

### 6.3 同時查詢出院及轉院病摘

```http
GET [base]/Composition
    ?subject=Patient/{patient-id}
    &type=http://loinc.org|18842-5,http://loinc.org|18761-7
    &_sort=-date
```

### 6.4 查詢住院中用藥（category = inpatient）

```http
GET [base]/MedicationStatement
    ?subject=Patient/{patient-id}
    &category=http://terminology.hl7.org/CodeSystem/medication-statement-category|inpatient
    &status=active
```

### 6.5 查詢最新檢驗結果

```http
GET [base]/Observation
    ?subject=Patient/{patient-id}
    &category=laboratory
    &_sort=-date
    &_count=20
```

### 6.6 查詢影像報告

```http
GET [base]/DiagnosticReport
    ?subject=Patient/{patient-id}
    &category=RAD
    &_sort=-date
```

---

## 七、標準依據與參考資料

### 7.1 LOINC 官方資源

| 資源 | 網址 |
|------|------|
| LOINC 18761-7 (Transfer summary) | https://loinc.org/18761-7 |
| LOINC 18842-5 (Discharge summary) | https://loinc.org/18842-5 |
| LOINC Document Ontology | https://loinc.org/document-ontology/ |
| LOINC 首頁 | https://loinc.org/ |

### 7.2 HL7 FHIR 標準資源

| 資源 | 網址 |
|------|------|
| FHIR R4 Composition | https://hl7.org/fhir/R4/composition.html |
| FHIR R4 MedicationStatement | https://hl7.org/fhir/R4/medicationstatement.html |
| FHIR R4 DiagnosticReport | https://hl7.org/fhir/R4/diagnosticreport.html |
| FHIR R4 Binary | https://hl7.org/fhir/R4/binary.html |
| MedicationStatement Category ValueSet | https://hl7.org/fhir/r4/valueset-medication-statement-category.html |
| C-CDA Transfer Summary 範例 | https://github.com/HL7/C-CDA-Examples/blob/master/Documents/Transfer%20Summary/Transfer_Summary.xml |

### 7.3 台灣標準資源

| 資源 | 網址 |
|------|------|
| TW Core IG | https://twcore.mohw.gov.tw/ig/twcore/ |
| EMR-IG 電子病歷交換單張 | https://twcore.mohw.gov.tw/ig/emr/ |
| 衛福部 SMART 平台 | https://thas.mohw.gov.tw/ |
| FHIR Server Base URL | https://thas.mohw.gov.tw/v/r4/fhir |

### 7.4 其他參考資源

| 資源 | 網址 |
|------|------|
| HL7 aECG 標準 | https://www.hl7.org/implement/standards/product_brief.cfm?product_id=102 |
| DICOM WADO-RS | https://www.dicomstandard.org/using/dicomweb/retrieve-wado-rs-and-wado-uri |
| SMART on FHIR 文件 | https://docs.smarthealthit.org/ |

---

## 附錄：決策摘要

### A. 文件類型決策

| 決策項目 | 選擇 | 理由 |
|----------|------|------|
| 出院後轉院文件類型 | LOINC `18842-5` | TW Core IG 已定義，國際標準 |
| 住院中轉院文件類型 | LOINC `18761-7` | TW Core IG 未定義，採國際標準補充 |

### B. 資料傳輸決策

| 資料類型 | 第一版做法 | 未來擴充 |
|----------|-----------|----------|
| 檢驗報告 | 數值結果 (Observation) | - |
| 影像報告 | 文字判讀 (DiagnosticReport) | DICOM via WADO-RS |
| EKG | 文字判讀 (DiagnosticReport) | HL7 aECG XML via Binary |
| Vital Signs | 不傳輸 | - |

### C. 用藥分類決策

| 情境 | category 值 | 理由 |
|------|-------------|------|
| 出院帶回藥 | `outpatient` | 回家後要吃的藥 |
| 住院中用藥 | `inpatient` | 正在使用的藥，需立即評估 |

---

## 版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| v1.0 | 2026-01-29 | 初版建立 |

---

*文件建立單位：臺北榮民總醫院 教學部教師培育科*  
*專案：CHARI - Cross-Hospital Admission Record Integration*
