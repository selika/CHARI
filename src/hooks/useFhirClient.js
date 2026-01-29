import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';

export function useFhirClient() {
    const [client, setClient] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        FHIR.oauth2.ready()
            .then((client) => {
                setClient(client);
                setLoading(false);
                console.log("FHIR Client Initialized", client);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
                console.error("FHIR Client Initialization Error", err);
            });
    }, []);

    return { client, error, loading };
}
