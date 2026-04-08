import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';

// 衛福部 THAS Sandbox - 開放存取，不需要 OAuth
const MOHW_FHIR_SERVER = 'https://thas.mohw.gov.tw/v/r4/fhir';

// SMART on FHIR credentials
// 優先使用 sessionStorage 中的自訂憑證（測試頁面輸入的），否則用 Vite 環境變數
function getSmartCredentials() {
    const saved = sessionStorage.getItem('CHARI_SMART_TEST');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.clientId) {
                return { clientId: data.clientId, clientSecret: data.clientSecret || '' };
            }
        } catch { /* ignore */ }
    }
    return {
        clientId: import.meta.env.VITE_SMART_CLIENT_ID || '',
        clientSecret: import.meta.env.VITE_SMART_CLIENT_SECRET || ''
    };
}

export function useFhirClient() {
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hasIss = params.has('iss');
        const hasCode = params.has('code') && params.has('state');

        if (hasIss) {
            // Step 1: SMART Launch — 從 launch.html 轉來的，帶有 iss 參數
            // 啟動 OAuth2 授權流程
            const creds = getSmartCredentials();
            console.log('SMART Launch detected, starting OAuth authorize...');
            const authorizeParams = {
                clientId: creds.clientId,
                scope: 'launch openid fhirUser patient/*.read',
                redirectUri: window.location.origin + window.location.pathname.replace(/\/?(index\.html)?$/, '') + '/'
            };
            if (creds.clientSecret) {
                authorizeParams.clientSecret = creds.clientSecret;
            }
            FHIR.oauth2.authorize(authorizeParams);
            // authorize() 會 redirect，不會繼續執行
            return;
        }

        if (hasCode) {
            // Step 2: OAuth callback — 從授權伺服器返回，帶有 code + state
            // 完成 token 交換
            FHIR.oauth2.ready()
                .then((client) => {
                    setClient(client);
                    setLoading(false);
                    console.log('FHIR Client (OAuth) Initialized', {
                        serverUrl: client.state.serverUrl,
                        patientId: client.patient?.id
                    });
                })
                .catch((err) => {
                    console.error('OAuth flow failed:', err);
                    setError(err);
                    setLoading(false);
                });
        } else {
            // 沒有 SMART 參數 — 直接連接衛福部沙盒
            const directClient = FHIR.client({
                serverUrl: MOHW_FHIR_SERVER
            });
            setClient(directClient);
            setLoading(false);
            console.log('FHIR Client (Direct) Initialized — no SMART launch detected');
        }
    }, []);

    return { client, error, loading };
}
