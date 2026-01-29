import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';

// 衛福部 THAS Sandbox - 開放存取，不需要 OAuth
const MOHW_FHIR_SERVER = 'https://thas.mohw.gov.tw/v/r4/fhir';

export function useFhirClient() {
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 檢查 URL 是否有 OAuth 參數（從 SMART launch 來的）
        const params = new URLSearchParams(window.location.search);
        const hasOAuthParams = params.has('code') || params.has('state');

        if (hasOAuthParams) {
            // 有 OAuth 參數，嘗試完成 SMART launch
            FHIR.oauth2.ready()
                .then((client) => {
                    setClient(client);
                    setLoading(false);
                    console.log("FHIR Client (OAuth) Initialized", client);
                })
                .catch((err) => {
                    console.warn("OAuth failed, falling back to direct connection", err);
                    // OAuth 失敗，改用直接連接
                    createDirectClient();
                });
        } else {
            // 沒有 OAuth 參數，直接連接衛福部沙盒
            createDirectClient();
        }

        function createDirectClient() {
            // 創建直接連接的 FHIR client（不需要 OAuth）
            const directClient = FHIR.client({
                serverUrl: MOHW_FHIR_SERVER
            });
            setClient(directClient);
            setLoading(false);
            console.log("FHIR Client (Direct) Initialized", directClient);
        }
    }, []);

    return { client, error, loading };
}
