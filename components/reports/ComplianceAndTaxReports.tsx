
import React from 'react';
import { MOCK_TAX_RECORDS } from '../../constants';
import Icon from '../Icon';

const KpiCard: React.FC<{ title: string; value: string; color: string; icon: string }> = ({ title, value, color, icon }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4`} style={{ borderLeftColor: color }}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                <Icon name={icon} className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
    </div>
);

const ComplianceAndTaxReports: React.FC = () => {
    
    const totalDue = MOCK_TAX_RECORDS.filter(t => t.status === 'Due').reduce((acc, t) => acc + t.amount, 0);
    const totalPaid = MOCK_TAX_RECORDS.filter(t => t.status === 'Paid').reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Compliance & Tax Reports</h1>
                <p className="text-lg text-gray-500 mt-1">Regulatory tracking and tax obligation summaries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Tax Due" value={`KES ${totalDue.toLocaleString()}`} color="#ef4444" icon="arrears" />
                <KpiCard title="Tax Remitted (YTD)" value={`KES ${totalPaid.toLocaleString()}`} color="#10b981" icon="check" />
                <KpiCard title="Next Filing Date" value="20th Nov" color="#3b82f6" icon="time" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Tax Obligations Ledger</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount Due</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {MOCK_TAX_RECORDS.map(tax => (
                                <tr key={tax.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-700">{tax.type}</td>
                                    <td className="px-6 py-4 text-gray-600">{tax.description}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">KES {tax.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center text-gray-500 font-mono">{tax.date}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded-full ${tax.status === 'Due' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{tax.status}</span>
                                    </td>
                                </tr>
                            ))}
                            {MOCK_TAX_RECORDS.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No tax records found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComplianceAndTaxReports;
