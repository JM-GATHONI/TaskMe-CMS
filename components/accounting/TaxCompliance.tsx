
import React, { useState, useMemo } from 'react';
import { MOCK_TAX_RECORDS } from '../../constants';
import { TaxRecord } from '../../types';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';

const TaxLiabilityCard: React.FC<{ title: string; amount: number; dueDate: string; isOverdue?: boolean }> = ({ title, amount, dueDate, isOverdue }) => (
    <div className={`p-5 rounded-xl border-l-4 shadow-sm bg-white ${isOverdue ? 'border-red-500' : 'border-blue-500'}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-extrabold text-gray-800 mt-2">KES {amount.toLocaleString()}</h3>
            </div>
            {isOverdue && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">OVERDUE</span>}
        </div>
        <p className="text-xs text-gray-400 mt-3 font-medium flex items-center">
            <Icon name="time" className="w-3 h-3 mr-1" /> Due: {dueDate}
        </p>
    </div>
);

const TaxCompliance: React.FC = () => {
    const { tenants } = useData();
    const [records, setRecords] = useState<TaxRecord[]>(MOCK_TAX_RECORDS);

    // --- Live Estimations ---
    const estGrossRevenue = tenants.reduce((acc, t) => acc + (t.status !== 'Overdue' ? t.rentAmount : 0), 0);
    const estMRI = estGrossRevenue * 0.075; // 7.5% MRI Tax in Kenya (Example)
    const estVAT = estGrossRevenue * 0.16; // 16% VAT if applicable

    const handleMarkAsPaid = (recordId: string) => {
        setRecords(prev => prev.map(rec => rec.id === recordId ? { ...rec, status: 'Paid'} : rec));
        alert(`Record ${recordId} marked as paid.`);
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Tax & Compliance</h1>
                    <p className="text-lg text-gray-500 mt-1">Automated liability estimation and remittance tracking.</p>
                </div>
                <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-primary-dark transition-colors flex items-center">
                    <Icon name="download" className="w-4 h-4 mr-2"/> Tax Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TaxLiabilityCard title="Est. MRI (Current Month)" amount={estMRI} dueDate="20th Next Month" />
                <TaxLiabilityCard title="Pending VAT Liability" amount={estVAT} dueDate="20th Next Month" />
                <TaxLiabilityCard title="WHT Arrears" amount={12000} dueDate="Overdue" isOverdue />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tax Calendar Widget */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Compliance Calendar</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex flex-col items-center justify-center border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-400 uppercase">Nov</span>
                                <span className="text-lg font-bold text-blue-700">20</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">VAT & MRI Returns Due</p>
                                <p className="text-xs text-gray-500">KRA iTax Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-200">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Dec</span>
                                <span className="text-lg font-bold text-gray-700">09</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">PAYE Remittance Due</p>
                                <p className="text-xs text-gray-500">Staff Payroll Taxes</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-200">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Dec</span>
                                <span className="text-lg font-bold text-gray-700">15</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">Housing Levy Due</p>
                                <p className="text-xs text-gray-500">1.5% Gross Salary Match</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tax Ledger */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tax Obligations Ledger</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Tax</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Description</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase text-xs">Amount</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase text-xs">Due</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase text-xs">Status</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase text-xs">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map(tax => (
                                    <tr key={tax.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-700">{tax.type}</td>
                                        <td className="px-4 py-3 text-gray-600">{tax.description}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">KES {tax.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">{tax.date}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                tax.status === 'Due' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {tax.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {tax.status === 'Due' && (
                                                <button onClick={() => handleMarkAsPaid(tax.id)} className="text-blue-600 hover:text-blue-800 text-xs font-bold underline">
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxCompliance;
