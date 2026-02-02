import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, HelpCircle, X, Info } from 'lucide-react';

export default function Layout({ children, client }) {
    const [showHelp, setShowHelp] = useState(false);
    const location = useLocation();

    // 根據路由判斷當前頁面類型
    const getPageContext = () => {
        const path = location.pathname;
        if (path.includes('/composition/')) {
            return 'detail';
        } else if (path.includes('/patient/')) {
            // 檢查是否為住院中轉院案例 (pt-testa-03)
            if (path.includes('pt-testa-03')) {
                return 'timeline-transfer';
            }
            return 'timeline-discharge';
        }
        return 'home';
    };

    const pageContext = getPageContext();

    // 頁面說明內容
    const helpContent = {
        home: {
            title: '首頁說明',
            content: (
                <div className="space-y-4">
                    <p>CHARI（跨院病歷整合系統）是一個 SMART on FHIR 應用程式，協助醫療人員快速查閱病人的外院病歷資料。</p>
                    <p>請選擇測試案例並點擊「查詢病人」開始使用。</p>
                </div>
            )
        },
        'timeline-discharge': {
            title: '病歷時間軸說明 - 出院後轉院情境',
            content: (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-bold text-blue-800 mb-2">為什麼採用 Encounter 時間軸排版？</h4>
                        <p className="text-blue-700 text-sm">
                            以「就診紀錄 (Encounter)」為主軸，按時間順序呈現病人的完整就醫歷程。
                            這樣的設計讓醫師能快速掌握病人在不同時間點的就醫狀況與用藥變化。
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <h4 className="font-bold text-emerald-800 mb-2">門診記錄的呈現方式</h4>
                        <p className="text-emerald-700 text-sm">
                            門診記錄並非本次轉院的重點，但門診開立的用藥對接續照護至關重要。
                            因此門診記錄僅顯示用藥資訊，避免資訊過載影響閱讀效率。
                            若將用藥記錄獨立成專頁，反而不易與就診時間對照，降低臨床實用性。
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-bold text-amber-800 mb-2">臨床設計理念</h4>
                        <p className="text-amber-700 text-sm">
                            本系統以臨床實務需求為導向，協助醫師快速瀏覽外院病歷並選擇需要導入的資料。
                            時間軸式排版讓醫師能直觀理解病人的就醫脈絡，做出更準確的臨床判斷。
                        </p>
                    </div>
                </div>
            )
        },
        'timeline-transfer': {
            title: '病歷時間軸說明 - 住院中轉院情境',
            content: (
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-bold text-orange-800 mb-2">住院中轉院的特殊性</h4>
                        <p className="text-orange-700 text-sm">
                            病人目前仍在住院中，轉院病摘記錄的是「當下」的病況。
                            此情境下，<strong>現行住院狀況</strong>是接續照護的首要重點，
                            包含目前診斷、進行中的治療、住院用藥等資訊。
                        </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-bold text-red-800 mb-2">特別標示提醒</h4>
                        <p className="text-red-700 text-sm">
                            系統會以橘色標籤特別標示「住院中轉院」的病摘，提醒醫師這是緊急或特殊的轉院情況。
                            住院用藥會標示為「住院用藥」，與一般出院帶回藥做區隔。
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-bold text-amber-800 mb-2">臨床設計理念</h4>
                        <p className="text-amber-700 text-sm">
                            本系統以臨床實務需求為導向，針對住院中轉院情境，強調即時病況與治療資訊的呈現，
                            協助接收醫院醫師快速掌握病人狀態，確保照護的連續性與安全性。
                        </p>
                    </div>
                </div>
            )
        },
        detail: {
            title: '病摘導入說明',
            content: (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-bold text-blue-800 mb-2">結構化資料分類</h4>
                        <p className="text-blue-700 text-sm">
                            病摘內容依 FHIR 資源類型分類呈現：過敏註記、診斷、手術處置、檢驗數據、影像報告、用藥記錄等。
                            醫師可勾選需要導入本院病歷系統的項目。
                        </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-bold text-red-800 mb-2">過敏註記預設導入</h4>
                        <p className="text-red-700 text-sm">
                            基於病人安全考量，過敏註記 (AllergyIntolerance) 預設為勾選狀態。
                            高風險過敏會以紅色警示標記，確保不會遺漏重要的過敏資訊。
                        </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-bold text-amber-800 mb-2">臨床設計理念</h4>
                        <p className="text-amber-700 text-sm">
                            本頁面設計以臨床工作流程為考量，讓醫師能快速瀏覽病摘內容，
                            選擇性導入所需資料至本院系統，兼顧效率與資料完整性。
                        </p>
                    </div>
                </div>
            )
        }
    };

    const currentHelp = helpContent[pageContext] || helpContent.home;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass-card sticky top-0 z-50 rounded-none border-x-0 border-t-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => window.location.hash = '#/'}
                    >
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-premium group-hover:scale-110 transition-transform duration-300 overflow-hidden border border-slate-100 flex items-center justify-center">
                            <img
                                src={`${import.meta.env.BASE_URL}CHARI_App_Icon.png`}
                                alt="CHARI Logo"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-medical-navy font-black text-2xl tracking-tighter leading-none">CHARI</span>
                            <span className="text-[10px] text-medical-primary font-bold tracking-[0.2em] uppercase mt-0.5 opacity-70">Medical Grid</span>
                        </div>
                    </div>
                    {pageContext !== 'home' && (
                        <button
                            onClick={() => setShowHelp(true)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-medical-primary px-4 py-2.5 rounded-xl hover:bg-sky-50 transition-all duration-200"
                        >
                            <HelpCircle className="h-4 w-4" />
                            系統導覽
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </main>

            <footer className="bg-slate-900 py-12 mt-auto border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-white rounded-xl overflow-hidden shadow-lg border border-slate-700/50">
                                <img
                                    src={`${import.meta.env.BASE_URL}CHARI_App_Icon.png`}
                                    alt="CHARI Logo"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <span className="text-white font-black text-xl tracking-tight">CHARI</span>
                        </div>
                        <div className="text-slate-500 text-sm text-center md:text-right max-w-md">
                            <p className="mb-1 font-medium text-slate-400">跨院病歷整合系統 - SMART on FHIR</p>
                            <p>Enhancing healthcare interoperability with TW Core standard formats.</p>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-slate-800 text-center text-slate-600 text-xs">
                        &copy; {new Date().getFullYear()} CHARI Project. Strictly for medical research and verification.
                    </div>
                </div>
            </footer>

            {/* 頁面說明 Modal */}
            {showHelp && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-medical-navy text-white px-8 py-6 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-medical-primary p-2 rounded-lg">
                                    <Info className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-xl">{currentHelp.title}</span>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="hover:bg-white/10 p-2 rounded-xl transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 text-slate-700 leading-relaxed text-lg">
                            {currentHelp.content}
                        </div>
                        <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="px-8 py-3 bg-medical-navy text-white hover:bg-slate-800 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg"
                            >
                                我理解了
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
