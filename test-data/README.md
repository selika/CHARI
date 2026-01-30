# CHARI 測試資料

本資料夾包含 **3 筆測試案例**，用於開發與展示 CHARI 系統。

---

## 測試案例總覽

| 案例 | Patient ID | 診斷 | 情境類型 | 特色 |
|------|------------|------|----------|------|
| **TESTA-01** | `pt-testa-01` | SLE 紅斑性狼瘡 | 出院後轉院 | 基礎案例、檢驗數據 |
| **TESTA-02** | `pt-testa-02` | Severe AS s/p TAVI | 出院後轉院 | 複雜病例、多重共病、影像報告 |
| **TESTA-03** | `pt-testa-03` | NSTEMI, 三支血管疾病 | **住院中轉院** | 過敏記錄、轉院病摘、住院用藥 |

---

## 案例詳細說明

### TESTA-01：SLE 紅斑性狼瘡

| 項目 | 內容 |
|------|------|
| 病人 | 女性，14歲 |
| 來源醫院 | 臺北榮民總醫院 |
| 住院次數 | 2 次 |
| Composition 類型 | 出院病摘 (18842-5) |
| 特色 | 免疫疾病、生物製劑治療、完整檢驗數據 |

### TESTA-02：重度主動脈瓣狹窄 s/p TAVI

| 項目 | 內容 |
|------|------|
| 病人 | 女性，67歲 |
| 來源醫院 | 臺北榮民總醫院 |
| 住院次數 | 2 次（術前評估 + TAVI 手術） |
| Composition 類型 | 出院病摘 (18842-5) |
| 特色 | 多重共病（ESRD、CAD、DM）、TAVI 手術、影像報告、ICU 記錄 |

### TESTA-03：NSTEMI 住院中轉院 CABG

| 項目 | 內容 |
|------|------|
| 病人 | 男性，68歲 |
| 來源醫院 | 臺北榮民總醫院關渡分院 |
| 住院次數 | 2 次（含目前住院中） |
| Composition 類型 | 出院病摘 (18842-5) + **轉院病摘 (18761-7)** |
| 特色 | **住院中轉院情境**、藥物過敏（Penicillin, Arcoxia）、住院用藥含 Heparin drip |

---

## 資料規格

所有測試資料皆符合 [CHARI_資料規格文件_完整版.md](../plan/CHARI_資料規格文件_完整版.md)。

### 身分識別系統

| System OID | 說明 | 範例 |
|------------|------|------|
| `urn:oid:2.16.886.103` | 國民身分證 | F232727969 |
| `urn:oid:2.16.886.101.100` | 健保卡號 | 900000000101 |

### 文件類型代碼

| LOINC Code | Display | 適用情境 |
|------------|---------|----------|
| `18842-5` | Discharge summary | 出院後轉院 |
| `18761-7` | Transfer summary note | 住院中轉院 |

---

## 使用方式

每個測試案例資料夾包含獨立的 README 與 JSON 檔案，請參考各資料夾說明：

- [TESTA-01/README.md](./TESTA-01/README.md)
- [TESTA-02/README.md](./TESTA-02/README.md)
- [TESTA-03/README.md](./TESTA-03/README.md)

### 上傳至 FHIR Server

```bash
# 以 TESTA-01 為例，依序 POST
curl -X POST https://thas.mohw.gov.tw/v/r4/fhir \
  -H "Content-Type: application/fhir+json" \
  -d @test-data/TESTA-01/organization.json

curl -X POST https://thas.mohw.gov.tw/v/r4/fhir \
  -H "Content-Type: application/fhir+json" \
  -d @test-data/TESTA-01/patient.json

# ... 依序上傳其他資源
```

---

## 查詢範例

```http
# 查詢 TESTA-01 病人
GET /Patient?identifier=urn:oid:2.16.886.103|F232727969

# 查詢 TESTA-02 出院病摘
GET /Composition?subject=Patient/pt-testa-02&type=http://loinc.org|18842-5

# 查詢 TESTA-03 轉院病摘
GET /Composition?subject=Patient/pt-testa-03&type=http://loinc.org|18761-7

# 查詢 TESTA-03 過敏記錄
GET /AllergyIntolerance?patient=Patient/pt-testa-03
```

---

*測試資料為虛構，病人姓名、身分證號皆為假資料*
