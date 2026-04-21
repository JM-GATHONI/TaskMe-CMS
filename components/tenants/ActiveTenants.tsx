
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { TenantProfile, Task, BillItem, FineItem, TenantRequest, RequestMessage, TaskPriority, TaskStatus, RecurringBillSettings, Notice, Message, Notification, OffboardingRecord, Bill } from '../../types';
import Icon from '../Icon';
import { supabase } from '../../utils/supabaseClient';
import { canonicalizePhone } from '../../utils/phone';
import { followStkPaymentCompletion } from '../../utils/stkPaymentFollowup';
import { getMonthlyRentStatus } from '../../utils/rentSchedule';
import { computeRentPaymentCycleUpdate } from '../../utils/tenantPaymentCycle';
import { printSection } from '../../utils/exportHelper';
import { ManageOffboardingModal } from './Offboarding';

// --- STYLES ---
const styles = `
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
  }
  .pdf-preview {
    font-family: 'Times New Roman', serif;
    line-height: 1.6;
    color: #000;
  }
`;

const GRID_CARD_CLASSES = "relative bg-white rounded-2xl border-t-[8px] border-t-primary border-b-[4px] border-b-secondary border-x-[3px] border-x-secondary shadow-[inset_0_0_60px_-15px_rgba(162,53,74,0.15)] hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group p-4 flex items-center justify-between min-h-[110px]";

function isProbablyAuthUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id).trim());
}

function resolveTenantPaymentUserId(t: TenantProfile | undefined): string | null {
    if (!t) return null;
    if (t.authUserId && isProbablyAuthUuid(t.authUserId)) return t.authUserId;
    if (isProbablyAuthUuid(t.id)) return t.id;
    return null;
}

function tenantFullyAllocated(t: TenantProfile): boolean {
    return (
        !!t.propertyId &&
        !!t.unitId &&
        !!String(t.unit ?? '').trim() &&
        !!String(t.propertyName ?? '').trim()
    );
}

function isInactiveApplicantTenant(t: TenantProfile): boolean {
    return (
        t.status === 'Pending' ||
        t.status === 'PendingAllocation' ||
        t.status === 'PendingPayment' ||
        !tenantFullyAllocated(t)
    );
}

// Chip filter options. "All" shows every non-vacated/blacklisted tenant;
// the new PendingAllocation / PendingPayment chips surface tenants that
// previously only showed under the "Inactive" toggle, so a new registration
// is visible from the default Active Tenants view the moment it's saved.
const STATUS_FILTERS: Array<{ key: string; label: string }> = [
    { key: 'All', label: 'All' },
    { key: 'Active', label: 'Active' },
    { key: 'PendingAllocation', label: 'Pending Allocation' },
    { key: 'PendingPayment', label: 'Pending Payment' },
    { key: 'Overdue', label: 'Overdue' },
    { key: 'Notice', label: 'Notice' },
    { key: 'Vacated', label: 'Vacated' },
];

// --- HELPER: Get Arrears Text ---
const getArrearsText = (tenant: TenantProfile) => {
    if (tenant.status !== 'Overdue') return null;

    // Check outstanding bills for Rent types
    const rentBills = tenant.outstandingBills?.filter(b => 
        (b.type === 'Rent Arrears' || b.type === 'Rent' || (b.description && b.description.toLowerCase().includes('rent'))) &&
        b.status === 'Pending'
    );

    if (rentBills && rentBills.length > 0) {
        // Extract unique months from bill dates
        const months = [...new Set(rentBills.map(b => new Date(b.date).toLocaleString('default', { month: 'long' })))];
        
        // Sort months chronologically if needed, but Set order is usually insertion order which implies chronological if bills added in order
        if (months.length > 0) {
            return `Rent Due (${months.join(', ')})`;
        }
    }

    return 'Rent Due (Arrears)';
};

// --- Error Boundary to protect Tenant Detail view ---
class TenantDetailErrorBoundary extends React.Component<{ tenant: TenantProfile; onBack: () => void }, { hasError: boolean }> {
    constructor(props: { tenant: TenantProfile; onBack: () => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, info: any) {
        console.warn('[ActiveTenants] TenantDetailView crashed', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="space-y-4 p-6">
                    <button onClick={this.props.onBack} className="text-sm text-primary font-bold hover:underline">
                        ← Back to List
                    </button>
                    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                        There was a problem loading this tenant profile. Please return to the list and try again or refresh the page.
                    </div>
                </div>
            );
        }
        return <TenantDetailView tenant={this.props.tenant} onBack={this.props.onBack} />;
    }
}

// --- Simple Initiate Modal for Active Tenants context ---
const InitiateOffboardingModal: React.FC<{ 
    tenant: TenantProfile;
    onClose: () => void;
    onStart: (noticeDate: string, moveOutDate: string) => void;
}> = ({ tenant, onClose, onStart }) => {
    const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
    const [moveOutDate, setMoveOutDate] = useState('');

    const handleSubmit = () => {
        if (!moveOutDate) return alert("Please select a move-out date.");
        onStart(noticeDate, moveOutDate);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1500] flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Offboard {tenant.name}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Notice Date</label>
                        <input type="date" value={noticeDate} onChange={e => setNoticeDate(e.target.value)} className="w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Move Out Date</label>
                        <input type="date" value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)} className="w-full p-2 border rounded"/>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white rounded font-bold">Start Process</button>
                    </div>
                </div>
             </div>
        </div>
    );
}

