
import React from 'react';
import { MOCK_COMPANY_STRUCTURE } from '../../constants';

const CompanyStructure: React.FC = () => {
    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/settings/profile'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Settings
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Company Structure</h1>
                <p className="text-lg text-gray-500 mt-1">Define your organizational DNA.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(MOCK_COMPANY_STRUCTURE, null, 2)}</pre>
            </div>
        </div>
    );
};

export default CompanyStructure;
