import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';

// 衛福部 THAS Sandbox - 開放存取，不需要 OAuth
const MOHW_FHIR_SERVER = 'https://thas.mohw.gov.tw/v/r4/fhir';

// SMART on FHIR credentials (從 Vite 環境變數注入，不寫死在原始碼)
const SMART_CLIENT_ID = import.meta.env.VITE_SMART_CLIENT_ID || '';
const SMART_CLIENT_SECRET = import.meta.env.VITE_SMART_CLIENT_SECRET || '';

export function useFhirClient() {
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hasIss = params.has('iss');
        const hasCode = params.has('code') || params.has('state');
        const hasSmartState = sessionStorage.getItem('SMART_KEY');

        if (hasIss) {
            // Step 1: 從 launch.html 轉來的，帶有 iss 參數
            // 啟動 OAuth2 授權流程
            console.log('SMART Launch detected, starting OAuth authorize...');
            FHIR.oauth2.authorize({
                clientId: SMART_CLIENT_ID,
                clientSecret: SMART_CLIENT_SECRET,
                scope: 'launch openid fhirUser patient/*.read',
                redirectUri: window.location.origin + window.location.pathname
            });
            // authorize() 會 redirect，不會繼續執行
            return;
        }

        if (hasCode || hasSmartState) {
            // Step 2: OAuth callback — 從授權伺服器返回，帶有 code/state
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
            // 沒有 SMART 參數，直接連接衛福部沙盒
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
