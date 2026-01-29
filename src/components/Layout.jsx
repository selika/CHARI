import React from 'react';
import { Activity } from 'lucide-react';

export default function Layout({ children, client }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-medical-primary font-bold text-xl">
                        <Activity className="h-6 w-6" />
                        <span>CHARI</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        {client ? 'Connected to FHIR Server' : 'Not Connected'}
                    </div>
                </div>
            </header>
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                {children}
            </main>
            <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
                    SMART on FHIR App for Cross-Hospital Admission Record Integration
                </div>
            </footer>
        </div>
    );
}
