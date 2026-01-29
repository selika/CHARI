import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Calendar, Building, Download, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { searchCompositions } from '../services/fhirQueries';

export default function CompositionList({ client }) {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [compositions, setCompositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [detailData, setDetailData] = useState({});

    useEffect(() => {
        if (client && patientId) {
            setLoading(true);
            searchCompositions(client, patientId)
                .then(response => {
                    const entries = response.entry || [];
                    // 按日期排序（最新在前）並過濾只顯示出院病摘
                    const sorted = entries
                        .map(e => e.resource)
                        .filter(r => r.type?.coding?.[0]?.code === '18842-5') // 只要出院病摘
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

    // 動態載入病摘詳細內容
    const loadDetail = async (compositionId) => {
        if (detailData[compositionId]) {
            setExpandedId(expandedId === compositionId ? null : compositionId);
            return;
        }

        try {
            const composition = await client.request(`Composition/${compositionId}`);
            setDetailData(prev => ({ ...prev, [compositionId]: composition }));
            setExpandedId(compositionId);
        } catch (err) {
            console.error('Error loading detail:', err);
        }
    };

    // 解析 section 並分組
    const parseSections = (composition) => {
        const sections = composition.section || [];
        const grouped = {
            diagnosis: [],      // 診斷
            medications: [],    // 用藥
            allergies: [],      // 過敏
            procedures: [],     // 手術/處置
            others: []          // 其他
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
            <div className="max-w-4xl mx-auto p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
                <p className="text-slate-500">載入出院病摘中...</p>
            </div>
        );
    }

    // 最新一筆和歷史記錄
    const latestComposition = compositions[0];
    const historyCompositions = compositions.slice(1);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    title="返回病人搜尋"
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
                    {/* 最新出院病摘 */}
                    {latestComposition && (
                        <div className="bg-white rounded-lg shadow-md border-2 border-medical-primary overflow-hidden">
                            <div className="bg-medical-primary text-white px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    <span className="font-bold">最新出院病摘</span>
                                </div>
                                <span className="text-sm opacity-90">
                                    {new Date(latestComposition.date).toLocaleDateString('zh-TW')}
                                </span>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                                            {latestComposition.title || '出院病摘'}
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

                                {/* 動態載入的詳細內容 */}
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
                                    <SectionGroups composition={detailData[latestComposition.id]} parseSections={parseSections} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* 歷史記錄 */}
                    {historyCompositions.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                            <div className="px-6 py-3 border-b border-slate-200">
                                <h3 className="font-bold text-slate-700">歷史出院病摘 ({historyCompositions.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {historyCompositions.map((comp) => (
                                    <div key={comp.id} className="p-4 hover:bg-slate-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-slate-800">
                                                        {comp.title || '出院病摘'}
                                                    </span>
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
                                            <div className="mt-4">
                                                <SectionGroups composition={detailData[comp.id]} parseSections={parseSections} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// 分組顯示段落
function SectionGroups({ composition, parseSections }) {
    const grouped = parseSections(composition);

    return (
        <div className="mt-4 space-y-4">
            {/* 過敏史 - 紅色警示 */}
            {grouped.allergies.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        過敏史
                    </h4>
                    {grouped.allergies.map((item, i) => (
                        <div key={i} className="text-sm text-red-800">{item.text}</div>
                    ))}
                </div>
            )}

            {/* 診斷 */}
            {grouped.diagnosis.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-700 mb-2">出院診斷</h4>
                    {grouped.diagnosis.map((item, i) => (
                        <div key={i} className="text-sm text-blue-800 whitespace-pre-wrap">{item.text}</div>
                    ))}
                </div>
            )}

            {/* 用藥 */}
            {grouped.medications.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-bold text-green-700 mb-2">出院用藥</h4>
                    {grouped.medications.map((item, i) => (
                        <div key={i} className="text-sm text-green-800 whitespace-pre-wrap">{item.text}</div>
                    ))}
                </div>
            )}

            {/* 手術/處置 */}
            {grouped.procedures.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-bold text-purple-700 mb-2">手術/處置</h4>
                    {grouped.procedures.map((item, i) => (
                        <div key={i} className="text-sm text-purple-800 whitespace-pre-wrap">{item.text}</div>
                    ))}
                </div>
            )}

            {/* 其他 */}
            {grouped.others.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="font-bold text-slate-700 mb-2">其他資訊</h4>
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
