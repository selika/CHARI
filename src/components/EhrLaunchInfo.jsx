import React, { useState } from 'react';
import { Shield, ArrowLeft, ExternalLink, Play, Lock, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FHIR from 'fhirclient';

const FHIR_SERVERS = [
    { label: 'SMART Health IT (R4)', url: 'https://launch.smarthealthit.org/v/r4/fhir' },
    { label: 'THAS 衛福部', url: 'https://thas.mohw.gov.tw/v/r4/fhir' },
    { label: 'THAS Sandbox (appx)', url: 'https://emr-smart.appx.com.tw/v/r4/fhir' },
];

export default function EhrLaunchInfo() {
    const navigate = useNavigate();
    const [selectedServer, setSelectedServer] = useState(FHIR_SERVERS[0].url);
    const launchUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/launch.html';
    const redirectUri = window.location.origin + window.location.pathname;

    const hasCredentials = !!(import.meta.env.VITE_SMART_CLIENT_ID);

    const handleDirectLaunch = () => {
        if (!selectedServer || !hasCredentials) return;
        FHIR.oauth2.authorize({
            clientId: import.meta.env.VITE_SMART_CLIENT_ID,
            clientSecret: import.meta.env.VITE_SMART_CLIENT_SECRET || '',
            scope: 'launch openid fhirUser patient/*.read',
            redirectUri: redirectUri,
            iss: selectedServer,
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-medical-primary font-medium transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                返回首頁
            </button>

            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-4">
                    <Shield className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-black text-medical-navy">EHR Launch</h1>
                <p className="text-slate-500 mt-2">使用衛福部 SMART on FHIR 測試憑證，啟動 OAuth 授權流程</p>
            </div>

            {/* 直接啟動 */}
            <div className="glass-card p-8 space-y-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    <Play className="h-5 w-5 text-amber-500" />
                    啟動 EHR Launch
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            <Server className="h-3.5 w-3.5 inline mr-1.5" />
                            FHIR Server
                        </label>
                        <select
                            value={selectedServer}
                            onChange={(e) => setSelectedServer(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all bg-white"
                        >
                            {FHIR_SERVERS.map((s) => (
                                <option key={s.url} value={s.url}>{s.label} — {s.url}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-start gap-3">
                        <Lock className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-emerald-800">
                            <p className="font-semibold">OAuth 憑證已預載</p>
                            <p>Client ID 與 Client Secret 儲存於 GitHub Secrets，於建置時透過環境變數注入，不會出現在原始碼中。</p>
                            {hasCredentials ? (
                                <p className="mt-1 font-mono text-xs text-emerald-600">
                                    Client ID: {import.meta.env.VITE_SMART_CLIENT_ID?.slice(0, 8)}...（已載入）
                                </p>
                            ) : (
                                <p className="mt-1 text-red-600 font-semibold">未偵測到憑證，請確認 GitHub Secrets 已設定。</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleDirectLaunch}
                        disabled={!hasCredentials || !selectedServer}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play className="h-5 w-5" />
                        啟動 OAuth 授權
                    </button>
                </div>
            </div>

            {/* 技術說明 */}
            <div className="glass-card p-8 space-y-6">
                <h2 className="text-lg font-bold text-slate-800">技術說明：為什麼採用 EHR Launch？</h2>

                <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                    <p>
                        CHARI（Cross-Hospital Admission Record Integration）的核心使用情境是<strong>醫師在 EHR 系統中調閱跨院病歷</strong>。
                        在此情境下，病人已由 EHR 系統指定（醫師正在看診的病人），App 不需要額外提供病人選擇介面。
                    </p>

                    <div className="bg-sky-50 rounded-xl p-5 border border-sky-100">
                        <h3 className="font-bold text-sky-800 mb-3">EHR Launch vs Standalone Launch</h3>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-sky-200">
                                    <th className="text-left py-2 pr-4 text-sky-700">項目</th>
                                    <th className="text-left py-2 pr-4 text-sky-700">EHR Launch</th>
                                    <th className="text-left py-2 text-sky-700">Standalone Launch</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-600">
                                <tr className="border-b border-sky-100">
                                    <td className="py-2 pr-4 font-medium">啟動方式</td>
                                    <td className="py-2 pr-4">從 EHR 系統內啟動</td>
                                    <td className="py-2">使用者自行開啟 App</td>
                                </tr>
                                <tr className="border-b border-sky-100">
                                    <td className="py-2 pr-4 font-medium">病人選擇</td>
                                    <td className="py-2 pr-4">EHR 系統指定</td>
                                    <td className="py-2">使用者在授權頁選擇</td>
                                </tr>
                                <tr className="border-b border-sky-100">
                                    <td className="py-2 pr-4 font-medium">Scope</td>
                                    <td className="py-2 pr-4"><code>launch</code></td>
                                    <td className="py-2"><code>launch/patient</code></td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 font-medium">適用場景</td>
                                    <td className="py-2 pr-4">院內整合、看診流程</td>
                                    <td className="py-2">獨立應用、測試環境</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p>
                        CHARI 的設計目標是嵌入醫院的 HIS/EHR 系統中運作，因此 <strong>EHR Launch 是最符合實際部署情境的授權模式</strong>。
                        醫師在 EHR 中點擊「調閱跨院病歷」時，系統會帶入 <code>iss</code> 和 <code>launch</code> 參數啟動 CHARI，
                        自動完成 OAuth 授權並載入該病人的跨院資料。
                    </p>
                </div>
            </div>

            {/* 預設憑證與流程 */}
            <div className="glass-card p-8 space-y-6">
                <h2 className="text-lg font-bold text-slate-800">衛福部 SMART on FHIR 測試預設值</h2>

                <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-3">系統預設參數</h3>
                        <p className="text-xs text-slate-500 mb-3">以下為衛福部第二階段測試提供之預設值，已內建於系統中，無需手動輸入。</p>
                        <div className="space-y-3 text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="font-semibold text-slate-500 w-28 flex-shrink-0">Launch URL</span>
                                <code className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 break-all">
                                    {launchUrl}
                                </code>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="font-semibold text-slate-500 w-28 flex-shrink-0">Redirect URI</span>
                                <code className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 break-all">
                                    {redirectUri}
                                </code>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="font-semibold text-slate-500 w-28 flex-shrink-0">Scopes</span>
                                <code className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                                    launch openid fhirUser patient/*.read
                                </code>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="font-semibold text-slate-500 w-28 flex-shrink-0">Client ID</span>
                                <span className="text-slate-500 text-xs flex items-center gap-1.5">
                                    <Lock className="h-3 w-3" />
                                    儲存於 GitHub Secrets（建置時注入）
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className="font-semibold text-slate-500 w-28 flex-shrink-0">Client Secret</span>
                                <span className="text-slate-500 text-xs flex items-center gap-1.5">
                                    <Lock className="h-3 w-3" />
                                    儲存於 GitHub Secrets（建置時注入）
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                        <h3 className="font-bold text-amber-800 mb-2">OAuth 授權流程</h3>
                        <ol className="text-sm text-amber-900 space-y-2 list-decimal list-inside">
                            <li>點擊上方「啟動 OAuth 授權」，或由外部 Launcher 帶入 <code>iss</code> 參數至 <code>launch.html</code></li>
                            <li>CHARI 從 GitHub Secrets 載入 Client ID / Secret</li>
                            <li>呼叫 <code>FHIR.oauth2.authorize()</code> 啟動 OAuth 授權</li>
                            <li>使用者在授權頁面登入並同意授權</li>
                            <li>授權伺服器 redirect 回 CHARI，帶回 <code>code</code> + <code>state</code></li>
                            <li>CHARI 呼叫 <code>FHIR.oauth2.ready()</code> 完成 token 交換，載入病患資料</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* 其他測試方式 */}
            <div className="glass-card p-8 space-y-4">
                <h2 className="text-lg font-bold text-slate-800">其他測試方式</h2>
                <div className="text-sm text-slate-700 space-y-3">
                    <p>
                        除了 EHR Launch，CHARI 也支援 <strong>Standalone Launch</strong> 模式。
                        在 Standalone 模式下，使用者可自行輸入暫存的 OAuth 憑證（存於瀏覽器 Session，關閉即清除）並選擇病人。
                    </p>
                    <a
                        href="#/smart-test"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                        前往 OAuth Standalone Test
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </div>
    );
}
