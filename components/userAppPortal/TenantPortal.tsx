
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';
import { TenantRequest, RequestMessage, TaskPriority, TaskStatus, Task, TenantProfile, Message, OffboardingRecord } from '../../types';
import { printSection } from '../../utils/exportHelper';
import AdBanners from './AdBanners';
import { useProfileFirstName } from '../../hooks/useProfileFirstName';
import { supabase } from '../../utils/supabaseClient';
import { followStkPaymentCompletion } from '../../utils/stkPaymentFollowup';
import { computeRentPaymentCycleUpdate } from '../../utils/tenantPaymentCycle';

// --- STK PUSH UI ---
const MpesaStkModal: React.FC<{ onClose: () => void; amount: number; tenant: TenantProfile; userId: string; leaseId?: string | null }> = ({ onClose, amount, tenant, userId, leaseId = null }) => {
    const { updateTenant } = useData();
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
                const ref = String(row.transaction_id ?? '');
                setTxCode(ref);
                setStep('success');
                setIsSubmitting(false);
                // Write payment to tenant's paymentHistory so the portal reflects it immediately.
                const payDate = new Date().toISOString().split('T')[0];
                const newPayment = { date: payDate, amount: String(amount), status: 'Paid' as const, method: 'M-Pesa STK', reference: ref };
                const cycle = computeRentPaymentCycleUpdate(tenant, amount, payDate);
                const updates: Partial<TenantProfile> = {
                    paymentHistory: [newPayment, ...(tenant.paymentHistory || [])],
                    nextDueDate: cycle.nextDueDateIso,
                };
                if (cycle.clearRentExtension && tenant.rentExtension) {
                    updates.rentGraceDays = tenant.rentExtension.originalGraceDays ?? 4;
                    updates.rentExtension = { ...tenant.rentExtension, enabled: false };
                }
                updateTenant(tenant.id, updates);
            }
            if (String(row.status ?? '') === 'failed' || String(row.status ?? '') === 'cancelled') {
                setErrorMsg(String(row.result_desc ?? 'Payment did not complete.'));
                setStep('input');
                setIsSubmitting(false);
            }
        });
    }, [userId, checkoutRequestId]);  // eslint-disable-line react-hooks/exhaustive-deps

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

