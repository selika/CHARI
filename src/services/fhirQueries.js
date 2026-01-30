
// OIDs for Taiwan Identifiers
const SYSTEM_OID_NATIONAL_ID = "urn:oid:2.16.886.103";
const SYSTEM_OID_NHI_CARD = "urn:oid:2.16.886.101.100";

// LOINC Document Types
export const LOINC_DISCHARGE_SUMMARY = "18842-5";  // 出院病摘
export const LOINC_TRANSFER_SUMMARY = "18761-7";   // 轉院病摘

/**
 * Search Patient by National ID (Person ID - 身分證)
 * @param {Object} client FHIR Client
 * @param {string} idNumber National ID (e.g. F232727969)
 */
export async function searchPatientById(client, idNumber) {
    if (!client || !idNumber) return null;
    return client.request(`Patient?identifier=${SYSTEM_OID_NATIONAL_ID}|${idNumber.toUpperCase()}`);
}

/**
 * Search Patient by NHI Card Number (健保卡號)
 * @param {Object} client FHIR Client
 * @param {string} nhiNumber NHI Card Number
 */
export async function searchPatientByNHI(client, nhiNumber) {
    if (!client || !nhiNumber) return null;
    return client.request(`Patient?identifier=${SYSTEM_OID_NHI_CARD}|${nhiNumber}`);
}

/**
 * Search Discharge and Transfer Summaries (Composition) for a patient
 * 查詢病人的所有 Composition，前端再過濾出院/轉院病摘
 * @param {Object} client FHIR Client
 * @param {string} patientId Patient Reference ID
 */
export async function searchCompositions(client, patientId) {
    if (!client || !patientId) return null;
    // 直接使用 URL 字串查詢（避免 params 格式問題）
    const url = `Composition?subject=Patient/${patientId}&_sort=-date`;
    return client.request(url);
}

/**
 * Search Encounters for a patient (all types: inpatient, outpatient, emergency)
 * 查詢病人的所有就診記錄
 * @param {Object} client FHIR Client
 * @param {string} patientId Patient Reference ID
 */
export async function searchEncounters(client, patientId) {
    if (!client || !patientId) return null;
    const url = `Encounter?subject=Patient/${patientId}&_sort=-date`;
    return client.request(url);
}

/**
 * Search MedicationStatements for a specific Encounter
 * 查詢特定就診的用藥記錄
 * @param {Object} client FHIR Client
 * @param {string} encounterId Encounter ID
 */
export async function searchMedicationsByEncounter(client, encounterId) {
    if (!client || !encounterId) return null;
    const url = `MedicationStatement?context=Encounter/${encounterId}`;
    return client.request(url);
}
