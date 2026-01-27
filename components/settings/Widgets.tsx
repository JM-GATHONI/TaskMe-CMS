
import React from 'react';
import { MOCK_WIDGETS } from '../../constants';

const Widgets: React.FC = () => {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <button onClick={() => window.location.hash = '#/settings/profile'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Settings
            </button>
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Widgets</h1>
                <p className="text-lg text-gray-500 mt-1">Customize your workspace.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <ul>
                    {MOCK_WIDGETS.map(w => <li key={w.id} className="p-2 border-b">{w.name} - {w.enabled ? 'Enabled' : 'Disabled'}</li>)}
                </ul>
            </div>
        </div>
    );
};

export default Widgets;
