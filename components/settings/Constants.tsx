
import React from 'react';
import { MOCK_SYSTEM_CONSTANTS } from '../../constants';

const Constants: React.FC = () => {
    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/settings/profile'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Settings
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Constants</h1>
                <p className="text-lg text-gray-500 mt-1">System lists and dropdowns.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <ul>
                    {MOCK_SYSTEM_CONSTANTS.map(c => <li key={c.id} className="p-2 border-b">{c.category} - {c.value}</li>)}
                </ul>
            </div>
        </div>
    );
};

export default Constants;
