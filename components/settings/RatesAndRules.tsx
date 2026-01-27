
import React from 'react';
import { MOCK_RATES_AND_RULES } from '../../constants';

const RatesAndRules: React.FC = () => {
    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/settings/profile'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Settings
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Rates & Rules</h1>
                <p className="text-lg text-gray-500 mt-1">Define your business logic.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <ul>
                    {MOCK_RATES_AND_RULES.map(r => <li key={r.id} className="p-2 border-b">{r.name} - {r.value} {r.unit}</li>)}
                </ul>
            </div>
        </div>
    );
};

export default RatesAndRules;
