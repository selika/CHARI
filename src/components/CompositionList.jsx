import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Calendar, Building, ChevronRight } from 'lucide-react';
import { searchCompositions } from '../services/fhirQueries';

export default function CompositionList({ client }) {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [compositions, setCompositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (client && patientId) {
            setLoading(true);
            searchCompositions(client, patientId)
                .then(response => {
                    setCompositions(response.entry || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err);
                    setLoading(false);
                });
        }
    }, [client, patientId]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
                <p className="text-slate-500">Loading discharge summaries...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    title="Back to Patient Search"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-medical-primary" />
                        Discharge Summaries
                    </h2>
                    <p className="text-sm text-slate-500">History for Patient ID: {patientId}</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
                    Error loading records: {error.message}
                </div>
            )}

            <div className="grid gap-4">
                {compositions.length === 0 && !error ? (
                    <div className="p-12 text-center bg-white rounded-lg border border-slate-200 shadow-sm">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No Records Found</h3>
                        <p className="text-slate-500 mt-1">This patient has no discharge summaries available in the current system.</p>
                    </div>
                ) : (
                    compositions.map((entry) => {
                        const res = entry.resource;
                        const date = res.date ? new Date(res.date).toLocaleDateString() : 'Unknown Date';
                        const organization = res.custodian?.display || 'Unknown Hospital';
                        const title = res.title || 'Discharge Summary';

                        return (
                            <div
                                key={res.id}
                                onClick={() => navigate(`/composition/${res.id}`)}
                                className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-medical-primary transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-sky-50 text-medical-primary text-xs font-bold uppercase tracking-wide rounded">
                                                Discharge Summary
                                            </span>
                                            <span className="text-sm text-slate-400 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {date}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-medical-primary transition-colors">
                                            {title}
                                        </h3>
                                        <div className="flex items-center text-slate-600 text-sm gap-2">
                                            <Building className="h-4 w-4" />
                                            {organization}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-medical-primary transition-colors" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