// --- VACATE NOTICE MODAL ---
const VacationNoticeModal: React.FC<{ tenant: TenantProfile; onClose: () => void }> = ({ tenant, onClose }) => {
    const { addOffboardingRecord, updateTenant } = useData();
    const [moveOutDate, setMoveOutDate] = useState('');
    const [acceptForfeiture, setAcceptForfeiture] = useState(false);
    const [done, setDone] = useState(false);

    const todayMs = new Date(new Date().toDateString()).getTime();
    const daysNotice = moveOutDate ? Math.round((new Date(moveOutDate).getTime() - todayMs) / 86400000) : null;
    const isShortNotice = daysNotice !== null && daysNotice < 30;

    // Check whether the current month's rent has been paid.
    const currentMonthRentPaid = (() => {
        if (tenant.status !== 'Overdue') return true; // not flagged overdue = current
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return (tenant.paymentHistory || []).some(p => p.date?.startsWith(thisMonth) && p.status === 'Paid');
    })();

    const canSubmit = daysNotice !== null && daysNotice > 0 && currentMonthRentPaid && (!isShortNotice || acceptForfeiture);

    const handleSubmit = () => {
        if (!canSubmit || !moveOutDate) return;
        const noticeDate = new Date().toISOString().split('T')[0];
        const record: OffboardingRecord = {
            id: `ob-${Date.now()}`,
            tenantId: tenant.id,
            tenantName: tenant.name,
            unit: tenant.unit,
            propertyId: tenant.propertyId,
            noticeDate,
            moveOutDate,
            status: 'Notice Given',
            inspectionStatus: 'Pending',
            utilityClearance: false,
            depositRefunded: false,
            keysReturned: false,
            securityDepositForfeited: isShortNotice && acceptForfeiture,
        };
        addOffboardingRecord(record);
        updateTenant(tenant.id, { status: 'Notice', leaseEnd: moveOutDate });
        setDone(true);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Icon name="offboarding" className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Vacate Notice</h3>
                    </div>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>

                {done ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Icon name="check" className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-800">Notice Submitted</p>
                        <p className="text-sm text-gray-500">Your vacate notice has been recorded. The property team will be in touch to guide you through the exit process.</p>
                        <button onClick={onClose} className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-2">Done</button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="bg-gray-50 p-3 rounded-lg border text-sm">
                            <p className="font-bold text-gray-800">{tenant.name}</p>
                            <p className="text-gray-500">{tenant.unit} · {tenant.propertyName}</p>
                            {Number(tenant.depositPaid ?? 0) > 0 && (
                                <p className="text-xs mt-1 text-gray-500">Security Deposit Held: <span className="font-bold">KES {Number(tenant.depositPaid).toLocaleString()}</span></p>
                            )}
                        </div>
                        {!currentMonthRentPaid && (
                            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                                <p className="text-sm font-bold text-red-800">⛔ Outstanding Rent</p>
                                <p className="text-sm text-red-700 mt-1">Your current month's rent is unpaid. Please clear your outstanding balance before submitting a vacate notice.</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Intended Move-Out Date</label>
                            <input
                                type="date"
                                value={moveOutDate}
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                onChange={e => { setMoveOutDate(e.target.value); setAcceptForfeiture(false); }}
                                className="w-full p-3 border-2 rounded-xl focus:outline-none focus:border-primary"
                            />
                            {daysNotice !== null && daysNotice > 0 && (
                                <p className="text-xs text-gray-500 mt-1">{daysNotice} day{daysNotice !== 1 ? 's' : ''} from today.</p>
                            )}
                        </div>
                        {isShortNotice && (
                            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-bold text-amber-800">⚠ Notice Period Warning</p>
                                <ul className="text-sm text-amber-700 space-y-1.5 list-disc list-inside">
                                    <li>Vacate notice requires a minimum of <strong>30 days</strong>.</li>
                                    <li>Current month's rent must be fully paid before vacating.</li>
                                    <li>Vacating in less than 30 days means you <strong>forfeit your security deposit</strong>{Number(tenant.depositPaid ?? 0) > 0 ? ` of KES ${Number(tenant.depositPaid).toLocaleString()}` : ''}.</li>
                                </ul>
                                <label className="flex items-start gap-3 mt-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptForfeiture}
                                        onChange={e => setAcceptForfeiture(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 accent-amber-600 shrink-0"
                                    />
                                    <span className="text-sm text-amber-800 font-medium">I understand and agree to forfeit my security deposit to proceed with this move-out date.</span>
                                </label>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="flex-[2] py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Submit Notice
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TenantPortal: React.FC = () => {
    const { tenants, updateTenant, tasks, addTask, messages, addMessage, currentUser, isDataLoading, systemSettings, properties } = useData();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [generalTitle, setGeneralTitle] = useState('');
    const [generalDescription, setGeneralDescription] = useState('');
    const [messagesSubTab, setMessagesSubTab] = useState<'admin' | 'general'>('admin');
    const [isPayRentModalOpen, setIsPayRentModalOpen] = useState(false);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [selectedPortalKeys, setSelectedPortalKeys] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'maintenance' | 'messages' | 'browse'>('dashboard');
    const [browseSearch, setBrowseSearch] = useState('');
    const [newMessageContent, setNewMessageContent] = useState('');
    // Resolve the real TenantProfile (has paymentHistory, propertyId, unitId, etc.).
    // Match by id, email, or phone so a logged-in tenant sees their own data.
    const activeUser = (currentUser?.role === 'Tenant'
        ? tenants.find(t => t.id === currentUser.id || t.email === currentUser.email || t.phone === (currentUser as any).phone)
        : undefined) ?? tenants[0];
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
        const today = new Date().toISOString().split('T')[0];
        const activeStatuses = ['Active', 'Overdue', 'Notice'];
        const rentIsDue = activeStatuses.includes(activeUser.status ?? '') &&
            Number(activeUser.rentAmount ?? 0) > 0 &&
            (!activeUser.nextDueDate || activeUser.nextDueDate <= today);
        const rent = rentIsDue ? Number(activeUser.rentAmount ?? 0) : 0;
        const bills = activeUser.outstandingBills?.filter(b => b.status === 'Pending').reduce((s, b) => s + Number(b.amount ?? 0), 0) || 0;
        const fines = activeUser.outstandingFines?.filter(f => f.status === 'Pending').reduce((s, f) => s + Number(f.amount ?? 0), 0) || 0;
        return rent + bills + fines;
    }, [activeUser]);
    const portalLineItems = useMemo(() => {
        if (!activeUser) return [] as { key: string; label: string; amount: number }[];
        const items: { key: string; label: string; amount: number }[] = [];
        const today = new Date().toISOString().split('T')[0];
        const activeStatuses = ['Active', 'Overdue', 'Notice'];
        const rentIsDue = activeStatuses.includes(activeUser.status ?? '') &&
            Number(activeUser.rentAmount ?? 0) > 0 &&
            (!activeUser.nextDueDate || activeUser.nextDueDate <= today);
        if (rentIsDue && Number(activeUser.rentAmount ?? 0) > 0) {
            items.push({ key: 'rent', label: activeUser.status === 'Overdue' ? 'Rent (Overdue)' : 'Rent (Due)', amount: Number(activeUser.rentAmount ?? 0) });
        }
        for (const b of (activeUser.outstandingBills || []).filter(b => b.status === 'Pending')) {
            items.push({ key: `bill:${b.id}`, label: b.type + (b.description ? ` — ${b.description}` : ''), amount: b.amount });
        }
        for (const f of (activeUser.outstandingFines || []).filter(f => f.status === 'Pending')) {
            items.push({ key: `fine:${f.id}`, label: f.type, amount: f.amount });
        }
        return items;
    }, [activeUser]);
    const portalSelectedTotal = useMemo(() => {
        if (selectedPortalKeys.size === 0) return balance;
        return portalLineItems.filter(i => selectedPortalKeys.has(i.key)).reduce((s, i) => s + i.amount, 0);
    }, [selectedPortalKeys, portalLineItems, balance]);
    const togglePortalKey = (key: string) => setSelectedPortalKeys(prev => {
        const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s;
    });

    const handleSubmitMaintenanceRequest = () => {
        if (!title.trim() || !description.trim()) return alert('Please enter title and description.');
        const newReq: TenantRequest = {
            id: `req-${Date.now()}`,
            type: 'Maintenance',
            title,
            description,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            priority: 'Medium',
            messages: []
        };
        const newTask: Task = {
            id: `TASK-${Date.now()}`,
            title,
            description,
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
        updateTenant(activeUser.id, { requests: [...(activeUser.requests || []), newReq] });
        alert('Maintenance request submitted!');
        setTitle('');
        setDescription('');
    };

    const handleSubmitGeneralRequest = () => {
        if (!generalTitle.trim() || !generalDescription.trim()) return alert('Please enter a subject and details.');
        const newReq: TenantRequest = {
            id: `req-${Date.now()}`,
            type: 'General',
            title: generalTitle,
            description: generalDescription,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            priority: 'Medium',
            messages: []
        };
        updateTenant(activeUser.id, { requests: [...(activeUser.requests || []), newReq] });
        alert('General request submitted!');
        setGeneralTitle('');
        setGeneralDescription('');
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

    // Resolve this tenant's Paybill account reference (unit tag). Tenants read
    // this off their dashboard and type it at the M-Pesa Paybill account prompt
    // when paying manually (C2B). The confirmation callback matches it back.
    // Fallback: if propertyId/unitId are not set, match by unit number string.
    // NOTE: must stay above the early return to obey React's Rules of Hooks.
    const allVacantUnits = useMemo(() =>
        (properties || []).flatMap(p =>
            p.units
                .filter(u => u.status === 'Vacant')
                .map(u => ({
                    id: u.id,
                    unitNumber: u.unitNumber,
                    propertyName: p.name,
                    location: p.subLocation || p.nearestLandmark || p.location || p.branch || '',
                    type: (u as any).unitType || p.type || '',
                    rent: u.rent || p.defaultMonthlyRent || 0,
                    image: p.profilePictureUrl || '',
                    pinLocationUrl: p.pinLocationUrl || '',
                    phone: p.contactPhone || '',
                }))
        )
    , [properties]);

    const filteredBrowseUnits = useMemo(() => {
        const q = browseSearch.trim().toLowerCase();
        if (!q) return allVacantUnits;
        return allVacantUnits.filter(u =>
            (u.location || '').toLowerCase().includes(q) ||
            (u.type || '').toLowerCase().includes(q) ||
            u.propertyName.toLowerCase().includes(q) ||
            u.unitNumber.toLowerCase().includes(q)
        );
    }, [allVacantUnits, browseSearch]);

    const myUnit = useMemo(() => {
        if (!activeUser) return undefined;
        if (activeUser.propertyId && activeUser.unitId) {
            const p = (properties || []).find(pr => pr.id === activeUser.propertyId);
            const u = p?.units?.find(u => u.id === activeUser.unitId);
            if (u) return u;
        }
        const unitStr = (activeUser.unit || '').trim().toLowerCase();
        if (!unitStr) return undefined;
        for (const p of (properties || [])) {
            const u = p.units?.find(u => (u.unitNumber || '').trim().toLowerCase() === unitStr);
            if (u) return u;
        }
        return undefined;
    }, [activeUser, properties]);

    if (!activeUser) return <div className="p-8 text-center">Loading Tenant Profile...</div>;

    const displayName = profileLoading
        ? 'Loading...'
        : ((firstName ?? '').trim() ? (firstName as string).trim() : activeUser.name);

    const hasLease = !!activeUser.propertyName && Number(activeUser.rentAmount ?? 0) > 0;

    const myUnitTag = myUnit?.unitTag || activeUser?.unit || '';
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
                {(['dashboard', 'payments', 'maintenance', 'messages', 'browse'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm capitalize transition-colors whitespace-nowrap ${
                            activeTab === tab ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {tab === 'browse' ? 'Available Units' : tab}
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
                                {portalLineItems.length > 0 && (
                                    <div className="mt-4 space-y-2 border-t pt-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Select items to pay</p>
                                        {portalLineItems.map(item => (
                                            <label key={item.key} className="flex items-center justify-between gap-2 cursor-pointer group">
                                                <span className="flex items-center gap-2 flex-1 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                                                        checked={selectedPortalKeys.has(item.key)}
                                                        onChange={() => togglePortalKey(item.key)}
                                                    />
                                                    <span className="text-sm text-gray-700 truncate group-hover:text-primary transition-colors">{item.label}</span>
                                                </span>
                                                <span className="text-sm font-bold text-gray-800 shrink-0">KES {Number(item.amount).toLocaleString()}</span>
                                            </label>
                                        ))}
                                        {selectedPortalKeys.size > 0 && (
                                            <p className="text-xs font-bold text-primary pt-2 border-t">
                                                Paying: KES {portalSelectedTotal.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsPayRentModalOpen(true)}
                                disabled={!canPayNow}
                                className={`w-full mt-4 py-2 font-bold rounded-lg shadow-md transition-colors ${canPayNow ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                            >
                                {selectedPortalKeys.size > 0 ? `Pay KES ${portalSelectedTotal.toLocaleString()}` : 'Pay Now'}
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
                                <button
                                    onClick={() => setIsVacationModalOpen(true)}
                                    className="w-full mt-1 py-2.5 px-3 bg-orange-50 border-2 border-orange-300 text-orange-700 font-bold rounded-lg hover:bg-orange-100 transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    <Icon name="offboarding" className="w-4 h-4"/> Issue Vacate Notice
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
                                        <li>4. Amount: <span className="font-bold">KES {Number(portalSelectedTotal > 0 ? portalSelectedTotal : balance).toLocaleString()}</span></li>
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
                                {(activeUser.paymentHistory || []).length > 0
                                    ? (activeUser.paymentHistory || []).map((pay, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-3 py-3 text-gray-600">{pay.date}</td>
                                            <td className="px-3 py-3 text-xs font-mono text-gray-500">{pay.reference}</td>
                                            <td className="px-3 py-3 text-gray-600">{pay.method}</td>
                                            <td className="px-3 py-3 text-right font-bold text-gray-800">KES {(parseFloat(String(pay.amount || '0').replace(/,/g, '')) || 0).toLocaleString()}</td>
                                            <td className="px-3 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pay.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{(pay.status || 'Paid').toUpperCase()}</span></td>
                                        </tr>
                                    ))
                                    : (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-12 text-center text-gray-400 text-sm">No payment records found.</td>
                                        </tr>
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MAINTENANCE TAB */}
            {activeTab === 'maintenance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Report Maintenance Issue</h3>
                        <p className="text-xs text-gray-500 mb-4">For general inquiries, use the <button onClick={() => setActiveTab('messages')} className="text-primary underline font-medium">Messages</button> tab.</p>
                        <div className="space-y-4">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Subject (e.g. Leaking tap, broken lock)" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={3} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                            <button onClick={handleSubmitMaintenanceRequest} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors w-full">
                                Submit Maintenance Ticket
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
                <div className="space-y-4 animate-fade-in">
                    {/* Sub-tabs */}
                    <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-100 w-fit">
                        <button
                            onClick={() => setMessagesSubTab('admin')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                                messagesSubTab === 'admin' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            Messages
                        </button>
                        <button
                            onClick={() => setMessagesSubTab('general')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                                messagesSubTab === 'general' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            General Requests
                            {(activeUser.requests || []).filter(r => r.type === 'General').length > 0 && (
                                <span className="ml-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {(activeUser.requests || []).filter(r => r.type === 'General').length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Admin Messages */}
                    {messagesSubTab === 'admin' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[560px]">
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

                    {/* General Requests */}
                    {messagesSubTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Submit General Request</h3>
                                <p className="text-xs text-gray-500 mb-4">Inquiries, complaints, lease questions, or any non-maintenance matter.</p>
                                <div className="space-y-4">
                                    <input
                                        value={generalTitle}
                                        onChange={e => setGeneralTitle(e.target.value)}
                                        placeholder="Subject"
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                    <textarea
                                        value={generalDescription}
                                        onChange={e => setGeneralDescription(e.target.value)}
                                        placeholder="Describe your request..."
                                        rows={4}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                    <button onClick={handleSubmitGeneralRequest} className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors">
                                        Submit Request
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">My General Requests</h3>
                                <div className="space-y-3 max-h-[420px] overflow-y-auto">
                                    {(activeUser.requests || []).filter(r => r.type === 'General').length > 0
                                        ? (activeUser.requests || []).filter(r => r.type === 'General').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(req => (
                                            <div key={req.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-gray-800 text-sm">{req.title}</h4>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                        req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>{req.status}</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-1 line-clamp-2">{req.description}</p>
                                                <p className="text-[10px] text-gray-400">{req.date}</p>
                                            </div>
                                        ))
                                        : <p className="text-gray-400 text-center py-8 text-sm">No general requests yet.</p>
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isVacationModalOpen && (
                <VacationNoticeModal
                    tenant={activeUser}
                    onClose={() => setIsVacationModalOpen(false)}
                />
            )}

            {isPayRentModalOpen && (
                <MpesaStkModal
                    onClose={() => setIsPayRentModalOpen(false)}
                    amount={portalSelectedTotal > 0 ? portalSelectedTotal : (balance > 0 ? balance : activeUser.rentAmount)}
                    tenant={activeUser}
                    userId={String(currentUser?.id ?? activeUser.id)}
                    leaseId={null}
                />
            )}
            
            {/* BROWSE TAB */}
            {activeTab === 'browse' && (
                <div className="space-y-5 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Icon name="vacant-house" className="w-5 h-5 text-primary" />
                                    Available Units
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{allVacantUnits.length} unit{allVacantUnits.length !== 1 ? 's' : ''} currently available</p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Icon name="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={browseSearch}
                                    onChange={e => setBrowseSearch(e.target.value)}
                                    placeholder="Search by location or house type..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-primary focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        {filteredBrowseUnits.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredBrowseUnits.map(unit => (
                                    <div key={unit.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-36 bg-gray-100 relative">
                                            {unit.image
                                                ? <img src={unit.image} alt={unit.propertyName} className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center"><Icon name="branch" className="w-12 h-12 text-gray-300" /></div>
                                            }
                                            <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Available</span>
                                        </div>
                                        <div className="p-4">
                                            <p className="font-bold text-gray-800 text-sm truncate">{unit.unitNumber} — {unit.propertyName}</p>
                                            {unit.type && <p className="text-xs text-primary font-semibold mt-0.5">{unit.type}</p>}
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Icon name="map-pin" className="w-3 h-3" /> {unit.location || 'Location not set'}
                                            </p>
                                            <p className="text-sm font-extrabold text-gray-800 mt-2">KES {Number(unit.rent).toLocaleString()} <span className="font-normal text-gray-400 text-xs">/ mo</span></p>
                                            <div className="flex gap-2 mt-3">
                                                {unit.phone ? (
                                                    <a
                                                        href={`https://wa.me/${unit.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in ${unit.unitNumber} at ${unit.propertyName} (${unit.location}).`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 text-center py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                                                    >
                                                        Enquire
                                                    </a>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveTab('messages')}
                                                        className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                                    >
                                                        Enquire
                                                    </button>
                                                )}
                                                {unit.pinLocationUrl && (
                                                    <a
                                                        href={unit.pinLocationUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        Map
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Icon name="check" className="w-8 h-8 text-green-500" />
                                </div>
                                <p className="font-bold text-gray-700">
                                    {browseSearch ? 'No units match your search' : 'No units available right now'}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {browseSearch ? 'Try a different location or house type' : 'Check back soon!'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Advertising Banners */}
            <AdBanners />
        </div>
    );
};

export default TenantPortal;
