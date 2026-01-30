
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { TenantApplication, RecurringBillSettings, TenantProfile, Unit, Property } from '../../types';
import Icon from '../Icon';

// Helper type to unify TenantProfile and TenantApplication for the UI
export type UnifiedRecord = Omit<Partial<TenantApplication> & Partial<TenantProfile>, 'status'> & {
    status?: string;
    recordType: 'Tenant' | 'Application';
    displayStatus: string;
    submittedDate?: string;
    referrerId?: string; // Added to track specific person
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
    const { tenants, landlords, staff } = useData(); // Context for referrer lookups
    const [activeTab, setActiveTab] = useState<'details' | 'lease' | 'documents'>('details');
    
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
        source: record?.source || 'Walk-in'
    });

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

        setFormData(prev => ({ 
            ...prev, 
            unitId: uId, 
            unit: unit?.unitNumber,
            rentAmount: rent,
            depositPaid: rent // Default deposit to 1 month
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

    const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                // Handle different field names in types
                if (record?.recordType === 'Tenant') {
                    setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                } else {
                    setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
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

            if (day < 10) {
                // 1st to 9th: Full Rent
                calculated = monthlyRent;
                note = "Full month rent charged (Joined 1st-9th)";
            } else if (day <= 25) {
                // 10th to 25th: Prorated
                // Days remaining inclusive
                const daysRemaining = Math.max(0, 30 - day + 1); 
                calculated = (monthlyRent / 30) * daysRemaining;
                note = `Prorated: ${daysRemaining} days remaining`;
            } else {
                // After 25th: Prorated + Next Month
                const daysRemaining = Math.max(0, 30 - day + 1);
                const prorated = (monthlyRent / 30) * daysRemaining;
                calculated = prorated + monthlyRent;
                note = "Prorated days + Next Month's Rent (Joined after 25th)";
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

        onSave({
            ...formData,
            propertyId: selectedPropertyId,
            unitId: selectedUnitId
        });
    };

    // Generic Document Upload Handler (Mock)
    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
        if (e.target.files && e.target.files[0]) {
             alert(`${docType} selected: ${e.target.files[0].name}`);
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
            // Using Staff (Agents) as affiliates for this context
            options = staff.map(s => ({ id: s.id, name: s.name, sub: s.role }));
            label = "Select Affiliate/Agent";
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
                                    <input name="idNumber" value={formData.idNumber || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">KRA PIN</label>
                                    <input name="kraPin" value={formData.kraPin || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Primary Phone*</label>
                                    <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                                    <input name="email" value={formData.email || ''} onChange={handleChange} className="w-full p-2 border rounded" />
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
                                
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Deposit Amount</label>
                                    <input type="number" name="depositPaid" value={formData.depositPaid} onChange={handleAmountChange} className="w-full p-2 border rounded" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-blue-600 mb-1">Rent Due (Invoiced)</label>
                                    <input type="number" className="w-full p-2 border rounded bg-blue-50 font-bold text-blue-800" value={rentDue} disabled />
                                    <p className="text-[10px] text-gray-500 mt-1 italic">{calcNote}</p>
                                </div>
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
                                             <input type="file" onChange={(e) => handleDocUpload(e, doc)} className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300" />
                                         </div>
                                     ))}
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

const Applications: React.FC = () => {
    const { applications, tenants, properties, addApplication, updateApplication, updateTenant, updateProperty, deleteTenant, deleteApplication } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<UnifiedRecord | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Tenant' | 'Application'>('All');
    const [moveTenant, setMoveTenant] = useState<TenantProfile | null>(null);

    const handleAddNew = () => {
        setSelectedRecord({ recordType: 'Application', displayStatus: 'New' });
        setIsModalOpen(true);
    };

    const handleEdit = (record: UnifiedRecord) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
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

            // 3. Update Tenant
            const moveNote = `Moved from ${moveTenant.propertyName} - ${moveTenant.unit} to ${propertyName} - ${unitName} on ${new Date().toLocaleDateString()}`;
            updateTenant(moveTenant.id, {
                propertyId,
                unitId,
                propertyName,
                unit: unitName,
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
        // --- 1. Handle Active Tenant (Reallocation or Edit) ---
        if (data.recordType === 'Tenant') {
            const oldRecord = tenants.find(t => t.id === data.id);
            
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

            // Update Tenant Record
            updateTenant(data.id!, {
                ...data,
                propertyId: data.propertyId,
                propertyName: data.propertyName,
                unitId: data.unitId,
                unit: data.unit
            } as TenantProfile);
            
            alert(oldRecord && oldRecord.unitId !== data.unitId ? "Tenant reallocated successfully!" : "Tenant details updated.");
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

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property / Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredList.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${record.recordType === 'Tenant' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-blue-200 text-blue-700'}`}>
                                            {record.recordType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        <div className="flex items-center">
                                            {record.avatar || record.profilePicture ? (
                                                <img src={record.avatar || record.profilePicture} alt="" className="w-8 h-8 rounded-full mr-3 object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {record.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div>{record.name}</div>
                                                <div className="text-xs text-gray-400">{record.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.propertyName || record.property} 
                                        <span className="text-gray-400 mx-1">•</span> 
                                        <span className="font-bold text-gray-700">{record.unit}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.displayStatus, record.recordType)}`}>
                                            {record.displayStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.submittedDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            {record.recordType === 'Tenant' && (
                                                <button onClick={() => handleMoveClick(record as TenantProfile)} className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1 rounded">Move</button>
                                            )}
                                            <button onClick={() => handleEdit(record)} className="text-primary hover:text-primary-dark font-bold bg-primary/5 px-3 py-1 rounded">Edit</button>
                                            <button onClick={() => handleDelete(record)} className="text-red-500 hover:text-red-700 font-bold bg-red-50 px-3 py-1 rounded">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
            
            {moveTenant && (
                <MoveTenantModal 
                    tenant={moveTenant}
                    onClose={() => setMoveTenant(null)}
                    onMove={handleMoveSubmit}
                    properties={properties}
                />
            )}
        </div>
    );
};

export default Applications;