// --- Manual Payment Recording Modal ---
const RecordPaymentModal: React.FC<{
    tenant: TenantProfile;
    balance: number;
    onClose: () => void;
    onRecord: (amount: number, method: string, reference: string, date: string) => void;
}> = ({ tenant, balance, onClose, onRecord }) => {
    const [amount, setAmount] = useState(balance.toString());
    const [method, setMethod] = useState('Cash');
    const [reference, setReference] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return alert("Please enter a valid amount.");
        if (!reference) return alert("Reference is required.");
        
        onRecord(val, method, reference, date);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[1450] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Record Payment</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Amount Paid (KES)</label>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            className="w-full p-2 border rounded font-bold text-gray-800"
                        />
                         <p className="text-[10px] text-gray-400 mt-1">Total Balance: KES {Number(balance ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method</label>
                        <select 
                            value={method} 
                            onChange={e => setMethod(e.target.value)} 
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option>Cash</option>
                            <option>Bank Transfer</option>
                            <option>Cheque</option>
                            <option>M-Pesa (Manual)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Reference / Receipt No.</label>
                        <input 
                            type="text" 
                            value={reference} 
                            onChange={e => setReference(e.target.value)} 
                            className="w-full p-2 border rounded"
                            placeholder="e.g. RCPT-1002"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Date Paid</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-bold">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700">Record</button>
                </div>
            </div>
        </div>
    );
};


const MpesaStkModal: React.FC<{ onClose: () => void; amount: number; tenantName: string; tenantId: string }> = ({ onClose, amount, tenantName, tenantId }) => {
    const { updateTenant, tenants, addNotification, addMessage, addOverpayment, properties } = useData();
    const [step, setStep] = useState<'input' | 'processing' | 'success' | 'timed_out'>('input');
    const [phone, setPhone] = useState('');
    const [txCode, setTxCode] = useState('');
    const [editableAmount, setEditableAmount] = useState(amount);
    const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tenant = tenants.find(t => t.id === tenantId);
    const paymentUserId = resolveTenantPaymentUserId(tenant);
    const tenantsRef = useRef(tenants);
    const amountRef = useRef(editableAmount);
    useEffect(() => {
        tenantsRef.current = tenants;
    }, [tenants]);
    useEffect(() => {
        amountRef.current = editableAmount;
    }, [editableAmount]);

    // Pre-fill phone from tenant if available
    useEffect(() => {
        const t = tenants.find(te => te.id === tenantId);
        if (t?.phone) setPhone(t.phone);
    }, [tenantId, tenants]);

    useEffect(() => {
        if (!paymentUserId || !checkoutRequestId) return;

        const applyRow = (row: { status?: string | null; transaction_id?: string | null; result_desc?: string | null }) => {
            if (String(row.status ?? '') === 'completed') {
                const ref = String(row.transaction_id ?? '').trim() || checkoutRequestId;
                setTxCode(ref);
                const t = tenantsRef.current.find(te => te.id === tenantId);
                const amt = Number(amountRef.current ?? 0);
                if (t) {
                    const newPayment = {
                        date: new Date().toISOString().split('T')[0],
                        amount: `KES ${amt.toLocaleString()}`,
                        status: 'Paid' as const,
                        method: 'M-Pesa',
                        reference: ref,
                    };
                    const currentHistory = t.paymentHistory || [];
                    const updates: Partial<TenantProfile> = {
                        paymentHistory: [newPayment, ...currentHistory],
                    };
                    const cycle = computeRentPaymentCycleUpdate(t, amt, newPayment.date);
                    updates.nextDueDate = cycle.nextDueDateIso;
                    if (t.status === 'Pending' || t.status === 'PendingAllocation' || t.status === 'PendingPayment') {
                        const depExpected = Number((t as any).depositExpected ?? 0) > 0
                            ? Number((t as any).depositExpected)
                            : Number(t.rentAmount || 0) * Math.max(1, Number((t as any).depositMonths ?? 1));
                        const depPaid = Number(t.depositPaid || 0);
                        const depAlreadySettled = t.depositExempt
                            || !!t.rentExtension?.enabled
                            || (t.proratedDeposit?.enabled
                                ? t.proratedDeposit.amountPaidSoFar + 0.5 >= t.proratedDeposit.totalDepositAmount
                                : depExpected > 0 && depPaid + 0.5 >= depExpected);
                        const depSettledByPayment = t.proratedDeposit?.enabled
                            ? amt >= Number(t.rentAmount || 0) + (t.proratedDeposit.monthlyInstallment || 0)
                            : amt >= Number(t.rentAmount || 0) + depExpected;
                        if (depAlreadySettled || depSettledByPayment) {
                            updates.status = 'Active';
                            (updates as any).activationDate = new Date().toISOString().split('T')[0];
                        }
                        // Update depositPaid for standard tenants only when the payment
                        // verifiably covers rent + full expected deposit (no auto-pay).
                        if (!t.depositExempt && !t.proratedDeposit?.enabled && !t.rentExtension?.enabled
                            && depPaid < depExpected && amt >= Number(t.rentAmount || 0) + depExpected) {
                            updates.depositPaid = depExpected;
                        }
                    }
                    // Rent extension: restore grace days and clear extension flag
                    if (cycle.clearRentExtension && t.rentExtension) {
                        updates.rentGraceDays = t.rentExtension.originalGraceDays ?? 5;
                        updates.rentExtension = { ...t.rentExtension, enabled: false };
                    }
                    // Prorated deposit: advance installment counter
                    if (cycle.proratedUpdate && t.proratedDeposit) {
                        updates.proratedDeposit = { ...t.proratedDeposit, ...cycle.proratedUpdate };
                        updates.depositPaid = cycle.proratedUpdate.amountPaidSoFar;
                    }
                    updateTenant(tenantId, updates);

                    // Mark payment as reconciled in the payments ledger
                    supabase.from('payments')
                        .update({ reconciliation_status: 'reconciled' })
                        .eq('checkout_request_id', checkoutRequestId)
                        .then(() => {});

                    // Detect overpayment: amount exceeds expected rent (+ prorated installment if applicable)
                    const depositSettled = Number(t.depositPaid || 0) > 0 || t.depositExempt || t.rentExtension?.enabled;
                    if (depositSettled && !t.rentExtension?.enabled) {
                        const expectedRent = Number(t.rentAmount || 0);
                        const expectedInstallment = t.proratedDeposit?.enabled && !cycle.proratedUpdate?.fullyPaid
                            ? (t.proratedDeposit.monthlyInstallment || 0)
                            : 0;
                        const overpayAmt = amt - (expectedRent + expectedInstallment);
                        if (overpayAmt > 0) {
                            // Auto-apply: forward credit to next month and log as 'Applied'
                            // so the Overpayments ledger keeps an audit trail without
                            // requiring manual reconciliation.
                            const nextMonth = (() => {
                                const d = new Date(newPayment.date);
                                d.setMonth(d.getMonth() + 1);
                                return d.toISOString().slice(0, 7);
                            })();
                            addOverpayment({
                                id: `ovp-${Date.now()}`,
                                tenantName: t.name,
                                unit: t.unit,
                                amount: overpayAmt,
                                reference: ref,
                                dateReceived: newPayment.date,
                                appliedMonth: nextMonth,
                                status: 'Applied',
                            });
                        }
                    }

                    const msg = `Tenant ${t.name} paid KES ${amt.toLocaleString()} via M-Pesa.`;
                    addNotification({
                        id: `notif-${Date.now()}`,
                        title: 'Payment Received',
                        message: msg,
                        date: new Date().toLocaleString(),
                        read: false,
                        type: 'Success',
                        recipientRole: 'All',
                    });
                    // Notify the landlord separately
                    addNotification({
                        id: `notif-landlord-${Date.now()}`,
                        title: 'Rent Payment Received',
                        message: `${t.name} (${t.unit}) paid KES ${amt.toLocaleString()} via M-Pesa. Ref: ${ref}`,
                        date: new Date().toLocaleString(),
                        read: false,
                        type: 'Success',
                        recipientRole: 'Landlord',
                    });
                    addMessage({
                        id: `msg-${Date.now()}`,
                        recipient: { name: t.name, contact: t.phone },
                        content: `Payment of KES ${amt.toLocaleString()} received. Ref: ${ref}. Thank you!`,
                        channel: 'SMS',
                        status: 'Sent',
                        timestamp: new Date().toLocaleString(),
                        priority: 'Normal',
                    });
                }
                setStep('success');
                setIsSubmitting(false);
            }
            if (String(row.status ?? '') === 'failed' || String(row.status ?? '') === 'cancelled') {
                setErrorMsg(String(row.result_desc ?? 'Payment did not complete.'));
                setStep('input');
                setIsSubmitting(false);
                setCheckoutRequestId(null);
            }
            if (String(row.status ?? '') === 'timed_out') {
                setStep('timed_out');
                setIsSubmitting(false);
            }
        };

        return followStkPaymentCompletion(supabase, paymentUserId, checkoutRequestId, applyRow);
    }, [paymentUserId, checkoutRequestId, tenantId, updateTenant, addNotification, addMessage]);

    // Resolve the tenant's unit tag so it can be sent as AccountReference —
    // this makes the subsequent C2B confirmation (which carries the same tag
    // as BillRefNumber) reconcile back to this tenant automatically.
    // Falls back to tenant.unit (e.g. "KRG11") when no explicit unitTag field
    // is set on the unit record — the unit number IS the paybill account.
    const unitTag = (() => {
        if (!tenant?.unitId) return null;
        const prop = properties.find(p => p.id === tenant.propertyId);
        const u = prop?.units?.find(x => x.id === tenant.unitId);
        const explicit = String((u as any)?.unitTag ?? '').trim();
        const fallback = String(tenant?.unit ?? '').trim();
        return explicit || fallback || null;
    })();

    const handlePay = async () => {
        setErrorMsg(null);

        if (!paymentUserId) {
            setErrorMsg(
                'This tenant is not linked to a Supabase login (auth user). STK cannot be recorded in the payments ledger. Use Record Payment for offline settlement, or onboard the tenant via Registration → Users so their ID matches their login.',
            );
            return;
        }

        if (!unitTag) {
            setErrorMsg(
                'This tenant has no unit assigned. Allocate a unit in Tenants → Applications before initiating STK push.',
            );
            return;
        }

        if (!/^(2547|07)\d{8}$/.test(phone.replace(/\s/g, ''))) {
            alert('Please enter a valid Kenyan mobile number');
            return;
        }

        const amt = Math.round(Number(editableAmount) || 0);
        if (amt < 1) { setErrorMsg('Amount must be at least KES 1.'); return; }
        if (amt > 150_000) { setErrorMsg('Amount exceeds the M-Pesa per-transaction limit of KES 150,000.'); return; }

        setIsSubmitting(true);
        setStep('processing');

        try {
            const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
                body: {
                    phone,
                    amount: Math.round(Number(editableAmount) || 0),
                    leaseId: tenantId,
                    userId: paymentUserId,
                    unitTag,
                },
            });

            if (error) throw error;

            const id = String((data as any)?.checkoutRequestId ?? '').trim();
            if (!id) throw new Error('CheckoutRequestID missing from STK response');

            setCheckoutRequestId(id);
        } catch (e: any) {
            let msg = e?.message ?? 'Failed to initiate STK push.';
            try {
                const ctx = e?.context;
                if (ctx && typeof ctx.json === 'function') {
                    const body = await ctx.json();
                    if (body?.error) msg = String(body.error);
                }
            } catch {
                /* ignore */
            }
            setErrorMsg(msg);
            setStep('input');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 z-[1400] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes bounce { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
                
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
                
                .loading-dots span {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background-color: #1F9F21;
                    border-radius: 50%;
                    animation: bounce 1.4s ease-in-out infinite both;
                }
                
                .loading-dots span:nth-child(1) { animation-delay: 0s; }
                .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
                .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
            `}</style>
            
            <div className="mpesa-card" onClick={e => e.stopPropagation()}>
                <div className="mpesa-logo">M<span>p</span>esa</div>

                {step === 'input' && (
                    <>
                        <div className="mpesa-header">
                            <div className="mpesa-icon-box">
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 16V8C20.9998 6.89543 20.5611 5.8362 19.7804 5.05508C18.9997 4.27396 17.9408 3.83526 16.836 3.835H7.164C6.05925 3.83526 4.99999 4.27396 4.21922 5.05508C3.43845 5.8362 2.99975 6.89543 3 8V16C3.00026 17.1046 3.439 18.1641 4.22005 18.9453C5.00111 19.7266 6.06048 20.1654 7.165 20.166H16.836C17.9405 20.1654 19.0002 19.7266 19.7813 18.9453C20.5623 18.1641 21.001 17.1046 21 16Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M7.5 12H16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M7.5 15H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2 className="mpesa-title">Initiate STK Push</h2>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-6 -mt-4">Paying for {tenantName}</p>

                        {errorMsg && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mb-4">{errorMsg}</p>
                        )}

                        <div className="mpesa-input-group">
                            <label className="mpesa-label">Mobile Number</label>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                                className="mpesa-input" 
                                placeholder="2547XXXXXXXX"
                            />
                        </div>
                        
                        <div className="mpesa-input-group">
                            <label className="mpesa-label">Amount (KES)</label>
                            <input 
                                type="number" 
                                value={editableAmount} 
                                onChange={e => setEditableAmount(parseFloat(e.target.value) || 0)} 
                                className="mpesa-input" 
                                placeholder="Enter amount"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                            <button type="button" disabled={isSubmitting} onClick={handlePay} className="flex-[2] mpesa-btn disabled:opacity-50">
                                {isSubmitting ? 'Sending...' : 'Send STK Push'}
                            </button>
                        </div>
                    </>
                )}

                {(step === 'processing' || step === 'success' || step === 'timed_out') && (
                    <div className="text-center pt-4">
                         <div className="mpesa-header" style={{ justifyContent: 'center', borderBottom: 'none' }}>
                            <div className="mpesa-icon-box" style={step === 'timed_out' ? { background: '#e65c00' } : {}}>
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 12L10.5 14.5L16 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2 className="mpesa-title">Payment Confirmation</h2>
                        </div>

                        {step === 'processing' && (
                            <div className="py-6">
                                <div className="mpesa-spinner"></div>
                                <p className="text-xl font-semibold text-[#1a365d] mb-2">Waiting for confirmation...</p>
                                <p className="text-[#4a904a] font-medium">Please enter your M-Pesa PIN on your device</p>
                                <div className="loading-dots flex justify-center gap-1.5 mt-6">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        {step === 'timed_out' && (
                            <div className="py-6 animate-fade-in">
                                <div className="text-5xl mb-4">⏱</div>
                                <p className="text-lg font-semibold text-gray-700 mb-2">Taking longer than expected</p>
                                <p className="text-sm text-gray-500 mb-1">No confirmation was received within 2 minutes.</p>
                                <p className="text-sm text-gray-500 mb-6">
                                    Check your M-Pesa messages — if the payment went through, use <strong>Record Payment</strong> to log it manually with the M-Pesa transaction code.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => { setStep('input'); setCheckoutRequestId(null); setErrorMsg(null); }}
                                        className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors">
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="animate-fade-in">
                                <div className="mpesa-success-msg">
                                    Payment of <span className="text-[#1F9F21] font-bold ml-1">KES {Number(editableAmount ?? 0).toLocaleString()}</span> confirmed successfully!
                                </div>
                                <div className="text-left">
                                    <p className="text-[#4caf50] font-medium mb-1">Time:</p>
                                    <p className="text-[#2d3748] font-medium mb-4">{new Date().toLocaleString()}</p>
                                    <div className="mpesa-tx-code">
                                        {txCode}
                                    </div>
                                </div>
                                <button onClick={onClose} className="mpesa-btn mt-8">Done</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const FinesManagementModal: React.FC<{ tenant: TenantProfile; onClose: () => void }> = ({ tenant, onClose }) => {
    const { updateTenant, fines: fineRules, addMessage, addNotification } = useData();
    const [selectedFineId, setSelectedFineId] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [comment, setComment] = useState('');

    const handleSelectFine = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const ruleId = e.target.value;
        setSelectedFineId(ruleId);
        const rule = fineRules.find(f => f.id === ruleId);
        if (rule) {
            setAmount(rule.basis === 'Fixed Fee' ? rule.value : 0);
        } else {
            setAmount(0);
        }
    };

    const handleSave = () => {
        const rule = fineRules.find(f => f.id === selectedFineId);
        if (!rule) return;

        const newFine: FineItem = {
            id: `fine-${Date.now()}`,
            type: rule.type,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };
       
        const currentFines = tenant.outstandingFines || [];
        const updatedFines = [...currentFines, newFine];
        updateTenant(tenant.id, { outstandingFines: updatedFines });
        
        // --- NOTIFICATION & SMS ---
        const msgText = `You have been fined KES ${Number(amount ?? 0).toLocaleString()} for ${rule.type}, kindly pay to avoid further penalties.`;
        
        // 1. SMS
        const sms: Message = {
            id: `msg-${Date.now()}`,
            recipient: { name: tenant.name, contact: tenant.phone },
            content: msgText,
            channel: 'SMS',
            status: 'Sent',
            timestamp: new Date().toLocaleString(),
            priority: 'High'
        };
        addMessage(sms);

        // 2. Notification (To Tenant if portal exists, but primarily logging here)
        addNotification({
            id: `notif-${Date.now()}`,
            title: 'Fine Applied',
            message: `Fine of KES ${Number(amount ?? 0).toLocaleString()} applied to ${tenant.name} for ${rule.type}`,
            date: new Date().toLocaleString(),
            read: false,
            type: 'Warning',
            recipientRole: 'Tenant'
        });

        alert(`Fine applied. SMS notification sent to ${tenant.name}.`);
        onClose();
    };

    const availableFines = fineRules.filter(f => f.type !== 'Late Rent');

    return (
        <div className="fixed inset-0 bg-black/50 z-[1300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Issue Fine / Penalty</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
               
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Violation Type</label>
                        <select value={selectedFineId} onChange={handleSelectFine} className="w-full p-2 border rounded bg-white">
                            <option value="">Select violation...</option>
                            {availableFines.map(f => <option key={f.id} value={f.id}>{f.type}</option>)}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Late rent fines are calculated automatically.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="w-full p-2 border rounded" placeholder="Details of violation..."></textarea>
                    </div>
                    <button onClick={handleSave} className="w-full bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700">Apply Fine</button>
                </div>
            </div>
        </div>
    );
};

const NoticeTemplateModal: React.FC<{ 
    type: 'Warning' | 'Vacation' | 'Force' | 'Review Client Notice';
    tenant: TenantProfile;
    clientNotice?: Notice;
    onClose: () => void; 
    onAction: (data: any) => void 
}> = ({ type, tenant, clientNotice, onClose, onAction }) => {
    const [step, setStep] = useState<'edit' | 'preview'>('edit');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (type === 'Warning') {
            setSubject('Formal Warning: Lease Violation');
            setContent(`Dear ${tenant.name},\n\nThis letter serves as a formal warning regarding a violation of your lease agreement for ${tenant.unit}. specifically:\n\n[Enter Details of Violation]\n\nPlease rectify this immediately to avoid further action.`);
        } else if (type === 'Vacation') {
            setSubject('Acknowledgement of Vacation Notice');
            setContent(`Dear ${tenant.name},\n\nWe acknowledge receipt of your notice to vacate ${tenant.unit}. Your move-out date is set for [Enter Date].\n\nPlease ensure the unit is cleaned and keys are returned by the move-out date for deposit processing.`);
        } else if (type === 'Force') {
            setSubject('Notice of Eviction');
            setContent(`Dear ${tenant.name},\n\nDue to repeated violations/non-payment, your lease for ${tenant.unit} is hereby terminated effective immediately.\n\nYou are required to vacate the premises by [Enter Date]. Failure to comply will result in legal action.`);
        } else if (type === 'Review Client Notice') {
            setSubject('Re: Your Vacation Notice');
            setContent(`Dear ${tenant.name},\n\nWe have received your request to vacate. \n\n[If Accepted]: We accept your notice. Move out date: ${clientNotice?.effectiveDate}.\n[If Rejected]: We cannot accept your notice at this time due to...`);
        }
    }, [type, tenant, clientNotice]);

    const handleSend = (channels: string[]) => {
        alert(`Document Sent via: ${channels.join(', ')}`);
        onAction({ subject, content, channels });
        onClose();
    };

    const handleSave = () => {
        alert('Template Saved.');
        onAction({ subject, content, channels: [] });
        onClose();
    };

    const handleAcceptClientNotice = () => {
        alert('Client Notice Accepted. Notification sent.');
        onAction({ action: 'Accepted', subject, content });
        onClose();
    };

    const handleRejectClientNotice = () => {
        if(!rejectionReason) return alert("Please provide a rejection reason.");
        alert('Client Notice Rejected. Tenant notified.');
        onAction({ action: 'Rejected', reason: rejectionReason });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[1400] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-gray-800">
                        {type === 'Review Client Notice' ? 'Review Tenant Notice' : `Generate ${type} Notice`}
                    </h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    {type === 'Review Client Notice' && step === 'edit' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-4">
                                <h4 className="font-bold text-blue-800 text-sm">Client Request</h4>
                                <p className="text-sm text-blue-700 mt-1"><strong>Reason:</strong> {clientNotice?.reason}</p>
                                <p className="text-sm text-blue-700"><strong>Effective Date:</strong> {clientNotice?.effectiveDate}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setStep('preview')} className="p-4 border-2 border-green-100 bg-green-50 rounded-lg hover:border-green-300 text-left">
                                    <h5 className="font-bold text-green-800">Accept Notice</h5>
                                    <p className="text-xs text-green-700">Proceed to generate acceptance letter.</p>
                                </button>
                                <div className="p-4 border-2 border-red-100 bg-red-50 rounded-lg">
                                    <h5 className="font-bold text-red-800">Reject Notice</h5>
                                    <textarea 
                                        placeholder="Reason for rejection (e.g. Lease term not met, arrears)..." 
                                        className="w-full mt-2 p-2 text-sm border rounded"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                    />
                                    <button onClick={handleRejectClientNotice} className="mt-2 w-full py-1 bg-red-600 text-white text-xs font-bold rounded">Send Rejection</button>
                                </div>
                            </div>
                        </div>
                    ) : step === 'edit' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                                <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Content (Edit Template)</label>
                                <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full p-2 border rounded h-64 font-mono text-sm" />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-100 p-8 rounded-lg overflow-y-auto h-full border border-gray-300 shadow-inner">
                             <div className="bg-white p-8 shadow-lg max-w-lg mx-auto min-h-[400px] pdf-preview relative">
                                <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6">
                                    <div>
                                        <h1 className="text-2xl font-bold text-primary">TaskMe Realty</h1>
                                        <p className="text-xs text-gray-500">Property Management</p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                        <p>{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <h2 className="text-lg font-bold text-center mb-6 uppercase underline">{subject}</h2>
                                <div className="text-sm whitespace-pre-wrap text-justify">
                                    {content}
                                </div>
                                <div className="absolute bottom-8 left-8 right-8 border-t pt-4 text-center text-[10px] text-gray-400">
                                    <p>This is a system generated document.</p>
                                    <p>TaskMe Realty • Nairobi, Kenya • info@taskme.re</p>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-xl">
                    {step === 'preview' && (
                        <button onClick={() => setStep('edit')} className="text-gray-600 hover:underline text-sm">Back to Edit</button>
                    )}
                    {step === 'edit' && type !== 'Review Client Notice' && (
                        <button onClick={() => setStep('preview')} className="ml-auto px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Preview PDF</button>
                    )}
                    {step === 'preview' && (
                         <div className="flex gap-2 ml-auto">
                            <button onClick={handleSave} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-100">Save Only</button>
                            <button onClick={() => alert("Downloaded!")} className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded hover:bg-gray-300 flex items-center"><Icon name="download" className="w-4 h-4 mr-1"/> Download</button>
                            <div className="relative group">
                                <button className="px-4 py-2 bg-primary text-white font-bold rounded hover:bg-primary-dark flex items-center">Send To Client <Icon name="chevron-down" className="w-3 h-3 ml-2" /></button>
                                <div className="absolute bottom-full right-0 mb-2 w-40 bg-white shadow-xl rounded-lg overflow-hidden hidden group-hover:block border">
                                    <button onClick={() => handleSend(['SMS'])} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">SMS Link</button>
                                    <button onClick={() => handleSend(['Email'])} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Email PDF</button>
                                    <button onClick={() => handleSend(['WhatsApp'])} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">WhatsApp</button>
                                    <button onClick={() => handleSend(['App'])} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">In-App</button>
                                    <button onClick={() => handleSend(['All'])} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-primary">Send All</button>
                                </div>
                            </div>
                             {type === 'Review Client Notice' && (
                                <button onClick={handleAcceptClientNotice} className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 ml-2">Finalize Acceptance</button>
                            )}
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BillManagementModal: React.FC<{ tenant: TenantProfile; onClose: () => void }> = ({ tenant, onClose }) => {
    const { updateTenant } = useData();
    const [activeTab, setActiveTab] = useState<'Recurring' | 'Metered' | 'History'>('Recurring');
   
    const [recurring, setRecurring] = useState<RecurringBillSettings>(tenant.recurringBills || {
        serviceCharge: 0, garbage: 0, security: 0, waterFixed: 0, other: 0
    });

    const [meterType, setMeterType] = useState('Water');
    const [prevRead, setPrevRead] = useState<string>('');
    const [currRead, setCurrRead] = useState<string>('');
    const [rate, setRate] = useState<string>('');
    const [calculatedAmount, setCalculatedAmount] = useState(0);

    // --- Prorated billing state (Water only) ---
    type BillingMode = 'flat' | 'prorated';
    interface ProratedTier { from: number; to: number | null; rate: number; }
    const [billingMode, setBillingMode] = useState<BillingMode>('flat');
    const [tiers, setTiers] = useState<ProratedTier[]>([
        { from: 1, to: 6, rate: 50 },
        { from: 7, to: 50, rate: 88 },
        { from: 51, to: null, rate: 100 },
    ]);

    const calcProrated = (units: number, tierList: ProratedTier[]): number => {
        const sorted = [...tierList].sort((a, b) => a.from - b.from);
        let total = 0;
        let remaining = units;
        for (const tier of sorted) {
            if (remaining <= 0) break;
            const tierSize = tier.to === null ? remaining : (tier.to - tier.from + 1);
            const apply = Math.min(tierSize, remaining);
            total += apply * tier.rate;
            remaining -= apply;
        }
        return Math.round(total * 100) / 100;
    };

    useEffect(() => {
        const p = parseFloat(prevRead) || 0;
        const c = parseFloat(currRead) || 0;
        const units = c > p ? c - p : 0;
        if (units <= 0) { setCalculatedAmount(0); return; }

        if (meterType === 'Water' && billingMode === 'prorated') {
            setCalculatedAmount(calcProrated(units, tiers));
        } else {
            const r = parseFloat(rate) || 0;
            setCalculatedAmount(units * r);
        }
    }, [prevRead, currRead, rate, billingMode, tiers, meterType]);

    const handleSaveRecurring = () => {
        updateTenant(tenant.id, { recurringBills: recurring });
        alert("Recurring bills updated. These will be added to monthly rent.");
    };

    const handleSaveMetered = () => {
        if (calculatedAmount <= 0) return alert("Invalid amount. Check readings.");
        const units = (parseFloat(currRead) || 0) - (parseFloat(prevRead) || 0);
        const isProratedWater = meterType === 'Water' && billingMode === 'prorated';
        const tierDesc = isProratedWater
            ? tiers.map(t => `${t.from}-${t.to ?? '∞'}u@${t.rate}`).join(', ')
            : '';
        const newBill: BillItem = {
            id: `bill-${Date.now()}`,
            type: meterType,
            amount: calculatedAmount,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            description: isProratedWater
                ? `Prorated Water (${units} units): ${tierDesc}`
                : `Metered ${meterType}: ${prevRead} → ${currRead}`,
            meterReadings: {
                previous: parseFloat(prevRead),
                current: parseFloat(currRead),
                units,
                rate: isProratedWater ? 0 : parseFloat(rate),
                period: new Date().toLocaleDateString('default', { month: 'short' })
            }
        };
        updateTenant(tenant.id, { outstandingBills: [...(tenant.outstandingBills || []), newBill] });
        alert(`${meterType} bill of KES ${calculatedAmount.toLocaleString()} saved.`);
        setPrevRead(''); setCurrRead(''); setRate('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Bill Management</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
               
                <div className="flex border-b bg-gray-50">
                    {['Recurring', 'Metered', 'History'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-sm font-bold ${activeTab === tab ? 'bg-white border-t-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'Recurring' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 mb-4">Set fixed monthly charges added to rent.</p>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(recurring).map(key => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2 text-xs text-gray-400">KES</span>
                                            <input
                                                type="number"
                                                value={(recurring as any)[key]}
                                                onChange={e => setRecurring({...recurring, [key]: parseFloat(e.target.value) || 0})}
                                                className="w-full p-2 pl-8 border rounded"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-end">
                                <button onClick={handleSaveRecurring} className="bg-primary text-white px-4 py-2 rounded font-bold hover:bg-primary-dark">Update Recurring</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Metered' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">Calculate usage-based bills from meter readings.</p>

                            {/* Utility type */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Utility Type</label>
                                <select
                                    value={meterType}
                                    onChange={e => { setMeterType(e.target.value); if (e.target.value !== 'Water') setBillingMode('flat'); }}
                                    className="w-full p-2 border rounded bg-white"
                                >
                                    <option>Water</option>
                                    <option>Electricity</option>
                                </select>
                            </div>

                            {/* Billing mode toggle — Water only */}
                            {meterType === 'Water' && (
                                <div className="flex bg-gray-100 p-1 rounded-lg w-full">
                                    {(['flat', 'prorated'] as BillingMode[]).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setBillingMode(m)}
                                            className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${billingMode === m ? 'bg-white text-primary shadow' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {m === 'flat' ? 'Flat Rate' : 'Prorated (Tiered)'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Meter readings (always shown) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Prev. Reading (units)</label>
                                    <input type="number" value={prevRead} onChange={e => setPrevRead(e.target.value)} className="w-full p-2 border rounded" placeholder="0"/>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Curr. Reading (units)</label>
                                    <input type="number" value={currRead} onChange={e => setCurrRead(e.target.value)} className="w-full p-2 border rounded" placeholder="0"/>
                                </div>
                            </div>

                            {/* Flat rate input */}
                            {(meterType !== 'Water' || billingMode === 'flat') && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Price / Unit (KES)</label>
                                    <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full p-2 border rounded" placeholder="e.g. 88"/>
                                </div>
                            )}

                            {/* Prorated tier configuration */}
                            {meterType === 'Water' && billingMode === 'prorated' && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-3 py-2 flex justify-between items-center border-b">
                                        <p className="text-xs font-bold text-gray-600 uppercase">Tiered Rate Configuration</p>
                                        <button
                                            onClick={() => setTiers(prev => [...prev, { from: (prev[prev.length - 1]?.to ?? 0) + 1, to: null, rate: 0 }])}
                                            className="text-xs text-primary font-bold hover:underline"
                                        >
                                            + Add Tier
                                        </button>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left">From (unit)</th>
                                                <th className="px-3 py-2 text-left">To (unit)</th>
                                                <th className="px-3 py-2 text-left">KES / unit</th>
                                                <th className="px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {tiers.map((tier, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-2 py-1.5">
                                                        <input
                                                            type="number" value={tier.from} min={0}
                                                            onChange={e => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, from: parseInt(e.target.value) || 0 } : t))}
                                                            className="w-full p-1.5 border rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input
                                                            type="number"
                                                            value={tier.to ?? ''}
                                                            placeholder="∞"
                                                            min={0}
                                                            onChange={e => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, to: e.target.value === '' ? null : parseInt(e.target.value) } : t))}
                                                            className="w-full p-1.5 border rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <input
                                                            type="number" value={tier.rate} min={0}
                                                            onChange={e => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, rate: parseFloat(e.target.value) || 0 } : t))}
                                                            className="w-full p-1.5 border rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        {tiers.length > 1 && (
                                                            <button onClick={() => setTiers(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                                <Icon name="close" className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
                                        Units consumed: <strong>{Math.max(0, (parseFloat(currRead)||0) - (parseFloat(prevRead)||0))}</strong>
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <p className="text-xs text-blue-600 uppercase font-bold">Calculated Total</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">KES {Number(calculatedAmount).toLocaleString()}</p>
                                <p className="text-xs text-blue-500 mt-1">
                                    {Math.max(0, (parseFloat(currRead)||0) - (parseFloat(prevRead)||0))} units
                                    {meterType === 'Water' && billingMode === 'prorated' ? ' · Tiered rate' : ''}
                                </p>
                            </div>

                            <button onClick={handleSaveMetered} className="w-full bg-primary text-white py-2.5 rounded-lg font-bold hover:bg-primary-dark transition-colors">
                                Save Bill
                            </button>
                        </div>
                    )}

                    {activeTab === 'History' && (
                        <div className="space-y-2">
                            {(!tenant.outstandingBills || tenant.outstandingBills.length === 0) && <p className="text-center text-gray-400 py-4">No bill history.</p>}
                            {tenant.outstandingBills?.slice().reverse().map(bill => (
                                <div key={bill.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                                    <div>
                                        <p className="font-bold text-sm">{bill.type}</p>
                                        <p className="text-xs text-gray-500">{bill.date} {bill.description ? `• ${bill.description}` : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800">KES {Number(bill.amount ?? 0).toLocaleString()}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatusManagementModal: React.FC<{ tenant: TenantProfile; onClose: () => void }> = ({ tenant, onClose }) => {
    const { updateTenant } = useData();
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(tenant.houseStatus || []);

    const availableStatuses = [
        'Locked', 'Electricity Disconnected', 'Water Disconnected',
        'Gate Access Revoked', 'Gas Disconnected', 'Eviction notice issued',
        'Under Maintenance', 'Distressed'
    ];

    const toggleStatus = (status: string) => {
        const newStatuses = selectedStatuses.includes(status)
            ? selectedStatuses.filter(s => s !== status)
            : [...selectedStatuses, status];
        setSelectedStatuses(newStatuses);
    };

    const handleSave = () => {
        updateTenant(tenant.id, { houseStatus: selectedStatuses });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-800 mb-4">House Status</h3>
                <div className="space-y-3 mb-6">
                    {availableStatuses.map(status => (
                        <label key={status} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                                type="checkbox"
                                checked={selectedStatuses.includes(status)}
                                onChange={() => toggleStatus(status)}
                                className="h-5 w-5 text-primary rounded focus:ring-primary"
                            />
                            <span className={`text-sm ${selectedStatuses.includes(status) ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{status}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded font-bold">Save Status</button>
                </div>
            </div>
        </div>
    );
};

const NewRequestModal: React.FC<{ tenant: TenantProfile; onClose: () => void; onSave: (data: Partial<TenantRequest>, extra?: { priority: TaskPriority, assignTo: string, images: string[] }) => void }> = ({ tenant, onClose, onSave }) => {
    const { vendors, staff } = useData();
    const [requestType, setRequestType] = useState<'General' | 'Maintenance'>('General');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
    const [assignTo, setAssignTo] = useState('');
    const [images, setImages] = useState<string[]>([]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            type: requestType,
            title,
            description,
            images
        }, requestType === 'Maintenance' ? { priority, assignTo, images } : undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1300] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">New Request / Ticket</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                        <select
                            value={requestType}
                            onChange={e => setRequestType(e.target.value as any)}
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option value="General">General Inquiry</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>
                   
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Subject"
                        className="w-full p-2 border rounded"
                        autoFocus
                        required
                    />
                   
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Details..."
                        rows={3}
                        className="w-full p-2 border rounded"
                        required
                    ></textarea>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {images.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {images.map((img, idx) => (
                                    <img key={idx} src={img} alt="upload" className="w-10 h-10 object-cover rounded border" />
                                ))}
                            </div>
                        )}
                    </div>

                    {requestType === 'Maintenance' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded border">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Priority</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value as TaskPriority)}
                                    className="w-full p-2 border rounded bg-white text-sm"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Very High">Very High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Assign To</label>
                                <select
                                    value={assignTo}
                                    onChange={e => setAssignTo(e.target.value)}
                                    className="w-full p-2 border rounded bg-white text-sm"
                                >
                                    <option value="">Unassigned</option>
                                    <optgroup label="Staff">
                                        {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Vendors">
                                        {vendors.map(v => <option key={v.id} value={v.name}>{v.name} ({v.specialty})</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded font-bold">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatementView: React.FC<{ tenant: TenantProfile; onClose: () => void }> = ({ tenant, onClose }) => {
    const history = [
        ...(tenant.paymentHistory || []).map(p => ({
            date: p.date, desc: `Payment (${p.method}) - ${p.reference}`, amount: parseFloat(p.amount.replace(/[^0-9.]/g, '')), type: 'Credit'
        })),
        ...(tenant.outstandingBills || []).map(b => ({
            date: b.date, desc: `Bill: ${b.type}`, amount: b.amount, type: 'Debit'
        })),
        ...(tenant.outstandingFines || []).map(f => ({
            date: f.date, desc: `Fine: ${f.type}`, amount: f.amount, type: 'Debit'
        }))
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="hidden">
            <div id="printable-statement" className="p-8 bg-white max-w-3xl mx-auto text-gray-800 font-sans">
                <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">TaskMe Realty</h1>
                        <p className="text-sm">P.O. Box 1234, Nairobi</p>
                        <p className="text-sm">info@taskme.re | +254 700 000 000</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold uppercase text-gray-400">Statement</h2>
                        <p className="font-bold">{tenant.name}</p>
                        <p className="text-sm">{tenant.unit} - {tenant.propertyName}</p>
                        <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
               
                <table className="w-full text-sm mb-6">
                    <thead className="bg-gray-100 uppercase text-xs font-bold">
                        <tr>
                            <th className="py-2 px-2 text-left">Date</th>
                            <th className="py-2 px-2 text-left">Description</th>
                            <th className="py-2 px-2 text-right">Debit (Inv)</th>
                            <th className="py-2 px-2 text-right">Credit (Pay)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {history.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-2 px-2">{item.date}</td>
                                <td className="py-2 px-2">{item.desc}</td>
                                <td className="py-2 px-2 text-right">{item.type === 'Debit' ? Number(item.amount ?? 0).toLocaleString() : '-'}</td>
                                <td className="py-2 px-2 text-right">{item.type === 'Credit' ? Number(item.amount ?? 0).toLocaleString() : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="border-t pt-4 text-center text-xs text-gray-500">
                    End of Statement. Thank you for your business.
                </div>
            </div>
        </div>
    );
};

// --- DETAIL VIEW ---

const TenantDetailView: React.FC<{ tenant: TenantProfile; onBack: () => void }> = ({ tenant, onBack }) => {
    const { updateTenant, addTask, offboardingRecords, addOffboardingRecord, updateOffboardingRecord, addBill, properties, updateProperty, currentUser, checkPermission } = useData();
    const isSuperAdmin = (currentUser as any)?.role === 'Super Admin';
    const canEdit       = isSuperAdmin || checkPermission('Tenants', 'edit');
    const canPay        = isSuperAdmin || checkPermission('Tenants', 'pay');
    const canDeactivate = isSuperAdmin || checkPermission('Tenants', 'deactivate');
    const [chatInput, setChatInput] = useState('');
    const [activeModal, setActiveModal] = useState<'bills' | 'fines' | 'status' | 'request' | 'pay' | 'notice' | 'manageOffboarding' | 'initiateOffboarding' | 'recordPayment' | null>(null);
    const [activeFollowUpId, setActiveFollowUpId] = useState<string | null>(null);
    
    // For notices
    const [noticeModalType, setNoticeModalType] = useState<'Warning' | 'Vacation' | 'Force' | 'Review Client Notice'>('Warning');
    const [reviewNotice, setReviewNotice] = useState<Notice | undefined>(undefined);

    // Lease Upload State (Mock)
    const leaseInputRef = useRef<HTMLInputElement>(null);

    // Local state to handle race condition of context update
    const [createdRecord, setCreatedRecord] = useState<OffboardingRecord | null>(null);

    const activeOffboardingRecord = useMemo(() => 
        offboardingRecords.find(r => r.tenantId === tenant.id && r.status !== 'Completed' && r.status !== 'Cancelled')
    , [offboardingRecords, tenant.id]);

    const effectiveRecord = createdRecord || activeOffboardingRecord;

    const handleOpenOffboarding = () => {
        if (effectiveRecord) {
            setActiveModal('manageOffboarding');
        } else {
            setActiveModal('initiateOffboarding');
        }
    };

    const handleStartOffboarding = (noticeDate: string, moveOutDate: string) => {
        const start = new Date(noticeDate);
        const end = new Date(moveOutDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

        if (diffDays < 30) {
            alert(`Notice Rejected: The notice period is only ${diffDays} days. A minimum of 30 days is required.`);
            return;
        }

        let warning = "";
        if (end.getDate() > 5) {
            warning = "\n\nWARNING: Vacation date is after the 5th. Full month rent is now due. Deposit may be forfeited or deducted if rent remains unpaid.";
        }

        const newRecord: OffboardingRecord = {
            id: `off-${Date.now()}`,
            tenantId: tenant.id,
            tenantName: tenant.name,
            unit: tenant.unit,
            noticeDate,
            moveOutDate,
            status: 'Notice Given',
            inspectionStatus: 'Pending',
            utilityClearance: false,
            depositRefunded: false,
            keysReturned: false
        };

        addOffboardingRecord(newRecord);
        updateTenant(tenant.id, { status: 'Notice', leaseEnd: moveOutDate });
        
        setCreatedRecord(newRecord); // Set local immediately
        setActiveModal('manageOffboarding');
        
        alert(`Offboarding initiated for ${tenant.name}. Status set to 'Notice'.${warning}`);
    };

    const handleRevokeNotice = (recordId: string, tenantId: string) => {
        if (window.confirm("Are you sure you want to revoke the notice? The tenant will remain Active and the offboarding process will be cancelled.")) {
            updateOffboardingRecord(recordId, { status: 'Cancelled' } as any); 
            updateTenant(tenantId, { status: 'Active', leaseEnd: undefined });
            setCreatedRecord(null);
            setActiveModal(null);
            alert("Notice revoked. Tenant status restored to Active.");
        }
    };

    const handleFinalizeOffboarding = (record: OffboardingRecord) => {
        if (record.finalBillAmount !== undefined) {
            if (record.finalBillAmount > 0) {
                const refundBill: Bill = {
                    id: `bill-ref-${Date.now()}`,
                    vendor: record.tenantName,
                    category: 'Deposit Refund',
                    amount: record.finalBillAmount,
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0],
                    status: 'Unpaid',
                    description: `Deposit Refund for ${record.unit}`,
                    propertyId: 'Agency', 
                    metadata: { grossAmount: 0, deductions: 0 }
                };
                addBill(refundBill);
            } else if (record.finalBillAmount < 0) {
                console.log("Tenant owes balance", Math.abs(record.finalBillAmount));
            }
        }
        const prop = properties.find(p => p.id === tenant.propertyId);
        if (prop && tenant.unitId) {
            const updatedUnits = prop.units.map(u => u.id === tenant.unitId ? { ...u, status: 'Vacant' as const } : u);
            updateProperty(prop.id, { units: updatedUnits as any });
        }
        updateTenant(record.tenantId, { status: 'Vacated' });
        updateOffboardingRecord(record.id, { status: 'Completed' });
        setCreatedRecord(null);
        setActiveModal(null);
        alert(`Offboarding finalized. ${record.finalBillAmount && record.finalBillAmount > 0 ? 'Deposit refund bill created in Payments.' : ''}`);
    };


    const handleLeaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            alert(`Uploaded: ${file.name}`);
        }
    };
    
    const handleLeaseDownload = () => {
        alert("Downloading Lease Document...");
    };

    // Placement fee: first month rent goes to agency as placement fee
    const tenantProperty = properties.find(p => p.id === tenant.propertyId);
    const onboardingMonth = tenant.onboardingDate ? tenant.onboardingDate.slice(0, 7) : null;
    const currentMonthIsoNow = new Date().toISOString().slice(0, 7);
    const isPlacementFeeMonth = !!(tenantProperty?.placementFee) && onboardingMonth === currentMonthIsoNow;

    // Days in Arrears & Automated Fine Logic
    // Requirement:
    // - Last due date drives the cycle.
    // - Next due date is the 1st of the next month.
    // - Late fees only accrue after (next due date + grace period) *and* only if next period rent isn't paid.
    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
    const currentMonthIso = currentDate.toISOString().slice(0, 7);

    const paidDates = (tenant.paymentHistory || [])
        .filter(p => p.status === 'Paid' && !!p.date)
        .map(p => String(p.date));

    const latestPaidDateStr = paidDates.length > 0
        ? paidDates.reduce((max, d) => (d > max ? d : max), paidDates[0])
        : (tenant.onboardingDate ? String(tenant.onboardingDate) : null);

    // Anchor the "cycle" last due date on the latest paid date (for fines),
    // but display the "Last Due Date" in UI as the first rent+deposit payment/onboarding.
    const lastDueDate = latestPaidDateStr ? new Date(latestPaidDateStr) : currentDate;
    lastDueDate.setHours(0, 0, 0, 0);

    const nextDueDate = new Date(lastDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    nextDueDate.setDate(1);
    nextDueDate.setHours(0, 0, 0, 0);

    const nextPeriodIso = nextDueDate.toISOString().slice(0, 7);

    // Check payment status for the "next due period".
    const amountPaidThisPeriod = tenant.paymentHistory
        .filter(p => p.date.startsWith(nextPeriodIso) && p.status === 'Paid')
        .reduce((sum, p) => sum + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);
    const amountPaidThisMonth = tenant.paymentHistory
        .filter(p => p.date.startsWith(currentMonthIso) && p.status === 'Paid')
        .reduce((sum, p) => sum + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);

    // Use prorated first-month rent when the tenant joined this month
    // and firstMonthRent was stored at approval (join day 10 or later).
    const activationMonthIso = (tenant as any).activationDate
        ? String((tenant as any).activationDate).slice(0, 7)
        : (tenant.onboardingDate ? tenant.onboardingDate.slice(0, 7) : null);
    const isActivationMonth = activationMonthIso === currentMonthIso;
    const firstMonthRentStored = Number((tenant as any).firstMonthRent || 0);
    // Compute prorated rent on-the-fly when firstMonthRent was not persisted at approval
    // (e.g. tenant registered directly, not via the applications approval flow).
    const proratedRentOnTheFly = (() => {
        if (!isActivationMonth) return 0;
        const joinDateStr = (tenant as any).activationDate || tenant.onboardingDate;
        if (!joinDateStr) return 0;
        const joinDate = new Date(joinDateStr);
        const joinDay = joinDate.getDate();
        if (joinDay <= 9) return 0; // full rent — no proration needed
        const baseRent = Number(tenant.rentAmount || 0);
        const lastDayOfMonth = new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 0).getDate();
        const daysLeft = Math.max(0, lastDayOfMonth - joinDay); // days AFTER join day
        const prorated = Math.round((baseRent / 30) * daysLeft);
        return joinDay >= 25 ? prorated + baseRent : prorated; // 25+: add full next month
    })();
    const effectiveRent = isActivationMonth
        ? (firstMonthRentStored > 0
            ? firstMonthRentStored
            : (proratedRentOnTheFly > 0 ? proratedRentOnTheFly : Number(tenant.rentAmount || 0)))
        : Number(tenant.rentAmount || 0);

    const isFullyPaid = amountPaidThisMonth >= effectiveRent;

    const rentStat = getMonthlyRentStatus(tenant, { isRentPaidThisMonth: isFullyPaid });
    const daysLate = rentStat.daysLateThisMonth;
    const automatedLateFine = rentStat.automatedLateFine;

    // Derived Financials — use prorated rent in activation month.
    const rentDue = tenant.status === 'Active' && isFullyPaid ? 0 : effectiveRent;

    // Expected full deposit for a standard (non-prorated, non-extension) tenant.
    // Prefer depositExpected (set at registration and not mutated by payments)
    // and fall back to rentAmount × depositMonths for legacy rows.
    const depositMonthsRaw = Number((tenant as any).depositMonths ?? 1);
    const depositMonths = Number.isFinite(depositMonthsRaw) && depositMonthsRaw > 0 ? depositMonthsRaw : 1;
    const depositExpectedStandard = Number((tenant as any).depositExpected ?? 0) > 0
        ? Number((tenant as any).depositExpected)
        : (Number(tenant.rentAmount || 0) * depositMonths);

    // Deposit status: exempt tenants and already-paid tenants owe 0; prorated tracks via proratedDeposit.
    const depositPaidAmt = Number(tenant.depositPaid || 0);
    // depositDue = total remaining balance (used in tracking card Expected/Paid/Balance).
    const depositDue = tenant.depositExempt
        ? 0
        : tenant.proratedDeposit?.enabled
            ? Math.max(0, tenant.proratedDeposit.totalDepositAmount - tenant.proratedDeposit.amountPaidSoFar)
            : Math.max(0, depositExpectedStandard - depositPaidAmt);
    // depositDueForInvoice = amount owed THIS period: one installment for prorated deposits,
    // full remaining balance for standard deposits. Used in Total Invoiced.
    const depositDueForInvoice = tenant.depositExempt
        ? 0
        : tenant.proratedDeposit?.enabled
            ? (tenant.proratedDeposit.amountPaidSoFar >= tenant.proratedDeposit.totalDepositAmount
                ? 0
                : tenant.proratedDeposit.monthlyInstallment)
            : Math.max(0, depositExpectedStandard - depositPaidAmt);

    // Fully-paid check: compares paid vs expected rather than "any amount > 0".
    // Fixes the "Fully Paid" badge showing up for freshly-registered tenants
    // where a legacy path set depositPaid > 0 without covering the full amount.
    const isDepositFullyPaid = !tenant.depositExempt && (
        tenant.proratedDeposit?.enabled
            ? tenant.proratedDeposit.amountPaidSoFar >= tenant.proratedDeposit.totalDepositAmount
            : depositExpectedStandard > 0 && depositPaidAmt + 0.5 >= depositExpectedStandard
    );
    const recurrentBills = Object.values(tenant.recurringBills || {}).reduce((a: number, b) => a + (b as number), 0);
    const pendingBills = (tenant.outstandingBills || []).filter(b => b.status === 'Pending').reduce((sum, b) => sum + b.amount, 0);
    const fines = (tenant.outstandingFines || []).filter(f => f.type !== 'Late Rent' && f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);
    
    // Total Expected = Rent + Recurrent + Bills + Fines + Automated Fine + Utility Deposits
    // Note: If rent is partially paid, we show total expected and subtract paid in UI
    const waterDepositOwed = (() => {
        const d = (tenant as any).waterDeposit as { required?: boolean; exempt?: boolean; amount?: number; paid?: number } | undefined;
        if (!d?.required || d?.exempt) return 0;
        return Math.max(0, (d.amount || 0) - (d.paid || 0));
    })();
    const electricityDepositOwed = (() => {
        const d = (tenant as any).electricityDeposit as { required?: boolean; exempt?: boolean; amount?: number; paid?: number } | undefined;
        if (!d?.required || d?.exempt) return 0;
        return Math.max(0, (d.amount || 0) - (d.paid || 0));
    })();
    const totalExpected = rentDue + recurrentBills + pendingBills + fines + automatedLateFine + depositDueForInvoice + waterDepositOwed + electricityDepositOwed;
    
    // Total Paid is amountPaidThisMonth (assuming bills are paid separately or included in general pot for this visual)
    // For simplicity in this view, we just show Balance = Expected - Paid
    
    // If tenant is overdue from previous months, that should be in outstandingBills as 'Rent Arrears'
    // So 'rentDue' here is strictly current month rent.
    
    // Allow negative balance so any overpayment shows as a credit / advance
    // (auto-applied overpayments still get logged via Overpayments ledger).
    const balanceDue = totalExpected - amountPaidThisMonth;
    const isCreditBalance = balanceDue < 0;
    const creditAmount = isCreditBalance ? Math.abs(balanceDue) : 0;

    // First rent+deposit payment (or onboarding) – used for display-only "Last Due Date".
    const firstPaidDateStr = paidDates.length > 0
        ? paidDates.reduce((min, d) => (d < min ? d : min), paidDates[0])
        : (tenant.onboardingDate ? String(tenant.onboardingDate) : null);
    const firstDueDate = firstPaidDateStr ? new Date(firstPaidDateStr) : lastDueDate;
    firstDueDate.setHours(0, 0, 0, 0);

    // nextDueDate & lastDueDate are now derived above to match the automated late fine rule.

    // Check for client-initiated vacation notices
    useEffect(() => {
        const clientVacationNotice = tenant.notices?.find(n => n.origin === 'Client' && n.status === 'Active');
        if (clientVacationNotice) {
            setReviewNotice(clientVacationNotice);
        } else {
            setReviewNotice(undefined);
        }
    }, [tenant]);

    // --- Actions Handlers ---

    const openNoticeModal = (type: 'Warning' | 'Vacation' | 'Force' | 'Review Client Notice') => {
        setNoticeModalType(type);
        setActiveModal('notice');
    };

    const handleNoticeAction = (data: any) => {
        let newNotices: Notice[] = [...(tenant.notices || [])];
        let newStatus = tenant.status;

        const today = new Date().toISOString().split('T')[0];

        if (data.action === 'Accepted') {
            // Update the client notice status
            newNotices = newNotices.map(n => n.id === reviewNotice?.id ? { ...n, status: 'Resolved' } : n);
            // Add an official system notice confirming vacation
            newNotices.push({
                id: `ntc-sys-${Date.now()}`,
                origin: 'System',
                type: 'Vacation',
                dateIssued: today,
                effectiveDate: reviewNotice?.effectiveDate || today,
                reason: 'Client request accepted',
                status: 'Active'
            });
            newStatus = 'Notice';
        } else if (data.action === 'Rejected') {
            // Update client notice status
            newNotices = newNotices.map(n => n.id === reviewNotice?.id ? { ...n, status: 'Resolved' } : n);
        } else {
             const newNotice: Notice = {
                id: `notice-${Date.now()}`,
                origin: 'System',
                dateIssued: today,
                effectiveDate: today,
                reason: data.subject,
                status: 'Active',
                type: noticeModalType === 'Force' ? 'Eviction' : noticeModalType === 'Warning' ? 'Warning' : 'Vacation'
            };
            newNotices.push(newNotice);

            if (noticeModalType === 'Vacation') newStatus = 'Notice';
            if (noticeModalType === 'Force') newStatus = 'Evicted';
        }

        updateTenant(tenant.id, { status: newStatus, notices: newNotices });
    };

    const handleNewRequest = (data: Partial<TenantRequest>, extra?: { priority: TaskPriority, assignTo: string, images: string[] }) => {
        const newReq: TenantRequest = {
            id: `req-${Date.now()}`,
            type: data.type || 'General',
            title: data.title || 'Request',
            description: data.description || '',
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
            priority: 'Medium',
            messages: [],
            images: extra?.images || []
        };

        if (data.type === 'Maintenance') {
            const newTask: Task = {
                id: `TASK-${Date.now()}`,
                title: data.title || 'Maintenance',
                description: data.description || '',
                status: TaskStatus.Issued,
                priority: extra?.priority || TaskPriority.Medium,
                dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                sla: 48,
                assignedTo: extra?.assignTo || 'Unassigned',
                tenant: { name: tenant.name, unit: tenant.unit },
                property: tenant.propertyName || 'Unknown',
                comments: [],
                history: [{ id: `h-${Date.now()}`, timestamp: new Date().toLocaleString(), event: 'Task Created via Hub' }],
                attachments: extra?.images || [],
                source: 'Internal',
                costs: { labor: 0, materials: 0, travel: 0 }
            };
            addTask(newTask);
            newReq.taskId = newTask.id;
            newReq.status = 'Converted to Task';
        }

        const updatedRequests = [...(tenant.requests || []), newReq];
        updateTenant(tenant.id, { requests: updatedRequests });
        setActiveModal(null);
        alert('Request added successfully.');
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        const newMessage: RequestMessage = {
            id: `msg-${Date.now()}`,
            sender: 'Admin',
            text: chatInput,
            date: new Date().toLocaleString()
        };
        
        let updatedRequests = [...(tenant.requests || [])];
        if (updatedRequests.length === 0) {
             updatedRequests.push({
                id: `gen-chat-${tenant.id}`,
                type: 'General',
                title: 'Direct Messages',
                description: 'Chat history',
                date: new Date().toISOString().split('T')[0],
                status: 'Approved',
                priority: 'Medium',
                messages: []
            });
        }
        
        if (activeFollowUpId) {
            updatedRequests = updatedRequests.map(req => req.id === activeFollowUpId ? { ...req, messages: [...(req.messages || []), newMessage] } : req);
        } else {
            updatedRequests[0].messages = [...(updatedRequests[0].messages || []), newMessage];
        }

        updateTenant(tenant.id, { requests: updatedRequests });
        setChatInput('');
        setActiveFollowUpId(null);
    };

    const handleFollowUp = (reqId: string) => {
        handleSendMessage();
    };

    const handleDownloadStatement = () => {
        printSection('printable-statement', `Statement_${tenant.name}`);
    };

    const handleRecordPayment = (amount: number, method: string, reference: string, date: string) => {
        const normalizedRef = String(reference || '').trim() || `MAN-${Date.now()}`;
        const newPayment = {
            date: date,
            amount: `KES ${Number(amount ?? 0).toLocaleString()}`,
            status: 'Paid' as const,
            method: method,
            reference: normalizedRef
        };
        const cycle = computeRentPaymentCycleUpdate(tenant, Number(amount || 0), date);
        const updates: Partial<TenantProfile> = {
            paymentHistory: [newPayment, ...tenant.paymentHistory],
            nextDueDate: cycle.nextDueDateIso,
        };
        if (tenant.status === 'Pending' || tenant.status === 'PendingAllocation' || tenant.status === 'PendingPayment') {
            const alreadySettled = tenant.depositExempt || isDepositFullyPaid || !!tenant.rentExtension?.enabled;
            const settledByPayment = tenant.proratedDeposit?.enabled
                ? Number(amount) >= effectiveRent + (tenant.proratedDeposit.monthlyInstallment || 0)
                : Number(amount) >= effectiveRent + depositExpectedStandard;
            if (alreadySettled || settledByPayment) {
                updates.status = 'Active';
                (updates as any).activationDate = date;
            }
        }
        if (!tenant.depositExempt && !tenant.proratedDeposit?.enabled && !tenant.rentExtension?.enabled
            && Number(tenant.depositPaid || 0) < depositExpectedStandard
            && Number(amount || 0) >= Number(tenant.rentAmount || 0) + depositExpectedStandard) {
            updates.depositPaid = depositExpectedStandard;
        }
        // Rent extension: restore grace days and clear extension flag
        if (cycle.clearRentExtension && tenant.rentExtension) {
            updates.rentGraceDays = tenant.rentExtension.originalGraceDays ?? 5;
            updates.rentExtension = { ...tenant.rentExtension, enabled: false };
        }
        // Prorated deposit: advance installment counter
        if (cycle.proratedUpdate && tenant.proratedDeposit) {
            updates.proratedDeposit = { ...tenant.proratedDeposit, ...cycle.proratedUpdate };
            updates.depositPaid = cycle.proratedUpdate.amountPaidSoFar;
        }
        updateTenant(tenant.id, updates);
        setActiveModal(null);
        alert("Payment recorded successfully.");
    };

    const sortedRequests = [...(tenant.requests || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Statement Component (Hidden) */}
            <StatementView tenant={tenant} onClose={() => {}} />

            {/* Back Button */}
            <button onClick={onBack} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors w-fit">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to List
            </button>

            {/* Header Profile Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border-r-4 border-b-4 border-secondary">
                <div className="bg-primary p-6 text-white relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center text-2xl font-bold uppercase border-2 border-white/50 shadow-md">
                                {tenant.avatar || tenant.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                                <p className="text-white/80">{tenant.unit}, {tenant.propertyName}</p>
                                {(() => {
                                    const explicit = tenantProperty?.units?.find(u => u.id === tenant.unitId)?.unitTag;
                                    const tag = String(explicit ?? tenant.unit ?? '').trim();
                                    return tag ? (
                                        <p className="text-xs text-white/90 mt-1">
                                            Payment Account: <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">{tag}</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-amber-200 mt-1">No unit assigned — allocate a unit to enable payments</p>
                                    );
                                })()}
                                <p className="text-xs text-white/60 mt-1">Onboarded: {tenant.onboardingDate}</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 text-right flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${tenant.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {tenant.status === 'Active' ? '● Active' : '● ' + tenant.status}
                            </span>
                            <button
                                type="button"
                                className={`text-xs px-2 py-1 rounded font-bold shadow-sm border ${
                                    tenant.leaseSigned
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : 'bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                                title="Lease status from Applications documents flow"
                            >
                                {tenant.leaseSigned ? 'Lease Signed' : 'Lease Not Signed'}
                            </button>
                            
                            {/* Updated Status Sticker Logic */}
                            {isFullyPaid ? (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded font-bold shadow-sm flex items-center animate-pulse">
                                    <Icon name="check" className="w-3 h-3 mr-1" /> Paid for {currentMonthName}
                                </span>
                            ) : tenant.status === 'Overdue' ? (
                                <span className="text-xs bg-red-800 text-white px-2 py-1 rounded font-bold animate-pulse shadow-sm">
                                    OVERDUE ({daysLate} Days Late)
                                </span>
                            ) : (
                                <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded font-bold shadow-sm">
                                    Rent Due
                                </span>
                            )}

                             {tenant.houseStatus && tenant.houseStatus.length > 0 && (
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {tenant.houseStatus.map(status => (
                                        <span key={status} className="text-[10px] bg-white text-red-600 px-2 py-0.5 rounded font-bold uppercase border border-red-200 shadow-sm">
                                            {status}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Phone</p>
                            <p className="text-sm font-semibold text-gray-700">{tenant.phone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-700">{tenant.email}</p>
                                {canDeactivate && (
                                <button 
                                    onClick={handleOpenOffboarding} 
                                    className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 hover:bg-red-100 font-bold transition-colors shadow-sm"
                                    title="Initiate or Manage Offboarding"
                                >
                                    Offboard Tenant
                                </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Lease Type</p>
                            <p className="text-sm font-semibold text-gray-700">{tenant.leaseType || 'Fixed'}</p>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Start: {tenant.leaseStartDate ? new Date(tenant.leaseStartDate).toLocaleDateString() : 'Not set'}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Expiry: {tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : 'Not set'}
                            </p>
                        </div>
                        <div className="flex flex-col items-start">
                            <p className="text-xs text-gray-400 font-bold uppercase">Lease Doc</p>
                            <div className="flex gap-2 mt-1">
                                <button onClick={handleLeaseDownload} className="text-xs text-primary font-bold hover:underline flex items-center bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                    <Icon name="download" className="w-3 h-3 mr-1" /> Download
                                </button>
                                <button onClick={() => leaseInputRef.current?.click()} className="text-xs text-gray-600 font-bold hover:underline flex items-center bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                    <Icon name="plus" className="w-3 h-3 mr-1" /> Upload
                                </button>
                                <input type="file" ref={leaseInputRef} className="hidden" onChange={handleLeaseUpload} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 border-t pt-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase">Last Due Date</p>
                            <p className="font-bold text-gray-700">{firstDueDate.toLocaleDateString()}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase">Next Due Date</p>
                            <p className="font-bold text-gray-700">
                                {tenant.nextDueDate ? new Date(tenant.nextDueDate).toLocaleDateString() : nextDueDate.toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Deposit Tracking Card */}
                    {!tenant.depositExempt && (
                        <div className="mt-4 border-t pt-4">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-2">Security Deposit</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Expected</p>
                                    <p className="font-bold text-gray-700 text-sm">
                                        KES {(tenant.proratedDeposit?.enabled
                                            ? tenant.proratedDeposit.totalDepositAmount
                                            : depositExpectedStandard).toLocaleString()}
                                    </p>
                                    {tenant.proratedDeposit?.enabled && (
                                        <p className="text-[10px] text-indigo-600 mt-0.5">
                                            {tenant.proratedDeposit.monthsPaid}/{tenant.proratedDeposit.durationMonths} installments
                                        </p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Paid</p>
                                    <p className="font-bold text-green-700 text-sm">
                                        KES {(tenant.proratedDeposit?.enabled
                                            ? tenant.proratedDeposit.amountPaidSoFar
                                            : depositPaidAmt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Balance</p>
                                    <p className={`font-bold text-sm ${depositDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {depositDue > 0 ? `KES ${depositDue.toLocaleString()}` : 'Cleared'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4">
                {canEdit ? (
                <button onClick={() => setActiveModal('bills')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 h-32 cursor-pointer hover:shadow-md transition-all group hover:border-blue-300">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                        <Icon name="payments" className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-gray-700 text-sm">Bills</p>
                </button>
                ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-32 flex flex-col items-center justify-center opacity-40 cursor-not-allowed" title="No permission">
                    <Icon name="payments" className="w-5 h-5 text-gray-400 mb-2" /><p className="font-bold text-gray-400 text-sm">Bills</p>
                </div>
                )}
                {canEdit ? (
                <button onClick={() => setActiveModal('fines')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 h-32 cursor-pointer hover:shadow-md transition-all group hover:border-red-300">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2 group-hover:scale-110 transition-transform">
                        <Icon name="arrears" className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-gray-700 text-sm">Fines</p>
                </button>
                ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-32 flex flex-col items-center justify-center opacity-40 cursor-not-allowed" title="No permission">
                    <Icon name="arrears" className="w-5 h-5 text-gray-400 mb-2" /><p className="font-bold text-gray-400 text-sm">Fines</p>
                </div>
                )}
                {canEdit ? (
                <button onClick={() => setActiveModal('status')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 h-32 cursor-pointer hover:shadow-md transition-all group hover:border-green-300">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2 group-hover:scale-110 transition-transform">
                        <Icon name="check" className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-gray-700 text-sm">House Status</p>
                </button>
                ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-32 flex flex-col items-center justify-center opacity-40 cursor-not-allowed" title="No permission">
                    <Icon name="check" className="w-5 h-5 text-gray-400 mb-2" /><p className="font-bold text-gray-400 text-sm">House Status</p>
                </div>
                )}
            </div>

            {/* Notices & Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Notices & Actions</h3>
                
                {/* Client Review Notification Area */}
                {reviewNotice && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center animate-pulse">
                        <div>
                            <p className="text-blue-800 font-bold text-sm">Client Submitted Vacation Notice</p>
                            <p className="text-xs text-blue-600">Requested Move Out: {reviewNotice.effectiveDate}</p>
                        </div>
                        <button onClick={() => openNoticeModal('Review Client Notice')} className="px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-blue-700">
                            Review Notice
                        </button>
                    </div>
                )}

                {canEdit && (
                <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => openNoticeModal('Warning')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 h-32 cursor-pointer hover:shadow-md transition-all group hover:border-yellow-300">
                         <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mb-2 group-hover:scale-110 transition-transform">
                            <Icon name="bell" className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-gray-700 text-sm text-center">Issue Warning</p>
                    </button>
                    <button onClick={() => openNoticeModal('Vacation')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 h-32 cursor-pointer hover:shadow-md transition-all group hover:border-blue-300">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                            <Icon name="offboarding" className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-gray-700 text-sm text-center">Record Vacation</p>
                    </button>
                    <button onClick={() => openNoticeModal('Force')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 h-32 cursor-pointer hover:shadow-md transition-all group hover:border-red-300">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2 group-hover:scale-110 transition-transform">
                            <Icon name="close" className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-gray-700 text-sm text-center">Force Vacation</p>
                    </button>
                </div>
                )}
            </div>

            {/* Balance Overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Balance Overview</h3>
                <div className="space-y-3 text-sm">
                    {/* Detailed Breakdown */}
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-100">
                        {/* Deposit status badges */}
                        {tenant.depositExempt && (
                            <div className="flex justify-between text-gray-500 text-xs">
                                <span className="flex items-center gap-1">
                                    Security Deposit
                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">Exempt</span>
                                </span>
                                <span>—</span>
                            </div>
                        )}
                        {!tenant.depositExempt && isDepositFullyPaid && (
                            <div className="flex justify-between text-green-700 font-medium text-xs">
                                <span className="flex items-center gap-1">
                                    Security Deposit
                                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Fully Paid</span>
                                </span>
                                <span>KES {(tenant.proratedDeposit?.totalDepositAmount ?? Number(tenant.depositPaid || 0)).toLocaleString()}</span>
                            </div>
                        )}
                        {!tenant.depositExempt && !isDepositFullyPaid && tenant.proratedDeposit?.enabled && (
                            <div className="flex justify-between text-indigo-700 font-medium">
                                <span className="flex items-center gap-1 flex-wrap">
                                    Deposit Installment
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                                        {tenant.proratedDeposit.monthsPaid}/{tenant.proratedDeposit.durationMonths} paid
                                    </span>
                                </span>
                                <span>KES {tenant.proratedDeposit.monthlyInstallment.toLocaleString()}</span>
                            </div>
                        )}
                        {!tenant.depositExempt && !tenant.proratedDeposit?.enabled && depositDue > 0 && (
                            <div className="flex justify-between text-blue-700 font-medium">
                                <span className="flex items-center gap-1">
                                    Security Deposit
                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">New Tenant</span>
                                </span>
                                <span>KES {Number(depositDue).toLocaleString()}</span>
                            </div>
                        )}
                        {/* Deposit-exempt admin control:
                            - Any admin can waive the deposit while it's still unpaid.
                            - Only Super Admin can un-exempt, or waive a deposit
                              that has already been (partially/fully) collected. */}
                        {(() => {
                            const depositAlreadyCollected = depositPaidAmt > 0
                                || (tenant.proratedDeposit?.amountPaidSoFar ?? 0) > 0;
                            const canWaive = !tenant.depositExempt && (!depositAlreadyCollected || isSuperAdmin);
                            const canRestore = !!tenant.depositExempt && isSuperAdmin;
                            if (!canWaive && !canRestore) return null;
                            return (
                                <div className="pt-2 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-gray-500">
                                        {tenant.depositExempt ? 'Deposit is currently waived.' : 'Waive security deposit for this tenant.'}
                                        {depositAlreadyCollected && !tenant.depositExempt && (
                                            <span className="block text-amber-700 font-medium">Deposit already collected — super-admin only.</span>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (tenant.depositExempt) {
                                                if (!window.confirm('Restore security deposit requirement for this tenant?')) return;
                                                updateTenant(tenant.id, { depositExempt: false } as any);
                                            } else {
                                                const msg = depositAlreadyCollected
                                                    ? 'This tenant has already paid part or all of their deposit. Waiving it now will mark them exempt but will NOT refund anything. Continue?'
                                                    : 'Waive security deposit for this tenant?';
                                                if (!window.confirm(msg)) return;
                                                updateTenant(tenant.id, { depositExempt: true } as any);
                                            }
                                        }}
                                        className={`text-[11px] font-bold px-2 py-1 rounded border ${tenant.depositExempt ? 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'}`}
                                    >
                                        {tenant.depositExempt ? 'Restore deposit' : 'Waive deposit'}
                                    </button>
                                </div>
                            );
                        })()}
                        {/* Rent extension notice */}
                        {tenant.rentExtension?.enabled && (
                            <div className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded p-2 mt-1">
                                Rent deferred until <strong>{tenant.rentExtension.rentDeferredUntil}</strong> — no grace period after that date.
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-600">
                                {isActivationMonth && effectiveRent > 0 && effectiveRent !== Number(tenant.rentAmount || 0)
                                    ? (() => {
                                        const joinDateStr = (tenant as any).activationDate || tenant.onboardingDate;
                                        const joinDate = joinDateStr ? new Date(joinDateStr) : null;
                                        const jDay = joinDate ? joinDate.getDate() : null;
                                        const lastDay = joinDate
                                            ? new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 0).getDate()
                                            : 30;
                                        const daysLeft = jDay != null ? Math.max(0, lastDay - jDay) : null;
                                        return `Prorated Rent${daysLeft != null ? ` — ${daysLeft} days` : ''} (joined ${currentMonthName} ${jDay ?? ''})`;
                                    })()
                                    : `Base Rent (${currentMonthName})`}
                            </span>
                            <span className="font-medium">KES {Number(rentDue ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Recurrent Bills</span>
                            <span className="font-medium">KES {Number(recurrentBills ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Pending Bills/Fines</span>
                            <span className="font-medium">KES {(Number(pendingBills ?? 0) + Number(fines ?? 0)).toLocaleString()}</span>
                        </div>
                        {automatedLateFine > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Late Fee</span>
                                <span>KES {Number(automatedLateFine ?? 0).toLocaleString()}</span>
                            </div>
                        )}
                        {waterDepositOwed > 0 && (
                            <div className="flex justify-between text-teal-700">
                                <span className="flex items-center gap-1">Water Deposit <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-1.5 py-0.5 rounded font-bold">Unpaid</span></span>
                                <span>KES {Number(waterDepositOwed).toLocaleString()}</span>
                            </div>
                        )}
                        {electricityDepositOwed > 0 && (
                            <div className="flex justify-between text-teal-700">
                                <span className="flex items-center gap-1">Electricity Deposit <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-1.5 py-0.5 rounded font-bold">Unpaid</span></span>
                                <span>KES {Number(electricityDepositOwed).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
                            <span>Total Invoiced</span>
                            <span>KES {Number(totalExpected ?? 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {isPlacementFeeMonth && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                            <span className="font-bold mt-0.5">⚠</span>
                            <div>
                                <p className="font-bold">Placement Fee Month</p>
                                <p>This tenant's first month rent (KES {Number(effectiveRent ?? 0).toLocaleString()}) is directed to the agency as a placement fee. Management commission and MRI tax do not apply this month.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-green-600">
                        <span className="font-medium">Amount Paid (This Month)</span>
                        <span className="font-bold">- KES {Number(amountPaidThisMonth ?? 0).toLocaleString()}</span>
                    </div>

                    <div className="border-t pt-3 mt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-800 text-base">
                            {isCreditBalance ? 'Credit (Advance)' : 'Total Due'}
                        </span>
                        <span className={`text-xl font-extrabold ${isCreditBalance ? 'text-emerald-600' : balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {isCreditBalance ? '- ' : ''}KES {Number(isCreditBalance ? creditAmount : balanceDue).toLocaleString()}
                        </span>
                    </div>
                </div>
                
                {canPay && (
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                        onClick={() => setActiveModal('recordPayment')}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Record Manual Pay
                    </button>
                    <button
                        onClick={() => setActiveModal('pay')}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md transition-colors"
                    >
                        M-Pesa Push
                    </button>
                </div>
                )}
            </div>

            {/* Payment History */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Payment History</h3>
                    <button
                        onClick={handleDownloadStatement}
                        className="text-primary text-xs font-bold hover:underline flex items-center"
                    >
                        <Icon name="download" className="w-3 h-3 mr-1" /> View Statement
                    </button>
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2">Txn Code</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(tenant.paymentHistory || []).map((pay, idx) => {
                                const ref = String((pay as any).reference ?? '').trim();
                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">{pay.date}</td>
                                        <td className="px-4 py-3 text-gray-600">{pay.method}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                                            {ref || <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{pay.amount}</td>
                                    </tr>
                                );
                            })}
                            {(tenant.paymentHistory || []).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No payment history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Communication Hub */}
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col h-[600px]">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full"><Icon name="communication" className="w-5 h-5 text-primary" /></div>
                        <h3 className="text-lg font-bold text-gray-800">Communication Hub</h3>
                    </div>
                    <button
                        onClick={() => setActiveModal('request')}
                        className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded hover:bg-gray-200 flex items-center"
                    >
                        <Icon name="plus" className="w-3 h-3 mr-1"/> Create Ticket
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4">
                    <div className="text-center text-xs text-gray-400 my-2">- Notifications -</div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 flex items-center gap-3">
                        <div className="bg-blue-100 p-1.5 rounded text-blue-600"><Icon name="mail" className="w-4 h-4"/></div>
                        <div className="flex-grow">
                            <p className="font-bold">System Notification</p>
                            <p>Invoice #INV-001 sent via Email</p>
                        </div>
                        <span className="text-[10px]">{tenant.onboardingDate}</span>
                    </div>

                    {sortedRequests.map(req => (
                        <div key={req.id} className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${req.type === 'Maintenance' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'}`}>{req.type}</span>
                                    <h4 className="font-bold text-sm text-gray-800">{req.title}</h4>
                                </div>
                                <span className="text-[10px] text-gray-400">{req.date}</span>
                            </div>
                            
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-2 border border-gray-100">{req.description}</p>

                            {req.images && req.images.length > 0 && (
                                <div className="flex gap-2 mb-2">
                                    {req.images.map((img, i) => (
                                        <img key={i} src={img} alt="request-attachment" className="w-8 h-8 rounded object-cover border" />
                                    ))}
                                </div>
                            )}
                           
                            {req.messages && req.messages.length > 0 && (
                                <div className="space-y-2 pl-2 border-l-2 border-gray-100 my-2">
                                    {req.messages.map(msg => (
                                        <div key={msg.id} className="text-xs">
                                            <span className={`font-bold ${msg.sender === 'Admin' ? 'text-primary' : 'text-gray-600'}`}>{msg.sender}:</span> {msg.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="mt-2 flex justify-end">
                                <button 
                                    onClick={() => setActiveFollowUpId(activeFollowUpId === req.id ? null : req.id)} 
                                    className={`text-xs font-bold px-3 py-1.5 rounded flex items-center transition-colors ${activeFollowUpId === req.id ? 'bg-gray-200 text-gray-700' : 'bg-primary text-white hover:bg-primary-dark'}`}
                                >
                                    <Icon name="communication" className="w-3 h-3 mr-1" />
                                    {activeFollowUpId === req.id ? 'Cancel Follow Up' : 'Follow Up'}
                                </button>
                            </div>

                            {activeFollowUpId === req.id && (
                                <div className="mt-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            placeholder="Type message..."
                                            className="flex-grow p-2 border rounded text-xs focus:ring-1 focus:ring-primary outline-none"
                                            autoFocus
                                        />
                                        <button onClick={() => handleFollowUp(req.id)} className="px-3 py-1 bg-primary text-white rounded text-xs font-bold">Send</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t pt-3">
                     <div className="flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Send general In-App message to Tenant..."
                            className="flex-grow p-2 border rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button onClick={handleSendMessage} className="px-4 py-2 bg-primary text-white rounded font-bold hover:bg-primary-dark transition-colors">
                            <Icon name="communication" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {activeModal === 'bills' && <BillManagementModal tenant={tenant} onClose={() => setActiveModal(null)} />}
            {activeModal === 'fines' && <FinesManagementModal tenant={tenant} onClose={() => setActiveModal(null)} />}
            {activeModal === 'status' && <StatusManagementModal tenant={tenant} onClose={() => setActiveModal(null)} />}
            {activeModal === 'request' && <NewRequestModal tenant={tenant} onClose={() => setActiveModal(null)} onSave={handleNewRequest} />}
            {activeModal === 'pay' && <MpesaStkModal onClose={() => setActiveModal(null)} amount={Math.max(0, balanceDue)} tenantName={tenant.name} tenantId={tenant.id} />}
            {activeModal === 'recordPayment' && (
                <RecordPaymentModal
                    tenant={tenant}
                    balance={Math.max(0, balanceDue)}
                    onClose={() => setActiveModal(null)} 
                    onRecord={handleRecordPayment} 
                />
            )}
            {activeModal === 'notice' && (
                <NoticeTemplateModal 
                    type={noticeModalType} 
                    tenant={tenant} 
                    clientNotice={reviewNotice}
                    onClose={() => setActiveModal(null)} 
                    onAction={handleNoticeAction} 
                />
            )}
            
            {activeModal === 'initiateOffboarding' && (
                <InitiateOffboardingModal 
                    tenant={tenant}
                    onClose={() => setActiveModal(null)}
                    onStart={handleStartOffboarding}
                />
            )}

            {activeModal === 'manageOffboarding' && effectiveRecord && (
                <ManageOffboardingModal
                    record={effectiveRecord}
                    onClose={() => { setActiveModal(null); setCreatedRecord(null); }}
                    onUpdate={updateOffboardingRecord}
                    onRevoke={handleRevokeNotice}
                    onFinalize={handleFinalizeOffboarding}
                />
            )}
        </div>
    );
};

// --- LIST VIEW ---

const ActiveTenants: React.FC = () => {
    const { tenants, applications, isDataLoading } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Active');
    const [listMode, setListMode] = useState<'active' | 'inactive'>('active');
   
    // Check URL for specific tenant view on load or change
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.includes('tenantId=')) {
                const id = hash.split('tenantId=')[1].split('&')[0];
                setSelectedTenantId(id);
            } else {
                setSelectedTenantId(null);
            }
        };
        handleHashChange(); // Initial check
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const approvedPendingApps = useMemo(() => {
        return applications.filter(a => a.status === 'Approved');
    }, [applications]);

    const inactivePool = useMemo(() => tenants.filter(isInactiveApplicantTenant), [tenants]);

    const filteredTenants = useMemo(() => {
        const pool = listMode === 'inactive' ? inactivePool : tenants;
        const q = searchQuery.trim().toLowerCase();
        const qCanonical = canonicalizePhone(searchQuery);

        return pool.filter(t => {
            const matchesSearch = !q ? true : (
                (t.name || '').toLowerCase().includes(q) ||
                (t.unit || '').toLowerCase().includes(q) ||
                (t.propertyName || '').toLowerCase().includes(q) ||
                (t.idNumber || '').toLowerCase().includes(q) ||
                (t.phone || '').includes(searchQuery) ||
                (!!qCanonical && canonicalizePhone(t.phone) === qCanonical) ||
                (!!qCanonical && canonicalizePhone((t as any).alternativePhone) === qCanonical)
            );
            if (listMode === 'inactive') return matchesSearch;
            const matchesFilter =
                activeFilter === 'All' ||
                t.status === activeFilter ||
                // Treat legacy 'Pending' rows as PendingAllocation (no unit) or PendingPayment (has unit)
                (activeFilter === 'PendingAllocation' && t.status === 'Pending' && !tenantFullyAllocated(t)) ||
                (activeFilter === 'PendingPayment' && t.status === 'Pending' && tenantFullyAllocated(t));
            return matchesSearch && matchesFilter;
        });
    }, [tenants, inactivePool, listMode, searchQuery, activeFilter]);

    const handleTenantClick = (id: string) => {
        window.location.hash = `#/tenants/active-tenants?tenantId=${id}`;
    };

    const handleBackToList = () => {
        // Clear the query param to return to the list view of this component
        window.location.hash = '#/tenants/active-tenants';
    };

    if (isDataLoading) {
        return <div className="text-center py-8">Loading data...</div>;
    }

    if (!isDataLoading && tenants.length === 0 && applications.length === 0) {
        return <div className="text-center py-8 text-gray-500">No tenants yet. Add your first one.</div>;
    }

    // If a tenant is selected via URL, show detailed view
    const specificTenant = tenants.find(t => t.id === selectedTenantId);
    if (specificTenant) {
        return <TenantDetailErrorBoundary tenant={specificTenant} onBack={handleBackToList} />;
    }

    // Otherwise, show list view
    return (
        <div className="space-y-8 pb-10">
            <style>{styles}</style>
           
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        {listMode === 'inactive' ? 'Inactive / Pending applicants' : 'Active Tenants'}
                    </h1>
                    <p className="text-lg text-gray-500 mt-1">
                        {listMode === 'inactive'
                            ? 'Tenants not yet active or missing allocation. Open a card to record payment or STK — successful M-Pesa confirms a Pending tenant as Active.'
                            : 'Manage tenant profiles, bills, and house status.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <button
                            type="button"
                            onClick={() => setListMode('active')}
                            className={`px-4 py-2 text-sm font-bold ${listMode === 'active' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            Active tenants
                        </button>
                        <button
                            type="button"
                            onClick={() => setListMode('inactive')}
                            className={`px-4 py-2 text-sm font-bold border-l border-gray-200 ${listMode === 'inactive' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            Inactive / Pending ({inactivePool.length})
                        </button>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                        <Icon name="search" className="w-5 h-5 text-gray-400 ml-2" />
                        <input
                            className="outline-none text-sm w-56"
                            placeholder="Search name, unit, ID, phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {approvedPendingApps.length > 0 && listMode === 'inactive' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-amber-900">
                        <strong>{approvedPendingApps.length}</strong> approved application(s) may still need a tenant record or allocation. Review them in Applications.
                    </p>
                    <button
                        type="button"
                        onClick={() => { window.location.hash = '#/tenants/applications'; }}
                        className="px-4 py-2 bg-amber-700 text-white text-sm font-bold rounded-lg hover:bg-amber-800"
                    >
                        Open Applications
                    </button>
                </div>
            )}

            {/* Filters */}
            {listMode === 'active' && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {STATUS_FILTERS.map(({ key, label }) => {
                        const count = key === 'All'
                            ? tenants.length
                            : tenants.filter(t =>
                                t.status === key ||
                                (key === 'PendingAllocation' && t.status === 'Pending' && !tenantFullyAllocated(t)) ||
                                (key === 'PendingPayment' && t.status === 'Pending' && tenantFullyAllocated(t))
                            ).length;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveFilter(key)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${activeFilter === key ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
                            >
                                {label}{count > 0 ? ` (${count})` : ''}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map(tenant => {
                    const currentMonthIso = new Date().toISOString().slice(0, 7);
                    const isAllocated = tenantFullyAllocated(tenant);

                    const isPaid = tenant.paymentHistory.some(p => p.date.startsWith(currentMonthIso) && p.status === 'Paid');
                    const rentStat = getMonthlyRentStatus(tenant, { isRentPaidThisMonth: isPaid });
                    const automatedLateFine = rentStat.automatedLateFine;
                    const cardActivationMonth = (tenant as any).activationDate
                        ? String((tenant as any).activationDate).slice(0, 7)
                        : (tenant.onboardingDate ? tenant.onboardingDate.slice(0, 7) : null);
                    const cardFirstMonthRent = Number((tenant as any).firstMonthRent || 0);
                    const cardProratedRentOnTheFly = (() => {
                        if (cardActivationMonth !== currentMonthIso) return 0;
                        const joinDateStr = (tenant as any).activationDate || tenant.onboardingDate;
                        if (!joinDateStr) return 0;
                        const joinDate = new Date(joinDateStr);
                        const joinDay = joinDate.getDate();
                        if (joinDay <= 9) return 0;
                        const baseRent = Number(tenant.rentAmount || 0);
                        const lastDayOfMonth = new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 0).getDate();
                        const daysLeft = Math.max(0, lastDayOfMonth - joinDay);
                        const prorated = Math.round((baseRent / 30) * daysLeft);
                        return joinDay >= 25 ? prorated + baseRent : prorated;
                    })();
                    const cardEffectiveRent = cardActivationMonth === currentMonthIso
                        ? (cardFirstMonthRent > 0
                            ? cardFirstMonthRent
                            : (cardProratedRentOnTheFly > 0 ? cardProratedRentOnTheFly : Number(tenant.rentAmount || 0)))
                        : Number(tenant.rentAmount || 0);
                    const rentDue = !isAllocated ? 0 : (isPaid ? 0 : cardEffectiveRent);
                    const pendingBills = !isAllocated
                        ? 0
                        : (tenant.outstandingBills?.filter(b => b.status === 'Pending').reduce((s, b) => s + b.amount, 0) || 0);
                    const pendingFines = !isAllocated
                        ? 0
                        : (tenant.outstandingFines?.filter(f => f.status === 'Pending').reduce((s, f) => s + f.amount, 0) || 0);

                    // Deposit owed on the card — respects all deposit modes.
                    // Exempt: nothing owed. Prorated: show next installment (if not fully paid).
                    // Rent extension: deposit already captured at activation, none owed here.
                    // Standard / multi-month: owed if depositPaid is still 0.
                    const depositOwed = (() => {
                        if (!isAllocated) return 0;
                        if (tenant.depositExempt) return 0;
                        if (tenant.rentExtension?.enabled) return 0; // deposit captured upfront at activation
                        if (tenant.proratedDeposit?.enabled) {
                            const fullyPaid = tenant.proratedDeposit.amountPaidSoFar >= tenant.proratedDeposit.totalDepositAmount;
                            return fullyPaid ? 0 : (tenant.proratedDeposit.monthlyInstallment || 0);
                        }
                        // Standard / multi-month: owed = expected - actually paid.
                        // Previously this returned 0 as soon as depositPaid > 0, which
                        // falsely cleared partial-deposit balances from the card.
                        const depositMonths = Number(tenant.depositMonths ?? 1);
                        const expected = Number((tenant as any).depositExpected ?? 0) > 0
                            ? Number((tenant as any).depositExpected)
                            : (Number(tenant.rentAmount || 0) * depositMonths);
                        return Math.max(0, expected - Number(tenant.depositPaid || 0));
                    })();

                    // Card "Total Due" should match the tenant-detail "Total Invoiced"
                    // line: everything they owe right now — rent, deposit/installment,
                    // outstanding bills, fines, and any accrued late fees. Previously
                    // the card switched to a rent-only view once the deposit was paid,
                    // which left other outstanding bills off the headline number.
                    const totalDueLabel = 'Total Due';
                    const totalDue = !isAllocated ? 0
                        : rentDue + depositOwed + pendingBills + pendingFines + automatedLateFine;

                    // Arrears Month Indicator
                    const arrearsText = getArrearsText(tenant);

                    // Partial-paid tag: tenant has sent some money but the
                    // first rent + deposit hasn't fully cleared, so they
                    // remain in PendingPayment / Pending instead of Active.
                    const hasAnyPaid = (tenant.paymentHistory || []).some(p => p.status === 'Paid');
                    const depositMonthsForCard = Number(tenant.depositMonths ?? 1);
                    const expectedDepositForCard = Number((tenant as any).depositExpected ?? 0) > 0
                        ? Number((tenant as any).depositExpected)
                        : (Number(tenant.rentAmount || 0) * depositMonthsForCard);
                    const depositCovered = tenant.depositExempt
                        || tenant.rentExtension?.enabled
                        || (tenant.proratedDeposit?.enabled
                            ? tenant.proratedDeposit.amountPaidSoFar >= tenant.proratedDeposit.totalDepositAmount
                            : Number(tenant.depositPaid || 0) + 0.5 >= expectedDepositForCard);
                    const showPartialPaid = isAllocated
                        && hasAnyPaid
                        && !depositCovered
                        && (tenant.status === 'Pending' || tenant.status === 'PendingPayment');

                    return (
                        <div
                            key={tenant.id}
                            className={GRID_CARD_CLASSES}
                            onClick={() => handleTenantClick(tenant.id)}
                        >
                            <div className="flex flex-col h-full w-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200 uppercase">
                                            {tenant.avatar || tenant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{tenant.name}</h3>
                                            <p className="text-xs text-gray-500">{tenant.unit} • {tenant.propertyName}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                            !isAllocated ? 'bg-yellow-100 text-yellow-800' :
                                            tenant.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            tenant.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {!isAllocated ? 'Pending Allocation' : tenant.status}
                                        </span>
                                        {showPartialPaid && (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                                Partial Paid
                                            </span>
                                        )}
                                        {tenant.houseStatus && tenant.houseStatus.length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {tenant.houseStatus.slice(0, 2).map(status => (
                                                    <span key={status} className="text-[9px] bg-red-50 text-red-600 px-1 rounded border border-red-100">
                                                        {status}
                                                    </span>
                                                ))}
                                                {tenant.houseStatus.length > 2 && <span className="text-[9px] text-gray-400">+{tenant.houseStatus.length - 2}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm mt-auto border-t pt-3 mb-3">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Rent</p>
                                        <p className="font-semibold">KES {Number(isAllocated ? (tenant.rentAmount ?? 0) : 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">
                                            {totalDueLabel}
                                        </p>
                                        <p className={`font-semibold ${totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            KES {Number(totalDue ?? 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {arrearsText && (
                                    <div className="mb-2 text-xs text-red-600 font-bold bg-red-50 p-1 rounded text-center border border-red-100">
                                        {arrearsText}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200 transition-colors">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredTenants.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No tenants found matching criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActiveTenants;
