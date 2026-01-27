
import React, { useState } from 'react';
import { MOCK_KYC_RECORDS } from '../../constants';
import { KycRecord } from '../../types';

const ComplianceAndKYC: React.FC = () => {
    const [records, setRecords] = useState<KycRecord[]>(MOCK_KYC_RECORDS);
    const [viewMode, setViewMode] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending');

    const handleVerify = (id: string) => {
        if (confirm("Are you sure you want to verify this investor?")) {
            setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'Verified' } : r));
        }
    };

    const filteredRecords = records.filter(r => r.status === viewMode);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Compliance & KYC</h1>
                <p className="text-lg text-gray-500 mt-1">Verify investor identities and manage regulatory records.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex space-x-4 mb-6 border-b">
                    {['Pending', 'Verified', 'Rejected'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode as any)}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${viewMode === mode ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {mode} ({records.filter(r => r.status === mode).length})
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRecords.map(rec => (
                                <tr key={rec.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{rec.investorName}</td>
                                    <td className="px-6 py-4 text-gray-600">{rec.idNumber}</td>
                                    <td className="px-6 py-4 text-gray-600">{rec.phone}</td>
                                    <td className="px-6 py-4 text-gray-600">{rec.joinDate}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button className="text-blue-600 hover:underline text-sm">View Docs</button>
                                        {rec.status === 'Pending' && (
                                            <button 
                                                onClick={() => handleVerify(rec.id)}
                                                className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-600"
                                            >
                                                Verify
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No records found in this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComplianceAndKYC;
