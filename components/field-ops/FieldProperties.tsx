
import React from 'react';
import Properties from '../landlords/Properties'; // Reusing existing powerful component
import { useData } from '../../context/DataContext';
import Icon from '../Icon';

const FieldProperties: React.FC = () => {
    const { properties } = useData();

    // Simple Insights
    const topPerforming = properties.slice(0, 3); // Mock sort
    const struggling = properties.slice(-2); // Mock sort

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">Properties (Field View)</h1>
                    <p className="text-lg text-gray-500 mt-1">Operational status and health of managed assets.</p>
                </div>
            </div>

            {/* Field Insights Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center"><Icon name="check" className="w-4 h-4 mr-2" /> Top Performing Assets</h4>
                    <div className="space-y-2">
                        {topPerforming.map(p => (
                            <div key={p.id} className="bg-white p-2 rounded shadow-sm flex justify-between text-sm">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-green-600 font-bold">98% Occ.</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <h4 className="font-bold text-red-800 mb-3 flex items-center"><Icon name="arrears" className="w-4 h-4 mr-2" /> Requires Attention</h4>
                     <div className="space-y-2">
                        {struggling.map(p => (
                            <div key={p.id} className="bg-white p-2 rounded shadow-sm flex justify-between text-sm">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-red-600 font-bold">High Vacancy</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Embedded existing component for full CRUD */}
            <Properties />
        </div>
    );
};

export default FieldProperties;
