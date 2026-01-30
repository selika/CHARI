import React, { useState } from 'react';
import { Search, User, AlertCircle, ChevronDown } from 'lucide-react';
import { searchPatientById, searchPatientByNHI } from '../services/fhirQueries';

// 測試案例資料
const TEST_PATIENTS = [
    {
        id: 'pt-testa-01',
        name: 'TESTA-01',
        nationalId: 'F232727969',
        nhiCard: '900000000101',
        diagnosis: 'SLE 紅斑性狼瘡',
        scenario: '出院後轉院',
        gender: 'female',
        birthDate: '2010-12-14'
    },
    {
        id: 'pt-testa-02',
        name: 'TESTA-02',
        nationalId: 'H201340546',
        nhiCard: '900000000202',
        diagnosis: 'Severe AS s/p TAVI',
        scenario: '出院後轉院',
        gender: 'female',
        birthDate: '1958-01-09'
    },
    {
        id: 'pt-testa-03',
        name: '陳志明',
        nationalId: 'A123456789',
        nhiCard: '900000000303',
        diagnosis: 'NSTEMI 三支血管疾病',
        scenario: '住院中轉院',
        gender: 'male',
        birthDate: '1957-03-15',
        hasAllergy: true
    }
];

export default function PatientSearch({ client, onPatientSelect }) {
    const [selectedTestCase, setSelectedTestCase] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);

    const handleTestCaseChange = (e) => {
        setSelectedTestCase(e.target.value);
        setPatient(null);
        setError(null);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!selectedTestCase) return;

        const testPatient = TEST_PATIENTS.find(p => p.id === selectedTestCase);
        if (!testPatient) return;

        setLoading(true);
        setError(null);
        setPatient(null);

        try {
            // 優先用健保卡號查詢
            let response = await searchPatientByNHI(client, testPatient.nhiCard);

            // 如果沒找到，改用身分證查詢
            if (!response || !response.entry || response.entry.length === 0) {
                response = await searchPatientById(client, testPatient.nationalId);
            }

            if (response && response.entry && response.entry.length > 0) {
                setPatient(response.entry[0].resource);
            } else {
                setError(`找不到病人 ${testPatient.name}，請確認測試資料已上傳至沙盒。`);
            }
        } catch (err) {
            console.error(err);
            setError('查詢時發生錯誤，請稍後再試。');
        } finally {
            setLoading(false);
        }
    };

    const getPatientName = (p) => {
        if (!p || !p.name || p.name.length === 0) return 'Unknown';
        const name = p.name[0];
        return name.text || `${name.family || ''} ${name.given ? name.given.join(' ') : ''}`;
    };

    const selectedTestPatient = TEST_PATIENTS.find(p => p.id === selectedTestCase);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-medical-primary" />
                    病人查詢
                </h2>

                {/* 測試案例選擇 */}
                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            選擇測試案例
                        </label>
                        <div className="relative">
                            <select
                                value={selectedTestCase}
                                onChange={handleTestCaseChange}
                                className="block w-full pl-3 pr-10 py-3 text-base border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-medical-primary appearance-none cursor-pointer"
                            >
                                <option value="">-- 請選擇測試病人 --</option>
                                {TEST_PATIENTS.map((tp) => (
                                    <option key={tp.id} value={tp.id}>
                                        {tp.name} - {tp.diagnosis} ({tp.scenario})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* 選中案例的詳細資訊 */}
                    {selectedTestPatient && (
                        <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div className="text-slate-500">身分證號</div>
                                <div className="font-mono text-slate-700">{selectedTestPatient.nationalId}</div>
                                <div className="text-slate-500">健保卡號</div>
                                <div className="font-mono text-slate-700">{selectedTestPatient.nhiCard}</div>
                                <div className="text-slate-500">情境類型</div>
                                <div className="text-slate-700">
                                    {selectedTestPatient.scenario === '住院中轉院' ? (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                            {selectedTestPatient.scenario}
                                        </span>
                                    ) : (
                                        selectedTestPatient.scenario
                                    )}
                                </div>
                            </div>
                            {selectedTestPatient.hasAllergy && (
                                <div className="flex items-center gap-1 text-red-600 mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>此病人有藥物過敏記錄</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !selectedTestCase}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${loading || !selectedTestCase ? 'bg-slate-400 cursor-not-allowed' : 'bg-medical-primary hover:bg-sky-600 shadow-sm'} transition-colors`}
                    >
                        {loading ? '查詢中...' : '查詢病人'}
                    </button>
                </form>

                {/* 附註說明 */}
                <p className="mt-4 text-xs text-slate-400 text-center">
                    ※ 為方便測試，使用下拉選單。系統介接時可直接對接身分證或健保卡號。
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Result Card */}
            {patient && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-md font-semibold text-slate-500 uppercase tracking-wider mb-4">查詢結果</h3>

                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 bg-medical-bg rounded-full flex items-center justify-center text-medical-primary font-bold text-xl">
                                {getPatientName(patient).charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900">{getPatientName(patient)}</h4>
                                <div className="text-sm text-slate-600 mt-1">
                                    <p>性別: {patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '未知'}</p>
                                    <p>生日: {patient.birthDate || '未知'}</p>
                                    <p>Patient ID: <span className="font-mono text-xs">{patient.id}</span></p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onPatientSelect(patient)}
                            className="px-4 py-2 bg-medical-primary text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
                        >
                            查看病摘
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
