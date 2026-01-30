
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { User, StaffProfile, TenantProfile } from '../../types';
import Icon from '../Icon';
import { hashPassword } from '../../utils/security';

// Unified User Type for UI Display
interface UnifiedUser {
    id: string;
    name: string;
    username?: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    type: 'Staff' | 'Landlord' | 'Tenant';
    fullObject: StaffProfile | User | TenantProfile;
}

// Category Configuration
interface UserCategory {
    id: string;
    title: string;
    roles: string[]; // Roles that belong to this category
    color: string;
    icon: string;
}

const CATEGORIES: UserCategory[] = [
    { id: 'system', title: 'System Users', roles: ['Super Admin', 'Branch Manager', 'Accountant', 'Assistant Admin'], color: 'bg-blue-500', icon: 'system-user' },
    { id: 'field', title: 'Field Team', roles: ['Field Agent', 'Caretaker'], color: 'bg-green-500', icon: 'agent' },
    { id: 'partners', title: 'Partners', roles: ['Landlord', 'Affiliate', 'Contractor'], color: 'bg-purple-500', icon: 'landlords' },
    { id: 'clients', title: 'Clients', roles: ['Tenant'], color: 'bg-orange-500', icon: 'tenants' },
];

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
    onClose: () => void; 
    onSave: (data: any) => void;
    availableRoles: string[];
}> = ({ existingUser, onClose, onSave, availableRoles }) => {
    const [formData, setFormData] = useState({
        name: existingUser?.name || '',
        username: existingUser?.username || '',
        email: existingUser?.email || '',
        phone: existingUser?.phone || '',
        idNumber: (existingUser?.fullObject as any)?.idNumber || '',
        kraPin: (existingUser?.fullObject as any)?.kraPin || '',
        role: existingUser?.role || availableRoles[0] || 'Tenant',
        status: existingUser?.status || 'Active',
        password: '' // Only for creation
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

        onSave({ ...formData, passwordHash });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1500] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border border-gray-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{existingUser ? 'Edit User' : 'Add New User'}</h2>
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
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Number</label>
                            <input name="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="ID No." className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">KRA PIN</label>
                            <input name="kraPin" value={formData.kraPin} onChange={handleChange} placeholder="A00..." className="w-full p-2 border rounded focus:ring-1 focus:ring-primary outline-none" />
                        </div>
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
        staff, landlords, tenants, roles,
        addStaff, updateStaff, deleteStaff,
        addLandlord, updateLandlord, deleteLandlord,
        addTenant, updateTenant, deleteTenant 
    } = useData();
    
    // UI State
    const [activeCategoryId, setActiveCategoryId] = useState('system');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [resetUser, setResetUser] = useState<UnifiedUser | null>(null);
    const [editUser, setEditUser] = useState<UnifiedUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Derived State
    const activeCategory = CATEGORIES.find(c => c.id === activeCategoryId);

    // --- AGGREGATE ALL USERS ---
    const allUsers: UnifiedUser[] = useMemo(() => {
        const staffUsers: UnifiedUser[] = staff.map(s => ({
            id: s.id, name: s.name, username: s.username, email: s.email, phone: s.phone, role: s.role, status: s.status, type: 'Staff', fullObject: s
        }));
        const landlordUsers: UnifiedUser[] = landlords.map(l => ({
            id: l.id, name: l.name, username: l.username, email: l.email, phone: l.phone, role: l.role || 'Landlord', status: l.status, type: 'Landlord', fullObject: l
        }));
        const tenantUsers: UnifiedUser[] = tenants.map(t => ({
            id: t.id, name: t.name, username: t.username, email: t.email, phone: t.phone, role: t.role || 'Tenant', status: t.status, type: 'Tenant', fullObject: t
        }));
        
        return [...staffUsers, ...landlordUsers, ...tenantUsers];
    }, [staff, landlords, tenants]);

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

    const handleSaveUser = (data: any) => {
        const { passwordHash, ...rest } = data;
        const newId = rest.id || (rest.role === 'Tenant' ? `t-${Date.now()}` : rest.role === 'Landlord' ? `l-${Date.now()}` : `staff-${Date.now()}`);
        
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
            if (editUser.type === 'Staff') updateStaff(editUser.id, rest);
            else if (editUser.type === 'Landlord') updateLandlord(editUser.id, rest);
            else if (editUser.type === 'Tenant') updateTenant(editUser.id, rest);
            setEditUser(null);
        } else {
            // Create Logic based on Role
            if (rest.role === 'Landlord') {
                addLandlord({ ...commonFields, role: 'Landlord' } as User);
            } else if (rest.role === 'Tenant') {
                addTenant({ 
                    ...commonFields, 
                    unit: '', rentAmount: 0, onboardingDate: new Date().toISOString().split('T')[0],
                    paymentHistory: [], outstandingBills: [], outstandingFines: [], maintenanceRequests: [] 
                } as TenantProfile);
            } else {
                // Staff (System Users, Field Team, etc.)
                addStaff({ ...commonFields, role: rest.role, branch: 'Headquarters', payrollInfo: { baseSalary: 0, nextPaymentDate: '' }, leaveBalance: { annual: 0 } } as StaffProfile);
            }
        }
        setIsFormVisible(false);
    };

    const handleResetPassword = (hash: string) => {
        if (!resetUser) return;
        if (resetUser.type === 'Staff') updateStaff(resetUser.id, { passwordHash: hash });
        else if (resetUser.type === 'Landlord') updateLandlord(resetUser.id, { passwordHash: hash });
        else if (resetUser.type === 'Tenant') updateTenant(resetUser.id, { passwordHash: hash });
        
        setResetUser(null);
        alert(`Password for ${resetUser.name} reset successfully.`);
    };

    const handleDeleteUser = (user: UnifiedUser) => {
        if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
            if (user.type === 'Staff') deleteStaff(user.id);
            else if (user.type === 'Landlord') deleteLandlord(user.id);
            else if (user.type === 'Tenant') deleteTenant(user.id);
        }
    };

    // Get available roles for the current active category to populate dropdown
    const availableRolesForForm = useMemo(() => {
        // Also ensure roles exist in system roles context
        const contextRoleNames = roles.map(r => r.name);
        // Filter category roles that are defined in system
        return activeCategory ? activeCategory.roles.filter(r => contextRoleNames.includes(r) || ['Landlord', 'Tenant'].includes(r)) : []; 
        // Landlord and Tenant might not be in "roles" state if not added yet, but handled as static options
    }, [activeCategory, roles]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    <p className="text-lg text-gray-500 mt-1">Organize users by role and access level.</p>
                 </div>
                 <button onClick={() => window.location.hash = '#/settings/roles-permissions'} className="text-sm font-bold text-primary hover:underline flex items-center">
                    <Icon name="settings" className="w-4 h-4 mr-1" /> Manage Roles & Permissions
                 </button>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {CATEGORIES.map(cat => {
                    const count = allUsers.filter(u => cat.roles.includes(u.role)).length;
                    const isActive = activeCategoryId === cat.id;

                    return (
                        <div 
                            key={cat.id} 
                            onClick={() => { setActiveCategoryId(cat.id); setSearchQuery(''); }}
                            className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group ${
                                isActive ? 'bg-white border-primary shadow-lg transform -translate-y-1' : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                            }`}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                <Icon name={cat.icon} className={`w-24 h-24 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                            </div>
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white shadow-md ${cat.color}`}>
                                    <Icon name={cat.icon} className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">{cat.title}</h3>
                                <p className="text-gray-500 text-sm mt-1">{count} Users</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* List Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
                <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
                     <h3 className="font-bold text-gray-700 text-lg flex items-center">
                        <Icon name="stack" className="w-5 h-5 mr-2 text-gray-400" />
                        {activeCategory?.title} List
                     </h3>
                     <div className="flex gap-3 w-full md:w-auto">
                         <div className="relative flex-grow md:flex-grow-0 md:w-64">
                             <input 
                                 type="text" 
                                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                                 placeholder={`Search ${activeCategory?.title}...`}
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                             />
                             <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                         </div>
                         <button 
                            onClick={() => { setEditUser(null); setIsFormVisible(true); }} 
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-md transition-transform active:scale-95 whitespace-nowrap"
                        >
                            <Icon name="plus" className="w-5 h-5 mr-2" /> Add User
                        </button>
                     </div>
                </div>

                <div className="flex-grow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 font-medium font-mono text-xs">
                                        {user.username || <span className="text-gray-300">--</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200">{user.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                            user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditUser(user); setIsFormVisible(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                <Icon name="settings" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setResetUser(user)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="Reset Password">
                                                <Icon name="keys" className="w-4 h-4" /> {/* Assuming 'keys' icon exists or mapped to something */}
                                            </button>
                                            <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                <Icon name="close" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-16 text-gray-400 bg-gray-50/50">No users found in {activeCategory?.title}.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isFormVisible && (
                <UserForm 
                    existingUser={editUser || undefined} 
                    onClose={() => { setIsFormVisible(false); setEditUser(null); }} 
                    onSave={handleSaveUser} 
                    availableRoles={availableRolesForForm}
                />
            )}
            {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSave={handleResetPassword} />}
        </div>
    );
};

export default Users;