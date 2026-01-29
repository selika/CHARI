import React, { useState } from 'react';
import { Search, CreditCard, User, AlertCircle } from 'lucide-react';
import { searchPatientById, searchPatientByNHI } from '../services/fhirQueries';
// import { useNavigate } from 'react-router-dom'; // Will enable when routing is set up

export default function PatientSearch({ client, onPatientSelect }) {
    const [searchType, setSearchType] = useState('id'); // 'id' or 'nhi'
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchValue.trim()) return;

        setLoading(true);
        setError(null);
        setPatient(null);

        try {
            let response;
            if (searchType === 'id') {
                response = await searchPatientById(client, searchValue);
            } else {
                response = await searchPatientByNHI(client, searchValue);
            }

            if (response && response.entry && response.entry.length > 0) {
                // Found patient
                setPatient(response.entry[0].resource);
            } else {
                setError('No patient found with these details.');
            }
        } catch (err) {
            console.error(err);
            setError('Error occurred while searching. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPatientName = (p) => {
        if (!p || !p.name || p.name.length === 0) return 'Unknown';
        // Use first name text or family + given
        const name = p.name[0];
        return name.text || `${name.family || ''} ${name.given ? name.given.join(' ') : ''}`;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-medical-primary" />
                    Patient Search
                </h2>

                {/* Search Type Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-slate-100">
                    <button
                        className={`pb-2 text-sm font-medium transition-colors ${searchType === 'id'
                                ? 'text-medical-primary border-b-2 border-medical-primary'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => { setSearchType('id'); setSearchValue(''); setError(null); setPatient(null); }}
                    >
                        National ID
                    </button>
                    <button
                        className={`pb-2 text-sm font-medium transition-colors ${searchType === 'nhi'
                                ? 'text-medical-primary border-b-2 border-medical-primary'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => { setSearchType('nhi'); setSearchValue(''); setError(null); setPatient(null); }}
                    >
                        NHI Card
                    </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {searchType === 'id' ? <User className="h-5 w-5 text-slate-400" /> : <CreditCard className="h-5 w-5 text-slate-400" />}
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:border-medical-primary focus:ring-1 focus:ring-medical-primary sm:text-sm transition-colors"
                            placeholder={searchType === 'id' ? 'e.g. A123456789' : 'e.g. 900000000001'}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !searchValue}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading || !searchValue ? 'bg-slate-400 cursor-not-allowed' : 'bg-medical-primary hover:bg-sky-600 shadow-sm'
                            } transition-colors`}
                    >
                        {loading ? 'Searching...' : 'Search Patient'}
                    </button>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Result Card */}
            {patient && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-md font-semibold text-slate-500 uppercase tracking-wider mb-4">Patient Found</h3>

                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 bg-medical-bg rounded-full flex items-center justify-center text-medical-primary font-bold text-xl">
                                {getPatientName(patient).charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900">{getPatientName(patient)}</h4>
                                <div className="text-sm text-slate-600 mt-1">
                                    <p>Gender: {patient.gender || 'Unknown'}</p>
                                    <p>Birth Date: {patient.birthDate || 'Unknown'}</p>
                                    <p>ID: {patient.identifier ? patient.identifier[0].value : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onPatientSelect(patient)}
                            className="px-4 py-2 bg-white border border-medical-primary text-medical-primary rounded-md text-sm font-medium hover:bg-medical-bg transition-colors"
                        >
                            View Records
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
