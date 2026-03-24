
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { User, StaffProfile, TenantProfile, RenovationInvestor, Vendor } from '../../types';
import Icon from '../Icon';
import { hashPassword } from '../../utils/security';
import { supabase } from '../../utils/supabaseClient';

// Unified User Type for UI Display
interface UnifiedUser {
    id: string;
    name: string;
    username?: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    type: 'Staff' | 'Landlord' | 'Tenant' | 'Investor' | 'Vendor';
    fullObject: StaffProfile | User | TenantProfile | RenovationInvestor | Vendor;
}

// Category Configuration
interface UserCategory {
    id: string;
    title: string;
    roles: string[]; // Roles that belong to this category
    color: string;
    icon: string;
}

const ResetPasswordModal: React.FC<{ user: UnifiedUser; onClose: () => void; onSave: (passwordHash: string) => void }> = ({ user, onClose, onSave }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) return alert("Please fill all fields.");
        if (newPassword !== confirmPassword) return alert("Passwords do not match.");

        setIsSaving(true);
        const hash = await hashPassword(newPassword);
        onSave(hash);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1600] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Reset Password</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Set a new password for <strong>{user.name}</strong> ({user.username || 'No Username'}).</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                        <input 
                            type="password"
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                        <input 
                            type="password"
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 disabled:opacity-50">
                            {isSaving ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserForm: React.FC<{ 
    existingUser?: UnifiedUser; 
    category: UserCategory;
    onClose: () => void; 
    onSave: (data: any) => void;
    availableRoles: string[];
    properties: any[];
    referralOptions: any[];
}> = ({ existingUser, category, onClose, onSave, availableRoles, properties, referralOptions }) => {
    const [formData, setFormData] = useState<any>({
        name: existingUser?.name || '',
        username: existingUser?.username || '',
        email: existingUser?.email || '',
        phone: existingUser?.phone || '',
        idNumber: (existingUser?.fullObject as any)?.idNumber || '',
        kraPin: (existingUser?.fullObject as any)?.kraPin || '',
        role: existingUser?.role || availableRoles[0] || 'Tenant',
        status: existingUser?.status || 'Active',
        password: '', // Only for creation
        
        // Extended Fields
        assignedPropertyId: (existingUser?.fullObject as StaffProfile)?.assignedPropertyId || '',
        referrerId: (existingUser?.fullObject as RenovationInvestor)?.referrerId || '',
        referrerType: (existingUser?.fullObject as RenovationInvestor)?.referrerType || 'Agent',
        specialty: (existingUser?.fullObject as Vendor)?.specialty || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return;

        setIsSaving(true);
        let passwordHash = undefined;
        if (!existingUser && formData.password) {
            passwordHash = await hashPassword(formData.password);
        }

        onSave({ ...formData, passwordHash, plainPassword: formData.password });
        setIsSaving(false);
    };

    const isCaretaker = formData.role === 'Caretaker' || category.id === 'caretakers';
    const isInvestor = category.id === 'investors' || formData.role === 'Investor';
    const isContractor = category.id === 'contractors' || formData.role === 'Contractor';
    const isAffiliate = category.id === 'affiliates' || formData.role === 'Affiliate';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1500] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border border-gray-200 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{existingUser ? 'Edit User' : `Add New ${category.title.slice(0, -1)}`}</h2>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                            <input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" required />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                            <input name="username" value={formData.username} onChange={handleChange} placeholder="jdoe" className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="07..." className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" required />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                            <input name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" required type="email" />
                        </div>
                        
                        {/* Specific Fields per Category */}
                        {isCaretaker && (
                             <div className="col-span-2 bg-orange-50 p-3 rounded border border-orange-100">
                                <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Assigned Property</label>
                                <select 
                                    name="assignedPropertyId" 
                                    value={formData.assignedPropertyId} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border rounded bg-white focus:ring-1 focus:ring-orange-500 outline-none"
                                >
                                    <option value="">-- Select Property --</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <p className="text-[10px] text-orange-600 mt-1">Caretaker will manage tickets for this property.</p>
                            </div>
                        )}

                        {isInvestor && (
                             <div className="col-span-2 bg-yellow-50 p-3 rounded border border-yellow-100">
                                <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Referral / Attachment</label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                     <select name="referrerType" value={formData.referrerType} onChange={handleChange} className="p-2 border rounded bg-white text-xs">
                                         <option value="Agent">Agent</option>
                                         <option value="Landlord">Landlord</option>
                                         <option value="Tenant">Tenant</option>
                                         <option value="Affiliate">Affiliate</option>
                                         <option value="System User">System User</option>
                                         <option value="Investor">Investor</option>
                                         <option value="Caretaker">Caretaker</option>
                                         <option value="Walkin">Walkin</option>
                                     </select>
                                     <select 
                                        name="referrerId" 
                                        value={formData.referrerId} 
                                        onChange={handleChange} 
                                        className="p-2 border rounded bg-white text-xs"
                                        disabled={formData.referrerType === 'Walkin'}
                                     >
                                         <option value="">-- Select Referrer --</option>
                                         {referralOptions.filter(r => 
                                             (formData.referrerType === 'Agent' && r.type === 'Staff' && r.role === 'Field Agent') ||
                                             (formData.referrerType === 'Landlord' && r.type === 'Landlord') ||
                                             (formData.referrerType === 'Tenant' && r.type === 'Tenant') ||
                                             (formData.referrerType === 'Affiliate' && r.type === 'Landlord' && r.role === 'Affiliate') ||
                                             (formData.referrerType === 'System User' && r.type === 'Staff') ||
                                             (formData.referrerType === 'Investor' && r.type === 'Investor') ||
                                             (formData.referrerType === 'Caretaker' && r.type === 'Staff' && r.role === 'Caretaker')
                                         ).map(opt => (
                                             <option key={opt.id} value={opt.id}>{opt.name}</option>
                                         ))}
                                     </select>
                                </div>
                                <p className="text-[10px] text-yellow-600">Commissions will be tracked for the selected referrer.</p>
                            </div>
                        )}

                        {isContractor && (
                             <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Specialty / Service</label>
                                <input 
                                    name="specialty" 
                                    value={formData.specialty} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Plumbing, Electrical..." 
                                    className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" 
                                />
                            </div>
                        )}

                        {!isContractor && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Number</label>
                                    <input name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="ID No." className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">KRA PIN</label>
                                    <input name="kraPin" value={formData.kraPin} onChange={handleChange} placeholder="A00..." className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded bg-white focus:ring-1 focus:ring-primary outline-none">
                                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded bg-white focus:ring-1 focus:ring-primary outline-none">
                                <option>Active</option>
                                <option>Inactive</option>
                                <option>Suspended</option>
                            </select>
                         </div>
                    </div>

                    {!existingUser && (
                        <div className="pt-2 border-t mt-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password</label>
                             <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Set initial password" className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" required />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark shadow-sm">
                            {isSaving ? 'Saving...' : existingUser ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Users: React.FC = () => {
    const { 
        staff, landlords, tenants, roles, renovationInvestors, vendors, properties,
        addStaff, updateStaff, deleteStaff,
        addLandlord, updateLandlord, deleteLandlord,
        addTenant, updateTenant, deleteTenant,
        addRenovationInvestor, updateRenovationInvestor, deleteRenovationInvestor,
        addVendor, updateVendor, deleteVendor
    } = useData();
    
    // UI State
    const [activeCategoryId, setActiveCategoryId] = useState('system');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [resetUser, setResetUser] = useState<UnifiedUser | null>(null);
    const [editUser, setEditUser] = useState<UnifiedUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dbStaffProfiles, setDbStaffProfiles] = useState<StaffProfile[]>([]);
    
    // Get dynamic system roles from context
    const systemRoleNames = useMemo(() => {
        return roles.filter(r => r.isSystem).map(r => r.name);
    }, [roles]);

    // Pull server-side staff profiles so system users created directly in DB still appear in this module.
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data, error } = await supabase
                    .schema('app')
                    .from('staff_profiles')
                    .select('id,name,role,email,phone,branch,status');
                if (error) throw error;
                if (!alive) return;
                const mapped: StaffProfile[] = (data ?? []).map((row: any) => ({
                    id: row.id,
                    name: row.name || '',
                    role: row.role || 'Staff',
                    email: row.email || '',
                    phone: row.phone || '',
                    branch: row.branch || 'Headquarters',
                    status: row.status || 'Active',
                    payrollInfo: { baseSalary: 0, nextPaymentDate: '' },
                    leaveBalance: { annual: 0 },
                } as StaffProfile));
                setDbStaffProfiles(mapped);
            } catch (e) {
                console.warn('Failed to load app.staff_profiles for user management', e);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Construct Categories with dynamic system roles
    const categories: UserCategory[] = useMemo(() => [
        { id: 'system', title: 'System Users', roles: systemRoleNames, color: 'bg-blue-500', icon: 'system-user' },
        { id: 'field', title: 'Field Agents', roles: ['Field Agent'], color: 'bg-green-500', icon: 'agent' },
        { id: 'caretakers', title: 'Caretakers', roles: ['Caretaker'], color: 'bg-orange-500', icon: 'caretaker' },
        { id: 'landlords', title: 'Landlords', roles: ['Landlord'], color: 'bg-purple-500', icon: 'landlords' },
        { id: 'tenants', title: 'Tenants', roles: ['Tenant'], color: 'bg-indigo-500', icon: 'tenants' },
        { id: 'investors', title: 'Investors', roles: ['Investor'], color: 'bg-yellow-500', icon: 'revenue' },
        { id: 'affiliates', title: 'Affiliates', roles: ['Affiliate'], color: 'bg-pink-500', icon: 'branch' },
        { id: 'contractors', title: 'Contractors', roles: ['Contractor'], color: 'bg-gray-500', icon: 'tools' },
    ], [systemRoleNames]);

    // Derived State
    const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];

    // --- AGGREGATE ALL USERS ---
    const allUsers: UnifiedUser[] = useMemo(() => {
        const mergedStaff = [...staff];
        for (const dbRow of dbStaffProfiles) {
            if (!mergedStaff.some(s => s.id === dbRow.id)) mergedStaff.push(dbRow);
        }

        const staffUsers: UnifiedUser[] = mergedStaff.map(s => ({
            id: s.id, name: s.name, username: s.username, email: s.email, phone: s.phone, role: s.role, status: s.status, type: 'Staff', fullObject: s
        }));
        const landlordUsers: UnifiedUser[] = landlords.map(l => ({
            id: l.id, name: l.name, username: l.username, email: l.email, phone: l.phone, role: l.role || 'Landlord', status: l.status, type: 'Landlord', fullObject: l
        }));
        const tenantUsers: UnifiedUser[] = tenants.map(t => ({
            id: t.id, name: t.name, username: t.username, email: t.email, phone: t.phone, role: t.role || 'Tenant', status: t.status, type: 'Tenant', fullObject: t
        }));
        const investors: UnifiedUser[] = renovationInvestors.map(i => ({
            id: i.id, name: i.name, username: i.username || '', email: i.email, phone: i.phone, role: 'Investor', status: i.status, type: 'Investor', fullObject: i
        }));
        const contractors: UnifiedUser[] = vendors.map(v => ({
            id: v.id, name: v.name, username: v.username || '', email: v.email || '', phone: v.phone || '', role: 'Contractor', status: 'Active', type: 'Vendor', fullObject: v
        }));

        return [...staffUsers, ...landlordUsers, ...tenantUsers, ...investors, ...contractors];
    }, [staff, dbStaffProfiles, landlords, tenants, renovationInvestors, vendors]);

    // Filter Users by Active Category Roles
    const categoryUsers = useMemo(() => {
        if (!activeCategory) return [];
        return allUsers.filter(u => activeCategory.roles.includes(u.role));
    }, [allUsers, activeCategory]);

    // Apply Search
    const filteredUsers = useMemo(() => {
        return categoryUsers.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [categoryUsers, searchQuery]);

    // --- ACTIONS ---

    const handleSaveUser = async (data: any) => {
        const { passwordHash, plainPassword, assignedPropertyId, referrerId, referrerType, specialty, ...rest } = data;
        let newId = rest.id || `${activeCategory.id}-${Date.now()}`;
        
        const commonFields = {
            id: newId,
            name: rest.name,
            username: rest.username,
            email: rest.email,
            phone: rest.phone,
            idNumber: rest.idNumber || '',
            status: rest.status,
            passwordHash: passwordHash
        };

        if (editUser) {
            // Update logic
            if (editUser.type === 'Staff') updateStaff(editUser.id, { ...rest, assignedPropertyId });
            else if (editUser.type === 'Landlord') updateLandlord(editUser.id, rest);
            else if (editUser.type === 'Tenant') updateTenant(editUser.id, rest);
            else if (editUser.type === 'Investor') updateRenovationInvestor(editUser.id, { ...rest, referrerId, referrerType });
            else if (editUser.type === 'Vendor') updateVendor(editUser.id, { ...rest, specialty });
            setEditUser(null);
        } else {
            // Create Auth user in Supabase so credentials work for login
            try {
                if (!plainPassword || !rest.email) {
                    throw new Error('Email and initial password are required to create a login-enabled account.');
                }

                const nameParts = String(rest.name ?? '').trim().split(/\s+/).filter(Boolean);
                const firstName = nameParts[0] ?? null;
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
                const fullName = String(rest.name ?? rest.email);

                const { data: createdId, error } = await supabase.rpc('admin_create_auth_user', {
                    p_email: rest.email,
                    p_password: plainPassword,
                    p_role: rest.role ?? activeCategory.roles?.[0] ?? 'Tenant',
                    p_full_name: fullName,
                    p_first_name: firstName,
                    p_last_name: lastName,
                    p_phone: rest.phone ?? null,
                    p_id_number: rest.idNumber ?? null,
                });
                if (error) throw error;
                if (!createdId) {
                    throw new Error('Auth account was not created. User save cancelled to avoid app-only records.');
                }
                newId = String(createdId);
            } catch (e: any) {
                console.warn('Supabase user creation failed; cancelling user creation', e);
                alert(`Failed to create login-enabled account.\n\nNo user record was saved.\n\n${e?.message ?? e}`);
                return;
            }

            const commonFieldsWithId = { ...commonFields, id: newId };
            // Create Logic based on Category/Role
            if (activeCategory.id === 'landlords') {
                addLandlord({ ...commonFieldsWithId, role: 'Landlord' } as User);
            } else if (activeCategory.id === 'tenants') {
                addTenant({ 
                    ...commonFieldsWithId, 
                    unit: '', rentAmount: 0, onboardingDate: new Date().toISOString().split('T')[0],
                    paymentHistory: [], outstandingBills: [], outstandingFines: [], maintenanceRequests: [] 
                } as TenantProfile);
            } else if (activeCategory.id === 'investors') {
                addRenovationInvestor({
                    ...commonFieldsWithId,
                    joinDate: new Date().toISOString().split('T')[0],
                    referrerId,
                    referrerType,
                    status: 'Active'
                } as RenovationInvestor);
            } else if (activeCategory.id === 'contractors') {
                addVendor({
                    id: newId,
                    name: rest.name,
                    username: rest.username,
                    specialty: specialty || 'General',
                    rating: 5,
                    email: rest.email,
                    phone: rest.phone,
                    // Although Vendor doesn't strictly have passwordHash in base type, 
                    // we allow saving it to enable login as requested.
                    // @ts-ignore 
                    passwordHash: passwordHash 
                } as Vendor);
            } else if (activeCategory.id === 'affiliates') {
                addLandlord({ ...commonFieldsWithId, role: 'Affiliate' } as User); // Reuse User for affiliate login
            } else {
                // Staff (System, Field, Caretaker)
                addStaff({ 
                    ...commonFieldsWithId, 
                    role: rest.role, 
                    branch: 'Headquarters', 
                    payrollInfo: { baseSalary: 0, nextPaymentDate: '' }, 
                    leaveBalance: { annual: 0 },
                    assignedPropertyId // For Caretakers
                } as StaffProfile);
            }
        }
        setIsFormVisible(false);
    };

    const handleResetPassword = (hash: string) => {
        if (!resetUser) return;
        if (resetUser.type === 'Staff') updateStaff(resetUser.id, { passwordHash: hash });
        else if (resetUser.type === 'Landlord') updateLandlord(resetUser.id, { passwordHash: hash });
        else if (resetUser.type === 'Tenant') updateTenant(resetUser.id, { passwordHash: hash });
        else if (resetUser.type === 'Investor') updateRenovationInvestor(resetUser.id, { passwordHash: hash });
        else if (resetUser.type === 'Vendor') updateVendor(resetUser.id, { passwordHash: hash } as any);
        
        setResetUser(null);
        alert(`Password for ${resetUser.name} reset successfully.`);
    };

    const handleDeleteUser = (user: UnifiedUser) => {
        if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
            if (user.type === 'Staff') deleteStaff(user.id);
            else if (user.type === 'Landlord') deleteLandlord(user.id);
            else if (user.type === 'Tenant') deleteTenant(user.id);
            else if (user.type === 'Investor') deleteRenovationInvestor(user.id);
            else if (user.type === 'Vendor') deleteVendor(user.id);
        }
    };

    // Get available roles for the current active category to populate dropdown
    const availableRolesForForm = useMemo(() => {
        if (activeCategory?.id === 'system') {
            return systemRoleNames;
        }
        // Return combined list for non-system categories to allow role switching
        return ['Landlord', 'Tenant', 'Field Agent', 'Affiliate', 'Caretaker', 'Contractor', 'Investor'];
    }, [activeCategory, systemRoleNames]);

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    <p className="text-lg text-gray-500 mt-1">Organize users, partners, and field staff.</p>
                 </div>
                 <button onClick={() => window.location.hash = '#/settings/roles-permissions'} className="text-sm font-bold text-primary hover:underline flex items-center">
                    <Icon name="settings" className="w-4 h-4 mr-1" /> Manage Roles & Permissions
                 </button>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => {
                    const count = allUsers.filter(u => cat.roles.includes(u.role)).length;
                    const isActive = activeCategoryId === cat.id;

                    return (
                        <div 
                            key={cat.id} 
                            onClick={() => { setActiveCategoryId(cat.id); setSearchQuery(''); }}
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group ${
                                isActive ? 'bg-white border-primary shadow-lg transform -translate-y-1' : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                            }`}
                        >
                            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                <Icon name={cat.icon} className={`w-16 h-16 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                            </div>
                            <div className="relative z-10 flex flex-col items-start">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white shadow-md ${cat.color}`}>
                                    <Icon name={cat.icon} className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800">{cat.title}</h3>
                                <p className="text-gray-500 text-xs mt-1">{count} Users</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* List Container - Redesigned to match image */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                         <Icon name="menu" className="w-5 h-5 text-gray-400" />
                         <h3 className="font-bold text-gray-700 text-lg">
                            {activeCategory?.title} List
                         </h3>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:w-64">
                             <input 
                                 type="text" 
                                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm"
                                 placeholder={`Search ${activeCategory?.title}...`}
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                             />
                             <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                        <button 
                            onClick={() => { setEditUser(null); setIsFormVisible(true); }} 
                            className="bg-[#9D1F15] hover:bg-[#7A1810] text-white px-4 py-2 rounded text-sm font-bold flex items-center whitespace-nowrap transition-colors"
                        >
                            <Icon name="plus" className="w-4 h-4 mr-2" /> Add User
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-white border-b border-gray-100 text-gray-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Username</th>
                                <th className="px-6 py-4">Tel</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">RegDate</th>
                                <th className="px-6 py-4 text-center">Active</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => {
                                const fullObj = user.fullObject as any;
                                const regDate = fullObj.dateRegistered || fullObj.onboardingDate || fullObj.joinDate || 'N/A';
                                const isActive = user.status === 'Active';

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800 text-sm uppercase">{user.name}</div>
                                            <div className="text-xs text-gray-500 lowercase">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {user.username || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {user.phone}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {user.role}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {regDate}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {isActive ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => { setEditUser(user); setIsFormVisible(true); }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center transition-colors"
                                                >
                                                    <Icon name="settings" className="w-3 h-3 mr-1" /> Edit
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setResetUser(user)}
                                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-bold flex items-center transition-colors"
                                                >
                                                    <Icon name="keys" className="w-3 h-3 mr-1" /> Set Pwd
                                                </button>

                                                <button 
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center transition-colors"
                                                >
                                                    <Icon name="trash" className="w-3 h-3 mr-1" /> Del
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isFormVisible && activeCategory && (
                <UserForm 
                    existingUser={editUser || undefined} 
                    category={activeCategory}
                    onClose={() => { setIsFormVisible(false); setEditUser(null); }} 
                    onSave={handleSaveUser} 
                    availableRoles={availableRolesForForm}
                    properties={properties}
                    referralOptions={allUsers}
                />
            )}
            {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSave={handleResetPassword} />}
        </div>
    );
};

export default Users;
