import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, AlertTriangle, FileText, ChevronDown, ChevronUp, X, Calendar, Building } from 'lucide-react';

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
    { key: 'chiefComplaint', label: '主訴', icon: '💬', resourceTypes: [], bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', textOnly: true, sectionCode: '10154-3' },
    { key: 'hpi', label: '現病史', icon: '📖', resourceTypes: [], bgColor: 'bg-violet-50', borderColor: 'border-violet-200', textOnly: true, sectionCode: '10164-2' },
    { key: 'history', label: '過去病史', icon: '📝', resourceTypes: [], bgColor: 'bg-slate-50', borderColor: 'border-slate-200', textOnly: true, sectionCode: '11348-0' },
    { key: 'procedures', label: '手術/處置史', icon: '🔧', resourceTypes: ['Procedure'], bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { key: 'labs', label: '檢驗報告', icon: '🔬', resourceTypes: ['Observation'], bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { key: 'imaging', label: '影像/EKG 報告', icon: '📊', resourceTypes: ['DiagnosticReport'], bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { key: 'medications', label: '用藥記錄', icon: '💊', resourceTypes: ['MedicationStatement', 'MedicationRequest'], bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
    { key: 'plan', label: '出院/轉院計畫', icon: '📅', resourceTypes: ['CarePlan'], bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textOnly: true, sectionCode: '18776-5' }
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

    // Text Section Selection State
    const [selectedTextSections, setSelectedTextSections] = useState({});

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

                    // 初始化文字區段選擇（主訴、現病史不預設選中）
                    setSelectedTextSections({});

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

    const toggleTextSection = (code) => {
        setSelectedTextSections(prev => ({
            ...prev,
            [code]: !prev[code]
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

        // 加入選中的純文字區段（以 FHIR DocumentReference 格式）
        if (composition?.section) {
            // 主訴（只有選中才加入）
            if (selectedTextSections['10154-3']) {
                const chiefComplaintSection = composition.section.find(s => s.code?.coding?.[0]?.code === '10154-3');
                if (chiefComplaintSection?.text?.div) {
                    grouped.chiefComplaint = [{
                        resourceType: 'DocumentReference',
                        id: `docref-${composition.id}-chief-complaint`,
                        status: 'current',
                        type: {
                            coding: [{ system: 'http://loinc.org', code: '10154-3', display: 'Chief complaint' }],
                            text: '主訴'
                        },
                        subject: composition.subject,
                        date: composition.date,
                        content: [{
                            attachment: {
                                contentType: 'text/html',
                                data: btoa(unescape(encodeURIComponent(chiefComplaintSection.text.div)))
                            }
                        }],
                        _sourceText: chiefComplaintSection.text.div.replace(/<[^>]*>/g, '')
                    }];
                }
            }
            // 現病史（只有選中才加入）
            if (selectedTextSections['10164-2']) {
                const hpiSection = composition.section.find(s => s.code?.coding?.[0]?.code === '10164-2');
                if (hpiSection?.text?.div) {
                    grouped.hpi = [{
                        resourceType: 'DocumentReference',
                        id: `docref-${composition.id}-hpi`,
                        status: 'current',
                        type: {
                            coding: [{ system: 'http://loinc.org', code: '10164-2', display: 'History of present illness' }],
                            text: '現病史'
                        },
                        subject: composition.subject,
                        date: composition.date,
                        content: [{
                            attachment: {
                                contentType: 'text/html',
                                data: btoa(unescape(encodeURIComponent(hpiSection.text.div)))
                            }
                        }],
                        _sourceText: hpiSection.text.div.replace(/<[^>]*>/g, '')
                    }];
                }
            }
            // 過去病史
            const historySection = composition.section.find(s => s.code?.coding?.[0]?.code === '11348-0');
            if (historySection?.text?.div) {
                grouped.history = [{ _textOnly: true, html: historySection.text.div }];
            }
            // 出院/轉院計畫
            const planSection = composition.section.find(s =>
                s.code?.coding?.[0]?.code === '18776-5' || s.code?.coding?.[0]?.code === '42349-1'
            );
            if (planSection?.text?.div) {
                grouped.plan = [{ _textOnly: true, html: planSection.text.div }];
            }
        }

        // 計算總數：資源數 + 選中的文字區段數
        const textSectionCount = Object.values(selectedTextSections).filter(Boolean).length;
        setImportResult({ grouped, total: idsToImport.length + textSectionCount });
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
                className={`flex items-start gap-3 p-3 rounded-md border mb-2 cursor-pointer transition-colors ${selectedIds[resource.id]
                    ? 'bg-sky-50 border-medical-primary'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${isHighRisk ? 'border-red-300' : ''}`}
                onClick={() => toggleSelection(resource.id)}
            >
                <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedIds[resource.id] ? 'bg-medical-primary border-medical-primary text-white' : 'border-slate-300 bg-white'
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
            {/* Import Result Panel - Full Screen Modal */}
            {importResult && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="bg-premium-gradient text-white px-10 py-8 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                    <Download className="h-7 w-7" />
                                </div>
                                <div>
                                    <span className="font-black text-2xl tracking-tight">導入預覽</span>
                                    <p className="text-sky-100 text-xs font-bold tracking-widest uppercase mt-0.5 opacity-80">
                                        Total {importResult.total} Structured Resources Detected
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeImportResult}
                                className="hover:bg-white/10 p-3 rounded-2xl transition-all hover:rotate-90 duration-300"
                            >
                                <X className="h-8 w-8" />
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto flex-1 space-y-8 bg-slate-50/50">
                            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                                <div className="bg-amber-500 p-1.5 rounded-lg shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-amber-800 font-bold text-sm">臨床數據導入規範</p>
                                    <p className="text-amber-700/70 text-xs leading-relaxed">
                                        以下為系統解析之結構化資料。過敏註記為「高優先度」預設導入項目。
                                        點擊資源對應標籤可查看 FHIR JSON 原始格式。確認無誤後將同步寫入本院伺服器。
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {IMPORT_SECTIONS.map((sec, idx) => {
                                    const items = importResult.grouped[sec.key] || [];
                                    if (items.length === 0) return null;
                                    return (
                                        <div
                                            key={sec.key}
                                            className={`${sec.bgColor} ${sec.borderColor} border-2 rounded-[2rem] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                                                    <span className="text-2xl">{sec.icon}</span>
                                                    {sec.label}
                                                </h4>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sec.bgColor} border ${sec.borderColor}`}>
                                                    {items.length} Items
                                                </span>
                                            </div>

                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 text-sm border border-white shadow-sm hover:shadow-md transition-shadow">
                                                        {item._textOnly ? (
                                                            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.html }} />
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold font-mono bg-slate-100 px-2 py-1 rounded-lg text-slate-500">
                                                                        {item.resourceType} / {item.id}
                                                                    </span>
                                                                </div>
                                                                <pre className="text-[10px] leading-tight bg-slate-900 text-emerald-400 p-5 rounded-xl overflow-x-auto max-h-48 font-mono scrollbar-thin scrollbar-thumb-slate-700 border border-slate-800">
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
                        <div className="bg-white px-10 py-6 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Ready for Integration</span>
                            </div>
                            <button
                                onClick={closeImportResult}
                                className="px-10 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-bold transition-all transform active:scale-95 shadow-xl"
                            >
                                確認並關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm text-slate-500 hover:text-medical-primary transition-all active:scale-90"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-sky-100 px-2 py-0.5 rounded-lg text-[10px] font-bold text-sky-600 uppercase tracking-widest border border-sky-200">
                                Clinical Document
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{composition.title}</h1>
                        <p className="text-slate-400 font-medium flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(composition.date).toLocaleDateString('zh-TW')}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 font-bold text-slate-500"><Building className="h-4 w-4" /> {composition.custodian?.display || '未知醫院'}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleImport}
                    disabled={Object.values(selectedIds).filter(Boolean).length === 0 && Object.values(selectedTextSections).filter(Boolean).length === 0}
                    className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-white transition-all transform active:scale-95 shadow-2xl ${(Object.values(selectedIds).filter(Boolean).length > 0 || Object.values(selectedTextSections).filter(Boolean).length > 0)
                        ? 'bg-premium-gradient hover:shadow-premium-hover hover:-translate-y-1'
                        : 'bg-slate-300 cursor-not-allowed opacity-50'
                        }`}
                >
                    <Download className="h-6 w-6" />
                    <span className="text-lg">導入結構化資料 ({Object.values(selectedIds).filter(Boolean).length + Object.values(selectedTextSections).filter(Boolean).length})</span>
                </button>
            </div>

            {/* Resource Sections by Type */}
            <div className="space-y-10">
                {/* Allergies Section */}
                {(() => {
                    const allergies = resourcesByType['AllergyIntolerance'] || [];
                    const hasRealAllergy = allergies.some(a => {
                        const text = (a.code?.text || a.code?.coding?.[0]?.display || '').toLowerCase();
                        return !text.includes('nkda') && !text.includes('no known');
                    });
                    if (allergies.length > 0 && hasRealAllergy) {
                        return (
                            <div className="glass-card rounded-[2.5rem] border-2 border-red-200 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 blur-[50px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
                                <div className="bg-red-50/50 px-8 py-5 border-b border-red-200 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-500 p-2 rounded-xl shadow-lg shadow-red-200">
                                            <AlertTriangle className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="font-black text-red-700 tracking-tight text-xl">⚠️ 過敏史記錄 ({allergies.length})</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full border border-red-100 shadow-sm animate-pulse">Critical Priority</span>
                                </div>
                                <div className="p-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allergies.map(renderResource)}
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Conditions & Procedures Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Conditions */}
                    {resourcesByType['Condition']?.length > 0 && (
                        <div className="glass-card rounded-[2.5rem] overflow-hidden">
                            <div className="bg-blue-50/50 px-8 py-5 border-b border-blue-200 flex items-center justify-between">
                                <h3 className="font-black text-blue-700 tracking-tight text-xl flex items-center gap-3">
                                    <span className="bg-blue-100 p-2 rounded-xl"><FileText className="h-5 w-5 text-blue-600" /></span>
                                    臨床診斷 ({resourcesByType['Condition'].length})
                                </h3>
                                <div className="flex gap-4">
                                    <button onClick={() => selectAll('Condition')} className="text-xs font-bold text-blue-600 hover:underline tracking-tighter uppercase">Select All</button>
                                    <button onClick={() => deselectAll('Condition')} className="text-xs font-bold text-slate-400 hover:underline tracking-tighter uppercase">Clear</button>
                                </div>
                            </div>
                            <div className="p-8 space-y-2">
                                {resourcesByType['Condition'].map(renderResource)}
                            </div>
                        </div>
                    )}

                    {/* Procedures */}
                    {resourcesByType['Procedure']?.length > 0 && (
                        <div className="glass-card rounded-[2.5rem] overflow-hidden">
                            <div className="bg-purple-50/50 px-8 py-5 border-b border-purple-200 flex items-center justify-between">
                                <h3 className="font-black text-purple-700 tracking-tight text-xl flex items-center gap-3">
                                    <span className="bg-purple-100 p-2 rounded-xl"><Check className="h-5 w-5 text-purple-600" /></span>
                                    手術／處置 ({resourcesByType['Procedure'].length})
                                </h3>
                                <div className="flex gap-4">
                                    <button onClick={() => selectAll('Procedure')} className="text-xs font-bold text-purple-600 hover:underline tracking-tighter uppercase">Select All</button>
                                    <button onClick={() => deselectAll('Procedure')} className="text-xs font-bold text-slate-400 hover:underline tracking-tighter uppercase">Clear</button>
                                </div>
                            </div>
                            <div className="p-8 space-y-2">
                                {resourcesByType['Procedure'].map(renderResource)}
                            </div>
                        </div>
                    )}
                </div>

                {/* 主訴 / 現病史 (Text Sections) */}
                {composition.section?.some(s => ['10154-3', '10164-2'].includes(s.code?.coding?.[0]?.code)) && (
                    <div className="glass-card rounded-[2.5rem] overflow-hidden">
                        <div className="bg-cyan-50/50 px-8 py-5 border-b border-cyan-200">
                            <h3 className="font-black text-cyan-700 tracking-tight text-xl flex items-center gap-3">
                                <span className="bg-cyan-100 p-2 rounded-xl"><FileText className="h-5 w-5 text-cyan-600" /></span>
                                臨床文本 (Textual Insight)
                            </h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {composition.section?.filter(s => s.code?.coding?.[0]?.code === '10154-3').map((section, idx) => (
                                <div
                                    key={`cc-${idx}`}
                                    className={`group flex items-start gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${selectedTextSections['10154-3']
                                        ? 'bg-cyan-50 border-cyan-400 shadow-xl shadow-cyan-100 scale-[1.02]'
                                        : 'bg-white border-slate-100 hover:border-cyan-200'
                                        }`}
                                    onClick={() => toggleTextSection('10154-3')}
                                >
                                    <div className={`shrink-0 mt-1 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedTextSections['10154-3'] ? 'bg-cyan-500 border-cyan-500 text-white rotate-0' : 'border-slate-200 bg-white rotate-45'
                                        }`}>
                                        {selectedTextSections['10154-3'] && <Check className="h-4 w-4 stroke-[3]" />}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-black text-cyan-600 uppercase tracking-[0.2em]">Chief Complaint</div>
                                            <div className="bg-cyan-100 h-1.5 w-1.5 rounded-full"></div>
                                        </div>
                                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: section.text?.div }} />
                                    </div>
                                </div>
                            ))}
                            {composition.section?.filter(s => s.code?.coding?.[0]?.code === '10164-2').map((section, idx) => (
                                <div
                                    key={`hpi-${idx}`}
                                    className={`group flex items-start gap-4 p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${selectedTextSections['10164-2']
                                        ? 'bg-violet-50 border-violet-400 shadow-xl shadow-violet-100 scale-[1.02]'
                                        : 'bg-white border-slate-100 hover:border-violet-200'
                                        }`}
                                    onClick={() => toggleTextSection('10164-2')}
                                >
                                    <div className={`shrink-0 mt-1 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedTextSections['10164-2'] ? 'bg-violet-500 border-violet-500 text-white rotate-0' : 'border-slate-200 bg-white rotate-45'
                                        }`}>
                                        {selectedTextSections['10164-2'] && <Check className="h-4 w-4 stroke-[3]" />}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-black text-violet-600 uppercase tracking-[0.2em]">Medical History</div>
                                            <div className="bg-violet-100 h-1.5 w-1.5 rounded-full"></div>
                                        </div>
                                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: section.text?.div }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Laboratory Observations */}
                {resourcesByType['Observation']?.length > 0 && (
                    <div className="glass-card rounded-[2.5rem] overflow-hidden">
                        <div className="bg-emerald-50/50 px-8 py-5 border-b border-emerald-200 flex items-center justify-between">
                            <h3 className="font-black text-emerald-700 tracking-tight text-xl flex items-center gap-3">
                                <span className="bg-emerald-100 p-2 rounded-xl"><div className="h-5 w-5 bg-emerald-600 rounded-sm"></div></span>
                                檢驗數據 (Clinical Labs)
                            </h3>
                            <button onClick={() => selectAll('Observation')} className="text-xs font-bold text-emerald-600 hover:underline tracking-tighter uppercase">Select All Items</button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resourcesByType['Observation'].map(renderResource)}
                        </div>
                    </div>
                )}

                {/* Medications */}
                {(resourcesByType['MedicationStatement']?.length > 0 || resourcesByType['MedicationRequest']?.length > 0) && (
                    <div className="glass-card rounded-[2.5rem] overflow-hidden bg-white">
                        <div className="bg-teal-50/50 px-8 py-5 border-b border-teal-200 flex items-center justify-between">
                            <h3 className="font-black text-teal-700 tracking-tight text-xl flex items-center gap-3">
                                <span className="bg-teal-100 p-2 rounded-xl"><div className="h-5 w-5 bg-teal-600 rounded-full"></div></span>
                                藥物處方明細 (Medications)
                            </h3>
                            <button onClick={() => selectAll('MedicationStatement', 'MedicationRequest')} className="text-xs font-bold text-teal-600 hover:underline tracking-tighter uppercase">Sync All Prescriptions</button>
                        </div>
                        <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {resourcesByType['MedicationStatement']?.map(renderResource)}
                            {resourcesByType['MedicationRequest']?.map(renderResource)}
                        </div>
                    </div>
                )}

                {/* Other Textual Insight Sections */}
                {composition.section?.filter(s => {
                    const code = s.code?.coding?.[0]?.code;
                    return s.text?.div && !s.entry?.length && code !== '10154-3' && code !== '10164-2';
                }).map((section, idx) => {
                    const code = section.code?.coding?.[0]?.code;
                    const title = SECTION_CODES[code] || section.title || '其他臨床紀錄';
                    return (
                        <div key={idx} className="glass-card rounded-[2.5rem] overflow-hidden animate-in fade-in duration-700">
                            <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                                    {title}
                                </h3>
                            </div>
                            <div className="p-10 prose prose-sm max-w-none text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: section.text.div }} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
