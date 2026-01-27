
import React from 'react';
import { MOCK_ROLES } from '../../constants';

const RolesAndPermissions: React.FC = () => {
    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/settings/profile'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Settings
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Roles & Permissions</h1>
                <p className="text-lg text-gray-500 mt-1">The governance engine for the entire platform.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <ul>
                    {MOCK_ROLES.map(r => <li key={r.id} className="p-2 border-b">{r.name} - {r.description}</li>)}
                </ul>
            </div>
        </div>
    );
};

export default RolesAndPermissions;
