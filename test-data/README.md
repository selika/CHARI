# CHARI 測試資料

本資料夾包含 **10 筆測試用出院病摘**，用於開發與展示 CHARI 系統。

---

## 為什麼要自建測試資料？

衛福部 THAS 沙盒提供的範例資料存在以下限制：

| 問題 | 說明 |
|------|------|
| **缺少來源醫院** | 原範例的 Composition 沒有 `custodian` 欄位，無法識別病摘來源 |
| **缺少 Encounter 關聯** | 診斷、用藥未連結住院事件，無法重建「某次住院發生了什麼」 |
| **段落結構不完整** | 部分病摘缺少過敏史、出院計畫等關鍵段落 |
| **缺少身分識別** | 沒有身分證、健保卡等台灣實務需要的 identifier |

本測試資料依照 **TW Core IG** 規範與 **FHIR Encounter Design Guide** 建立，補齊上述缺漏。

---

## 資料結構

### 檔案列表

| 檔案 | 說明 | 筆數 |
|------|------|------|
| `organizations.json` | 來源醫院 | 5 |
| `patients.json` | 測試病人（含身分證、健保卡號） | 10 |
| `encounters.json` | 住院事件 | 10 |
| `conditions.json` | 出院診斷 | 24 |
| `procedures.json` | 手術/處置 | 9 |
| `allergies.json` | 過敏紀錄 | 4 |
| `medication-statements.json` | 出院用藥 | 33 |
| `careplans.json` | 出院計畫 | 10 |
| `compositions.json` | 出院病摘（主文件） | 10 |

### 資源依賴順序

```
Organizations → Patients → Encounters → Conditions → Procedures
             → Allergies → MedicationStatements → CarePlans → Compositions
```

---

## 來源醫院分布

| 醫院 | Organization ID | 筆數 |
|------|-----------------|------|
| 臺北榮民總醫院 | org-vghtpe | 5 |
| 國立臺灣大學醫學院附設醫院 | org-ntuh | 2 |
| 林口長庚紀念醫院 | org-cgmh | 1 |
| 中國醫藥大學附設醫院 | org-cmuh | 1 |
| 高雄榮民總醫院 | org-vghks | 1 |

---

## 病例摘要

| # | Patient ID | 姓名 | 主要診斷 | 來源醫院 |
|---|------------|------|----------|----------|
| 1 | pt-test-001 | 王大明 | 急性心肌梗塞，s/p PCI | 北榮 |
| 2 | pt-test-002 | 李美華 | 急性缺血性腦中風 | 北榮 |
| 3 | pt-test-003 | 張志強 | 社區型肺炎 | 北榮 |
| 4 | pt-test-004 | 陳淑芬 | 糖尿病足併骨髓炎 | 北榮 |
| 5 | pt-test-005 | 林建宏 | 髖關節置換術後 | 北榮 |
| 6 | pt-test-006 | 黃雅琪 | 乳癌術後 | 台大 |
| 7 | pt-test-007 | 吳明德 | 攝護腺肥大 s/p TURP | 台大 |
| 8 | pt-test-008 | 周秀蘭 | 膽結石 s/p 腹腔鏡膽囊切除 | 長庚 |
| 9 | pt-test-009 | 鄭文傑 | 肝硬化併腹水 | 中國醫 |
| 10 | pt-test-010 | 許淑惠 | 急性闘尾炎 s/p 腹腔鏡切除 | 高榮 |

---

## 身分識別系統

| System OID | 說明 | 範例 |
|------------|------|------|
| `urn:oid:2.16.886.103` | 國民身分證 | A123456789 |
| `urn:oid:2.16.886.101.100` | 健保卡號 | 900000000001 |

---

## 設計特色

### 1. 完整的 Encounter 關聯

所有臨床資源都正確連結到對應的住院事件：

```json
{
  "resourceType": "Condition",
  "encounter": { "reference": "Encounter/enc-pt-test-001" },
  "subject": { "reference": "Patient/pt-test-001" }
}
```

### 2. Composition 段落完整

每份病摘包含標準段落，並透過 `section.entry` 連結結構化資料：

- 主訴 (Chief Complaint)
- 現病史 (Present Illness)
- 過去病史 (Past History)
- 出院診斷 (Discharge Diagnosis) → Condition
- 出院用藥 (Discharge Medications) → MedicationStatement
- 過敏史 (Allergies) → AllergyIntolerance
- 手術紀錄 (Surgical Procedures) → Procedure
- 出院計畫 (Discharge Plan) → CarePlan

### 3. 資料溯源

透過 `custodian` 欄位標示來源醫院：

```json
{
  "resourceType": "Composition",
  "custodian": {
    "reference": "Organization/org-vghtpe",
    "display": "臺北榮民總醫院"
  }
}
```

---

## 注意事項

- 本資料為 **虛構測試資料**，病人姓名、身分證號皆為假資料
- 資料已上傳至 THAS 沙盒供開發測試使用
- 如需查詢測試，請使用上述 Patient ID 進行 GET 請求
