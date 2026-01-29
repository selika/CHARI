import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, AlertTriangle, FileText } from 'lucide-react';

// Section Code Mapping
const SECTION_CODES = {
    '10154-3': 'Chief Complaint',
    '11348-0': 'Past Medical History',
    '11535-2': 'Discharge Diagnosis',
    '10160-0': 'Medications',
    '48765-2': 'Allergies',
    '47519-4': 'Procedures',
    '18776-5': 'Care Plan'
};

export default function CompositionDetail({ client }) {
    const { compositionId } = useParams();
    const navigate = useNavigate();

    const [composition, setComposition] = useState(null);
    const [sectionData, setSectionData] = useState({}); // { [sectionCode]: [resources] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selection State for Import
    const [selectedIds, setSelectedIds] = useState({});

    useEffect(() => {
        if (client && compositionId) {
            setLoading(true);

            // Fetch Composition
            client.request(`Composition/${compositionId}`)
                .then(async (comp) => {
                    setComposition(comp);

                    // Process Sections
                    const data = {};
                    if (comp.section) {
                        await Promise.all(comp.section.map(async (sec) => {
                            const code = sec.code?.coding?.[0]?.code;
                            if (code && sec.entry) {
                                // Fetch entries for this section
                                // Note: In a real efficient app, we'd use _include or a Bundle, 
                                // but direct fetching is clearer for this demo if entries are few.
                                // We limit to first 10 to avoid request storm.
                                const entries = await Promise.all(
                                    sec.entry.slice(0, 5).map(ref => {
                                        return client.request(ref.reference).catch(e => null); // Ignore errors for individual items
                                    })
                                );
                                data[code] = entries.filter(e => e !== null);
                            }
                        }));
                    }
                    setSectionData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err);
                    setLoading(false);
                });
        }
    }, [client, compositionId]);

    const toggleSelection = (id) => {
        setSelectedIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleImport = () => {
        const idsToImport = Object.keys(selectedIds).filter(id => selectedIds[id]);
        const items = [];
        Object.values(sectionData).flat().forEach(item => {
            if (idsToImport.includes(item.id)) items.push(item);
        });

        alert(`Importing ${idsToImport.length} items:\n` + items.map(i => `${i.resourceType}: ${i.id}`).join('\n'));
        // In real app: POST to local FHIR server or HIS API
    };

    const renderResource = (resource) => {
        if (!resource) return null;

        // Simple renderer based on type
        let content = "Unknown Data";
        let isHighRisk = false;

        switch (resource.resourceType) {
            case 'Condition':
                content = resource.code?.text || resource.code?.coding?.[0]?.display || "Unnamed Condition";
                break;
            case 'MedicationStatement':
            case 'MedicationRequest':
                content = (resource.medicationCodeableConcept?.text || resource.medicationCodeableConcept?.coding?.[0]?.display || "Unnamed Medication")
                    + (resource.dosage?.[0]?.text ? ` - ${resource.dosage[0].text}` : "");
                break;
            case 'AllergyIntolerance':
                content = resource.code?.text || resource.code?.coding?.[0]?.display || "Unknown Allergy";
                if (resource.criticality === 'high') {
                    content += " (High Risk)";
                    isHighRisk = true;
                }
                break;
            case 'Procedure':
                content = resource.code?.text || resource.code?.coding?.[0]?.display || "Unnamed Procedure";
                break;
            default:
                content = JSON.stringify(resource).substring(0, 50) + "...";
        }

        return (
            <div
                key={resource.id}
                className={`flex items-start gap-3 p-3 rounded-md border mb-2 cursor-pointer transition-colors ${selectedIds[resource.id]
                        ? 'bg-sky-50 border-medical-primary'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                onClick={() => toggleSelection(resource.id)}
            >
                <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedIds[resource.id] ? 'bg-medical-primary border-medical-primary text-white' : 'border-slate-300 bg-white'
                    }`}>
                    {selectedIds[resource.id] && <Check className="h-3 w-3" />}
                </div>

                <div className="flex-1">
                    <p className={`text-sm font-medium ${isHighRisk ? 'text-red-700' : 'text-slate-700'}`}>
                        {isHighRisk && <AlertTriangle className="inline h-4 w-4 mr-1 text-red-500" />}
                        {content}
                    </p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
                <p className="text-slate-500">Loading details...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-red-600">Error: {error.message}</div>;
    }

    if (!composition) return <div>No data</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{composition.title}</h1>
                        <p className="text-slate-500">{composition.date} • {composition.custodian?.display}</p>
                    </div>
                </div>

                <button
                    onClick={handleImport}
                    disabled={Object.values(selectedIds).filter(Boolean).length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors shadow-sm ${Object.values(selectedIds).filter(Boolean).length > 0
                            ? 'bg-medical-primary hover:bg-sky-600'
                            : 'bg-slate-300 cursor-not-allowed'
                        }`}
                >
                    <Download className="h-4 w-4" />
                    Import Selected ({Object.values(selectedIds).filter(Boolean).length})
                </button>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {composition.section?.map((section, idx) => {
                    const code = section.code?.coding?.[0]?.code;
                    const title = SECTION_CODES[code] || section.title || "Unknown Section";
                    const entries = sectionData[code];

                    const hasEntries = entries && entries.length > 0;
                    const hasText = section.text?.div;

                    return (
                        <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                                <h3 className="font-bold text-slate-700">{title}</h3>
                            </div>
                            <div className="p-6">
                                {hasEntries ? (
                                    <div>
                                        {entries.map(renderResource)}
                                    </div>
                                ) : (
                                    hasText ? (
                                        <div className="prose prose-sm text-slate-600" dangerouslySetInnerHTML={{ __html: section.text.div }} />
                                    ) : (
                                        <p className="text-slate-400 italic text-sm">No structured data available.</p>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
