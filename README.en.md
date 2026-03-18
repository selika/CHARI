# CHARI: Cross-Hospital Admission Record Integration System

> **SMART on FHIR App** - A bidirectional discharge/transfer summary exchange platform for inter-hospital referrals

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![FHIR](https://img.shields.io/badge/FHIR-R4-orange.svg)](https://hl7.org/fhir/R4/)
[![Platform](https://img.shields.io/badge/Platform-MOHW%20SMART-green.svg)](https://thas.mohw.gov.tw/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://selika.github.io/CHARI/)

---

## Project Overview

**CHARI** (Cross-Hospital Admission Record Integration) is a SMART on FHIR application designed to solve clinical record integration problems during inter-hospital referrals and transfers. It enables the receiving hospital to quickly review discharge or transfer summaries from the originating hospital and selectively import relevant information into its local medical record system.

**Live Demo**: https://selika.github.io/CHARI/

### Problems It Solves

| Pain Point | Current Situation | CHARI Solution |
|-----------|-------------------|----------------|
| Difficult data access | Paper fax, scanned PDFs | Standardized FHIR-based retrieval |
| Hard to reuse information directly | Manual transcription item by item | One-click selective import |
| Important details may be missed | Allergies and medications may be overlooked | Structured presentation with alerts |

---

## System Architecture

```
┌──────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────┐
│ Hospital A (source)  │     │ MOHW FHIR Server         │     │ Hospital B (receiver)│
│                      │     │                          │     │                      │
│  ┌───────────────┐   │     │  ┌────────────────────┐  │     │  ┌───────────────┐   │
│  │      HIS      │   │     │  │    Composition     │  │     │  │      HIS      │   │
│  └──────┬────────┘   │     │  │       Bundle       │  │     │  └──────┬────────┘   │
│         │            │     │  └────────────────────┘  │     │         │            │
│  ┌──────▼────────┐   │     │                          │     │  ┌──────▼────────┐   │
│  │   CHARI App   │───┼────►│ POST discharge/transfer  │     │  │   CHARI App   │   │
│  └───────────────┘   │     │ summaries                │◄────┼──│ GET summaries  │   │
└──────────────────────┘     └──────────────────────────┘     └──────────────────────┘
```

---

## Core Features

### Encounter-Based Timeline

CHARI uses **Encounter** as the main timeline axis and integrates:
- Discharge summaries (blue theme)
- Transfer summaries (orange theme, labeled as "Transferred During Admission")
- Outpatient records (green theme)

### Summary Import Features

| Item | Description |
|------|-------------|
| Allergy alerts | Imported by default, high-risk allergies highlighted in red |
| Chief complaint / Present illness | Optional import as FHIR `DocumentReference` |
| Diagnoses | `Condition` resources with ICD codes |
| Medication records | `MedicationStatement`, separated into inpatient medication and discharge medication |
| Procedures / operations | `Procedure` resources |
| Lab reports | `Observation` resources with abnormal values highlighted in red |

### Supported FHIR Resources

- `Composition` - discharge / transfer summaries
- `Encounter` - visit records (inpatient / outpatient)
- `Condition` - diagnoses
- `MedicationStatement` - medications
- `AllergyIntolerance` - allergies
- `Procedure` - procedures / operations
- `Observation` - laboratory data
- `DiagnosticReport` - imaging / EKG reports

---

## Test Cases

This project includes three AI-generated test patients modeled after realistic clinical scenarios:

| Patient | Diagnosis | Scenario | Source Hospital |
|--------|-----------|----------|-----------------|
| Lin Xiaoxuan | SLE | Transfer after discharge | Taipei Veterans General Hospital |
| Wang Meihua | Severe AS s/p TAVI | Transfer after discharge | Taipei Veterans General Hospital |
| Chen Zhiming | NSTEMI with three-vessel disease | Transfer during hospitalization | Kuandu Hospital |

**FHIR Server**: `https://thas.mohw.gov.tw/v/r4/fhir`

---

## Technical Specifications

| Item | Specification |
|------|---------------|
| FHIR version | R4 |
| Profile | TW Core IG |
| Authentication | OAuth 2.0 (SMART App Launch) |
| Frontend framework | React 18 + Vite |
| FHIR client | fhirclient.js |
| UI framework | Tailwind CSS + Lucide Icons |
| Deployment | GitHub Pages |

### Environments

| Environment | URL |
|------------|-----|
| Demo | `https://selika.github.io/CHARI/` |
| FHIR Server | `https://thas.mohw.gov.tw/v/r4/fhir` |
| Patient Browser | `https://thas.mohw.gov.tw/patient-browser/` |

---

## Project Structure

```
CHARI/
├── README.md                         # Chinese README
├── README.en.md                      # English README
├── AGENTS.md                         # AI coding agent guide
├── LICENSE                           # Apache 2.0 license
├── package.json                      # Project config and dependencies
├── vite.config.js                    # Vite build config
│
├── docs/                             # Technical documents
│   ├── CHARI_完整應用說明文件_v4.pdf  # Full application guide (PDF)
│   └── CHARI_資料規格文件_完整版.md   # FHIR data specification
│
├── public/                           # Static assets
│   ├── CHARI_App_Icon.png            # App icon
│   └── launch.html                   # SMART App launch page
│
├── src/                              # Frontend source code
│   ├── App.jsx                       # Main application
│   ├── main.jsx                      # Entry point
│   ├── components/
│   │   ├── PatientSearch.jsx         # Patient search
│   │   ├── CompositionList.jsx       # Summary timeline
│   │   ├── CompositionDetail.jsx     # Summary import view
│   │   └── Layout.jsx                # Page layout
│   ├── hooks/
│   │   └── useFhirClient.js          # FHIR client hook
│   └── services/
│       └── fhirQueries.js            # FHIR query wrappers
│
├── test-data/                        # Test data
│   ├── README.md                     # Test case overview
│   ├── TESTA-01/                     # Lin Xiaoxuan (SLE, transfer after discharge)
│   │   └── README.md
│   ├── TESTA-02/                     # Wang Meihua (TAVI, transfer after discharge)
│   │   └── README.md
│   └── TESTA-03/                     # Chen Zhiming (NSTEMI, transfer during hospitalization)
│       └── README.md
│
└── scripts/                          # Data upload scripts
    ├── upload-compositions.cjs
    ├── upload-outpatient.cjs
    └── upload-patients.cjs
```

---

## Related Documents

| Document | Description |
|---------|-------------|
| [docs/CHARI_完整應用說明文件_v4.pdf](docs/CHARI_完整應用說明文件_v4.pdf) | Full application guide with screenshots |
| [docs/CHARI_資料規格文件_完整版.md](docs/CHARI_資料規格文件_完整版.md) | FHIR resource definitions and data specification |
| [test-data/README.md](test-data/README.md) | Test case overview and usage notes |

---

## Development and Deployment

```bash
# Install dependencies
npm install

# Local development
npm run dev

# Build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## Development Progress

| Phase | Status |
|------|--------|
| Phase 1: Summary query and timeline | ✅ Completed |
| Phase 2: Summary import functionality | ✅ Completed |
| Phase 3: Test data creation | ✅ Completed |

---

## License

This project is licensed under the **Apache License 2.0**.

---

## Author

**Shih-Neng Tsai** - Information Engineer, Department of Medical Education, Taipei Veterans General Hospital

---

## References

- [HL7 FHIR R4](https://hl7.org/fhir/R4/)
- [SMART App Launch IG](https://docs.smarthealthit.org/)
- [TW Core IG](https://twcore.mohw.gov.tw/)
- [fhirclient.js](https://docs.smarthealthit.org/client-js/)
- [MOHW SMART Platform](https://thas.mohw.gov.tw/)
