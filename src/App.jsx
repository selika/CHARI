import React from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useFhirClient } from './hooks/useFhirClient';
import Layout from './components/Layout';
import PatientSearch from './components/PatientSearch';
import CompositionList from './components/CompositionList';
import CompositionDetail from './components/CompositionDetail';

// Wrapper to handle navigation logic for Search
function SearchRoute({ client }) {
    const navigate = useNavigate();
    return (
        <PatientSearch
            client={client}
            onPatientSelect={(patient) => navigate(`/patient/${patient.id}`)}
        />
    );
}

function App() {
    const { client, error, loading } = useFhirClient();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Initializing FHIR Client...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full border-l-4 border-red-500">
                    <h2 className="text-lg font-bold text-red-600 mb-2">Launch Error</h2>
                    <p className="text-slate-700">{error.message}</p>
                    <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-800 font-mono break-all">
                        Detailed: {JSON.stringify(error)}
                    </div>
                    <p className="text-sm text-slate-500 mt-4">Make sure you launched this app via a SMART Sandbox.</p>
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            <Layout client={client}>
                <Routes>
                    <Route path="/" element={<SearchRoute client={client} />} />
                    <Route path="/patient/:patientId" element={<CompositionList client={client} />} />
                    <Route path="/composition/:compositionId" element={<CompositionDetail client={client} />} />
                </Routes>
            </Layout>
        </HashRouter>
    );
}

export default App;
