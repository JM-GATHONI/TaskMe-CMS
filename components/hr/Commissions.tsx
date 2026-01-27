
import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';

const HRCommissions: React.FC = () => {
    const { staff } = useData();

    const commissionsList = useMemo(() => {
        return staff.flatMap(s => 
            (s.commissions || []).map(c => ({
                staffName: s.name,
                date: c.date,
                amount: c.amount,
                source: c.source
            }))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [staff]);

    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/hr-payroll/staff-management'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Staff Management
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Commissions</h1>
                <p className="text-lg text-gray-500 mt-1">Track real-time earnings and performance bonuses.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                {commissionsList.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-50 uppercase text-gray-500 font-bold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Staff Member</th>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {commissionsList.map((comm, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">{comm.date}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{comm.staffName}</td>
                                        <td className="px-4 py-3 text-gray-600">{comm.source}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">KES {comm.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-8">No commissions recorded yet.</p>
                )}
            </div>
        </div>
    );
};

export default HRCommissions;
