
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { TenantProfile } from '../../types';
import Icon from '../Icon';

// --- CARD STYLE CONSTANT ---
const MAJOR_CARD_CLASSES = "relative bg-white rounded-2xl border-t-[8px] border-t-primary border-b-[4px] border-b-secondary border-x-[3px] border-x-secondary shadow-[inset_0_0_60px_-15px_rgba(157,31,21,0.15)] hover:shadow-lg transition-all duration-300 overflow-hidden";

interface InboundCardProps {
    title: string;
    amount: number;
    count: number;
    icon: string;
    onClick: () => void;
}

const PaymentCard: React.FC<InboundCardProps> = ({ title, amount, count, icon, onClick }) => (
    <div 
        className={`${MAJOR_CARD_CLASSES} p-6 cursor-pointer group`}
        onClick={onClick}
    >
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide group-hover:text-gray-700">{title}</p>
                <h3 className="text-2xl font-extrabold text-gray-800 mt-2">KES {(amount/1000).toFixed(1)}k</h3>
                <p className="text-xs text-gray-400 mt-1">{count} Transactions</p>
            </div>
            <div className="p-3 rounded-full bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon name={icon} className="w-6 h-6" />
            </div>
        </div>
        <div className="relative z-10 mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                View Details <Icon name="chevron-down" className="w-3 h-3 ml-1 -rotate-90" />
            </span>
        </div>
    </div>
);

// --- MODALS (Payment Flow) ---

