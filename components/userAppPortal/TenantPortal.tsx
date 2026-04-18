
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';
import { TenantRequest, RequestMessage, TaskPriority, TaskStatus, Task, TenantProfile, Message } from '../../types';
import { printSection } from '../../utils/exportHelper';
import AdBanners from './AdBanners';
import { useProfileFirstName } from '../../hooks/useProfileFirstName';
import { supabase } from '../../utils/supabaseClient';
import { followStkPaymentCompletion } from '../../utils/stkPaymentFollowup';

// --- STK PUSH UI ---
const MpesaStkModal: React.FC<{ onClose: () => void; amount: number; tenant: TenantProfile; userId: string; leaseId?: string | null }> = ({ onClose, amount, tenant, userId, leaseId = null }) => {
    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
    const [phone, setPhone] = useState(tenant.phone);
    const [txCode, setTxCode] = useState('');
    const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!userId || !checkoutRequestId) return;

        return followStkPaymentCompletion(supabase, userId, checkoutRequestId, (row) => {
            if (String(row.status ?? '') === 'completed') {
                setTxCode(String(row.transaction_id ?? ''));
                setStep('success');
                setIsSubmitting(false);
            }
            if (String(row.status ?? '') === 'failed' || String(row.status ?? '') === 'cancelled') {
                setErrorMsg(String(row.result_desc ?? 'Payment did not complete.'));
                setStep('input');
                setIsSubmitting(false);
            }
        });
    }, [userId, checkoutRequestId]);

    const handlePay = async () => {
        setErrorMsg(null);
        setIsSubmitting(true);
        setStep('processing');
        try {
            const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
                body: { phone, amount, leaseId, userId },
            });
            if (error) throw error;
            const id = String((data as any)?.checkoutRequestId ?? '').trim();
            if (!id) throw new Error('CheckoutRequestID missing from STK response');
            setCheckoutRequestId(id);
            // stay on processing: user should complete prompt, callback flips to success
        } catch (e: any) {
            let msg = e?.message ?? 'Failed to initiate STK push.';
            // When edge functions return a JSON { error }, Supabase wraps it in an error object.
            // Best-effort parse so we can show the exact configured message.
            try {
                const ctx = e?.context;
                if (ctx && typeof ctx.json === 'function') {
                    const body = await ctx.json();
                    if (body?.error) msg = String(body.error);
                } else if (ctx && typeof ctx.text === 'function') {
                    const txt = await ctx.text();
                    if (txt) {
                        const parsed = JSON.parse(txt);
                        if (parsed?.error) msg = String(parsed.error);
                    }
                }
            } catch {
                // ignore parse issues
            }
            setErrorMsg(msg);
            setStep('input');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[450px] overflow-hidden relative border border-[#e0f0e0]" onClick={e => e.stopPropagation()}>
                <div className="absolute top-5 right-5 font-extrabold text-2xl text-[#1F9F21] select-none">M<span className="text-[#177D1A]">p</span>esa</div>

                {step === 'input' && (
                    <div className="p-8">
                        <div className="flex items-center mb-6 pb-4 border-b-2 border-[#e8f5e9]">
                            <div className="w-[50px] h-[50px] bg-[#1F9F21] rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-[#1F9F21]/30">
                                <Icon name="wallet" className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-[22px] font-bold text-[#1a365d]">Pay Rent</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block mb-2 font-semibold text-[#2d3748] text-[15px]">Mobile Number</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3.5 border-2 border-[#c8e6c9] rounded-xl text-base focus:outline-none focus:border-[#1F9F21] focus:ring-4 focus:ring-[#1F9F21]/20 transition-all"/>
                            </div>
                            <div>
                                <label className="block mb-2 font-semibold text-[#2d3748] text-[15px]">Amount Due (KES)</label>
                                <div className="w-full p-3.5 border-2 border-[#c8e6c9] bg-gray-50 rounded-xl text-base font-bold text-[#1a365d]">{amount.toLocaleString()}</div>
                            </div>
                            {errorMsg && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                                    {errorMsg}
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button onClick={onClose} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                <button onClick={handlePay} disabled={isSubmitting} className="flex-[2] bg-gradient-to-r from-[#1F9F21] to-[#177D1A] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed">Pay Now</button>
                            </div>
                        </div>
                    </div>
                )}

                {(step === 'processing' || step === 'success') && (
                    <div className="p-8 text-center">
                        {step === 'processing' && (
                            <div className="py-8">
                                <div className="w-16 h-16 border-4 border-[#1F9F21]/20 border-t-[#1F9F21] rounded-full animate-spin mx-auto mb-6"></div>
                                <p className="text-xl font-semibold text-[#1a365d] mb-2">Processing...</p>
                                <p className="text-[#4a904a] font-medium text-base">Check your phone for STK prompt</p>
                            </div>
                        )}
                        {step === 'success' && (
                            <div>
                                <div className="bg-[#e8f5e9] border-l-4 border-[#1F9F21] p-5 rounded-r-xl mb-6 text-left border border-[#c8e6c9]">
                                    <p className="text-lg text-[#1b5e20] font-semibold">Payment of <span className="text-[#1F9F21] font-bold text-2xl ml-1">KES {amount.toLocaleString()}</span> confirmed!</p>
                                </div>
                                <div className="text-left mb-6">
                                    <p className="text-[#4caf50] font-medium mb-1">Time: {new Date().toLocaleTimeString()}</p>
                                    <div className="bg-[#f1fdf1] p-3 rounded-lg border border-dashed border-[#1F9F21] text-center font-mono font-bold text-[#177D1A]">
                                        {txCode || checkoutRequestId || '—'}
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-full py-3.5 bg-[#1F9F21] text-white font-bold rounded-xl shadow-lg">Done</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TenantPortal: React.FC = () => {
    const { tenants, updateTenant, tasks, addTask, messages, addMessage, currentUser, isDataLoading, systemSettings, properties } = useData();
    const [requestType, setRequestType] = useState<'Maintenance' | 'General'>('Maintenance');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPayRentModalOpen, setIsPayRentModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'maintenance' | 'messages'>('dashboard');
    const [newMessageContent, setNewMessageContent] = useState('');
    // Use logged-in user if available and is a tenant, fallback to first tenant only for dev/demo
    const activeUser = (currentUser?.role === 'Tenant' ? (currentUser as TenantProfile) : undefined) || tenants[0];
    const { firstName, loading: profileLoading } = useProfileFirstName({ nameFallback: activeUser?.name });

    const myTasks = useMemo(() => {
        if (!activeUser) return [];
        return tasks.filter(t => t.tenant.name === activeUser.name && t.tenant.unit === activeUser.unit);
    }, [tasks, activeUser]);

    const myMessages = useMemo(() => {
        if (!activeUser) return [];
        return messages.filter(m => {
            const isDirect = m.recipient.name === activeUser.name || m.recipient.contact === activeUser.phone;
            const isGroup = m.recipient.name === 'Group: All Tenants' || 
                           (activeUser.propertyName && m.recipient.name.includes(activeUser.propertyName));
            const isSentByMe = m.recipient.name === 'Property Management' && m.isIncoming; 
            return isDirect || isGroup;
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [messages, activeUser]);

    const balance = useMemo(() => {
        if (!activeUser) return 0;
        const rent = activeUser.status === 'Overdue' ? Number(activeUser.rentAmount ?? 0) : 0;
        const bills = activeUser.outstandingBills?.filter(b => b.status === 'Pending').reduce((s, b) => s + Number(b.amount ?? 0), 0) || 0;
        const fines = activeUser.outstandingFines?.filter(f => f.status === 'Pending').reduce((s, f) => s + Number(f.amount ?? 0), 0) || 0;
        return rent + bills + fines;
    }, [activeUser]);

    const handleSubmitRequest = () => {
        if (!title.trim() || !description.trim()) return alert('Please enter title and description.');
        
        // 1. Create Tenant Request
        const newReq: TenantRequest = {
            id: `req-${Date.now()}`,
            type: requestType,
            title,
            description,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            priority: 'Medium',
            messages: []
        };

        // 2. Create Task if Maintenance
        if (requestType === 'Maintenance') {
            const newTask: Task = {
                id: `TASK-${Date.now()}`,
                title: title,
                description: description,
                status: TaskStatus.Issued,
                priority: TaskPriority.Medium,
                dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                sla: 48,
                assignedTo: 'Unassigned',
                tenant: { name: activeUser.name, unit: activeUser.unit },
                property: activeUser.propertyName || 'Unknown',
                comments: [],
                history: [{ id: `h-${Date.now()}`, timestamp: new Date().toLocaleString(), event: 'Reported by Tenant' }],
                attachments: [],
                source: 'Internal',
                costs: { labor: 0, materials: 0, travel: 0 }
            };
            addTask(newTask);
            newReq.status = 'Converted to Task';
            newReq.taskId = newTask.id;
        }

        const updatedRequests = [...(activeUser.requests || []), newReq];
        updateTenant(activeUser.id, { requests: updatedRequests });
        
        alert("Request submitted successfully!");
        setTitle('');
        setDescription('');
        setActiveTab('maintenance');
    };

    const handleSendMessage = () => {
        if (!newMessageContent.trim()) return;
        const msg: Message = {
            id: `msg-${Date.now()}`,
            recipient: { name: 'Property Management', contact: 'Admin' }, // Sending to Admin
            content: `From ${activeUser.name} (${activeUser.unit}): ${newMessageContent}`,
            channel: 'App',
            status: 'Sent',
            timestamp: new Date().toLocaleString(),
            priority: 'Normal',
            isIncoming: true // Marked as incoming for the admin dashboard
        };
        addMessage(msg);
        setNewMessageContent('');
        alert('Message sent to Property Management.');
    };

    const handleDownloadStatement = () => {
        printSection('payment-history-table', `Statement_${activeUser.name}`);
    };

    if (!activeUser) return <div className="p-8 text-center">Loading Tenant Profile...</div>;

    const displayName = profileLoading
        ? 'Loading...'
        : ((firstName ?? '').trim() ? (firstName as string).trim() : activeUser.name);

    const hasLease = !!activeUser.propertyName && Number(activeUser.rentAmount ?? 0) > 0;

    // Resolve this tenant's Paybill account reference (unit tag). Tenants read
    // this off their dashboard and type it at the M-Pesa Paybill account prompt
    // when paying manually (C2B). The confirmation callback matches it back.
    const myUnit = properties
        .find(p => p.id === activeUser.propertyId)
        ?.units?.find(u => u.id === activeUser.unitId);
    const myUnitTag = myUnit?.unitTag || '';
    const agencyPaybill = systemSettings?.agencyPaybill || '';
    const canPayNow = Number(balance ?? 0) > 0;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <Icon name="branch" className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/50">
                            {displayName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
                            <p className="opacity-90">{activeUser.unit} • {activeUser.propertyName}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
                {['dashboard', 'payments', 'maintenance', 'messages'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm capitalize transition-colors whitespace-nowrap ${
                            activeTab === tab ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {isDataLoading ? (
                            <>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                                    <div className="h-3 w-28 bg-gray-200 rounded mb-3"></div>
                                    <div className="h-7 w-36 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                    <div className="h-9 w-full bg-gray-200 rounded mt-6"></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                                    <div className="h-3 w-28 bg-gray-200 rounded mb-4"></div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                                        <div className="h-4 w-full bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                                    <div className="h-3 w-28 bg-gray-200 rounded mb-4"></div>
                                    <div className="space-y-3">
                                        <div className="h-9 w-full bg-gray-200 rounded"></div>
                                        <div className="h-9 w-full bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Current Balance</p>
                                <p className={`text-3xl font-extrabold mt-1 ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    KES {Number(balance ?? 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {hasLease ? 'Due Date: 5th of Month' : 'No active lease found'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsPayRentModalOpen(true)}
                                disabled={!canPayNow}
                                className={`w-full mt-4 py-2 font-bold rounded-lg shadow-md transition-colors ${canPayNow ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                            >
                                Pay Now
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Lease Details</p>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status</span>
                                    {hasLease ? (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">{activeUser.status}</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">No active lease</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Lease Ends</span>
                                    <span className="font-medium">
                                        {hasLease ? (activeUser.leaseEnd ? new Date(activeUser.leaseEnd).toLocaleDateString() : 'Month-to-Month') : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Rent</span>
                                    <span className="font-medium">
                                        KES {Number(activeUser.rentAmount ?? 0).toLocaleString()}{hasLease ? '' : ' (no lease)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Quick Actions</p>
                            <div className="space-y-2">
                                <button onClick={() => setActiveTab('maintenance')} className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center">
                                    <Icon name="tools" className="w-4 h-4 mr-2 text-orange-500"/> Report Issue
                                </button>
                                <button onClick={() => setActiveTab('messages')} className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center">
                                    <Icon name="mail" className="w-4 h-4 mr-2 text-blue-500"/> Contact Admin
                                </button>
                            </div>
                        </div>
                            </>
                        )}
                    </div>

                    {/* Pay by M-Pesa Paybill — manual C2B route.
                        The Business No + Account No below are what the tenant types at the
                        Lipa na M-Pesa Pay Bill prompt. The C2B confirmation webhook uses
                        the account (unit tag) to match payment → unit → tenant. */}
                    {(agencyPaybill || myUnitTag) && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-xl shadow-sm">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-[220px]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[#1F9F21] font-extrabold text-lg">M<span className="text-[#177D1A]">p</span>esa</span>
                                        <span className="text-xs font-bold text-gray-500 uppercase">Pay via Paybill</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Prefer to pay from the M-Pesa menu instead? Use the details below. The STK push above is faster, but both work.
                                    </p>
                                    <ol className="text-sm text-gray-800 space-y-2">
                                        <li>1. M-PESA &rsaquo; Lipa na M-PESA &rsaquo; Pay Bill</li>
                                        <li className="flex items-center gap-2 flex-wrap">
                                            2. Business Number:
                                            <span className="font-mono font-bold bg-white px-3 py-1 rounded border border-green-300 text-green-700 tracking-wider">
                                                {agencyPaybill || '— not set —'}
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-2 flex-wrap">
                                            3. Account Number:
                                            <span className="font-mono font-bold bg-white px-3 py-1 rounded border border-green-300 text-green-700 tracking-wider uppercase">
                                                {myUnitTag || '— not set —'}
                                            </span>
                                        </li>
                                        <li>4. Amount: <span className="font-bold">KES {Number(balance ?? 0).toLocaleString()}</span></li>
                                        <li>5. Enter M-PESA PIN and confirm.</li>
                                    </ol>
                                </div>
                                <div className="bg-white rounded-lg border border-green-200 p-4 min-w-[180px]">
                                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">Your Account</p>
                                    <p className="font-mono text-xl font-extrabold text-green-700 tracking-wider uppercase mb-1">{myUnitTag || '—'}</p>
                                    <p className="text-xs text-gray-500">{activeUser.unit} &bull; {activeUser.propertyName}</p>
                                </div>
                            </div>
                            {!myUnitTag && (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-4">
                                    Your unit has no Paybill account reference set yet. Contact your property manager — using the wrong account will delay reconciliation.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === 'payments' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Payment History & Statements</h3>
                        <button onClick={handleDownloadStatement} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold flex items-center transition-colors">
                            <Icon name="download" className="w-4 h-4 mr-2" /> Download Statement
                        </button>
                    </div>
                    <div className="overflow-x-auto" id="payment-history-table">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-3 py-3">Date</th>
                                    <th className="px-3 py-3">Ref</th>
                                    <th className="px-3 py-3">Method</th>
                                    <th className="px-3 py-3 text-right">Amount</th>
                                    <th className="px-3 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(activeUser.paymentHistory || []).map((pay, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-3 py-3 text-gray-600">{pay.date}</td>
                                        <td className="px-3 py-3 text-xs font-mono text-gray-500">{pay.reference}</td>
                                        <td className="px-3 py-3 text-gray-600">{pay.method}</td>
                                        <td className="px-3 py-3 text-right font-bold text-gray-800">{pay.amount}</td>
                                        <td className="px-3 py-3 text-center"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">PAID</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MAINTENANCE TAB */}
            {activeTab === 'maintenance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Submit New Request</h3>
                        <div className="space-y-4">
                            <div className="flex gap-2 p-1 bg-gray-50 rounded-lg w-fit">
                                <button onClick={() => setRequestType('Maintenance')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${requestType === 'Maintenance' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Maintenance</button>
                                <button onClick={() => setRequestType('General')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${requestType === 'General' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>General</button>
                            </div>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Subject" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details..." rows={3} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                            <button onClick={handleSubmitRequest} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors w-full">
                                Submit Ticket
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Active Tasks</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {myTasks.length > 0 ? myTasks.map(task => (
                                <div key={task.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>{task.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                    <p className="text-[10px] text-gray-400">Created: {task.history[0]?.timestamp}</p>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-center py-8 text-sm">No active tasks.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[600px]">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Message Center</h3>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Property Management</span>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                            {myMessages.length > 0 ? myMessages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.recipient.name === 'Property Management' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.recipient.name === 'Property Management' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>
                                        <p>{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                        {msg.recipient.name.startsWith('Group') ? <span className="font-bold text-blue-500 mr-1">BROADCAST</span> : ''}
                                        {msg.timestamp}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center text-gray-400 py-10">No messages yet.</p>
                            )}
                        </div>
                        <div className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <input 
                                    value={newMessageContent}
                                    onChange={e => setNewMessageContent(e.target.value)}
                                    placeholder="Type a message to admin..." 
                                    className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button onClick={handleSendMessage} className="px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                                    <Icon name="communication" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase">Contact Info</h4>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Property Manager</p>
                                <p className="font-medium text-gray-800">TaskMe Office</p>
                                <p className="text-blue-600">0700 000 000</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Caretaker</p>
                                <p className="font-medium text-gray-800">Charles</p>
                                <p className="text-blue-600">0700 111 555</p>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Emergency</p>
                                <button className="w-full py-2 bg-red-50 text-red-600 font-bold rounded hover:bg-red-100 text-xs">
                                    Report Emergency
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isPayRentModalOpen && (
                <MpesaStkModal
                    onClose={() => setIsPayRentModalOpen(false)}
                    amount={balance > 0 ? balance : activeUser.rentAmount}
                    tenant={activeUser}
                    userId={String(currentUser?.id ?? activeUser.id)}
                    leaseId={null}
                />
            )}
            
            {/* Advertising Banners */}
            <AdBanners />
        </div>
    );
};

export default TenantPortal;
