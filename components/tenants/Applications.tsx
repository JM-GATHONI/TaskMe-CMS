
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { TenantApplication, RecurringBillSettings, TenantProfile, Unit, Property } from '../../types';
import Icon from '../Icon';
import { uploadToBucket } from '../../utils/supabaseStorage';
import { supabase } from '../../utils/supabaseClient';
import { followStkPaymentCompletion } from '../../utils/stkPaymentFollowup';
import { getMonthlyRentStatus } from '../../utils/rentSchedule';
import { canonicalizePhone, digitsOnly } from '../../utils/phone';

// Helper type to unify TenantProfile and TenantApplication for the UI
export type UnifiedRecord = Omit<Partial<TenantApplication> & Partial<TenantProfile>, 'status'> & {
    status?: string;
    recordType: 'Tenant' | 'Application';
    displayStatus: string;
    submittedDate?: string;
    referrerId?: string; // Added to track specific person
};

const APP_CARD_CLASSES = "relative bg-white rounded-2xl border-t-[8px] border-t-primary border-b-[4px] border-b-secondary border-x-[3px] border-x-secondary shadow-[inset_0_0_60px_-15px_rgba(162,53,74,0.15)] hover:shadow-lg transition-all duration-300 overflow-hidden p-4 flex items-center justify-between min-h-[110px]";
const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(val ?? '').trim());

function tenantFullyAllocated(t: Partial<TenantProfile>): boolean {
    return !!t.propertyId && !!t.unitId && !!String(t.unit ?? '').trim() && !!String(t.propertyName ?? '').trim();
}

// Arrears text copied to keep Applications card internals aligned with Active Tenants cards.
const getArrearsText = (tenant: TenantProfile) => {
    if (tenant.status !== 'Overdue') return null;

    const rentBills = tenant.outstandingBills?.filter(b =>
        (b.type === 'Rent Arrears' || b.type === 'Rent' || (b.description && b.description.toLowerCase().includes('rent'))) &&
        b.status === 'Pending',
    );

    if (rentBills && rentBills.length > 0) {
        const months = [...new Set(rentBills.map(b => new Date(b.date).toLocaleString('default', { month: 'long' })))];
        if (months.length > 0) return `Rent Due (${months.join(', ')})`;
    }

    return 'Rent Due (Arrears)';
};

// --- MOVE TENANT MODAL ---
const MoveTenantModal: React.FC<{
    tenant: TenantProfile;
    onClose: () => void;
    onMove: (propertyId: string, unitId: string, propertyName: string, unitName: string) => void;
    properties: Property[];
}> = ({ tenant, onClose, onMove, properties }) => {
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState('');

    const activeProperty = properties.find(p => p.id === selectedPropertyId);
    const availableUnits = activeProperty?.units.filter(u => u.status === 'Vacant') || [];

    const handleConfirm = () => {
        if (!selectedPropertyId || !selectedUnitId) return alert("Please select a property and unit.");
        const unitName = activeProperty?.units.find(u => u.id === selectedUnitId)?.unitNumber || '';
        const propertyName = activeProperty?.name || '';
        onMove(selectedPropertyId, selectedUnitId, propertyName, unitName);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Move Tenant</h3>
                <p className="text-sm text-gray-600 mb-4">Moving <strong>{tenant.name}</strong> from {tenant.propertyName} ({tenant.unit})</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Property</label>
                        <select 
                            className="w-full p-2 border rounded" 
                            value={selectedPropertyId} 
                            onChange={e => { setSelectedPropertyId(e.target.value); setSelectedUnitId(''); }}
                        >
                            <option value="">Select Property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Unit</label>
                        <select 
                            className="w-full p-2 border rounded bg-white disabled:bg-gray-100" 
                            value={selectedUnitId} 
                            onChange={e => setSelectedUnitId(e.target.value)}
                            disabled={!selectedPropertyId}
                        >
                            <option value="">Select Unit</option>
                            {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unitNumber} ({u.rent} KES)</option>)}
                        </select>
                        {selectedPropertyId && availableUnits.length === 0 && <p className="text-xs text-red-500 mt-1">No vacant units available.</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700">Cancel</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Confirm Move</button>
                </div>
            </div>
        </div>
    );
};