const PaymentMethodModal: React.FC<{ 
    onClose: () => void; 
    onSelectMethod: (method: 'M-Pesa' | 'Bank' | 'Cash', tenant: TenantProfile) => void;
    tenants: TenantProfile[];
}> = ({ onClose, onSelectMethod, tenants }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<TenantProfile | null>(null);

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.unit.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="fixed inset-0 bg-black/50 z-[1300] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Record New Payment</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>

                {!selectedTenant ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">First, select the tenant paying.</p>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Search Tenant Name or Unit..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-primary focus:border-primary"
                        />
                        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                            {filteredTenants.map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => setSelectedTenant(t)}
                                    className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{t.name}</p>
                                        <p className="text-xs text-gray-500">{t.propertyName} - {t.unit}</p>
                                    </div>
                                    <Icon name="chevron-down" className="w-4 h-4 -rotate-90 text-gray-400" />
                                </div>
                            ))}
                            {filteredTenants.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">No tenants found.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center mb-4">
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase">Paying For</p>
                                <p className="font-bold text-blue-900">{selectedTenant.name}</p>
                                <p className="text-xs text-blue-700">{selectedTenant.unit}</p>
                            </div>
                            <button onClick={() => setSelectedTenant(null)} className="text-xs text-blue-600 hover:underline">Change</button>
                        </div>
                        
                        <p className="text-sm font-bold text-gray-700 mb-2">Select Payment Method</p>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => onSelectMethod('M-Pesa', selectedTenant)} className="flex items-center p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <Icon name="communication" className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">M-Pesa STK Push</p>
                                    <p className="text-xs text-gray-500">Trigger payment to tenant's phone</p>
                                </div>
                            </button>
                            <button onClick={() => onSelectMethod('Bank', selectedTenant)} className="flex items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Icon name="stack" className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">Bank Transfer</p>
                                    <p className="text-xs text-gray-500">Record EFT/RTGS or Cheque</p>
                                </div>
                            </button>
                            <button onClick={() => onSelectMethod('Cash', selectedTenant)} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-4 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                                    <Icon name="wallet" className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">Cash</p>
                                    <p className="text-xs text-gray-500">Record cash receipt</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MpesaStkModal: React.FC<{ onClose: () => void; tenant: TenantProfile; onSuccess: (amount: number, code: string) => void }> = ({ onClose, tenant, onSuccess }) => {
    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
    const [phone, setPhone] = useState(tenant.phone);
    const [amount, setAmount] = useState(tenant.rentAmount.toString());
    const [txCode, setTxCode] = useState('');

    const handlePay = () => {
        if (!/^(2547|07)\d{8}$/.test(phone.replace(/\s/g, ''))) {
            alert('Please enter a valid Kenyan mobile number');
            return;
        }
        
        setStep('processing');
        setTimeout(() => {
            const randomCode = `QHS${Math.floor(Math.random()*10000).toString().padStart(4, '0')}XT`;
            setTxCode(randomCode);
            setStep('success');
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 z-[1400] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
             <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .mpesa-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 25px rgba(31, 159, 33, 0.15);
                    padding: 30px;
                    border: 1px solid #e0f0e0;
                    width: 100%;
                    max-width: 450px;
                    position: relative;
                }
                
                .mpesa-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e8f5e9;
                }
                
                .mpesa-icon-box {
                    width: 50px;
                    height: 50px;
                    background: #1F9F21;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 15px;
                    box-shadow: 0 4px 10px rgba(31, 159, 33, 0.3);
                }
                
                .mpesa-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #1a365d;
                }
                
                .mpesa-input-group {
                    margin-bottom: 25px;
                }
                
                .mpesa-label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #2d3748;
                    font-size: 15px;
                }
                
                .mpesa-input {
                    width: 100%;
                    padding: 14px;
                    border: 2px solid #c8e6c9;
                    border-radius: 12px;
                    font-size: 16px;
                    transition: all 0.3s;
                }
                
                .mpesa-input:focus {
                    outline: none;
                    border-color: #1F9F21;
                    box-shadow: 0 0 0 3px rgba(31, 159, 33, 0.2);
                }
                
                .mpesa-btn {
                    background: linear-gradient(to right, #1F9F21, #177D1A);
                    color: white;
                    border: none;
                    padding: 14px 20px;
                    width: 100%;
                    border-radius: 12px;
                    font-size: 17px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(31, 159, 33, 0.4);
                    position: relative;
                    overflow: hidden;
                }
                
                .mpesa-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(31, 159, 33, 0.6);
                }
                
                .mpesa-spinner {
                    width: 60px;
                    height: 60px;
                    border: 5px solid rgba(31, 159, 33, 0.2);
                    border-top: 5px solid #1F9F21;
                    border-radius: 50%;
                    margin: 0 auto 25px;
                    animation: spin 1s linear infinite;
                }
                
                .mpesa-success-msg {
                    background: #e8f5e9;
                    border-left: 4px solid #1F9F21;
                    padding: 20px;
                    border-radius: 0 12px 12px 0;
                    margin: 25px 0;
                    font-size: 18px;
                    color: #1b5e20;
                    font-weight: 600;
                    border: 1px solid #c8e6c9;
                }
                
                .mpesa-tx-code {
                    background: #f1fdf1;
                    padding: 15px;
                    border-radius: 10px;
                    font-family: monospace;
                    font-size: 18px;
                    letter-spacing: 1px;
                    margin-top: 20px;
                    color: #177D1A;
                    font-weight: 700;
                    border: 1px dashed #1F9F21;
                    text-align: center;
                }
                
                .mpesa-logo {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    font-weight: 800;
                    font-size: 24px;
                    color: #1F9F21;
                    text-shadow: 0 2px 4px rgba(31, 159, 33, 0.2);
                }
                
                .mpesa-logo span {
                    color: #177D1A;
                }
            `}</style>
            
            <div className="mpesa-card" onClick={e => e.stopPropagation()}>
                <div className="mpesa-logo">M<span>p</span>esa</div>

                {step === 'input' && (
                    <>
                        <div className="mpesa-header">
                            <div className="mpesa-icon-box">
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8C20.9998 6.89543 20.5611 5.8362 19.7804 5.05508C18.9997 4.27396 17.9408 3.83526 16.836 3.835H7.164C6.05925 3.83526 4.99999 4.27396 4.21922 5.05508C3.43845 5.8362 2.99975 6.89543 3 8V16C3.00026 17.1046 3.439 18.1641 4.22005 18.9453C5.00111 19.7266 6.06048 20.1654 7.165 20.166H16.836C17.9405 20.1654 19.0002 19.7266 19.7813 18.9453C20.5623 18.1641 21.001 17.1046 21 16Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 12H16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 15H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <h2 className="mpesa-title">Initiate STK Push</h2>
                        </div>

                        <p className="text-sm text-gray-500 mb-6 -mt-4">Requesting payment from {tenant.name}</p>

                        <div className="mpesa-input-group">
                            <label className="mpesa-label">Phone Number</label>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                                className="mpesa-input"
                            />
                        </div>
                        <div className="mpesa-input-group">
                            <label className="mpesa-label">Amount (KES)</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                className="mpesa-input"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={onClose} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={handlePay} className="flex-[2] mpesa-btn">Send Request</button>
                        </div>
                    </>
                )}

                {(step === 'processing' || step === 'success') && (
                    <div className="text-center pt-4">
                        <div className="mpesa-header" style={{ justifyContent: 'center', borderBottom: 'none' }}>
                            <div className="mpesa-icon-box">
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12L10.5 14.5L16 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <h2 className="mpesa-title">Payment Confirmation</h2>
                        </div>

                        {step === 'processing' && (
                            <div className="py-6">
                                <div className="mpesa-spinner"></div>
                                <p className="text-xl font-semibold text-[#1a365d] mb-2">Sending Request...</p>
                                <p className="text-[#4a904a] font-medium">Please ask the tenant to check their phone.</p>
                            </div>
                        )}

                        {step === 'success' && (
                            <div>
                                <div className="mpesa-success-msg">
                                    Payment Successful!
                                </div>
                                <div className="text-left">
                                    <p className="text-[#4caf50] font-medium mb-1">Time:</p>
                                    <p className="text-[#2d3748] font-medium mb-4">{new Date().toLocaleString()}</p>
                                    <div className="mpesa-tx-code">
                                        {txCode}
                                    </div>
                                </div>
                                <button onClick={() => onSuccess(parseFloat(amount), txCode)} className="mpesa-btn mt-8">Finish</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const ManualPaymentModal: React.FC<{ 
    onClose: () => void; 
    tenant: TenantProfile; 
    method: 'Bank' | 'Cash';
    onSuccess: (amount: number, ref: string) => void 
}> = ({ onClose, tenant, method, onSuccess }) => {
    const [amount, setAmount] = useState(tenant.rentAmount.toString());
    const [reference, setReference] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = () => {
        if (!amount || !reference) return alert("Amount and Reference are required.");
        onSuccess(parseFloat(amount), reference);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Record {method} Payment</h3>
                <p className="text-xs text-gray-500 mb-4">For Tenant: <strong>{tenant.name}</strong> ({tenant.unit})</p>
                
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Date Paid</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Amount (KES)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded font-bold"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Transaction Ref / Receipt No</label>
                        <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full p-2 border rounded" placeholder={method === 'Bank' ? 'e.g. FT2309...' : 'e.g. RCPT-001'}/>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-bold">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-primary-dark">Record</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const Inbound: React.FC = () => {
    const { tenants, updateTenant, addNotification } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Payment Modal State
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payStep, setPayStep] = useState<'method' | 'mpesa' | 'manual' | null>(null);
    const [selectedPayTenant, setSelectedPayTenant] = useState<TenantProfile | null>(null);
    const [selectedPayMethod, setSelectedPayMethod] = useState<'M-Pesa' | 'Bank' | 'Cash' | null>(null);

    // Ensure modal closes if no step is defined
    useEffect(() => {
        if (isPayModalOpen && !payStep) {
            setPayStep('method');
        }
    }, [isPayModalOpen, payStep]);

    // Data filtering logic
    const filteredPayments = useMemo(() => {
        return tenants.flatMap(t => t.paymentHistory.map(p => ({
            ...p,
            tenantName: t.name,
            unit: t.unit,
            property: t.propertyName
        }))).filter(p => {
             const matchesSearch = p.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   p.reference.toLowerCase().includes(searchQuery.toLowerCase());
             // Date filter logic (simplified)
             return matchesSearch;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [tenants, searchQuery]);

    const totalCollected = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);

    const handleOpenPaymentModal = () => {
        setPayStep('method');
        setSelectedPayTenant(null);
        setIsPayModalOpen(true);
    };

    const handleMethodSelect = (method: 'M-Pesa' | 'Bank' | 'Cash', tenant: TenantProfile) => {
        setSelectedPayMethod(method);
        setSelectedPayTenant(tenant);
        if (method === 'M-Pesa') setPayStep('mpesa');
        else setPayStep('manual');
    };

    const handlePaymentSuccess = (amount: number, ref: string) => {
        if (selectedPayTenant) {
            const newPayment = {
                date: new Date().toISOString().split('T')[0],
                amount: `KES ${amount.toLocaleString()}`,
                status: 'Paid' as const,
                method: selectedPayMethod || 'Manual',
                reference: ref
            };
            const updatedHistory = [newPayment, ...(selectedPayTenant.paymentHistory || [])];
            updateTenant(selectedPayTenant.id, { paymentHistory: updatedHistory });
            
            // Add Notification
            addNotification({
                id: `notif-${Date.now()}`,
                title: 'Payment Received',
                message: `Received KES ${amount.toLocaleString()} from ${selectedPayTenant.name}`,
                date: new Date().toLocaleString(),
                read: false,
                type: 'Success',
                recipientRole: 'All'
            });
        }
        setIsPayModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Inbound Payments</h1>
                    <p className="text-lg text-gray-500 mt-1">Track and record rent collections and other income.</p>
                </div>
                <button 
                    onClick={handleOpenPaymentModal}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-md hover:bg-primary-dark shadow-sm flex items-center"
                >
                    <Icon name="plus" className="w-5 h-5 mr-2" /> Record Payment
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500">
                    <p className="text-gray-500 text-sm font-bold uppercase">Total Collected (View)</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">KES {totalCollected.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
                     <p className="text-gray-500 text-sm font-bold uppercase">Transactions</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{filteredPayments.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-purple-500">
                     <p className="text-gray-500 text-sm font-bold uppercase">Today's Inflow</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">KES 0</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full max-w-md">
                        <input 
                            type="text" 
                            placeholder="Search payments..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="search" className="w-5 h-5" /></div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Tenant</th>
                                <th className="px-6 py-3">Reference</th>
                                <th className="px-6 py-3">Method</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayments.map((p, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-600">{p.date}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {p.tenantName}
                                        <div className="text-xs text-gray-500">{p.property} - {p.unit}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.reference}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.method}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600">{p.amount}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Paid</span>
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No payments found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal Logic */}
            {isPayModalOpen && (
                <>
                    {payStep === 'method' && (
                        <PaymentMethodModal 
                            tenants={tenants}
                            onClose={() => setIsPayModalOpen(false)}
                            onSelectMethod={handleMethodSelect}
                        />
                    )}
                    {payStep === 'mpesa' && selectedPayTenant && (
                        <MpesaStkModal 
                            tenant={selectedPayTenant}
                            onClose={() => setIsPayModalOpen(false)}
                            onSuccess={handlePaymentSuccess}
                        />
                    )}
                    {payStep === 'manual' && selectedPayTenant && selectedPayMethod && (
                        <ManualPaymentModal
                            tenant={selectedPayTenant}
                            method={selectedPayMethod as 'Bank' | 'Cash'}
                            onClose={() => setIsPayModalOpen(false)}
                            onSuccess={handlePaymentSuccess}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default Inbound;
