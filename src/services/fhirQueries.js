
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
 * 同時查詢出院病摘 (18842-5) 和轉院病摘 (18761-7)
 * @param {Object} client FHIR Client
 * @param {string} patientId Patient Reference ID
 */
export async function searchCompositions(client, patientId) {
    if (!client || !patientId) return null;
    // Query both Discharge Summary (18842-5) and Transfer Summary (18761-7)
    return client.request({
        url: `Composition`,
        headers: { 'Cache-Control': 'no-cache' },
        method: 'GET',
        params: {
            subject: `Patient/${patientId}`,
            type: `http://loinc.org|${LOINC_DISCHARGE_SUMMARY},http://loinc.org|${LOINC_TRANSFER_SUMMARY}`,
            _sort: '-date'
        }
    });
}
