import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, AlertTriangle, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';

// Section Code Mapping
const SECTION_CODES = {
    '10154-3': '主訴',
    '10164-2': '現病史',
    '11348-0': '過去病史',
    '46241-6': '入院診斷',
    '11535-2': '出院/轉院診斷',
    '8648-8': '住院經過',
    '10183-2': '出院用藥',
    '42346-7': '住院用藥',
    '48765-2': '過敏史',
    '47519-4': '手術/處置',
    '8724-7': '手術紀錄',
    '18776-5': '出院/轉院計畫',
    '30954-2': '檢驗結果',
    '18726-0': '影像檢查',
    '11524-6': 'EKG',
    '42349-1': '轉院原因'
};

// Import 區段順序
const IMPORT_SECTIONS = [
    { key: 'allergies', label: '過敏註記', icon: '⚠️', resourceTypes: ['AllergyIntolerance'], bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { key: 'diagnosis', label: '主要診斷', icon: '📋', resourceTypes: ['Condition'], bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { key: 'history', label: '過去病史', icon: '📝', resourceTypes: [], bgColor: 'bg-slate-50', borderColor: 'border-slate-200', textOnly: true },
    { key: 'procedures', label: '手術/處置史', icon: '🔧', resourceTypes: ['Procedure'], bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { key: 'labs', label: '檢驗報告', icon: '🔬', resourceTypes: ['Observation'], bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { key: 'imaging', label: '影像/EKG 報告', icon: '📊', resourceTypes: ['DiagnosticReport'], bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { key: 'medications', label: '用藥記錄', icon: '💊', resourceTypes: ['MedicationStatement', 'MedicationRequest'], bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
    { key: 'plan', label: '出院/轉院計畫', icon: '📅', resourceTypes: ['CarePlan'], bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textOnly: true }
];

export default function CompositionDetail({ client }) {
    const { compositionId } = useParams();
    const navigate = useNavigate();

    const [composition, setComposition] = useState(null);
    const [allResources, setAllResources] = useState([]); // 所有載入的資源
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selection State for Import
    const [selectedIds, setSelectedIds] = useState({});

    // Import Result Display
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        if (client && compositionId) {
            setLoading(true);

            client.request(`Composition/${compositionId}`)
                .then(async (comp) => {
                    setComposition(comp);

                    // 載入所有 section 的 entry 資源
                    const resources = [];
                    const initialSelected = {};

                    if (comp.section) {
                        for (const sec of comp.section) {
                            if (sec.entry) {
                                for (const ref of sec.entry) {
                                    try {
                                        const resource = await client.request(ref.reference);
                                        if (resource) {
                                            resources.push(resource);
                                            // 過敏預設選中
                                            if (resource.resourceType === 'AllergyIntolerance') {
                                                initialSelected[resource.id] = true;
                                            }
                                        }
                                    } catch (e) {
                                        console.warn('Failed to load:', ref.reference);
                                    }
                                }
                            }
                        }
                    }

                    setAllResources(resources);
                    setSelectedIds(initialSelected);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err);
                    setLoading(false);
                });
        }
    }, [client, compositionId]);

    const toggleSelection = (id) => {
        setSelectedIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const selectAll = (...resourceTypes) => {
        const newSelected = { ...selectedIds };
        allResources.filter(r => resourceTypes.includes(r.resourceType)).forEach(r => {
            newSelected[r.id] = true;
        });
        setSelectedIds(newSelected);
    };

    const deselectAll = (...resourceTypes) => {
        const newSelected = { ...selectedIds };
        allResources.filter(r => resourceTypes.includes(r.resourceType)).forEach(r => {
            newSelected[r.id] = false;
        });
        setSelectedIds(newSelected);
    };

    const handleImport = () => {
        const idsToImport = Object.keys(selectedIds).filter(id => selectedIds[id]);
        const itemsToImport = allResources.filter(r => idsToImport.includes(r.id));

        // 按區段分組
        const grouped = {};
        IMPORT_SECTIONS.forEach(sec => {
            grouped[sec.key] = itemsToImport.filter(r => sec.resourceTypes.includes(r.resourceType));
        });

        // 加入純文字區段
        if (composition?.section) {
            const historySection = composition.section.find(s => s.code?.coding?.[0]?.code === '11348-0');
            if (historySection?.text?.div) {
                grouped.history = [{ _textOnly: true, html: historySection.text.div }];
            }
            const planSection = composition.section.find(s =>
                s.code?.coding?.[0]?.code === '18776-5' || s.code?.coding?.[0]?.code === '42349-1'
            );
            if (planSection?.text?.div) {
                grouped.plan = [{ _textOnly: true, html: planSection.text.div }];
            }
        }

        setImportResult({ grouped, total: idsToImport.length });
    };

    const closeImportResult = () => {
        setImportResult(null);
    };

    // 資源渲染 - 友善顯示
    const renderResourceDisplay = (resource) => {
        if (resource._textOnly) {
            return <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: resource.html }} />;
        }

        switch (resource.resourceType) {
            case 'Condition':
                return (
                    <div>
                        <span className="font-medium">{resource.code?.text || resource.code?.coding?.[0]?.display}</span>
                        {resource.code?.coding?.[0]?.code && (
                            <span className="ml-2 text-xs text-slate-500">[{resource.code?.coding?.[0]?.code}]</span>
                        )}
                    </div>
                );
            case 'MedicationStatement':
            case 'MedicationRequest':
                const medCategory = resource.category?.coding?.[0]?.code;
                const isInpatient = medCategory === 'inpatient';
                const startDate = resource.effectivePeriod?.start || resource.effectiveDateTime;
                const endDate = resource.effectivePeriod?.end;
                return (
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">
                                {resource.medicationCodeableConcept?.text || resource.medicationCodeableConcept?.coding?.[0]?.display}
                            </span>
                            {medCategory && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isInpatient ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {isInpatient ? '住院用藥' : '出院帶回'}
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">
                            {resource.dosage?.[0]?.text && <span>{resource.dosage[0].text}</span>}
                            {startDate && (
                                <span className="ml-2">
                                    {new Date(startDate).toLocaleDateString('zh-TW')}
                                    {endDate && ` ~ ${new Date(endDate).toLocaleDateString('zh-TW')}`}
                                </span>
                            )}
                        </div>
                    </div>
                );
            case 'AllergyIntolerance':
                return (
                    <div className="flex items-center gap-2">
                        {resource.criticality === 'high' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className={`font-medium ${resource.criticality === 'high' ? 'text-red-700' : ''}`}>
                            {resource.code?.text || resource.code?.coding?.[0]?.display}
                        </span>
                        {resource.criticality === 'high' && <span className="text-xs text-red-500">(High Risk)</span>}
                        {resource.reaction?.[0]?.manifestation?.[0]?.text && (
                            <span className="text-slate-500">- {resource.reaction[0].manifestation[0].text}</span>
                        )}
                    </div>
                );
            case 'Procedure':
                return (
                    <div>
                        <span className="font-medium">{resource.code?.text || resource.code?.coding?.[0]?.display}</span>
                        {resource.performedDateTime && (
                            <span className="ml-2 text-xs text-slate-500">
                                {new Date(resource.performedDateTime).toLocaleDateString('zh-TW')}
                            </span>
                        )}
                    </div>
                );
            case 'Observation':
                const value = resource.valueQuantity
                    ? `${resource.valueQuantity.value} ${resource.valueQuantity.unit || ''}`
                    : resource.valueString || resource.valueCodeableConcept?.text || '';
                const interpretation = resource.interpretation?.[0]?.coding?.[0]?.code;
                const isAbnormal = interpretation === 'H' || interpretation === 'L' || interpretation === 'A';
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-medium w-40 truncate">
                            {resource.code?.text || resource.code?.coding?.[0]?.display}
                        </span>
                        <span className={`${isAbnormal ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                            {value}
                        </span>
                        {interpretation && (
                            <span className={`text-xs px-1 rounded ${isAbnormal ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                                {interpretation}
                            </span>
                        )}
                    </div>
                );
            case 'DiagnosticReport':
                return (
                    <div>
                        <span className="font-medium">{resource.code?.text || resource.code?.coding?.[0]?.display}</span>
                        {resource.conclusion && (
                            <p className="text-sm text-slate-600 mt-1">{resource.conclusion}</p>
                        )}
                    </div>
                );
            default:
                return <span>{resource.resourceType}: {resource.id}</span>;
        }
    };

    // 資源選擇項目渲染
    const renderResource = (resource) => {
        if (!resource) return null;

        const isHighRisk = resource.resourceType === 'AllergyIntolerance' && resource.criticality === 'high';

        return (
            <div
                key={resource.id}
                className={`flex items-start gap-3 p-3 rounded-md border mb-2 cursor-pointer transition-colors ${
                    selectedIds[resource.id]
                        ? 'bg-sky-50 border-medical-primary'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                } ${isHighRisk ? 'border-red-300' : ''}`}
                onClick={() => toggleSelection(resource.id)}
            >
                <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                    selectedIds[resource.id] ? 'bg-medical-primary border-medical-primary text-white' : 'border-slate-300 bg-white'
                }`}>
                    {selectedIds[resource.id] && <Check className="h-3 w-3" />}
                </div>
                <div className="flex-1 text-sm">
                    {renderResourceDisplay(resource)}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
                <p className="text-slate-500">載入病摘內容中...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-red-600">Error: {error.message}</div>;
    }

    if (!composition) return <div>No data</div>;

    // 按資源類型分組
    const resourcesByType = {};
    allResources.forEach(r => {
        if (!resourcesByType[r.resourceType]) resourcesByType[r.resourceType] = [];
        resourcesByType[r.resourceType].push(r);
    });

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Import Result Panel */}
            {importResult && (
                <div className="bg-white rounded-lg shadow-lg border-2 border-medical-primary overflow-hidden sticky top-0 z-10">
                    <div className="bg-medical-primary text-white px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            <span className="font-bold">導入預覽 - 共 {importResult.total} 筆資料</span>
                        </div>
                        <button onClick={closeImportResult} className="hover:bg-white/20 p-1 rounded">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                        <p className="text-xs text-slate-500 mb-4">※ 過敏註記為預設導入</p>
                        <div className="space-y-4">
                            {IMPORT_SECTIONS.map(sec => {
                                const items = importResult.grouped[sec.key] || [];
                                if (items.length === 0) return null;
                                return (
                                    <div key={sec.key} className={`${sec.bgColor} ${sec.borderColor} border rounded-lg p-4`}>
                                        <h4 className="font-bold text-slate-700 mb-2">{sec.icon} {sec.label}</h4>
                                        <div className="space-y-2">
                                            {items.map((item, idx) => (
                                                <div key={idx} className="bg-white rounded p-2 text-sm border border-slate-100">
                                                    {item._textOnly ? (
                                                        <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: item.html }} />
                                                    ) : (
                                                        <div>
                                                            <div className="text-xs text-slate-400 mb-1">{item.resourceType}/{item.id}</div>
                                                            <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto max-h-32">
                                                                {JSON.stringify(item, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{composition.title}</h1>
                        <p className="text-slate-500">
                            {new Date(composition.date).toLocaleDateString('zh-TW')} • {composition.custodian?.display || '未知醫院'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleImport}
                    disabled={Object.values(selectedIds).filter(Boolean).length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors shadow-sm ${
                        Object.values(selectedIds).filter(Boolean).length > 0
                            ? 'bg-medical-primary hover:bg-sky-600'
                            : 'bg-slate-300 cursor-not-allowed'
                    }`}
                >
                    <Download className="h-4 w-4" />
                    Import ({Object.values(selectedIds).filter(Boolean).length})
                </button>
            </div>

            {/* Resource Sections by Type */}
            <div className="space-y-6">
                {/* Allergies Section - Always First */}
                {resourcesByType['AllergyIntolerance']?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 overflow-hidden">
                        <div className="bg-red-50 px-6 py-3 border-b border-red-200 flex items-center justify-between">
                            <h3 className="font-bold text-red-700 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                ⚠️ 過敏史 ({resourcesByType['AllergyIntolerance'].length})
                            </h3>
                            <span className="text-xs text-red-500">※ 預設導入</span>
                        </div>
                        <div className="p-4">
                            {resourcesByType['AllergyIntolerance'].map(renderResource)}
                        </div>
                    </div>
                )}

                {/* Conditions */}
                {resourcesByType['Condition']?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-blue-50 px-6 py-3 border-b border-blue-200 flex items-center justify-between">
                            <h3 className="font-bold text-blue-700">📋 診斷 ({resourcesByType['Condition'].length})</h3>
                            <div className="flex gap-2">
                                <button onClick={() => selectAll('Condition')} className="text-xs text-blue-600 hover:underline">全選</button>
                                <button onClick={() => deselectAll('Condition')} className="text-xs text-slate-500 hover:underline">取消</button>
                            </div>
                        </div>
                        <div className="p-4">
                            {resourcesByType['Condition'].map(renderResource)}
                        </div>
                    </div>
                )}

                {/* Procedures */}
                {resourcesByType['Procedure']?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-purple-50 px-6 py-3 border-b border-purple-200 flex items-center justify-between">
                            <h3 className="font-bold text-purple-700">🔧 手術/處置 ({resourcesByType['Procedure'].length})</h3>
                            <div className="flex gap-2">
                                <button onClick={() => selectAll('Procedure')} className="text-xs text-purple-600 hover:underline">全選</button>
                                <button onClick={() => deselectAll('Procedure')} className="text-xs text-slate-500 hover:underline">取消</button>
                            </div>
                        </div>
                        <div className="p-4">
                            {resourcesByType['Procedure'].map(renderResource)}
                        </div>
                    </div>
                )}

                {/* Observations (Labs) */}
                {resourcesByType['Observation']?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-green-50 px-6 py-3 border-b border-green-200 flex items-center justify-between">
                            <h3 className="font-bold text-green-700">🔬 檢驗數據 ({resourcesByType['Observation'].length})</h3>
                            <div className="flex gap-2">
                                <button onClick={() => selectAll('Observation')} className="text-xs text-green-600 hover:underline">全選</button>
                                <button onClick={() => deselectAll('Observation')} className="text-xs text-slate-500 hover:underline">取消</button>
                            </div>
                        </div>
                        <div className="p-4">
                            {resourcesByType['Observation'].map(renderResource)}
                        </div>
                    </div>
                )}

                {/* DiagnosticReports (Imaging/EKG) */}
                {resourcesByType['DiagnosticReport']?.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex items-center justify-between">
                            <h3 className="font-bold text-amber-700">📊 影像/EKG 報告 ({resourcesByType['DiagnosticReport'].length})</h3>
                            <div className="flex gap-2">
                                <button onClick={() => selectAll('DiagnosticReport')} className="text-xs text-amber-600 hover:underline">全選</button>
                                <button onClick={() => deselectAll('DiagnosticReport')} className="text-xs text-slate-500 hover:underline">取消</button>
                            </div>
                        </div>
                        <div className="p-4">
                            {resourcesByType['DiagnosticReport'].map(renderResource)}
                        </div>
                    </div>
                )}

                {/* Medications */}
                {(resourcesByType['MedicationStatement']?.length > 0 || resourcesByType['MedicationRequest']?.length > 0) && (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-teal-50 px-6 py-3 border-b border-teal-200 flex items-center justify-between">
                            <h3 className="font-bold text-teal-700">
                                💊 用藥記錄 ({(resourcesByType['MedicationStatement']?.length || 0) + (resourcesByType['MedicationRequest']?.length || 0)})
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => selectAll('MedicationStatement', 'MedicationRequest')} className="text-xs text-teal-600 hover:underline">全選</button>
                                <button onClick={() => deselectAll('MedicationStatement', 'MedicationRequest')} className="text-xs text-slate-500 hover:underline">取消</button>
                            </div>
                        </div>
                        <div className="p-4">
                            {resourcesByType['MedicationStatement']?.map(renderResource)}
                            {resourcesByType['MedicationRequest']?.map(renderResource)}
                        </div>
                    </div>
                )}

                {/* Text Sections from Composition */}
                {composition.section?.filter(s => s.text?.div && !s.entry?.length).map((section, idx) => {
                    const code = section.code?.coding?.[0]?.code;
                    const title = SECTION_CODES[code] || section.title || '其他';
                    return (
                        <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                                <h3 className="font-bold text-slate-700">{title}</h3>
                            </div>
                            <div className="p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.text.div }} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