export const ApplicationFormModal: React.FC<{ 
    record?: UnifiedRecord; 
    onClose: () => void; 
    onSave: (data: UnifiedRecord) => void;
    properties: Property[];
}> = ({ record, onClose, onSave, properties }) => {
    const { tenants, landlords, staff, vendors, renovationInvestors } = useData(); // Context for referrer lookups
    // Open on 'lease' tab when tenant has no unit assigned yet so the user
    // lands directly on the Rent & Deposit / proration section.
    const needsUnitSetup = !record?.unitId && !record?.unit;
    const [activeTab, setActiveTab] = useState<'details' | 'lease' | 'documents'>(needsUnitSetup ? 'lease' : 'details');
    
    // File inputs refs (reused)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultRecurringBills: RecurringBillSettings = {
        serviceCharge: 0, garbage: 0, security: 0, waterFixed: 0, other: 0
    };

    // Form State
    const [formData, setFormData] = useState<UnifiedRecord>({
        ...record,
        recurringBills: record?.recurringBills || defaultRecurringBills,
        // Ensure legacy rent data is captured
        rentAmount: record?.rentAmount || 0,
        depositPaid: record?.depositPaid || 0,
        // Start date
        rentStartDate: record?.rentStartDate || record?.onboardingDate || new Date().toISOString().split('T')[0],
        rentDueDate: record?.rentDueDate ?? 1,
        rentGraceDays: record?.rentGraceDays ?? 5,
        leaseStartDate: (record as any)?.leaseStartDate || new Date().toISOString().split('T')[0],
        leaseEnd: (record as any)?.leaseEnd || (() => {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            return d.toISOString().split('T')[0];
        })(),
        source: record?.source || 'Walk-in',
        // Deposit special cases
        depositExempt: record?.depositExempt || false,
        depositMonths: record?.depositMonths ?? 1,
        proratedDeposit: record?.proratedDeposit,
        rentExtension: record?.rentExtension,
    });

    const ensureLeaseDates = (prev: any) => {
        const hasStart = !!String(prev.leaseStartDate || '').trim();
        const startIso = hasStart ? String(prev.leaseStartDate) : new Date().toISOString().split('T')[0];
        let endIso = String(prev.leaseEnd || '').trim();
        if (!endIso) {
            const end = new Date(startIso);
            end.setFullYear(end.getFullYear() + 1);
            endIso = end.toISOString().split('T')[0];
        }
        return { ...prev, leaseStartDate: startIso, leaseEnd: endIso };
    };

    // Rent Due Calculation State
    const [rentDue, setRentDue] = useState(0);
    const [calcNote, setCalcNote] = useState('');

    // Handle Property/Unit Selection
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(record?.propertyId || '');
    const [selectedUnitId, setSelectedUnitId] = useState<string>(record?.unitId || '');

    // Initialize IDs based on name match if IDs missing (for legacy data)
    useEffect(() => {
        if (!selectedPropertyId && record?.property) {
            const prop = properties.find(p => p.name === record.property);
            if (prop) setSelectedPropertyId(prop.id);
        }
    }, [record, properties, selectedPropertyId]);

    useEffect(() => {
        if (selectedPropertyId && !selectedUnitId && record?.unit) {
            const prop = properties.find(p => p.id === selectedPropertyId);
            const unit = prop?.units.find(u => u.unitNumber === record.unit);
            if (unit) setSelectedUnitId(unit.id);
        }
    }, [selectedPropertyId, record, properties, selectedUnitId]);

    const activeProperty = properties.find(p => p.id === selectedPropertyId);
    
    // Filter units: Show current unit + all vacant units
    const availableUnits = activeProperty?.units.filter(u => 
        u.status === 'Vacant' || u.id === record?.unitId
    ) || [];

    const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPropertyId(e.target.value);
        setSelectedUnitId(''); // Reset unit when property changes
        const prop = properties.find(p => p.id === e.target.value);
        setFormData(prev => ({ 
            ...prev, 
            propertyId: e.target.value, 
            propertyName: prop?.name, 
            property: prop?.name, // Legacy support
            rentAmount: 0 // Reset rent on property change
        }));
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const uId = e.target.value;
        setSelectedUnitId(uId);
        const unit = activeProperty?.units.find(u => u.id === uId);
        const rent = unit?.rent || activeProperty?.defaultMonthlyRent || 0;
        const depositMonths = activeProperty?.deposit?.months ?? 1;

        setFormData(prev => ({
            ...prev,
            unitId: uId,
            unit: unit?.unitNumber,
            rentAmount: rent,
            depositMonths,
            // Expected deposit — drives invoicing and the "Fully Paid" check.
            // depositPaid stays at whatever the tenant has actually paid
            // (default 0); it must not be pre-filled to the full amount or
            // the card will falsely show the deposit as settled.
            depositExpected: prev.depositExempt ? 0 : rent * depositMonths,
            depositPaid: prev.depositPaid && Number(prev.depositPaid) > 0 ? prev.depositPaid : 0,
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Digit-only guard for phone/ID fields. Strips anything non-numeric.
    const handleDigitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: digitsOnly(value) }));
    };

    const STANDARD_RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child'];
    const currentRelationship = String((formData as any).nextOfKinRelationship ?? '');
    const isCustomRelationship = currentRelationship.length > 0 && !STANDARD_RELATIONSHIPS.includes(currentRelationship);
    // Tracks whether the "Other" option is active so the free-text box appears
    // even before the user has typed a value.
    const [showOtherRelationship, setShowOtherRelationship] = useState<boolean>(isCustomRelationship);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleRecurringBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Allow empty string for better UX, convert to 0 on use
        const numValue = value === '' ? 0 : parseFloat(value);
        setFormData(prev => ({
            ...prev,
            recurringBills: {
                ...(prev.recurringBills || defaultRecurringBills),
                [name]: numValue
            }
        }));
    };

    const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const ext = file.name.split('.').pop() || 'jpg';
                    const path = `${user.id}/tenant-pic-${Date.now()}.${ext}`;
                    const url = await uploadToBucket('profile-pictures', path, file);
                    if (record?.recordType === 'Tenant') setFormData(prev => ({ ...prev, avatar: url }));
                    else setFormData(prev => ({ ...prev, profilePicture: url }));
                } else {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (record?.recordType === 'Tenant') setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                        else setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                }
            } catch (err) {
                console.warn('Upload failed, using base64', err);
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (record?.recordType === 'Tenant') setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                    else setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    // Rent Calculation Logic
    useEffect(() => {
        if (formData.rentAmount && formData.rentStartDate) {
            const date = new Date(formData.rentStartDate);
            const day = date.getDate();
            const monthlyRent = formData.rentAmount;

            let calculated = 0;
            let note = "";

            if (day <= 9) {
                // 1st to 9th: Full Rent + Deposit
                calculated = monthlyRent;
                note = "Full month rent charged (joined 1st-9th)";
            } else if (day <= 24) {
                // 10th to 24th: Prorated rent + Deposit
                const daysRemaining = Math.max(0, 30 - day + 1);
                calculated = (monthlyRent / 30) * daysRemaining;
                note = `Prorated: ${daysRemaining} days remaining (joined 10th-24th)`;
            } else {
                // 25th onward: Prorated remainder + full next month's rent + Deposit
                const daysRemaining = Math.max(0, 30 - day + 1);
                const prorated = (monthlyRent / 30) * daysRemaining;
                calculated = prorated + monthlyRent;
                note = "Prorated days + next month's rent (joined 25th+)";
            }
            
            setRentDue(Math.round(calculated));
            setCalcNote(note);
        } else {
            setRentDue(0);
            setCalcNote("");
        }
    }, [formData.rentAmount, formData.rentStartDate]);

    const handleSubmit = () => {
        if (!formData.name || !formData.phone) return alert("Name and Phone are required");
        if (!selectedPropertyId || !selectedUnitId) return alert("Property and Unit are required");

        const leaseSigned = !!formData.leaseSigned;
        if (leaseSigned) {
            const docs = Array.isArray(formData.documents) ? formData.documents : [];
            const hasSignedLease = docs.some(d => String(d?.type ?? '') === 'Signed Lease Agreement' && String(d?.url ?? '').trim());
            if (!hasSignedLease) {
                alert('Lease is marked as signed. Please upload the signed lease document.');
                return;
            }
        }

        const activePropertyResolved = properties.find(p => p.id === selectedPropertyId);
        const activeUnitResolved = activePropertyResolved?.units?.find(u => u.id === selectedUnitId);

        const resolvedPropertyName = activePropertyResolved?.name ?? formData.propertyName ?? formData.property ?? '';
        const resolvedUnitNumber = activeUnitResolved?.unitNumber ?? formData.unit ?? '';

        const resolvedRent = activeUnitResolved?.rent ?? activePropertyResolved?.defaultMonthlyRent ?? formData.rentAmount ?? 0;

        const payload = leaseSigned ? ensureLeaseDates(formData) : formData;

        // Status lifecycle for Tenant records:
        //   • Existing Active/Overdue/Notice/etc. tenants keep their status.
        //   • New tenant with unit allocated but no payment → PendingPayment.
        //   • Tenant without a unit → PendingAllocation.
        //   • Applications keep their own status (formData.status).
        let resolvedStatus: TenantProfile['status'] | string = formData.status;
        if (formData.recordType === 'Tenant') {
            const hasUnit = !!(selectedPropertyId && selectedUnitId);
            const hasPaid = Array.isArray(formData.paymentHistory) && formData.paymentHistory.some(p => p?.status === 'Paid');
            const currentStatus = String(record?.status || formData.status || '');
            const isLifecyclePending = ['Pending', 'PendingAllocation', 'PendingPayment', ''].includes(currentStatus);
            if (isLifecyclePending || !record?.id) {
                resolvedStatus = hasPaid ? 'Active' : (hasUnit ? 'PendingPayment' : 'PendingAllocation');
            } else {
                resolvedStatus = currentStatus;
            }
        }

        onSave({
            ...payload,
            propertyId: selectedPropertyId,
            // Ensure UI allocation checks (ActiveTenants tenantFullyAllocated) evaluate correctly.
            propertyName: resolvedPropertyName,
            property: resolvedPropertyName, // legacy
            unitId: selectedUnitId,
            unit: resolvedUnitNumber,
            status: resolvedStatus,
            rentAmount: resolvedRent,
        });
    };

    const upsertDoc = (name: string, type: string, url: string) => {
        setFormData(prev => {
            const docs = Array.isArray(prev.documents) ? [...prev.documents] : [];
            const idx = docs.findIndex(d => String(d?.type) === type);
            const next = { name, type, url };
            if (idx >= 0) docs[idx] = next;
            else docs.push(next);
            let out: any = { ...prev, documents: docs };
            if (type === 'Signed Lease Agreement' && !!prev.leaseSigned) {
                out = ensureLeaseDates(out);
            }
            return out;
        });
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, docKey?: string) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to upload documents.');
                return;
            }
            const ext = file.name.split('.').pop() || 'pdf';
            const safeKey = String(docKey || docType).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const path = `${user.id}/tenant-doc-${safeKey}-${Date.now()}.${ext}`;
            const url = await uploadToBucket('documents', path, file);
            upsertDoc(docType, docKey || docType, url);
        } catch (err: any) {
            console.warn('Document upload failed', err);
            alert(err?.message ?? 'Document upload failed.');
        } finally {
            e.target.value = '';
        }
    };

    const renderReferrerSelect = () => {
        const source = formData.source;
        if (source === 'Walk-in' || source === 'Website') return null;

        let options: {id: string, name: string, sub?: string}[] = [];
        let label = "Select Referrer";

        if (source === 'Tenant') {
            options = tenants.map(t => ({ id: t.id, name: t.name, sub: t.unit }));
            label = "Select Referring Tenant";
        } else if (source === 'Landlord') {
            options = landlords.map(l => ({ id: l.id, name: l.name }));
            label = "Select Referring Landlord";
        } else if (source === 'Affiliate') {
            // Using Staff (Agents) as affiliates for this context or Landlords with Affiliate role
            options = landlords.filter(l => l.role === 'Affiliate').map(l => ({ id: l.id, name: l.name, sub: 'Affiliate' }));
            // Also include staff agents if needed, but keeping it clean
            label = "Select Affiliate";
        } else if (source === 'Agent') {
             options = staff.filter(s => s.role === 'Field Agent').map(s => ({ id: s.id, name: s.name, sub: 'Agent' }));
             label = "Select Agent";
        } else if (source === 'Contractor') {
             options = vendors.map(v => ({ id: v.id, name: v.name, sub: v.specialty }));
             label = "Select Contractor";
        } else if (source === 'Caretaker') {
             options = staff.filter(s => s.role === 'Caretaker').map(s => ({ id: s.id, name: s.name, sub: s.branch }));
             label = "Select Caretaker";
        } else if (source === 'Investor') {
             options = renovationInvestors.map(i => ({ id: i.id, name: i.name, sub: 'Investor' }));
             label = "Select Investor";
        } else if (source === 'Posters') {
             // Posters might imply a specific campaign or location, simple input for now or select list of campaigns
             return (
                 <div className="md:col-span-2">
                     <label className="block text-xs font-medium text-gray-700 mb-1">Poster Location / ID</label>
                     <input 
                        name="referrerId" 
                        value={formData.referrerId || ''} 
                        onChange={handleChange} 
                        placeholder="e.g. CBD-001" 
                        className="w-full p-2 border rounded bg-white"
                     />
                 </div>
             );
        } else if (source === 'Referral') {
             // General Referral
             return (
                 <div className="md:col-span-2">
                     <label className="block text-xs font-medium text-gray-700 mb-1">Referrer Name / Details</label>
                     <input 
                        name="referrerId" 
                        value={formData.referrerId || ''} 
                        onChange={handleChange} 
                        placeholder="Name of referrer" 
                        className="w-full p-2 border rounded bg-white"
                     />
                 </div>
             );
        }

        return (
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <select 
                    name="referrerId" 
                    value={formData.referrerId || ''} 
                    onChange={handleChange} 
                    className="w-full p-2 border rounded bg-white"
                >
                    <option value="">-- Select Person --</option>
                    {options.map(opt => (
                        <option key={opt.id} value={opt.id}>
                            {opt.name} {opt.sub ? `(${opt.sub})` : ''}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">{record ? `Edit ${record.recordType}` : 'New Application'}</h2>
                        {record?.recordType === 'Tenant' && <p className="text-xs text-blue-600 font-bold">Active Tenant Record</p>}
                    </div>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button onClick={() => setActiveTab('details')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Details</button>
                    <button onClick={() => setActiveTab('lease')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'lease' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Property & Rent</button>
                    <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Documents</button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {activeTab === 'details' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name*</label>
                                    <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">ID Number</label>
                                    <input name="idNumber" value={formData.idNumber || ''} onChange={handleDigitChange} inputMode="numeric" maxLength={10} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">KRA PIN</label>
                                    <input name="kraPin" value={formData.kraPin || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Primary Phone*</label>
                                    <input name="phone" value={formData.phone || ''} onChange={handleDigitChange} inputMode="numeric" maxLength={12} placeholder="0712345678" className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                                    <input name="email" value={formData.email || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>

                                {/* Alternative contact + Next of Kin (all optional) */}
                                <div className="md:col-span-2 border-t pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Additional Contact &amp; Next of Kin</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Alternative Phone</label>
                                            <input name="alternativePhone" value={(formData as any).alternativePhone || ''} onChange={handleDigitChange} inputMode="numeric" maxLength={12} placeholder="0712345678" className="w-full p-2 border rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Next of Kin Full Name</label>
                                            <input name="nextOfKinName" value={(formData as any).nextOfKinName || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Next of Kin Phone</label>
                                            <input name="nextOfKinPhone" value={(formData as any).nextOfKinPhone || ''} onChange={handleDigitChange} inputMode="numeric" maxLength={12} placeholder="0712345678" className="w-full p-2 border rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Relationship to Tenant</label>
                                            <select
                                                value={showOtherRelationship || isCustomRelationship ? 'Other' : currentRelationship}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    if (v === 'Other') {
                                                        setShowOtherRelationship(true);
                                                        setFormData(prev => ({ ...prev, nextOfKinRelationship: '' } as any));
                                                    } else {
                                                        setShowOtherRelationship(false);
                                                        setFormData(prev => ({ ...prev, nextOfKinRelationship: v } as any));
                                                    }
                                                }}
                                                className="w-full p-2 border rounded bg-white"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="Spouse">Spouse</option>
                                                <option value="Parent">Parent</option>
                                                <option value="Sibling">Sibling</option>
                                                <option value="Child">Child</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            {(showOtherRelationship || isCustomRelationship) && (
                                                <input
                                                    name="nextOfKinRelationship"
                                                    value={currentRelationship}
                                                    onChange={handleChange}
                                                    placeholder="Specify relationship"
                                                    className="w-full p-2 border rounded mt-2"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Source & Referral Section */}
                                <div className="md:col-span-2 border-t pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Lead Source</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">How did they find us?</label>
                                            <select name="source" value={formData.source} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                                                <option value="Walk-in">Walk-in</option>
                                                <option value="Website">Website</option>
                                                <option value="Agent">Agent</option>
                                                <option value="Affiliate">Affiliate</option>
                                                <option value="Contractor">Contractor</option>
                                                <option value="Caretaker">Caretaker</option>
                                                <option value="Investor">Investor</option>
                                                <option value="Tenant">Tenant Referral</option>
                                                <option value="Landlord">Landlord Referral</option>
                                                <option value="Referral">General Referral</option>
                                                <option value="Posters">Posters / Ads</option>
                                            </select>
                                        </div>
                                        {renderReferrerSelect()}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'lease' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Property</label>
                                    <select value={selectedPropertyId} onChange={handlePropertyChange} className="w-full p-2 border rounded bg-white">
                                        <option value="">-- Choose Property --</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Unit</label>
                                    <select value={selectedUnitId} onChange={handleUnitChange} disabled={!selectedPropertyId} className="w-full p-2 border rounded bg-white">
                                        <option value="">-- Choose Unit --</option>
                                        {availableUnits.map(u => (
                                            <option key={u.id} value={u.id}>{u.unitNumber} ({u.status})</option>
                                        ))}
                                    </select>
                                    {record?.recordType === 'Tenant' && selectedUnitId !== record.unitId && selectedUnitId && (
                                        <p className="text-xs text-orange-600 mt-1 font-bold">⚠️ Reallocation: Tenant will be moved to this unit.</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Rent Start Date</label>
                                    <input type="date" name="rentStartDate" value={formData.rentStartDate} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Rent</label>
                                    <input type="number" name="rentAmount" value={formData.rentAmount} onChange={handleAmountChange} className="w-full p-2 border rounded font-bold" />
                                </div>
                                
                                {!formData.depositExempt && !formData.proratedDeposit?.enabled && !formData.rentExtension?.enabled && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Deposit Amount</label>
                                        <input type="number" name="depositPaid" value={formData.depositPaid} onChange={handleAmountChange} className="w-full p-2 border rounded" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Rent due day (1–28)</label>
                                    <input
                                        type="number"
                                        name="rentDueDate"
                                        min={1}
                                        max={28}
                                        value={formData.rentDueDate ?? 1}
                                        onChange={handleAmountChange}
                                        className="w-full p-2 border rounded"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-0.5">Default 1st. Late logic uses this plus grace.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Grace period (days)</label>
                                    <input
                                        type="number"
                                        name="rentGraceDays"
                                        min={0}
                                        max={28}
                                        value={formData.rentGraceDays ?? 5}
                                        onChange={handleAmountChange}
                                        className="w-full p-2 border rounded"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-0.5">e.g. 5 → fees accrue from day due+6.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-blue-600 mb-1">Rent Due (Invoiced)</label>
                                    <input type="number" className="w-full p-2 border rounded bg-blue-50 font-bold text-blue-800" value={rentDue} disabled />
                                    <p className="text-[10px] text-gray-500 mt-1 italic">{calcNote}</p>
                                </div>
                            </div>

                            {/* ── Deposit Configuration ──────────────────────────────────────────── */}
                            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h4 className="text-xs font-bold text-gray-700 mb-3">Deposit Configuration</h4>

                                {/* Deposit Exempt */}
                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={!!formData.depositExempt}
                                        onChange={e => {
                                            const exempt = e.target.checked;
                                            setFormData(prev => ({
                                                ...prev,
                                                depositExempt: exempt,
                                                depositPaid: exempt ? 0 : (prev.rentAmount || 0) * (prev.depositMonths ?? 1),
                                                proratedDeposit: exempt ? undefined : prev.proratedDeposit,
                                                rentExtension: exempt ? undefined : prev.rentExtension,
                                            }));
                                        }}
                                        className="h-4 w-4 text-primary rounded border-gray-300"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">Deposit Exempt</span>
                                    <span className="text-xs text-gray-500 ml-1">— tenant pays rent only, no deposit collected</span>
                                </label>

                                {!formData.depositExempt && (<>
                                    {/* Deposit Months */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Deposit Months</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={12}
                                                value={formData.depositMonths ?? 1}
                                                disabled={!!formData.proratedDeposit?.enabled}
                                                onChange={e => {
                                                    const months = Math.max(1, parseInt(e.target.value) || 1);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        depositMonths: months,
                                                        depositPaid: (prev.rentAmount || 0) * months,
                                                    }));
                                                }}
                                                className="w-20 p-2 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                            />
                                            <span className="text-xs text-gray-500">
                                                × KES {(formData.rentAmount || 0).toLocaleString()} = <strong>KES {((formData.depositMonths ?? 1) * (formData.rentAmount || 0)).toLocaleString()}</strong>
                                            </span>
                                        </div>
                                        {(formData.depositMonths ?? 1) > 1 && !formData.proratedDeposit?.enabled && (
                                            <p className="text-xs text-indigo-600 mt-1 font-medium">Multi-month deposit: full amount collected at first payment.</p>
                                        )}
                                    </div>

                                    {/* Prorated Deposit */}
                                    <label className={`flex items-center gap-2 cursor-pointer mb-2 ${(formData.depositMonths ?? 1) > 1 && !formData.proratedDeposit?.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={!!formData.proratedDeposit?.enabled}
                                            onChange={e => {
                                                const enabled = e.target.checked;
                                                const total = (formData.rentAmount || 0) * (formData.depositMonths ?? 1);
                                                const dur = formData.depositMonths ?? 1;
                                                const installment = dur > 0 ? Math.ceil(total / dur) : total;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    proratedDeposit: enabled ? {
                                                        enabled: true,
                                                        totalDepositAmount: total,
                                                        monthlyInstallment: installment,
                                                        durationMonths: dur,
                                                        monthsPaid: 0,
                                                        amountPaidSoFar: 0,
                                                    } : undefined,
                                                    depositPaid: enabled ? 0 : (prev.rentAmount || 0) * (prev.depositMonths ?? 1),
                                                    rentExtension: enabled ? undefined : prev.rentExtension,
                                                }));
                                            }}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-semibold text-gray-700">Prorated Deposit</span>
                                        <span className="text-xs text-gray-500 ml-1">— paid in monthly installments alongside rent</span>
                                    </label>

                                    {formData.proratedDeposit?.enabled && (
                                        <div className="ml-6 grid grid-cols-3 gap-3 mb-3 p-3 bg-white border border-indigo-100 rounded-lg">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Total Deposit (KES)</label>
                                                <input
                                                    type="number" min={0}
                                                    value={formData.proratedDeposit.totalDepositAmount}
                                                    onChange={e => {
                                                        const total = parseFloat(e.target.value) || 0;
                                                        const dur = formData.proratedDeposit!.durationMonths;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            proratedDeposit: {
                                                                ...prev.proratedDeposit!,
                                                                totalDepositAmount: total,
                                                                monthlyInstallment: dur > 0 ? Math.ceil(total / dur) : total,
                                                            },
                                                        }));
                                                    }}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Monthly Installment</label>
                                                <input
                                                    type="number" min={0}
                                                    value={formData.proratedDeposit.monthlyInstallment}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        proratedDeposit: { ...prev.proratedDeposit!, monthlyInstallment: parseFloat(e.target.value) || 0 },
                                                    }))}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Duration (months)</label>
                                                <input
                                                    type="number" min={1} max={24}
                                                    value={formData.proratedDeposit.durationMonths}
                                                    onChange={e => {
                                                        const dur = Math.max(1, parseInt(e.target.value) || 1);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            proratedDeposit: {
                                                                ...prev.proratedDeposit!,
                                                                durationMonths: dur,
                                                                monthlyInstallment: Math.ceil(prev.proratedDeposit!.totalDepositAmount / dur),
                                                            },
                                                        }));
                                                    }}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Rent Extension */}
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            checked={!!formData.rentExtension?.enabled}
                                            onChange={e => {
                                                const enabled = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    rentExtension: enabled ? {
                                                        enabled: true,
                                                        rentDeferredUntil: (() => {
                                                            const d = new Date();
                                                            d.setMonth(d.getMonth() + 1);
                                                            d.setDate(1);
                                                            return d.toISOString().split('T')[0];
                                                        })(),
                                                        depositPaidUpfront: (prev.rentAmount || 0) * (prev.depositMonths ?? 1),
                                                        originalGraceDays: prev.rentGraceDays ?? 5,
                                                    } : undefined,
                                                    proratedDeposit: enabled ? undefined : prev.proratedDeposit,
                                                }));
                                            }}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-semibold text-gray-700">Rent Extension</span>
                                        <span className="text-xs text-gray-500 ml-1">— deposit paid now, first rent deferred to a set date (no grace after)</span>
                                    </label>

                                    {formData.rentExtension?.enabled && (
                                        <div className="ml-6 grid grid-cols-2 gap-3 p-3 bg-white border border-orange-100 rounded-lg">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Deposit Paid Upfront (KES)</label>
                                                <input
                                                    type="number" min={0}
                                                    value={formData.rentExtension.depositPaidUpfront}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        rentExtension: { ...prev.rentExtension!, depositPaidUpfront: parseFloat(e.target.value) || 0 },
                                                    }))}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">First Rent Due Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.rentExtension.rentDeferredUntil}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        rentExtension: { ...prev.rentExtension!, rentDeferredUntil: e.target.value },
                                                    }))}
                                                    className="w-full p-1.5 border rounded text-sm"
                                                />
                                                <p className="text-[10px] text-orange-600 mt-1">No grace after this date. Subsequent rent follows standard 1st-of-month schedule.</p>
                                            </div>
                                        </div>
                                    )}
                                </>)}
                            </div>
                            
                            {/* Recurring Bills */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Recurring Monthly Charges</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {['serviceCharge', 'garbage', 'security', 'waterFixed'].map(key => (
                                        <div key={key}>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                            <input 
                                                type="number" 
                                                name={key} 
                                                // If value is 0, show empty string to allow typing
                                                value={(formData.recurringBills as any)?.[key] === 0 ? '' : (formData.recurringBills as any)?.[key]} 
                                                onChange={handleRecurringBillChange} 
                                                placeholder="0"
                                                className="w-full p-1 pl-2 border rounded text-sm" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-20 h-20 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {formData.profilePicture || formData.avatar ? (
                                                <img src={formData.profilePicture || formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                            ) : <Icon name="user-circle" className="w-10 h-10 text-gray-400" />}
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary hover:underline">Upload Photo</button>
                                    </div>
                                </div>
                             </div>

                             <div className="border-t pt-4">
                                 <h4 className="text-sm font-bold text-gray-700 mb-3">Required Documents</h4>
                                 <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                     <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                         <input
                                             type="checkbox"
                                             checked={!!formData.leaseSigned}
                                             onChange={(e) =>
                                                 setFormData(prev => (e.target.checked
                                                     ? ensureLeaseDates({ ...prev, leaseSigned: true })
                                                     : { ...prev, leaseSigned: false }))
                                             }
                                         />
                                         Lease signed
                                     </label>
                                     <p className="text-xs text-gray-500 mt-1">
                                         If checked, a signed lease document must be uploaded below; otherwise the lease is treated as unsigned.
                                     </p>
                                     {!!formData.leaseSigned && (
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                             <div>
                                                 <label className="block text-xs font-bold text-gray-500 mb-1">Lease Start Date</label>
                                                 <input
                                                     type="date"
                                                     name="leaseStartDate"
                                                     value={String((formData as any).leaseStartDate || '')}
                                                     onChange={handleChange}
                                                     className="w-full p-2 border rounded bg-white"
                                                 />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-gray-500 mb-1">Lease Expiry Date</label>
                                                 <input
                                                     type="date"
                                                     name="leaseEnd"
                                                     value={String((formData as any).leaseEnd || '')}
                                                     onChange={handleChange}
                                                     className="w-full p-2 border rounded bg-white"
                                                 />
                                             </div>
                                         </div>
                                     )}
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {[
                                         'Full Picture', 
                                         'ID Front', 
                                         'ID Back', 
                                         'Lease Agreement', 
                                         'Inventory Checklist'
                                     ].map((doc, idx) => (
                                         <div key={idx} className="border border-dashed border-gray-300 rounded p-3 hover:bg-gray-50 transition-colors">
                                             <label className="block text-xs font-bold text-gray-500 mb-1">{doc}</label>
                                             <input
                                                 type="file"
                                                 onChange={(e) => handleDocUpload(e, doc)}
                                                 className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
                                             />
                                         </div>
                                     ))}
                                     <div className={`border border-dashed rounded p-3 transition-colors ${formData.leaseSigned ? 'border-green-400 hover:bg-green-50/40' : 'border-gray-300 hover:bg-gray-50'}`}>
                                         <label className="block text-xs font-bold text-gray-500 mb-1">Signed Lease (required if signed)</label>
                                         <input
                                             type="file"
                                             accept=".pdf,image/*"
                                             onChange={(e) => handleDocUpload(e, 'Signed Lease', 'Signed Lease Agreement')}
                                             className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
                                         />
                                         {Array.isArray(formData.documents) && formData.documents.some(d => String(d?.type ?? '') === 'Signed Lease Agreement' && String(d?.url ?? '').trim()) && (
                                             <p className="text-[10px] text-green-700 font-bold mt-1">Uploaded</p>
                                         )}
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white font-medium rounded hover:bg-primary-dark shadow-sm">Save Record</button>
                </div>
            </div>
        </div>
    );
};

const AppRecordPaymentModal: React.FC<{
    record: UnifiedRecord;
    onClose: () => void;
    onRecord: (amount: number, method: string, reference: string, date: string) => void;
}> = ({ record, onClose, onRecord }) => {
    const rent = Number(record.rentAmount || 0);
    const isApp = record.recordType === 'Application';

    // Compute expected first payment based on deposit mode
    const firstPaymentAmount = (() => {
        if (record.depositExempt) return rent;
        if (record.rentExtension?.enabled) return record.rentExtension.depositPaidUpfront || 0;
        if (record.proratedDeposit?.enabled) return rent + (record.proratedDeposit.monthlyInstallment || 0);
        if (isApp) {
            const depositMonths = record.depositMonths ?? 1;
            const depositAmt = Number(record.depositPaid || 0) || rent * depositMonths;
            return rent + depositAmt;
        }
        return rent + Number(record.depositPaid || 0);
    })();

    const [amount, setAmount] = useState(String(firstPaymentAmount));
    const [method, setMethod] = useState('Cash');
    const [reference, setReference] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const handleSubmit = (e?: React.MouseEvent) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        const val = parseFloat(amount);
        if (!Number.isFinite(val) || val <= 0) return alert('Enter a valid amount.');
        if (!reference.trim()) return alert('Reference is required.');
        onRecord(val, method, reference.trim(), date);
    };
    return (
        <div className="fixed inset-0 bg-black/60 z-[2100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Record Payment</h3>
                <p className="text-xs text-gray-500 mb-2">{record.name} • {record.recordType}</p>
                {isApp && (
                    <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded p-2 mb-3">
                        {record.rentExtension?.enabled
                            ? `Deposit only: KES ${(record.rentExtension.depositPaidUpfront || 0).toLocaleString()} (rent deferred to ${record.rentExtension.rentDeferredUntil})`
                            : record.proratedDeposit?.enabled
                                ? `Rent KES ${rent.toLocaleString()} + deposit installment KES ${(record.proratedDeposit.monthlyInstallment || 0).toLocaleString()}`
                                : record.depositExempt
                                    ? `Rent only: KES ${rent.toLocaleString()} (deposit exempt)`
                                    : `Rent + deposit: KES ${firstPaymentAmount.toLocaleString()}`}
                    </p>
                )}
                <div className="space-y-3">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded" placeholder="Amount" />
                    <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 border rounded bg-white">
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                        <option>M-Pesa (Manual)</option>
                        <option>Cheque</option>
                    </select>
                    <input value={reference} onChange={e => setReference(e.target.value)} className="w-full p-2 border rounded" placeholder="Reference" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div className="flex justify-end gap-2 mt-5">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded font-bold">Record</button>
                </div>
            </div>
        </div>
    );
};

const AppMpesaModal: React.FC<{
    record: UnifiedRecord;
    getPaymentUserId: (record: UnifiedRecord) => string | null;
    onClose: () => void;
    onPaid: (amount: number, reference: string) => void;
}> = ({ record, getPaymentUserId, onClose, onPaid }) => {
    const [phone, setPhone] = useState(record.phone || '');
    const [amount, setAmount] = useState(Number(record.rentAmount || 0) + Number(record.depositPaid || 0));
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'processing' | 'timed_out'>('input');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const userId = getPaymentUserId(record);

    useEffect(() => {
        if (!userId || !checkoutId) return;
        return followStkPaymentCompletion(supabase, userId, checkoutId, (row) => {
            const status = String(row.status ?? '');
            if (status === 'completed') {
                onPaid(amount, String(row.transaction_id ?? checkoutId));
            } else if (status === 'failed' || status === 'cancelled') {
                setError(String(row.result_desc ?? 'Payment did not complete.'));
                setStep('input');
                setBusy(false);
                setCheckoutId(null);
            } else if (status === 'timed_out') {
                setStep('timed_out');
                setBusy(false);
            }
        });
    }, [userId, checkoutId, amount, onPaid, record]);

    const handlePay = async () => {
        if (!userId) {
            setError('This record is not linked to a login-enabled user yet. Use manual payment or link user first.');
            return;
        }
        if (!/^(2547|07)\d{8}$/.test(phone.replace(/\s/g, ''))) {
            setError('Enter a valid Kenyan mobile number.');
            return;
        }
        const roundedAmt = Math.round(amount);
        if (!Number.isFinite(roundedAmt) || roundedAmt < 1) {
            setError('Enter a valid amount (minimum KES 1).');
            return;
        }
        if (roundedAmt > 150_000) {
            setError('Amount exceeds the M-Pesa per-transaction limit of KES 150,000.');
            return;
        }
        setError(null);
        setBusy(true);
        setStep('processing');
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('mpesa-stk-push', {
                body: { phone, amount: Math.round(amount), leaseId: record.id ?? null, userId },
            });
            if (invokeError) throw invokeError;
            const id = String((data as any)?.checkoutRequestId ?? '').trim();
            if (!id) throw new Error('CheckoutRequestID missing from STK response');
            setCheckoutId(id);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to initiate STK.');
            setStep('input');
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[2100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-3">M-Pesa Payment</h3>
                <p className="text-xs text-gray-500 mb-4">{record.name} • {record.recordType}</p>
                {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2 rounded mb-3">{error}</p>}
                {step === 'input' ? (
                    <div className="space-y-3">
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded" placeholder="07..." />
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)} className="w-full p-2 border rounded" placeholder="Amount" />
                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                            <button onClick={handlePay} disabled={busy} className="px-4 py-2 bg-green-700 text-white rounded font-bold disabled:opacity-50">
                                {busy ? 'Sending...' : 'Send STK'}
                            </button>
                        </div>
                    </div>
                ) : step === 'timed_out' ? (
                    <div className="py-4 text-center">
                        <div className="text-4xl mb-3">⏱</div>
                        <p className="font-semibold text-gray-700 mb-1">Taking longer than expected</p>
                        <p className="text-xs text-gray-500 mb-4">
                            No confirmation received. Check your M-Pesa messages — if it went through, use <strong>Record Payment</strong> with the M-Pesa code.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => { setStep('input'); setCheckoutId(null); setError(null); }}
                                className="px-4 py-2 bg-gray-100 rounded font-medium text-sm"
                            >
                                Try Again
                            </button>
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded font-medium text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 text-center">
                        <p className="font-semibold text-gray-800">Check your phone</p>
                        <p className="text-sm text-gray-500 mt-1">Approve the STK prompt to complete payment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProfileHubModal: React.FC<{
    record: UnifiedRecord;
    onClose: () => void;
    onManualPay: () => void;
    onStkPay: () => void;
    onEdit: () => void;
    onMove?: () => void;
    onDelete?: () => void;
    onApprove?: () => void;
    isApproved?: boolean;
    canApprove?: boolean;
}> = ({ record, onClose, onManualPay, onStkPay, onEdit, onMove, onDelete, onApprove, isApproved = false, canApprove = false }) => {
    const isApp = record.recordType === 'Application';
    const payDisabled = isApp && !isApproved;
    return (
        <div className="fixed inset-0 bg-black/60 z-[2150] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">View Profile</h3>
                        <p className="text-xs text-gray-500 mt-1">{record.name} • {record.propertyName || record.property} • {record.unit}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">
                        <Icon name="close" className="w-4 h-4" />
                    </button>
                </div>

                {isApp && (
                    <div className="mt-1">
                        <button
                            type="button"
                            onClick={onApprove}
                            disabled={!canApprove || isApproved}
                            className={`w-full py-3 rounded-lg font-bold transition-colors shadow-sm ${
                                isApproved
                                    ? 'bg-green-50 text-green-800 border border-green-200 cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-primary-dark border border-primary/20'
                            } ${(!canApprove || isApproved) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {isApproved ? 'Approved' : 'Approve then Pay'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onManualPay}
                        disabled={payDisabled}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Record Manual Pay
                    </button>
                    <button
                        type="button"
                        onClick={onStkPay}
                        disabled={payDisabled}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md transition-colors"
                    >
                        M-Pesa Push
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                    <button type="button" onClick={onEdit} className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded font-bold text-xs hover:bg-gray-200">
                        Edit Details
                    </button>
                    {onMove && (
                        <button type="button" onClick={onMove} className="px-4 py-2 bg-blue-50 text-blue-800 rounded font-bold text-xs hover:bg-blue-100">
                            Move
                        </button>
                    )}
                    {onDelete && (
                        <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-50 text-red-700 rounded font-bold text-xs hover:bg-red-100">
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const Applications: React.FC = () => {
    const { applications, tenants, properties, addApplication, updateApplication, addTenant, updateTenant, updateProperty, deleteTenant, deleteApplication } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<UnifiedRecord | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Tenant' | 'Application'>('All');
    const [moveTenant, setMoveTenant] = useState<TenantProfile | null>(null);
    const [manualPayRecord, setManualPayRecord] = useState<UnifiedRecord | null>(null);
    const [stkPayRecord, setStkPayRecord] = useState<UnifiedRecord | null>(null);
    const [profileHubRecord, setProfileHubRecord] = useState<UnifiedRecord | null>(null);

    const handleAddNew = () => {
        // Redirect to primary registration flow for Tenants (Registration > Users),
        // treating this button as a shortcut to the main registration module.
        try {
            window.location.hash = '#/registration/users?category=tenants';
        } catch {
            // Fallback: keep legacy behavior if hash navigation is unavailable
            setSelectedRecord({ recordType: 'Application', displayStatus: 'New' });
            setIsModalOpen(true);
        }
    };

    const handleEdit = (record: UnifiedRecord) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleApproveApplication = (record: UnifiedRecord) => {
        if (record.recordType !== 'Application' || !record.id) return;

        if (!record.propertyId || !record.unitId) {
            alert('Select a property and unit before approving.');
            return;
        }

        const prop = properties.find(p => p.id === record.propertyId);
        const unit = prop?.units?.find(u => u.id === record.unitId);

        if (!prop || !unit) {
            alert('Could not find property/unit to approve this application.');
            return;
        }

        const resolvedPropertyName = (record.propertyName || record.property || prop.name || '').toString();
        const resolvedUnitNumber = (record.unit || unit.unitNumber || '').toString();
        const rentAmount = Number(record.rentAmount || unit.rent || prop.defaultMonthlyRent || 0);
        const isDepositExempt = !!(record as any).depositExempt;
        const depositMonths = Number((record as any).depositMonths ?? 1);
        const proratedDeposit = (record as any).proratedDeposit;
        const rentExtension = (record as any).rentExtension;
        const depositPaidRaw = Number((record as any).depositPaid || 0);

        let depositPaid: number;
        if (isDepositExempt) {
            depositPaid = 0;
        } else if (proratedDeposit?.enabled) {
            depositPaid = 0; // starts at 0, increments per installment
        } else if (rentExtension?.enabled) {
            depositPaid = rentExtension.depositPaidUpfront || 0;
        } else {
            depositPaid = depositPaidRaw > 0 ? depositPaidRaw : rentAmount * depositMonths;
        }

        if (rentAmount <= 0) {
            alert('Rent must be set before approving.');
            return;
        }
        if (!isDepositExempt && depositPaid <= 0 && !proratedDeposit?.enabled) {
            alert('Deposit must be set before approving (or mark tenant as Deposit Exempt).');
            return;
        }

        updateApplication(record.id, {
            status: 'Approved',
            propertyName: resolvedPropertyName,
            property: resolvedPropertyName, // legacy
            unit: resolvedUnitNumber,
            unitId: record.unitId,
            propertyId: record.propertyId,
            rentAmount,
            depositPaid,
            depositExempt: isDepositExempt,
            depositMonths,
            proratedDeposit,
            rentExtension,
        } as any);

        setProfileHubRecord(prev =>
            prev && prev.id === record.id
                ? ({
                    ...prev,
                    status: 'Approved',
                    displayStatus: 'Approved',
                    propertyId: record.propertyId,
                    unitId: record.unitId,
                    propertyName: resolvedPropertyName,
                    property: resolvedPropertyName,
                    unit: resolvedUnitNumber,
                    rentAmount,
                    depositPaid,
                    depositExempt: isDepositExempt,
                    depositMonths,
                    proratedDeposit,
                    rentExtension,
                } as any)
                : prev,
        );
    };

    const handleMoveClick = (tenant: TenantProfile) => {
        setMoveTenant(tenant);
    };

    const handleMoveSubmit = (propertyId: string, unitId: string, propertyName: string, unitName: string) => {
        if (moveTenant) {
            // 1. Vacate old unit
            if (moveTenant.propertyId) {
                const oldProp = properties.find(p => p.id === moveTenant.propertyId);
                if (oldProp) {
                     const updatedUnits = oldProp.units.map(u => u.id === moveTenant.unitId ? { ...u, status: 'Vacant' } : u);
                     updateProperty(oldProp.id, { units: updatedUnits as Unit[] });
                }
            }
            
            // 2. Occupy new unit
            const newProp = properties.find(p => p.id === propertyId);
            if (newProp) {
                const updatedUnits = newProp.units.map(u => u.id === unitId ? { ...u, status: 'Occupied' } : u);
                updateProperty(propertyId, { units: updatedUnits as Unit[] });
            }

            const targetUnit = newProp?.units.find(u => u.id === unitId);
            const targetRent = Number(targetUnit?.rent ?? 0) || 0;

            // 3. Update Tenant
            const moveNote = `Moved from ${moveTenant.propertyName} - ${moveTenant.unit} to ${propertyName} - ${unitName} on ${new Date().toLocaleDateString()}`;
            updateTenant(moveTenant.id, {
                propertyId,
                unitId,
                propertyName,
                unit: unitName,
                // Auto-populate rent from the selected unit (supports variable rent per unit type/floor).
                rentAmount: targetRent,
                notes: [...(moveTenant.notes || []), moveNote]
            });

            setMoveTenant(null);
            alert("Tenant moved successfully.");
        }
    };

    const handleDelete = (record: UnifiedRecord) => {
        if (!record.id) return;
        
        const confirmMsg = record.recordType === 'Tenant' 
            ? `Are you sure you want to delete tenant ${record.name}? This will free up the unit.`
            : `Are you sure you want to delete application for ${record.name}?`;
            
        if (confirm(confirmMsg)) {
            if (record.recordType === 'Tenant') {
                deleteTenant(record.id);
            } else {
                deleteApplication(record.id);
            }
            alert(`${record.recordType} deleted successfully.`);
        }
    };

    const handleSave = (data: UnifiedRecord) => {
        // --- 1. Handle Active Tenant (Reallocation, Edit, or brand-new Tenant) ---
        if (data.recordType === 'Tenant') {
            const oldRecord = data.id ? tenants.find(t => t.id === data.id) : undefined;

            // Check for Property/Unit Change (Reallocation) via Edit Modal
            if (oldRecord && (oldRecord.propertyId !== data.propertyId || oldRecord.unitId !== data.unitId)) {
                // 1. Vacate Old Unit
                if (oldRecord.propertyId && oldRecord.unitId) {
                    const oldProp = properties.find(p => p.id === oldRecord.propertyId);
                    if (oldProp) {
                        const updatedUnits = oldProp.units.map(u => u.id === oldRecord.unitId ? { ...u, status: 'Vacant' } : u);
                        updateProperty(oldProp.id, { units: updatedUnits as Unit[] });
                    }
                }
                // 2. Occupy New Unit
                const newProp = properties.find(p => p.id === data.propertyId);
                if (newProp) {
                    const updatedUnits = newProp.units.map(u => u.id === data.unitId ? { ...u, status: 'Occupied' } : u);
                    updateProperty(newProp.id, { units: updatedUnits as Unit[] });
                }
            }

            if (oldRecord) {
                updateTenant(oldRecord.id, {
                    ...data,
                    propertyId: data.propertyId,
                    propertyName: data.propertyName,
                    unitId: data.unitId,
                    unit: data.unit
                } as TenantProfile);
                alert(oldRecord.unitId !== data.unitId ? "Tenant reallocated successfully!" : "Tenant details updated.");
            } else {
                // Brand-new tenant created directly (no application path). Previously
                // this hit updateTenant with an id that didn't exist and silently
                // dropped the record — see bug #13 ("tenants saved but invisible").
                const newTenant = {
                    ...data,
                    id: data.id || `tenant-${Date.now()}`,
                    paymentHistory: Array.isArray(data.paymentHistory) ? data.paymentHistory : [],
                    outstandingBills: Array.isArray((data as any).outstandingBills) ? (data as any).outstandingBills : [],
                    outstandingFines: Array.isArray((data as any).outstandingFines) ? (data as any).outstandingFines : [],
                    maintenanceRequests: Array.isArray((data as any).maintenanceRequests) ? (data as any).maintenanceRequests : [],
                    onboardingDate: (data as any).onboardingDate || new Date().toISOString().split('T')[0],
                } as TenantProfile;
                if (newTenant.propertyId && newTenant.unitId) {
                    const newProp = properties.find(p => p.id === newTenant.propertyId);
                    if (newProp) {
                        const updatedUnits = newProp.units.map(u => u.id === newTenant.unitId ? { ...u, status: 'Occupied' } : u);
                        updateProperty(newProp.id, { units: updatedUnits as Unit[] });
                    }
                }
                addTenant(newTenant);
                alert("Tenant added.");
            }
        }
        // --- 2. Handle Application ---
        else {
            if (data.id && applications.find(a => a.id === data.id)) {
                updateApplication(data.id, data as TenantApplication);
            } else {
                addApplication({ ...data, id: `app-${Date.now()}`, submittedDate: new Date().toISOString().split('T')[0], status: 'New' } as TenantApplication);
            }
        }
        
        setIsModalOpen(false);
    };

    const getPaymentUserId = (record: UnifiedRecord): string | null => {
        if (record.recordType === 'Tenant') {
            const t = tenants.find(x => x.id === record.id);
            if (!t) return null;
            if (t.authUserId && isUuid(t.authUserId)) return t.authUserId;
            if (isUuid(t.id)) return t.id;
            const targetCanonical = canonicalizePhone(t.phone);
            const byPhone = targetCanonical
                ? tenants.find(x => canonicalizePhone(x.phone) === targetCanonical && x.authUserId && isUuid(x.authUserId))
                : undefined;
            return byPhone?.authUserId ?? null;
        }
        if (record.recordType === 'Application') {
            const authUserId = (record as any).authUserId;
            if (authUserId && isUuid(authUserId)) return authUserId;
            // For applications created by other flows that don't include authUserId yet,
            // STK polling cannot be completed reliably.
            return null;
        }
        const recordCanonical = canonicalizePhone(record.phone);
        const byPhone = recordCanonical
            ? tenants.find(
                x => canonicalizePhone(x.phone) === recordCanonical && ((x.authUserId && isUuid(x.authUserId)) || isUuid(x.id)),
            )
            : undefined;
        if (!byPhone) return null;
        return byPhone.authUserId && isUuid(byPhone.authUserId) ? byPhone.authUserId : (isUuid(byPhone.id) ? byPhone.id : null);
    };

    const applyPaidState = (record: UnifiedRecord, amount: number, reference: string, method: string, date?: string) => {
        const payment = {
            date: (date && String(date).trim()) ? String(date).trim() : new Date().toISOString().split('T')[0],
            amount: `KES ${Number(amount || 0).toLocaleString()}`,
            status: 'Paid' as const,
            method,
            reference,
        };
        if (record.recordType === 'Tenant' && record.id) {
            const t = tenants.find(x => x.id === record.id);
            if (!t) return;
            const isPending = t.status === 'Pending' || t.status === 'PendingAllocation' || t.status === 'PendingPayment';
            updateTenant(record.id, {
                paymentHistory: [payment, ...(t.paymentHistory || [])],
                status: isPending ? 'Active' : t.status,
                activationDate: isPending ? new Date().toISOString().split('T')[0] : (t as any).activationDate,
            });
            return;
        }
        if (record.recordType === 'Application' && record.id) {
            const app = applications.find(a => a.id === record.id) ?? (record as any as TenantApplication);
            if (!app) return;

            if (String(app.status ?? '') !== 'Approved') {
                alert('Please approve the application first, then record the payment.');
                return;
            }

            if (!app.propertyId || !app.unitId) {
                alert('Property and unit allocation are required to activate the tenant.');
                return;
            }

            const prop = properties.find(p => p.id === app.propertyId);
            const unit = prop?.units?.find(u => u.id === app.unitId);
            if (!prop || !unit) {
                alert('Could not find the property/unit for this application.');
                return;
            }

            const rentAmount = Number(app.rentAmount || unit.rent || prop.defaultMonthlyRent || 0);
            const isDepositExempt = !!(app as any).depositExempt;
            const appDepositMonths = Number((app as any).depositMonths ?? 1);
            const appProrated = (app as any).proratedDeposit as TenantProfile['proratedDeposit'];
            const appRentExtension = (app as any).rentExtension as TenantProfile['rentExtension'];

            // ── Compute expected first payment ────────────────────────────────
            let expectedTotal: number;
            let depositPaid: number;
            let nextDueDateIso: string;
            let graceDays = Number(app.rentGraceDays ?? 5);

            if (isDepositExempt) {
                expectedTotal = rentAmount;
                depositPaid = 0;
                const dueDay = Math.min(28, Math.max(1, Number(app.rentDueDate ?? 1)));
                const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(dueDay); d.setHours(0, 0, 0, 0);
                nextDueDateIso = d.toISOString().split('T')[0];
            } else if (appRentExtension?.enabled) {
                expectedTotal = appRentExtension.depositPaidUpfront || 0;
                depositPaid = appRentExtension.depositPaidUpfront || 0;
                // First rent deferred; no grace period after the deferred date
                nextDueDateIso = appRentExtension.rentDeferredUntil;
                graceDays = 0;
            } else if (appProrated?.enabled) {
                expectedTotal = rentAmount + (appProrated.monthlyInstallment || 0);
                depositPaid = 0; // will be tracked via proratedDeposit.amountPaidSoFar
                const dueDay = Math.min(28, Math.max(1, Number(app.rentDueDate ?? 1)));
                const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(dueDay); d.setHours(0, 0, 0, 0);
                nextDueDateIso = d.toISOString().split('T')[0];
            } else {
                // Normal or multi-month: full deposit at first payment
                const storedDeposit = Number((app as any).depositPaid || 0);
                depositPaid = storedDeposit > 0 ? storedDeposit : rentAmount * appDepositMonths;
                expectedTotal = rentAmount + depositPaid;
                const dueDay = Math.min(28, Math.max(1, Number(app.rentDueDate ?? 1)));
                const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(dueDay); d.setHours(0, 0, 0, 0);
                nextDueDateIso = d.toISOString().split('T')[0];
            }

            if (expectedTotal > 0 && Number(amount || 0) + 0.01 < expectedTotal) {
                const label = appRentExtension?.enabled
                    ? 'deposit upfront'
                    : appProrated?.enabled
                        ? 'rent + deposit installment'
                        : isDepositExempt
                            ? 'rent (deposit exempt)'
                            : 'rent + deposit';
                alert(`First payment must cover ${label} (expected KES ${expectedTotal.toLocaleString()}).`);
                return;
            }

            const existingActiveSameUnit = tenants.find(
                t => t.propertyId === app.propertyId && t.unitId === app.unitId && t.status === 'Active' && t.id !== app.id,
            );
            if (existingActiveSameUnit) {
                alert('This unit is already allocated to an active tenant.');
                return;
            }

            // 1) Mark unit as occupied.
            const updatedUnits = prop.units.map(u => (u.id === app.unitId ? { ...u, status: 'Occupied' } : u));
            updateProperty(prop.id, { units: updatedUnits as any });

            // Build prorated deposit initial state if applicable
            let resolvedProratedDeposit = appProrated?.enabled
                ? {
                    ...appProrated,
                    monthsPaid: 1,
                    amountPaidSoFar: appProrated.monthlyInstallment || 0,
                }
                : undefined;

            // 2) Upsert TenantProfile.
            const tenantPayload: Partial<TenantProfile> = {
                id: app.id,
                name: app.name,
                username: '',
                email: String(app.email || ''),
                phone: String(app.phone || ''),
                alternativePhone: (app as any).alternativePhone || undefined,
                nextOfKinName: (app as any).nextOfKinName || undefined,
                nextOfKinPhone: (app as any).nextOfKinPhone || undefined,
                nextOfKinRelationship: (app as any).nextOfKinRelationship || undefined,
                idNumber: String(app.idNumber || ''),
                status: 'Active',
                activationDate: new Date().toISOString().split('T')[0],
                propertyId: app.propertyId,
                propertyName: app.propertyName || prop.name,
                unitId: app.unitId,
                unit: app.unit || unit.unitNumber,
                rentAmount: rentAmount,
                rentDueDate: app.rentDueDate,
                rentGraceDays: graceDays,
                depositPaid,
                depositExpected: isDepositExempt
                    ? 0
                    : appRentExtension?.enabled
                        ? (appRentExtension.depositPaidUpfront || 0)
                        : appProrated?.enabled
                            ? (appProrated.totalDepositAmount || 0)
                            : (rentAmount * appDepositMonths),
                onboardingDate: new Date().toISOString().split('T')[0],
                nextDueDate: nextDueDateIso,
                leaseSigned: !!app.leaseSigned,
                leaseStartDate: app.leaseStartDate,
                leaseEnd: app.leaseEnd,
                paymentHistory: [payment],
                outstandingBills: [],
                outstandingFines: [],
                maintenanceRequests: [],
                authUserId: (app as any).authUserId,
                avatar: app.avatar,
                profilePicture: (app as any).profilePicture,
                kraPin: app.kraPin,
                // Deposit special-case fields
                depositExempt: isDepositExempt || undefined,
                depositMonths: appDepositMonths > 1 ? appDepositMonths : undefined,
                proratedDeposit: resolvedProratedDeposit,
                rentExtension: appRentExtension?.enabled ? appRentExtension : undefined,
            };

            const alreadyTenant = tenants.find(t => t.id === app.id);
            if (alreadyTenant) {
                updateTenant(app.id, {
                    ...tenantPayload,
                    paymentHistory: [payment, ...(alreadyTenant.paymentHistory || [])],
                } as any);
            } else {
                addTenant(tenantPayload as TenantProfile);
            }

            // 3) Remove the application so it effectively "moves" into Active tenants.
            deleteApplication(app.id);
            return;
        }

        if (record.id) {
            updateApplication(record.id, { status: 'Approved' } as Partial<TenantApplication>);
        }
    };

    // --- Combine Data Sources ---
    const unifiedList: UnifiedRecord[] = useMemo(() => {
        const activeTenants: UnifiedRecord[] = tenants.map(t => ({
            ...t,
            recordType: 'Tenant',
            displayStatus: t.status,
            submittedDate: t.onboardingDate
        }));

        const applicantRecords: UnifiedRecord[] = applications.map(a => ({
            ...a,
            recordType: 'Application',
            displayStatus: a.status
        }));

        return [...activeTenants, ...applicantRecords].sort((a,b) => new Date(b.submittedDate || '').getTime() - new Date(a.submittedDate || '').getTime());
    }, [tenants, applications]);

    const filteredList = useMemo(() => {
        return unifiedList.filter(item => {
            const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (item.unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (item.propertyName || item.property || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'All' || item.recordType === filterType;
            return matchesSearch && matchesType;
        });
    }, [unifiedList, searchQuery, filterType]);

    const getStatusColor = (status: string, type: string) => {
        if (type === 'Tenant') {
            if (status === 'Active') return 'bg-green-100 text-green-800';
            if (status === 'Overdue') return 'bg-red-100 text-red-800';
            return 'bg-gray-100 text-gray-800';
        } else {
            if (status === 'Approved') return 'bg-blue-100 text-blue-800';
            if (status === 'New') return 'bg-purple-100 text-purple-800';
            return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Master Registry</h1>
                    <p className="text-lg text-gray-500 mt-1">Unified view of all Applicants and Active Tenants. Manage details and reallocate units.</p>
                </div>
                <button onClick={handleAddNew} className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark shadow-sm flex items-center space-x-2">
                    <Icon name="register" className="w-5 h-5"/>
                    <span>New Application</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4">
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name, unit..." 
                            className="p-2 border rounded-lg w-64 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="p-2 border rounded-lg bg-white"
                        >
                            <option value="All">All Records</option>
                            <option value="Tenant">Active Tenants</option>
                            <option value="Application">Applicants</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredList.map(record => {
                        const currentMonthIso = new Date().toISOString().slice(0, 7);
                        const isApplication = record.recordType === 'Application';
                        const tenant = record as any as TenantProfile;

                        const isAllocated = !isApplication ? tenantFullyAllocated(tenant) : false;
                        const isPaid = !isApplication && Array.isArray(tenant.paymentHistory)
                            ? tenant.paymentHistory.some(p => p.date.startsWith(currentMonthIso) && p.status === 'Paid')
                            : false;

                        const rentAmountForApps = Number(record.rentAmount || 0);

                        // For applications: show the deposit *owed*, not what's already been paid.
                        // Exempt → 0; rent extension → deposit upfront amount; prorated → monthly installment;
                        // multi-month / standard → rent × depositMonths (default 1).
                        const depositForApps = (() => {
                            if (!isApplication) return Number((record as any).depositPaid || 0);
                            if ((record as any).depositExempt) return 0;
                            if ((record as any).rentExtension?.enabled) {
                                return Number((record as any).rentExtension.depositPaidUpfront || 0);
                            }
                            if ((record as any).proratedDeposit?.enabled) {
                                return Number((record as any).proratedDeposit.monthlyInstallment || 0);
                            }
                            const depositMonths = Number((record as any).depositMonths ?? 1);
                            const stored = Number((record as any).depositPaid || 0);
                            return stored > 0 ? stored : rentAmountForApps * depositMonths;
                        })();

                        const rentDisplay = isApplication
                            ? rentAmountForApps
                            : Number(isAllocated ? (tenant.rentAmount ?? 0) : 0);

                        const automatedLateFine = !isApplication && isAllocated
                            ? getMonthlyRentStatus(tenant, { isRentPaidThisMonth: isPaid }).automatedLateFine
                            : 0;

                        const pendingBills = !isApplication && isAllocated
                            ? (tenant.outstandingBills?.filter(b => b.status === 'Pending').reduce((s, b) => s + b.amount, 0) || 0)
                            : 0;

                        const pendingFines = !isApplication && isAllocated
                            ? (tenant.outstandingFines?.filter(f => f.status === 'Pending').reduce((s, f) => s + f.amount, 0) || 0)
                            : 0;

                        const rentDue = isApplication
                            ? rentAmountForApps
                            : (!isAllocated ? 0 : (isPaid ? 0 : (tenant.rentAmount ?? 0)));

                        const totalDue = isApplication
                            ? (rentAmountForApps + depositForApps)
                            : (rentDue + pendingBills + pendingFines + automatedLateFine);

                        const arrearsText = !isApplication ? getArrearsText(tenant) : null;

                        return (
                            <div
                                key={record.id}
                                className={APP_CARD_CLASSES}
                                onClick={() => setProfileHubRecord(record)}
                            >
                                <div className="flex flex-col h-full w-full">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200 uppercase">
                                                {record.avatar ? String(record.avatar).charAt(0) : (record.name?.charAt(0) ?? '?')}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{record.name}</h3>
                                                <p className="text-xs text-gray-500">{record.unit} • {record.propertyName || record.property}</p>
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
                                            {!isApplication && tenant.houseStatus && tenant.houseStatus.length > 0 && (
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {tenant.houseStatus.slice(0, 2).map((status: string) => (
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
                                            <p className="font-semibold">KES {Number(rentDisplay ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold">
                                                {isApplication
                                                    ? ((record as any).depositExempt
                                                        ? 'Total Due'
                                                        : (record as any).rentExtension?.enabled
                                                            ? 'Deposit Due'
                                                            : (record as any).proratedDeposit?.enabled
                                                                ? 'Rent + Installment'
                                                                : 'Rent + Deposit')
                                                    : 'Total Due'}
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
                                        <button type="button" className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200 transition-colors">
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredList.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">No records found.</div>
                    )}
                </div>
            </div>
            
            {isModalOpen && (
                <ApplicationFormModal 
                    record={selectedRecord} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    properties={properties}
                />
            )}
            {profileHubRecord && (
                <ProfileHubModal
                    record={profileHubRecord}
                    onClose={() => setProfileHubRecord(null)}
                    onManualPay={() => {
                        if (profileHubRecord.recordType === 'Application' && String((profileHubRecord as any).status ?? '') !== 'Approved') {
                            alert('Please approve the application first.');
                            return;
                        }
                        setProfileHubRecord(null);
                        setManualPayRecord(profileHubRecord);
                    }}
                    onStkPay={() => {
                        if (profileHubRecord.recordType === 'Application' && String((profileHubRecord as any).status ?? '') !== 'Approved') {
                            alert('Please approve the application first.');
                            return;
                        }
                        setProfileHubRecord(null);
                        setStkPayRecord(profileHubRecord);
                    }}
                    onEdit={() => {
                        setProfileHubRecord(null);
                        handleEdit(profileHubRecord);
                    }}
                    onMove={
                        profileHubRecord.recordType === 'Tenant'
                            ? () => {
                                setProfileHubRecord(null);
                                handleMoveClick(profileHubRecord as TenantProfile);
                            }
                            : undefined
                    }
                    onDelete={() => {
                        setProfileHubRecord(null);
                        handleDelete(profileHubRecord);
                    }}
                    onApprove={() => handleApproveApplication(profileHubRecord)}
                    isApproved={profileHubRecord.recordType === 'Application' ? String((profileHubRecord as any).status ?? '') === 'Approved' : true}
                    canApprove={profileHubRecord.recordType === 'Application' ? !!profileHubRecord.propertyId && !!profileHubRecord.unitId : false}
                />
            )}
            
            {moveTenant && (
                <MoveTenantModal 
                    tenant={moveTenant}
                    onClose={() => setMoveTenant(null)}
                    onMove={handleMoveSubmit}
                    properties={properties}
                />
            )}
            {manualPayRecord && (
                <AppRecordPaymentModal
                    record={manualPayRecord}
                    onClose={() => setManualPayRecord(null)}
                    onRecord={(amount, method, reference, date) => {
                        applyPaidState(manualPayRecord, amount, reference, method, date);
                        setManualPayRecord(null);
                    }}
                />
            )}
            {stkPayRecord && (
                <AppMpesaModal
                    record={stkPayRecord}
                    getPaymentUserId={getPaymentUserId}
                    onClose={() => setStkPayRecord(null)}
                    onPaid={(amount, reference) => {
                        applyPaidState(stkPayRecord, amount, reference, 'M-Pesa');
                        setStkPayRecord(null);
                    }}
                />
            )}
        </div>
    );
};

export default Applications;
