import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Calendar, Building, Download, ChevronDown, ChevronUp, AlertCircle, Code, X, ArrowRightLeft } from 'lucide-react';
import { searchCompositions, LOINC_DISCHARGE_SUMMARY, LOINC_TRANSFER_SUMMARY } from '../services/fhirQueries';

export default function CompositionList({ client }) {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [compositions, setCompositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [detailData, setDetailData] = useState({});
    const [linkedResources, setLinkedResources] = useState({});
    const [showJsonModal, setShowJsonModal] = useState(null);

    useEffect(() => {
        if (client && patientId) {
            setLoading(true);
            searchCompositions(client, patientId)
                .then(response => {
                    const entries = response.entry || [];
                    // 按日期排序（最新在前），顯示出院病摘和轉院病摘
                    const sorted = entries
                        .map(e => e.resource)
                        .filter(r => {
                            const code = r.type?.coding?.[0]?.code;
                            return code === LOINC_DISCHARGE_SUMMARY || code === LOINC_TRANSFER_SUMMARY;
                        })
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                    setCompositions(sorted);
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

    // 解析 section 並分組
    const parseSections = (composition) => {
        const sections = composition.section || [];
        const grouped = {
            diagnosis: [],
            medications: [],
            allergies: [],
            procedures: [],
            others: []
        };

        sections.forEach(section => {
            const code = section.code?.coding?.[0]?.code;
            const title = section.title || '';
            const text = section.text?.div?.replace(/<[^>]*>/g, '') || '';

            const item = { title, text, code, entries: section.entry || [] };

            if (code === '48765-2' || title.includes('過敏')) {
                grouped.allergies.push(item);
            } else if (code === '10183-2' || code === '10160-0' || title.includes('用藥') || title.includes('Medication')) {
                grouped.medications.push(item);
            } else if (code === '11535-2' || code === '46241-6' || title.includes('診斷')) {
                grouped.diagnosis.push(item);
            } else if (code === '47519-4' || code === '8724-7' || title.includes('手術') || title.includes('Procedure')) {
                grouped.procedures.push(item);
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
                <p className="text-slate-500">載入出院病摘中...</p>
            </div>
        );
    }

    const latestComposition = compositions[0];
    const historyCompositions = compositions.slice(1);

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

            {compositions.length === 0 && !error ? (
                <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">查無資料</h3>
                    <p className="text-slate-500 mt-1">此病人無出院病摘記錄</p>
                </div>
            ) : (
                <>
                    {/* 最新病摘 */}
                    {latestComposition && (
                        <div className={`bg-white rounded-lg shadow-md border-2 overflow-hidden ${isTransferSummary(latestComposition) ? 'border-orange-500' : 'border-medical-primary'}`}>
                            <div className={`text-white px-6 py-3 flex items-center justify-between ${isTransferSummary(latestComposition) ? 'bg-orange-500' : 'bg-medical-primary'}`}>
                                <div className="flex items-center gap-2">
                                    {isTransferSummary(latestComposition) ? <ArrowRightLeft className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                    <span className="font-bold">最新{getCompositionTypeLabel(latestComposition)}</span>
                                    {isTransferSummary(latestComposition) && (
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">住院中轉院</span>
                                    )}
                                </div>
                                <span className="text-sm opacity-90">
                                    {new Date(latestComposition.date).toLocaleDateString('zh-TW')}
                                </span>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                                            {latestComposition.title || getCompositionTypeLabel(latestComposition)}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Building className="h-4 w-4" />
                                                {latestComposition.custodian?.display || '未知醫院'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(latestComposition.date).toLocaleDateString('zh-TW')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/composition/${latestComposition.id}`)}
                                        className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        導入病歷
                                    </button>
                                </div>

                                <button
                                    onClick={() => loadDetail(latestComposition.id)}
                                    className="w-full text-left text-sm text-medical-primary hover:underline flex items-center gap-1"
                                >
                                    {expandedId === latestComposition.id ? (
                                        <><ChevronUp className="h-4 w-4" /> 收合詳細內容</>
                                    ) : (
                                        <><ChevronDown className="h-4 w-4" /> 展開詳細內容</>
                                    )}
                                </button>

                                {expandedId === latestComposition.id && detailData[latestComposition.id] && (
                                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* 左側：分組內容 */}
                                        <div>
                                            <SectionGroups
                                                composition={detailData[latestComposition.id]}
                                                parseSections={parseSections}
                                            />
                                        </div>
                                        {/* 右側：可導入的 JSON 項目 */}
                                        <div>
                                            <ImportableResources
                                                resources={linkedResources[latestComposition.id] || []}
                                                onShowJson={setShowJsonModal}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 歷史記錄 */}
                    {historyCompositions.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="px-6 py-3 border-b border-slate-200">
                                <h3 className="font-bold text-slate-700">歷史病摘 ({historyCompositions.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {historyCompositions.map((comp) => (
                                    <div key={comp.id} className={`p-4 hover:bg-slate-50 ${isTransferSummary(comp) ? 'border-l-4 border-l-orange-400' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-slate-800">
                                                        {comp.title || getCompositionTypeLabel(comp)}
                                                    </span>
                                                    {isTransferSummary(comp) && (
                                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">轉院</span>
                                                    )}
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Building className="h-3 w-3" />
                                                        {comp.custodian?.display || '未知醫院'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {new Date(comp.date).toLocaleDateString('zh-TW')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => loadDetail(comp.id)}
                                                    className="text-xs text-medical-primary hover:underline"
                                                >
                                                    {expandedId === comp.id ? '收合' : '查看'}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/composition/${comp.id}`)}
                                                    className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                                >
                                                    導入
                                                </button>
                                            </div>
                                        </div>

                                        {expandedId === comp.id && detailData[comp.id] && (
                                            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <SectionGroups composition={detailData[comp.id]} parseSections={parseSections} />
                                                <ImportableResources
                                                    resources={linkedResources[comp.id] || []}
                                                    onShowJson={setShowJsonModal}
                                                />
                                            </div>
                                        )}
                                    </div>
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
                        <div key={i} className="text-sm text-green-800 whitespace-pre-wrap">{item.text}</div>
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
