import React, { useState, useEffect } from 'react';
import { KeyRound, Play, Trash2, Shield, AlertTriangle } from 'lucide-react';
import FHIR from 'fhirclient';

// sessionStorage key
const STORAGE_KEY = 'CHARI_SMART_TEST';

// 預設 FHIR Server 選項
const FHIR_SERVERS = [
    { label: 'SMART Health IT (R4)', url: 'https://launch.smarthealthit.org/v/r4/fhir' },
    { label: 'THAS 衛福部', url: 'https://thas.mohw.gov.tw/v/r4/fhir' },
    { label: 'THAS Sandbox', url: 'https://emr-smart.appx.com.tw/v/r4/fhir' },
    { label: 'SMART Health IT (R3)', url: 'https://r3.smarthealthit.org' },
    { label: '自訂', url: '' },
];

export default function SmartLaunchTest() {
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [fhirServer, setFhirServer] = useState(FHIR_SERVERS[0].url);
    const [customServer, setCustomServer] = useState('');
    const [scope, setScope] = useState('launch/patient openid fhirUser patient/*.read');
    const [showSecret, setShowSecret] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // 載入暫存的憑證
    useEffect(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setClientId(data.clientId || '');
                setClientSecret(data.clientSecret || '');
                setFhirServer(data.fhirServer || FHIR_SERVERS[0].url);
                setCustomServer(data.customServer || '');
                setScope(data.scope || 'launch/patient openid fhirUser patient/*.read');
                setHasSaved(true);
            } catch { /* ignore */ }
        }
    }, []);

    const getActiveServer = () => {
        return fhirServer || customServer;
    };

    const handleLaunch = () => {
        const server = getActiveServer();
        if (!clientId || !server) {
            alert('Please fill in Client ID and FHIR Server URL');
            return;
        }

        // 暫存到 sessionStorage
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            clientId, clientSecret, fhirServer, customServer, scope
        }));

        // 啟動 Standalone Launch（使用者選擇病人）
        const authorizeParams = {
            clientId: clientId,
            scope: scope,
            redirectUri: window.location.origin + window.location.pathname,
            iss: server,
        };

        if (clientSecret) {
            authorizeParams.clientSecret = clientSecret;
        }

        FHIR.oauth2.authorize(authorizeParams);
    };

    const handleClear = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setClientId('');
        setClientSecret('');
        setFhirServer(FHIR_SERVERS[0].url);
        setCustomServer('');
        setScope('launch/patient openid fhirUser patient/*.read');
        setHasSaved(false);
    };

    const isCustomServer = !FHIR_SERVERS.some(s => s.url === fhirServer && s.url !== '');

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-4">
                    <KeyRound className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-medical-navy">SMART on FHIR 連線測試</h1>
                <p className="text-slate-500 mt-2">輸入 OAuth2 憑證，測試 Standalone Launch 授權流程</p>
            </div>

            {/* 安全提示 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                    <p className="font-semibold">暫存模式</p>
                    <p>憑證僅存於瀏覽器 Session，關閉分頁或瀏覽器後自動清除，不會儲存於伺服器。</p>
                </div>
            </div>

            <div className="glass-card p-6 space-y-5">
                {/* Client ID */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Client ID <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
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
                            type={showSecret ? 'text' : 'password'}
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            placeholder="Leave empty for Public Client"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all pr-20"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                        >
                            {showSecret ? 'HIDE' : 'SHOW'}
                        </button>
                    </div>
                </div>

                {/* FHIR Server */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        FHIR Server <span className="text-red-400">*</span>
                    </label>
                    <select
                        value={isCustomServer ? '' : fhirServer}
                        onChange={(e) => {
                            setFhirServer(e.target.value);
                            if (e.target.value) setCustomServer('');
                        }}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all bg-white"
                    >
                        {FHIR_SERVERS.map((s) => (
                            <option key={s.label} value={s.url}>{s.label}{s.url ? ` — ${s.url}` : ''}</option>
                        ))}
                    </select>
                    {(isCustomServer || fhirServer === '') && (
                        <input
                            type="text"
                            value={customServer}
                            onChange={(e) => { setCustomServer(e.target.value); setFhirServer(''); }}
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
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-medical-primary focus:border-medical-primary outline-none transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1">Space-separated. Standalone Launch uses <code>launch/patient</code> instead of <code>launch</code>.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleLaunch}
                        disabled={!clientId || !getActiveServer()}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-medical-primary text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg"
                    >
                        <Play className="h-5 w-5" />
                        Launch
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear
                    </button>
                </div>
            </div>

            {/* 說明 */}
            <div className="mt-6 glass-card p-6">
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
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        Redirect URI: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{window.location.origin + window.location.pathname}</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
