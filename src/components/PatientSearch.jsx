import React, { useState } from 'react';
import { Search, User, AlertCircle, ChevronDown, Github, ExternalLink } from 'lucide-react';
import { searchPatientById, searchPatientByNHI } from '../services/fhirQueries';

// 測試案例資料
const TEST_PATIENTS = [
    {
        id: 'pt-testa-01',
        name: '林小萱',
        nationalId: 'F73278868',
        nhiCard: '900000000101',
        diagnosis: 'SLE 紅斑性狼瘡',
        scenario: '出院後轉院',
        gender: 'female',
        birthDate: '1991-03-15'
    },
    {
        id: 'pt-testa-02',
        name: '王美華',
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

    const handleTestCaseChange = (e) => {
        setSelectedTestCase(e.target.value);
        setError(null);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!selectedTestCase) return;

        const testPatient = TEST_PATIENTS.find(p => p.id === selectedTestCase);
        if (!testPatient) return;

        setLoading(true);
        setError(null);

        try {
            // 優先用健保卡號查詢
            let response = await searchPatientByNHI(client, testPatient.nhiCard);

            // 如果沒找到，改用身分證查詢
            if (!response || !response.entry || response.entry.length === 0) {
                response = await searchPatientById(client, testPatient.nationalId);
            }

            if (response && response.entry && response.entry.length > 0) {
                // 直接跳轉到病摘頁面
                onPatientSelect(response.entry[0].resource);
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

    const selectedTestPatient = TEST_PATIENTS.find(p => p.id === selectedTestCase);

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* 專案資訊 Hero Section */}
            <div className="relative overflow-hidden bg-medical-navy rounded-[2.5rem] p-10 shadow-2xl group">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-medical-primary opacity-20 blur-[100px] rounded-full group-hover:opacity-30 transition-opacity duration-700"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-medical-accent opacity-10 blur-[100px] rounded-full group-hover:opacity-20 transition-opacity duration-700"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-accent"></span>
                            </span>
                            <span className="text-sky-200 text-xs font-bold tracking-widest uppercase">SMART on FHIR</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            跨院病歷 <span className="text-transparent bg-clip-text bg-premium-gradient">整合系統</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                            CHARI (Cross-Hospital Admission Record Integration) 旨在整合跨院出院、轉院病摘及用藥記錄，
                            協助醫療人員透過 TW Core IG 標準格式掌握完整醫療資訊。
                        </p>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                            <a
                                href="https://github.com/selika/CHARI"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-white text-medical-navy hover:bg-sky-50 px-6 py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg group"
                            >
                                <Github className="h-5 w-5" />
                                GitHub Repo
                                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full max-w-md lg:max-w-none">
                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group-hover:border-white/20 transition-colors">
                            <img
                                src={`${import.meta.env.BASE_URL}transmission-concept.png`}
                                alt="Medical Data Transmission Concept"
                                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-medical-navy/60 to-transparent"></div>
                        </div>
                        {/* Decorative orbits */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 border-2 border-medical-accent/20 rounded-full animate-pulse"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 border-2 border-medical-primary/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12">
                    <div className="glass-card rounded-[2.5rem] p-10 border-slate-200/50 shadow-2xl relative overflow-hidden bg-white/40 backdrop-blur-xl">
                        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-4">
                            <div className="bg-sky-100 p-3 rounded-2xl">
                                <Search className="h-6 w-6 text-medical-primary" />
                            </div>
                            快速病人查詢
                        </h2>

                        {/* 測試案例選擇 */}
                        <form onSubmit={handleSearch} className="space-y-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    選擇測試情境
                                </label>
                                <div className="relative group">
                                    <select
                                        value={selectedTestCase}
                                        onChange={handleTestCaseChange}
                                        className="block w-full pl-6 pr-12 py-5 text-lg font-medium border-2 border-slate-100 rounded-3xl bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-medical-primary appearance-none cursor-pointer transition-all hover:bg-white hover:border-sky-100"
                                    >
                                        <option value="">-- 請選擇測試案例 --</option>
                                        {TEST_PATIENTS.map((tp) => (
                                            <option key={tp.id} value={tp.id}>
                                                {tp.name} - {tp.diagnosis} ({tp.scenario})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none text-slate-400 group-focus-within:text-medical-primary transition-colors">
                                        <ChevronDown className="h-6 w-6" />
                                    </div>
                                </div>
                            </div>

                            {/* 選中案例的詳細資訊 */}
                            {selectedTestPatient && (
                                <div className="bg-sky-50/50 rounded-3xl p-8 border border-sky-100/50 animate-in zoom-in-95 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest flex items-center gap-1.5">
                                                <User className="h-3 w-3" /> 基本資訊
                                            </div>
                                            <div className="text-lg font-bold text-slate-800">{selectedTestPatient.name}</div>
                                            <div className="text-sm text-slate-500 font-medium">
                                                {selectedTestPatient.gender === 'male' ? '男性' : '女性'} • {selectedTestPatient.birthDate}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">識別號碼</div>
                                            <div className="font-mono text-slate-700 font-semibold">{selectedTestPatient.nationalId}</div>
                                            <div className="font-mono text-slate-400 text-xs">{selectedTestPatient.nhiCard}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">情境分類</div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedTestPatient.scenario === '住院中轉院'
                                                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                    {selectedTestPatient.scenario}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedTestPatient.hasAllergy && (
                                        <div className="flex items-center gap-2 text-red-600 mt-6 bg-red-50 p-4 rounded-2xl border border-red-100">
                                            <div className="bg-red-500 p-1.5 rounded-full">
                                                <AlertCircle className="h-4 w-4 text-white" />
                                            </div>
                                            <span className="font-bold text-sm italic">此病人有已知的藥物過敏記錄 (NKDA 排除)</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !selectedTestCase}
                                className={`w-full flex justify-center items-center gap-3 py-5 px-8 text-lg font-bold rounded-3xl text-white shadow-xl transition-all active:scale-95 ${loading || !selectedTestCase
                                    ? 'bg-slate-300 cursor-not-allowed opacity-50'
                                    : 'bg-premium-gradient hover:shadow-premium-hover hover:-translate-y-1'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                                        正在介接 FHIR Server...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-6 w-6" />
                                        開始臨床調閱
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 flex items-center justify-center gap-3 py-4 border-t border-slate-100 grayscale opacity-50">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                            ))}
                        </div>
                        <p className="mt-6 text-xs text-slate-400 text-center font-medium">
                            ※ 測試版介面：快速切換測試案例以模擬不同臨床轉院情境。系統介接時將依權限自動介接後端 Server。
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-8 p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl flex items-start gap-4 animate-in shake duration-500">
                                <div className="bg-red-500 p-2 rounded-xl">
                                    <AlertCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="space-y-1 pt-1">
                                    <h4 className="font-bold">查詢失敗</h4>
                                    <p className="text-sm opacity-90">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
