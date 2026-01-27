
import React, { useState } from 'react';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';
import { ExternalTransaction, TenantProfile } from '../../types';

// Modal to match transaction to a tenant (External Matching)
const MatchTransactionModal: React.FC<{ 
    transaction: ExternalTransaction; 
    onClose: () => void; 
    onMatch: (tenantId: string) => void 
}> = ({ transaction, onClose, onMatch }) => {
    const { tenants } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTenantId, setSelectedTenantId] = useState('');

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-[1300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Match Transaction</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-500">Reference:</span>
                        <span className="font-mono font-semibold">{transaction.transactionCode || transaction.reference}</span>
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-bold text-green-600">KES {transaction.amount.toLocaleString()}</span>
                        <span className="text-gray-500">Date:</span>
                        <span>{new Date(transaction.date).toLocaleString()}</span>
                        <span className="text-gray-500">Sender:</span>
                        <span>{transaction.name || 'Unknown'}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Tenant</label>
                    <input 
                        type="text"
                        placeholder="Type name or unit..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2 border rounded-md mb-2"
                    />
                    <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                        {filteredTenants.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setSelectedTenantId(t.id)}
                                className={`p-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center ${selectedTenantId === t.id ? 'bg-blue-100' : ''}`}
                            >
                                <div>
                                    <p className="font-medium text-sm">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.propertyName} - {t.unit}</p>
                                </div>
                                {selectedTenantId === t.id && <Icon name="check" className="w-4 h-4 text-blue-600" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 font-medium">Cancel</button>
                    <button 
                        onClick={() => selectedTenantId && onMatch(selectedTenantId)}
                        disabled={!selectedTenantId}
                        className="px-4 py-2 bg-primary text-white rounded-md font-medium disabled:opacity-50"
                    >
                        Confirm Match
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal for Internal Payment Correction (Moving from A to B)
const PaymentCorrectionModal: React.FC<{
    payment: { reference: string, amount: string, date: string };
    fromTenant: TenantProfile;
    onClose: () => void;
    onConfirmMove: (toTenantId: string) => void;
}> = ({ payment, fromTenant, onClose, onConfirmMove }) => {
    const { tenants } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [targetTenantId, setTargetTenantId] = useState('');

    // Filter tenants excluding the source tenant
    const targetTenants = tenants.filter(t => 
        t.id !== fromTenant.id &&
        (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         t.unit.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-[1300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center mb-4 text-red-600 bg-red-50 p-3 rounded-lg">
                    <Icon name="info" className="w-5 h-5 mr-2" />
                    <h3 className="text-sm font-bold uppercase">Confirm Payment Reassignment</h3>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Moving Payment From:</p>
                    <div className="flex justify-between mb-3">
                        <span className="font-bold text-gray-800">{fromTenant.name} ({fromTenant.unit})</span>
                    </div>
                    <hr className="border-gray-200 mb-3"/>
                    <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <span>Reference:</span><span className="font-mono font-semibold text-gray-800">{payment.reference}</span>
                        <span>Amount:</span><span className="font-bold text-green-600">{payment.amount}</span>
                        <span>Date:</span><span>{payment.date}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Move To (Select Tenant)</label>
                    <input 
                        type="text"
                        placeholder="Search target tenant..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full p-2 border rounded-md mb-2"
                    />
                    <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                        {targetTenants.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setTargetTenantId(t.id)}
                                className={`p-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center ${targetTenantId === t.id ? 'bg-blue-100' : ''}`}
                            >
                                <div>
                                    <p className="font-medium text-sm">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.propertyName} - {t.unit}</p>
                                </div>
                                {targetTenantId === t.id && <Icon name="check" className="w-4 h-4 text-blue-600" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 font-medium">Cancel</button>
                    <button 
                        onClick={() => targetTenantId && onConfirmMove(targetTenantId)}
                        disabled={!targetTenantId}
                        className="px-4 py-2 bg-red-600 text-white rounded-md font-medium disabled:opacity-50 hover:bg-red-700"
                    >
                        Confirm Reassignment
                    </button>
                </div>
            </div>
        </div>
    );
};

const Reconciliation: React.FC = () => {
    const { externalTransactions, updateExternalTransaction, updateTenant, tenants, moveTenantPayment } = useData();
    const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external');
    
    const [selectedTx, setSelectedTx] = useState<ExternalTransaction | null>(null);
    
    // State for internal correction
    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [correctionData, setCorrectionData] = useState<{ payment: any, fromTenant: TenantProfile } | null>(null);

    const unmatchedTransactions = externalTransactions.filter(t => !t.matched);

    const handleMatch = (tenantId: string) => {
        if (!selectedTx) return;
        
        // 1. Update External Tx
        updateExternalTransaction(selectedTx.id, { matched: true, matchedTenantId: tenantId });
        
        // 2. Add payment to Tenant History
        const tenant = tenants.find(t => t.id === tenantId);
        if (tenant) {
            const newPayment = {
                date: selectedTx.date,
                amount: `KES ${selectedTx.amount.toLocaleString()}`,
                status: 'Paid' as const,
                method: selectedTx.type,
                reference: selectedTx.transactionCode || selectedTx.reference
            };
            updateTenant(tenantId, { paymentHistory: [newPayment, ...tenant.paymentHistory] });
        }

        setSelectedTx(null);
        alert("Transaction matched and recorded to tenant ledger.");
    };

    const handleOpenCorrection = (tenant: TenantProfile, payment: any) => {
        setCorrectionData({ payment, fromTenant: tenant });
        setCorrectionModalOpen(true);
    };

    const handleConfirmCorrection = (toTenantId: string) => {
        if (correctionData) {
            const { payment, fromTenant } = correctionData;
            moveTenantPayment(fromTenant.id, toTenantId, payment.reference);
            setCorrectionModalOpen(false);
            setCorrectionData(null);
            alert("Payment successfully moved.");
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Reconciliation</h1>
                <p className="text-lg text-gray-500 mt-1">Match external bank/M-Pesa statements and correct tenant ledger entries.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex border-b mb-6">
                    <button 
                        onClick={() => setActiveTab('external')}
                        className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'external' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        External Unmatched ({unmatchedTransactions.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('internal')}
                        className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'internal' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Internal Correction
                    </button>
                </div>

                {activeTab === 'external' && (
                    <div>
                        <p className="text-sm text-gray-500 mb-4">Incoming funds not yet assigned to a tenant ledger.</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Ref / Code</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {unmatchedTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-600">{tx.date}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{tx.transactionCode || tx.reference}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-800 font-medium">{tx.name || 'Unknown Sender'}</p>
                                                <p className="text-xs text-gray-500">{tx.account} • {tx.type}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600">KES {tx.amount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded hover:bg-blue-100"
                                                >
                                                    Match
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {unmatchedTransactions.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">All external transactions are matched.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'internal' && (
                    <div>
                         <p className="text-sm text-gray-500 mb-4">Recently recorded payments (Tenant Ledgers). Click 'Move' to reassign to another tenant.</p>
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Tenant</th>
                                        <th className="px-4 py-3">Property</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tenants.flatMap(t => t.paymentHistory.map(p => ({ ...p, tenant: t }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map((item, idx) => (
                                        <tr key={`${item.tenant.id}-${idx}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-600">{item.date}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{item.tenant.name}</td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">{item.tenant.unit}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600">{item.amount}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => handleOpenCorrection(item.tenant, item)}
                                                    className="text-xs text-red-600 font-bold hover:underline"
                                                >
                                                    Move
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {selectedTx && <MatchTransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} onMatch={handleMatch} />}
            
            {correctionModalOpen && correctionData && (
                <PaymentCorrectionModal 
                    payment={{ 
                        reference: correctionData.payment.reference, 
                        amount: correctionData.payment.amount, 
                        date: correctionData.payment.date 
                    }}
                    fromTenant={correctionData.fromTenant}
                    onClose={() => setCorrectionModalOpen(false)}
                    onConfirmMove={handleConfirmCorrection}
                />
            )}
        </div>
    );
};

export default Reconciliation;
