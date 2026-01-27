
import React, { useState, useMemo } from 'react';
import Icon from '../Icon';
import { RenovationProjectBill } from '../../types';

// Mock Projects (In real app, this would come from InvestmentPlans data context)
const MOCK_PROJECTS = [
    { id: 'fund-1', name: 'Urban Renewal Fund I', budget: 20000000 },
    { id: 'fund-2', name: 'Riverside Expansion', budget: 50000000 }
];

const RenovationAccounting: React.FC = () => {
    const [selectedProjectId, setSelectedProjectId] = useState(MOCK_PROJECTS[0].id);
    const [expenses, setExpenses] = useState<RenovationProjectBill[]>([
        { id: 'exp1', projectId: 'fund-1', vendor: 'Crown Paints', description: '200L Emulsion', amount: 150000, date: '2025-11-10', status: 'Paid', category: 'Material' },
        { id: 'exp2', projectId: 'fund-1', vendor: 'John Labor', description: 'Week 1 Wages', amount: 45000, date: '2025-11-12', status: 'Paid', category: 'Labor' },
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [newBill, setNewBill] = useState<Partial<RenovationProjectBill>>({
        vendor: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'Pending', category: 'Material'
    });

    const selectedProject = MOCK_PROJECTS.find(p => p.id === selectedProjectId);
    const projectExpenses = expenses.filter(e => e.projectId === selectedProjectId);
    const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBudget = (selectedProject?.budget || 0) - totalSpent;

    const handleAddBill = () => {
        if(!newBill.vendor || !newBill.amount) return alert("Fields required");
        const bill: RenovationProjectBill = {
            ...newBill,
            id: `bill-${Date.now()}`,
            projectId: selectedProjectId,
        } as RenovationProjectBill;
        
        setExpenses([bill, ...expenses]);
        setIsModalOpen(false);
        setNewBill({ vendor: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'Pending', category: 'Material' });
    };

    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/reits/investment-plans'} className="group flex items-center text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Investment Plans
            </button>

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Project Accounting</h1>
                    <p className="text-gray-500 mt-1">Track renovation costs against BOQ and Budget.</p>
                </div>
                <div className="flex gap-4">
                     <select 
                        value={selectedProjectId} 
                        onChange={e => setSelectedProjectId(e.target.value)} 
                        className="p-2 border rounded-lg bg-white shadow-sm font-medium"
                    >
                        {MOCK_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-sm flex items-center">
                        <Icon name="plus" className="w-4 h-4 mr-2"/> Add Expense
                    </button>
                </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-500 text-sm font-bold uppercase">Total Budget</p>
                    <h3 className="text-2xl font-extrabold text-gray-800 mt-2">KES {(selectedProject?.budget || 0).toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-500 text-sm font-bold uppercase">Total Spent</p>
                    <h3 className="text-2xl font-extrabold text-gray-800 mt-2">KES {totalSpent.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm font-bold uppercase">Remaining</p>
                    <h3 className="text-2xl font-extrabold text-green-600 mt-2">KES {remainingBudget.toLocaleString()}</h3>
                </div>
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Expense Ledger</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Vendor</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {projectExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{exp.date}</td>
                                <td className="px-6 py-4 font-bold">{exp.vendor}</td>
                                <td className="px-6 py-4 text-gray-600">{exp.description}</td>
                                <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{exp.category}</span></td>
                                <td className="px-6 py-4 text-right font-mono font-bold">KES {exp.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${exp.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {exp.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                         {projectExpenses.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No expenses recorded yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1300]" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Add Project Expense</h2>
                        <div className="space-y-3">
                            <input 
                                className="w-full p-2 border rounded" 
                                placeholder="Vendor Name" 
                                value={newBill.vendor} 
                                onChange={e => setNewBill({...newBill, vendor: e.target.value})}
                            />
                            <input 
                                className="w-full p-2 border rounded" 
                                placeholder="Description" 
                                value={newBill.description} 
                                onChange={e => setNewBill({...newBill, description: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded" 
                                    placeholder="Amount" 
                                    value={newBill.amount || ''} 
                                    onChange={e => setNewBill({...newBill, amount: parseFloat(e.target.value)})}
                                />
                                <select 
                                    className="w-full p-2 border rounded bg-white"
                                    value={newBill.category}
                                    onChange={e => setNewBill({...newBill, category: e.target.value as any})}
                                >
                                    <option>Material</option>
                                    <option>Labor</option>
                                    <option>Permits</option>
                                    <option>Other</option>
                                </select>
                            </div>
                             <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="date" 
                                    className="w-full p-2 border rounded" 
                                    value={newBill.date} 
                                    onChange={e => setNewBill({...newBill, date: e.target.value})}
                                />
                                <select 
                                    className="w-full p-2 border rounded bg-white"
                                    value={newBill.status}
                                    onChange={e => setNewBill({...newBill, status: e.target.value as any})}
                                >
                                    <option>Pending</option>
                                    <option>Paid</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                            <button onClick={handleAddBill} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RenovationAccounting;
