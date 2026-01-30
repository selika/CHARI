import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Calendar, Building, Download, ChevronDown, ChevronUp, AlertCircle, Code, X, ArrowRightLeft, Stethoscope, Pill } from 'lucide-react';
import { searchCompositions, searchEncounters, searchMedicationsByEncounter, LOINC_DISCHARGE_SUMMARY, LOINC_TRANSFER_SUMMARY } from '../services/fhirQueries';

export default function CompositionList({ client }) {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [compositions, setCompositions] = useState([]);
    const [outpatientEncounters, setOutpatientEncounters] = useState([]);
    const [timelineItems, setTimelineItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [detailData, setDetailData] = useState({});
    const [linkedResources, setLinkedResources] = useState({});
    const [encounterMedications, setEncounterMedications] = useState({});
    const [showJsonModal, setShowJsonModal] = useState(null);

    useEffect(() => {
        if (client && patientId) {
            setLoading(true);

            // 同時查詢 Compositions 和 Encounters
            Promise.all([
                searchCompositions(client, patientId),
                searchEncounters(client, patientId)
            ])
                .then(([compResponse, encResponse]) => {
                    // 處理 Compositions
                    const compEntries = compResponse?.entry || [];
                    const comps = compEntries
                        .map(e => e.resource)
                        .filter(r => {
                            const code = r.type?.coding?.[0]?.code;
                            return code === LOINC_DISCHARGE_SUMMARY || code === LOINC_TRANSFER_SUMMARY;
                        });
                    setCompositions(comps);

                    // 處理 Encounters - 只取門診 (AMB = ambulatory/outpatient)
                    const encEntries = encResponse?.entry || [];
                    const outpatient = encEntries
                        .map(e => e.resource)
                        .filter(r => r.class?.code === 'AMB');
                    setOutpatientEncounters(outpatient);

                    // 建立統一時間軸
                    const timeline = [];

                    // 加入出院/轉院病摘
                    comps.forEach(comp => {
                        timeline.push({
                            type: 'composition',
                            date: new Date(comp.date),
                            data: comp,
                            id: `comp-${comp.id}`
                        });
                    });

                    // 加入門診記錄
                    outpatient.forEach(enc => {
                        const encDate = enc.period?.start || enc.period?.end;
                        if (encDate) {
                            timeline.push({
                                type: 'outpatient',
                                date: new Date(encDate),
                                data: enc,
                                id: `enc-${enc.id}`
                            });
                        }
                    });

                    // 按日期排序（最新在前）
                    timeline.sort((a, b) => b.date - a.date);
                    setTimelineItems(timeline);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err);
                    setLoading(false);
                });
        }
    }, [client, patientId]);

    // 判斷是否為轉院病摘
    const isTransferSummary = (composition) => {
        return composition.type?.coding?.[0]?.code === LOINC_TRANSFER_SUMMARY;
    };

    // 取得病摘類型標籤
    const getCompositionTypeLabel = (composition) => {
        return isTransferSummary(composition) ? '轉院病摘' : '出院病摘';
    };

    // 動態載入病摘詳細內容和關聯資源
    const loadDetail = async (compositionId) => {
        if (detailData[compositionId]) {
            setExpandedId(expandedId === compositionId ? null : compositionId);
            return;
        }

        try {
            const composition = await client.request(`Composition/${compositionId}`);
            setDetailData(prev => ({ ...prev, [compositionId]: composition }));

            // 載入關聯的資源（section.entry）
            const resources = [];
            for (const section of composition.section || []) {
                for (const entry of section.entry || []) {
                    if (entry.reference) {
                        try {
                            const resource = await client.request(entry.reference);
                            resources.push({
                                reference: entry.reference,
                                resource: resource,
                                sectionTitle: section.title
                            });
                        } catch (e) {
                            console.warn(`Failed to load ${entry.reference}`, e);
                        }
                    }
                }
            }
            setLinkedResources(prev => ({ ...prev, [compositionId]: resources }));
            setExpandedId(compositionId);
        } catch (err) {
            console.error('Error loading detail:', err);
        }
    };

    // 載入門診就診的用藥記錄
    const loadEncounterMedications = async (encounterId) => {
        const key = `enc-${encounterId}`;
        if (encounterMedications[encounterId]) {
            setExpandedId(expandedId === key ? null : key);
            return;
        }

        try {
            const response = await searchMedicationsByEncounter(client, encounterId);
            const meds = (response?.entry || []).map(e => e.resource);
            setEncounterMedications(prev => ({ ...prev, [encounterId]: meds }));
            setExpandedId(key);
        } catch (err) {
            console.error('Error loading encounter medications:', err);
            setEncounterMedications(prev => ({ ...prev, [encounterId]: [] }));
            setExpandedId(key);
        }
    };

    // 解析 section 並分組
    const parseSections = (composition) => {
        const sections = composition.section || [];
        const grouped = {
            diagnosis: [],
            medications: [],
            allergies: [],
            procedures: [],
            labs: [],
            others: []
        };

        sections.forEach(section => {
            const code = section.code?.coding?.[0]?.code;
            const title = section.title || '';
            const text = section.text?.div?.replace(/<[^>]*>/g, '') || '';

            const item = { title, text, code, entries: section.entry || [], rawHtml: section.text?.div };

            if (code === '48765-2' || title.includes('過敏')) {
                grouped.allergies.push(item);
            } else if (code === '10183-2' || code === '10160-0' || title.includes('用藥') || title.includes('Medication')) {
                grouped.medications.push(item);
            } else if (code === '11535-2' || code === '46241-6' || title.includes('診斷')) {
                grouped.diagnosis.push(item);
            } else if (code === '47519-4' || code === '8724-7' || title.includes('手術') || title.includes('Procedure')) {
                grouped.procedures.push(item);
            } else if (code === '30954-2' || title.includes('檢驗')) {
                grouped.labs.push(item);
            } else {
                grouped.others.push(item);
            }
        });

        return grouped;
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
                <p className="text-slate-500">載入病歷資料中...</p>
            </div>
        );
    }

    const latestItem = timelineItems[0];
    const historyItems = timelineItems.slice(1);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">外院病摘查詢</h2>
                    <p className="text-sm text-slate-500">Patient ID: {patientId}</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
                    載入失敗: {error.message}
                </div>
            )}

            {timelineItems.length === 0 && !error ? (
                <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">查無資料</h3>
                    <p className="text-slate-500 mt-1">此病人無病歷記錄</p>
                </div>
            ) : (
                <>
                    {/* 最新記錄 */}
                    {latestItem && latestItem.type === 'composition' && (
                        <CompositionCard
                            composition={latestItem.data}
                            isLatest={true}
                            isTransferSummary={isTransferSummary}
                            getCompositionTypeLabel={getCompositionTypeLabel}
                            expandedId={expandedId}
                            detailData={detailData}
                            linkedResources={linkedResources}
                            loadDetail={loadDetail}
                            parseSections={parseSections}
                            setShowJsonModal={setShowJsonModal}
                            navigate={navigate}
                        />
                    )}

                    {latestItem && latestItem.type === 'outpatient' && (
                        <OutpatientCard
                            encounter={latestItem.data}
                            isLatest={true}
                            expandedId={expandedId}
                            encounterMedications={encounterMedications}
                            loadEncounterMedications={loadEncounterMedications}
                            setShowJsonModal={setShowJsonModal}
                        />
                    )}

                    {/* 歷史記錄時間軸 */}
                    {historyItems.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="px-6 py-3 border-b border-slate-200">
                                <h3 className="font-bold text-slate-700">病歷時間軸 ({historyItems.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {historyItems.map((item) => (
                                    item.type === 'composition' ? (
                                        <CompositionRow
                                            key={item.id}
                                            composition={item.data}
                                            isTransferSummary={isTransferSummary}
                                            getCompositionTypeLabel={getCompositionTypeLabel}
                                            expandedId={expandedId}
                                            detailData={detailData}
                                            linkedResources={linkedResources}
                                            loadDetail={loadDetail}
                                            parseSections={parseSections}
                                            setShowJsonModal={setShowJsonModal}
                                            navigate={navigate}
                                        />
                                    ) : (
                                        <OutpatientRow
                                            key={item.id}
                                            encounter={item.data}
                                            expandedId={expandedId}
                                            encounterMedications={encounterMedications}
                                            loadEncounterMedications={loadEncounterMedications}
                                            setShowJsonModal={setShowJsonModal}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* JSON Modal */}
            {showJsonModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                {showJsonModal.resourceType} - {showJsonModal.id}
                            </h3>
                            <button
                                onClick={() => setShowJsonModal(null)}
                                className="p-1 hover:bg-slate-200 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[calc(80vh-60px)]">
                            <pre className="text-xs bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto">
                                {JSON.stringify(showJsonModal, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 出院/轉院病摘大卡片（最新）
function CompositionCard({ composition, isLatest, isTransferSummary, getCompositionTypeLabel, expandedId, detailData, linkedResources, loadDetail, parseSections, setShowJsonModal, navigate }) {
    const isTransfer = isTransferSummary(composition);
    return (
        <div className={`bg-white rounded-lg shadow-md border-2 overflow-hidden ${isTransfer ? 'border-orange-500' : 'border-medical-primary'}`}>
            <div className={`text-white px-6 py-3 flex items-center justify-between ${isTransfer ? 'bg-orange-500' : 'bg-medical-primary'}`}>
                <div className="flex items-center gap-2">
                    {isTransfer ? <ArrowRightLeft className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    <span className="font-bold">{isLatest ? '最新' : ''}{getCompositionTypeLabel(composition)}</span>
                    {isTransfer && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">住院中轉院</span>}
                </div>
                <span className="text-sm opacity-90">{new Date(composition.date).toLocaleDateString('zh-TW')}</span>
            </div>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{composition.title || getCompositionTypeLabel(composition)}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1"><Building className="h-4 w-4" />{composition.custodian?.display || '未知醫院'}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(composition.date).toLocaleDateString('zh-TW')}</span>
                        </div>
                    </div>
                    <button onClick={() => navigate(`/composition/${composition.id}`)} className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Download className="h-4 w-4" />導入病歷
                    </button>
                </div>
                <button onClick={() => loadDetail(composition.id)} className="w-full text-left text-sm text-medical-primary hover:underline flex items-center gap-1">
                    {expandedId === composition.id ? <><ChevronUp className="h-4 w-4" /> 收合詳細內容</> : <><ChevronDown className="h-4 w-4" /> 展開詳細內容</>}
                </button>
                {expandedId === composition.id && detailData[composition.id] && (
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SectionGroups composition={detailData[composition.id]} parseSections={parseSections} />
                        <ImportableResources resources={linkedResources[composition.id] || []} onShowJson={setShowJsonModal} />
                    </div>
                )}
            </div>
        </div>
    );
}

// 出院/轉院病摘列表行
function CompositionRow({ composition, isTransferSummary, getCompositionTypeLabel, expandedId, detailData, linkedResources, loadDetail, parseSections, setShowJsonModal, navigate }) {
    const isTransfer = isTransferSummary(composition);
    return (
        <div className={`p-4 hover:bg-slate-50 ${isTransfer ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-blue-400'}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-800">{composition.title || getCompositionTypeLabel(composition)}</span>
                        {isTransfer && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">轉院</span>}
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Building className="h-3 w-3" />{composition.custodian?.display || '未知醫院'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 ml-7">{new Date(composition.date).toLocaleDateString('zh-TW')}</div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => loadDetail(composition.id)} className="text-xs text-medical-primary hover:underline">{expandedId === composition.id ? '收合' : '查看'}</button>
                    <button onClick={() => navigate(`/composition/${composition.id}`)} className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200">導入</button>
                </div>
            </div>
            {expandedId === composition.id && detailData[composition.id] && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SectionGroups composition={detailData[composition.id]} parseSections={parseSections} />
                    <ImportableResources resources={linkedResources[composition.id] || []} onShowJson={setShowJsonModal} />
                </div>
            )}
        </div>
    );
}

// 門診記錄大卡片（最新）
function OutpatientCard({ encounter, isLatest, expandedId, encounterMedications, loadEncounterMedications, setShowJsonModal }) {
    const key = `enc-${encounter.id}`;
    const meds = encounterMedications[encounter.id] || [];
    const encDate = encounter.period?.start || encounter.period?.end;
    const serviceType = encounter.serviceType?.coding?.[0]?.display || encounter.type?.[0]?.coding?.[0]?.display || '門診';

    return (
        <div className="bg-white rounded-lg shadow-md border-2 border-emerald-500 overflow-hidden">
            <div className="bg-emerald-500 text-white px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    <span className="font-bold">{isLatest ? '最新' : ''}門診記錄</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{serviceType}</span>
                </div>
                <span className="text-sm opacity-90">{encDate ? new Date(encDate).toLocaleDateString('zh-TW') : '未知日期'}</span>
            </div>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{serviceType}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1"><Building className="h-4 w-4" />{encounter.serviceProvider?.display || '未知醫院'}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{encDate ? new Date(encDate).toLocaleDateString('zh-TW') : '未知'}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => loadEncounterMedications(encounter.id)} className="w-full text-left text-sm text-emerald-600 hover:underline flex items-center gap-1">
                    {expandedId === key ? <><ChevronUp className="h-4 w-4" /> 收合用藥記錄</> : <><ChevronDown className="h-4 w-4" /> 查看門診用藥</>}
                </button>
                {expandedId === key && (
                    <div className="mt-4">
                        <MedicationList medications={meds} onShowJson={setShowJsonModal} />
                    </div>
                )}
            </div>
        </div>
    );
}

// 門診記錄列表行
function OutpatientRow({ encounter, expandedId, encounterMedications, loadEncounterMedications, setShowJsonModal }) {
    const key = `enc-${encounter.id}`;
    const meds = encounterMedications[encounter.id] || [];
    const encDate = encounter.period?.start || encounter.period?.end;
    const serviceType = encounter.serviceType?.coding?.[0]?.display || encounter.type?.[0]?.coding?.[0]?.display || '門診';

    return (
        <div className="p-4 hover:bg-slate-50 border-l-4 border-l-emerald-400">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <Stethoscope className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-800">{serviceType}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">門診</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Building className="h-3 w-3" />{encounter.serviceProvider?.display || '未知醫院'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 ml-7">{encDate ? new Date(encDate).toLocaleDateString('zh-TW') : '未知日期'}</div>
                </div>
                <button onClick={() => loadEncounterMedications(encounter.id)} className="text-xs text-emerald-600 hover:underline">{expandedId === key ? '收合' : '用藥'}</button>
            </div>
            {expandedId === key && (
                <div className="mt-4">
                    <MedicationList medications={meds} onShowJson={setShowJsonModal} />
                </div>
            )}
        </div>
    );
}

// 門診用藥列表
function MedicationList({ medications, onShowJson }) {
    if (medications.length === 0) {
        return <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded">此次門診無用藥記錄或資料載入中...</div>;
    }
    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-bold text-emerald-700 flex items-center gap-2 mb-3">
                <Pill className="h-4 w-4" />
                門診用藥 ({medications.length})
            </h4>
            <div className="space-y-2">
                {medications.map((med, i) => {
                    const medName = med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown';
                    const dosage = med.dosage?.[0]?.text || '';
                    const startDate = med.effectivePeriod?.start || med.effectiveDateTime;
                    return (
                        <button key={i} onClick={() => onShowJson(med)} className="w-full text-left px-3 py-2 rounded border bg-white border-emerald-200 text-sm hover:bg-emerald-100 transition-colors">
                            <div className="font-medium text-emerald-800">{medName}</div>
                            <div className="text-xs text-emerald-600">{dosage} {startDate && `• ${new Date(startDate).toLocaleDateString('zh-TW')}`}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// 可導入的資源列表
function ImportableResources({ resources, onShowJson }) {
    if (resources.length === 0) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4" />
                    可導入項目
                </h4>
                <p className="text-sm text-slate-500">載入中或無結構化資料...</p>
            </div>
        );
    }

    // 按資源類型分組
    const byType = {};
    resources.forEach(item => {
        const type = item.resource.resourceType;
        if (!byType[type]) byType[type] = [];
        byType[type].push(item);
    });

    const typeLabels = {
        Condition: '診斷',
        MedicationStatement: '用藥',
        AllergyIntolerance: '過敏',
        Procedure: '手術/處置',
        CarePlan: '照護計畫'
    };

    const typeColors = {
        Condition: 'bg-blue-100 text-blue-700 border-blue-300',
        MedicationStatement: 'bg-green-100 text-green-700 border-green-300',
        AllergyIntolerance: 'bg-red-100 text-red-700 border-red-300',
        Procedure: 'bg-purple-100 text-purple-700 border-purple-300',
        CarePlan: 'bg-amber-100 text-amber-700 border-amber-300'
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                <Code className="h-4 w-4" />
                可導入項目 ({resources.length})
            </h4>
            <div className="space-y-3">
                {Object.entries(byType).map(([type, items]) => (
                    <div key={type}>
                        <div className="text-xs font-medium text-slate-500 mb-1">
                            {typeLabels[type] || type} ({items.length})
                        </div>
                        <div className="space-y-1">
                            {items.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => onShowJson(item.resource)}
                                    className={`w-full text-left px-3 py-2 rounded border text-xs hover:opacity-80 transition-opacity ${typeColors[type] || 'bg-slate-100 text-slate-700 border-slate-300'}`}
                                >
                                    <div className="font-medium truncate">
                                        {getResourceDisplay(item.resource)}
                                    </div>
                                    <div className="text-[10px] opacity-70">
                                        {item.reference}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 取得資源的顯示文字
function getResourceDisplay(resource) {
    switch (resource.resourceType) {
        case 'Condition':
            return resource.code?.text || resource.code?.coding?.[0]?.display || 'Condition';
        case 'MedicationStatement':
            return resource.medicationCodeableConcept?.text ||
                   resource.medicationCodeableConcept?.coding?.[0]?.display ||
                   'Medication';
        case 'AllergyIntolerance':
            return resource.code?.text || resource.code?.coding?.[0]?.display || 'Allergy';
        case 'Procedure':
            return resource.code?.text || resource.code?.coding?.[0]?.display || 'Procedure';
        case 'CarePlan':
            return resource.title || resource.description || 'Care Plan';
        default:
            return resource.id || resource.resourceType;
    }
}

// 分組顯示段落
function SectionGroups({ composition, parseSections }) {
    const grouped = parseSections(composition);

    return (
        <div className="space-y-3">
            {grouped.allergies.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="font-bold text-red-700 flex items-center gap-2 mb-1 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        過敏史
                    </h4>
                    {grouped.allergies.map((item, i) => (
                        <div key={i} className="text-sm text-red-800">{item.text}</div>
                    ))}
                </div>
            )}

            {grouped.diagnosis.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-bold text-blue-700 mb-1 text-sm">出院診斷</h4>
                    {grouped.diagnosis.map((item, i) => (
                        <div key={i} className="text-sm text-blue-800 whitespace-pre-wrap">{item.text}</div>
                    ))}
                </div>
            )}

            {grouped.medications.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-bold text-green-700 mb-1 text-sm">出院用藥</h4>
                    {grouped.medications.map((item, i) => (
                        <div key={i} className="text-sm text-green-800">
                            {item.rawHtml ? (
                                <div className="overflow-x-auto [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:px-2 [&_th]:py-1 [&_th]:bg-green-100 [&_td]:px-2 [&_td]:py-1 [&_td]:border-t [&_td]:border-green-200"
                                     dangerouslySetInnerHTML={{ __html: item.rawHtml }} />
                            ) : (
                                <div className="whitespace-pre-wrap">{item.text}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {grouped.procedures.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-bold text-purple-700 mb-1 text-sm">手術/處置</h4>
                    {grouped.procedures.map((item, i) => (
                        <div key={i} className="text-sm text-purple-800 whitespace-pre-wrap">{item.text}</div>
                    ))}
                </div>
            )}

            {grouped.labs.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-bold text-green-700 mb-2 text-sm">檢驗結果</h4>
                    {grouped.labs.map((item, i) => (
                        <div key={i}>
                            <LabResultsDisplay entries={item.entries} rawHtml={item.rawHtml} />
                        </div>
                    ))}
                </div>
            )}

            {grouped.others.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <h4 className="font-bold text-slate-700 mb-1 text-sm">其他資訊</h4>
                    {grouped.others.map((item, i) => (
                        <div key={i} className="mb-2">
                            <div className="text-xs font-medium text-slate-500">{item.title}</div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap">{item.text}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 檢驗結果顯示元件 - 每行一個項目
function LabResultsDisplay({ entries, rawHtml }) {
    // 優先從 HTML 解析表格資料（包含完整數值）
    if (rawHtml) {
        // 解析 HTML 中的表格行
        const rows = rawHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        const dataRows = rows.filter(row => row.includes('<td'));

        if (dataRows.length > 0) {
            return (
                <div className="space-y-1">
                    {dataRows.map((row, i) => {
                        // 提取 td 內容並解碼 HTML entities
                        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
                        const decodeHtml = (html) => {
                            const txt = document.createElement('textarea');
                            txt.innerHTML = html;
                            return txt.value;
                        };
                        const cellTexts = cells.map(cell =>
                            decodeHtml(cell.replace(/<[^>]*>/g, '')).trim()
                        ).filter(t => t);

                        if (cellTexts.length >= 2) {
                            // 只有獨立的 H/L 標記才標為異常（排除名稱如 HGB, ALT 等）
                            const valueText = cellTexts.slice(1).join(' ');
                            const isAbnormal = /\s[HL]\s*$|\([HL]\)|⬆|⬇/.test(valueText);
                            return (
                                <div key={i} className={`text-sm py-0.5 border-b border-green-100 last:border-0 flex justify-between ${isAbnormal ? 'text-red-600 font-medium' : 'text-green-800'}`}>
                                    <span>{cellTexts[0]}</span>
                                    <span>{cellTexts.slice(1).join(' ')}</span>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            );
        }
    }

    // 如果沒有 HTML，從 entries 顯示參考名稱
    if (entries && entries.length > 0) {
        return (
            <div className="space-y-1">
                {entries.map((entry, i) => {
                    const ref = entry.reference || '';
                    const parts = ref.split('/');
                    const id = parts[parts.length - 1] || ref;
                    const namePart = id.split('-').slice(-2, -1)[0] || id;
                    return (
                        <div key={i} className="text-sm text-green-800 py-0.5 border-b border-green-100 last:border-0">
                            {namePart.toUpperCase()}
                        </div>
                    );
                })}
            </div>
        );
    }

    return <div className="text-sm text-slate-500">無檢驗資料</div>;
}
