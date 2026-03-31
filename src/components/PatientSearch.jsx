import React, { useState, useEffect } from 'react';
import { Search, User, AlertCircle, ChevronDown, Github, ExternalLink, KeyRound, Play, Trash2, Shield, AlertTriangle, Server, Zap } from 'lucide-react';
import FHIR from 'fhirclient';
import { searchPatientById, searchPatientByNHI } from '../services/fhirQueries';

// sessionStorage key for EHR Launch credentials
const SMART_STORAGE_KEY = 'CHARI_SMART_TEST';

// 預設 FHIR Server 選項
const FHIR_SERVERS = [
    { label: 'SMART Health IT (R4)', url: 'https://launch.smarthealthit.org/v/r4/fhir' },
    { label: 'THAS 衛福部', url: 'https://thas.mohw.gov.tw/v/r4/fhir' },
    { label: 'THAS Sandbox', url: 'https://emr-smart.appx.com.tw/v/r4/fhir' },
    { label: 'SMART Health IT (R3)', url: 'https://r3.smarthealthit.org' },
    { label: '自訂', url: '' },
];

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
        nationalId: 'H405481546',
        nhiCard: '900000000202',
        diagnosis: 'Severe AS s/p TAVI',
        scenario: '出院後轉院',
        gender: 'female',
        birthDate: '1958-05-13'
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

    // Demo tabs
    const [demoTab, setDemoTab] = useState('sandbox');

    // EHR Launch state
    const [ehrClientId, setEhrClientId] = useState('');
    const [ehrClientSecret, setEhrClientSecret] = useState('');
    const [ehrFhirServer, setEhrFhirServer] = useState(FHIR_SERVERS[0].url);
    const [ehrCustomServer, setEhrCustomServer] = useState('');
    const [ehrScope, setEhrScope] = useState('launch/patient openid fhirUser patient/*.read');
    const [showEhrSecret, setShowEhrSecret] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem(SMART_STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setEhrClientId(data.clientId || '');
                setEhrClientSecret(data.clientSecret || '');
                setEhrFhirServer(data.fhirServer || FHIR_SERVERS[0].url);
                setEhrCustomServer(data.customServer || '');
                setEhrScope(data.scope || 'launch/patient openid fhirUser patient/*.read');
            } catch { /* ignore */ }
        }
    }, []);

    const getEhrActiveServer = () => ehrFhirServer || ehrCustomServer;
    const isEhrCustomServer = !FHIR_SERVERS.some(s => s.url === ehrFhirServer && s.url !== '');

    const handleEhrLaunch = () => {
        const server = getEhrActiveServer();
        if (!ehrClientId || !server) return;
        sessionStorage.setItem(SMART_STORAGE_KEY, JSON.stringify({
            clientId: ehrClientId, clientSecret: ehrClientSecret,
            fhirServer: ehrFhirServer, customServer: ehrCustomServer, scope: ehrScope
        }));
        const params = {
            clientId: ehrClientId,
            scope: ehrScope,
            redirectUri: window.location.origin + window.location.pathname,
            iss: server,
        };
        if (ehrClientSecret) params.clientSecret = ehrClientSecret;
        FHIR.oauth2.authorize(params);
    };

    const handleEhrClear = () => {
        sessionStorage.removeItem(SMART_STORAGE_KEY);
        setEhrClientId(''); setEhrClientSecret('');
        setEhrFhirServer(FHIR_SERVERS[0].url); setEhrCustomServer('');
        setEhrScope('launch/patient openid fhirUser patient/*.read');
    };

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
                            <button
                                onClick={() => {
                                    setDemoTab('ehr');
                                    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="inline-flex items-center gap-3 bg-amber-400 text-medical-navy hover:bg-amber-300 px-6 py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg group"
                            >
                                <KeyRound className="h-5 w-5" />
                                OAuth2 連線測試
                            </button>
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

            {/* DEMO Section with Tabs */}
            <div id="demo-section" className="glass-card rounded-[2.5rem] p-10 border-slate-200/50 shadow-2xl relative overflow-hidden bg-white/40 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-2xl">
                        <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                    DEMO
                </h2>

                {/* Tab Buttons */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => setDemoTab('sandbox')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                            demoTab === 'sandbox'
                                ? 'bg-medical-primary text-white shadow-lg'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                        <Server className="h-4 w-4" />
                        Sandbox
                    </button>
                    <button
                        onClick={() => setDemoTab('ehr')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                            demoTab === 'ehr'
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                        <KeyRound className="h-4 w-4" />
                        EHR Launch
                    </button>
                </div>

                {/* Sandbox Tab */}
                {demoTab === 'sandbox' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-sky-50/80 rounded-2xl p-6 border border-sky-100">
                            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Server className="h-4 w-4 text-medical-primary" />
                                直連沙盒模式
                            </h3>
                            <p className="text-sm text-slate-600 mb-4">
                                無需 OAuth 授權，直接連接衛福部 THAS 開放沙盒。適合快速瀏覽測試資料與驗證 UI 介面。
                            </p>
                            <div className="bg-white rounded-xl p-4 border border-sky-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">FHIR Server</span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                        已連線
                                    </span>
                                </div>
                                <code className="block text-sm font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-lg break-all">
                                    https://thas.mohw.gov.tw/v/r4/fhir
                                </code>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span>FHIR R4</span>
                                    <span>TW Core IG</span>
                                    <span>Open Access</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                            <Shield className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-emerald-800">
                                <p className="font-semibold">使用方式</p>
                                <p>直接在上方「快速病人查詢」選擇測試案例即可。系統會自動連接 THAS 沙盒取得病患資料。</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* EHR Launch Tab */}
                {demoTab === 'ehr' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 安全提示 */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold">暫存模式</p>
                                <p>憑證僅存於瀏覽器 Session，關閉分頁或瀏覽器後自動清除，不會儲存於伺服器。</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Client ID */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                    Client ID <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={ehrClientId}
                                    onChange={(e) => setEhrClientId(e.target.value)}
                                    placeholder="e.g. cc344727-6f90-496c-94fd-c7829aa9a51d"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all"
                                />
                            </div>

                            {/* Client Secret */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                    Client Secret
                                    <span className="text-slate-400 font-normal ml-2">(Confidential Client)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showEhrSecret ? 'text' : 'password'}
                                        value={ehrClientSecret}
                                        onChange={(e) => setEhrClientSecret(e.target.value)}
                                        placeholder="Leave empty for Public Client"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all pr-20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEhrSecret(!showEhrSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                                    >
                                        {showEhrSecret ? 'HIDE' : 'SHOW'}
                                    </button>
                                </div>
                            </div>

                            {/* FHIR Server */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                    FHIR Server <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={isEhrCustomServer ? '' : ehrFhirServer}
                                    onChange={(e) => {
                                        setEhrFhirServer(e.target.value);
                                        if (e.target.value) setEhrCustomServer('');
                                    }}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all bg-white"
                                >
                                    {FHIR_SERVERS.map((s) => (
                                        <option key={s.label} value={s.url}>{s.label}{s.url ? ` — ${s.url}` : ''}</option>
                                    ))}
                                </select>
                                {(isEhrCustomServer || ehrFhirServer === '') && (
                                    <input
                                        type="text"
                                        value={ehrCustomServer}
                                        onChange={(e) => { setEhrCustomServer(e.target.value); setEhrFhirServer(''); }}
                                        placeholder="https://your-fhir-server/fhir"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all mt-2"
                                    />
                                )}
                            </div>

                            {/* Scopes */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                    Scopes
                                </label>
                                <input
                                    type="text"
                                    value={ehrScope}
                                    onChange={(e) => setEhrScope(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all"
                                />
                                <p className="text-xs text-slate-400 mt-1">Space-separated. Standalone Launch uses <code>launch/patient</code> instead of <code>launch</code>.</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleEhrLaunch}
                                    disabled={!ehrClientId || !getEhrActiveServer()}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg"
                                >
                                    <Play className="h-5 w-5" />
                                    Launch
                                </button>
                                <button
                                    onClick={handleEhrClear}
                                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* 說明 */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-medical-primary" />
                                使用說明
                            </h3>
                            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                                <li>填入評審或測試平台提供的 <strong>Client ID</strong> 和 <strong>Client Secret</strong></li>
                                <li>選擇目標 <strong>FHIR Server</strong>（或輸入自訂 URL）</li>
                                <li>點擊 <strong>Launch</strong> 啟動 Standalone Launch 授權流程</li>
                                <li>在授權頁面選擇病人並同意授權</li>
                                <li>授權成功後，CHARI 會以 OAuth Token 載入病患資料</li>
                            </ol>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-400">
                                    Redirect URI: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{window.location.origin + window.location.pathname}</code>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
