
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

const UserDetailModal: React.FC<{ user: UnifiedUser; onClose: () => void }> = ({ user, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1600] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">User Details</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-500 text-sm">{user.role} • {user.status}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded border">
                            <p className="text-xs text-gray-500 uppercase font-bold">Username</p>
                            <p className="font-medium text-gray-800">{user.username || 'Not Set'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border">
                            <p className="text-xs text-gray-500 uppercase font-bold">User Type</p>
                            <p className="font-medium text-gray-800">{user.type}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border">
                            <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                            <p className="font-medium text-gray-800">{user.email}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border">
                            <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                            <p className="font-medium text-gray-800">{user.phone}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded border col-span-2">
                            <p className="text-xs text-gray-500 uppercase font-bold">System ID</p>
                            <p className="font-mono text-gray-600">{user.id}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                     <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-bold hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>
    );
};

const UserForm: React.FC<{ 
    existingUser?: UnifiedUser; 
    onClose: () => void; 
    onSave: (data: any) => void;
}> = ({ existingUser, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: existingUser?.name || '',
        username: existingUser?.username || '',
        email: existingUser?.email || '',
        phone: existingUser?.phone || '',
        idNumber: (existingUser?.fullObject as any)?.idNumber || '',
        kraPin: (existingUser?.fullObject as any)?.kraPin || '',
        role: existingUser?.role || 'Tenant',
        status: existingUser?.status || 'Active',
        password: '' // Only for creation
    });
    const [isSaving, setIsSaving] = useState(false);

    // Sync if existingUser changes (e.g. reused component)
    useEffect(() => {
        if (existingUser) {
            setFormData({
                name: existingUser.name || '',
                username: existingUser.username || '',
                email: existingUser.email || '',
                phone: existingUser.phone || '',
                idNumber: (existingUser.fullObject as any)?.idNumber || '',
                kraPin: (existingUser.fullObject as any)?.kraPin || '',
                role: existingUser.role || 'Tenant',
                status: existingUser.status || 'Active',
                password: ''
            });
        }
    }, [existingUser]);

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
                                <option>Tenant</option>
                                <option>Landlord</option>
                                <option>Field Agent</option>
                                <option>Super Admin</option>
                                <option>Branch Manager</option>
                                <option>Accountant</option>
                                <option>Caretaker</option>
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
        staff, landlords, tenants, 
        addStaff, updateStaff, deleteStaff,
        addLandlord, updateLandlord, deleteLandlord,
        addTenant, updateTenant, deleteTenant 
    } = useData();
    
    // UI State
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [viewUser, setViewUser] = useState<UnifiedUser | null>(null);
    const [resetUser, setResetUser] = useState<UnifiedUser | null>(null);
    const [editUser, setEditUser] = useState<UnifiedUser | null>(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

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

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesRole = filterRole === 'All' || u.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [allUsers, searchQuery, filterRole]);

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return filteredUsers.slice(start, start + entriesPerPage);
    }, [filteredUsers, currentPage, entriesPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);

    // --- ACTIONS ---

    const handleSaveUser = (data: any) => {
        const { passwordHash, ...rest } = data;
        const newId = rest.id || (rest.role === 'Tenant' ? `t-${Date.now()}` : rest.role === 'Landlord' ? `l-${Date.now()}` : `staff-${Date.now()}`);
        
        // This common block is used for Create. For Update, we use 'rest' which contains form data.
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
            // Create Logic
            if (['Field Agent', 'Branch Manager', 'Accountant', 'Caretaker', 'Super Admin'].includes(rest.role)) {
                addStaff({ ...commonFields, role: rest.role, branch: 'Headquarters', payrollInfo: { baseSalary: 0, nextPaymentDate: '' }, leaveBalance: { annual: 0 } } as StaffProfile);
            } else if (rest.role === 'Landlord') {
                addLandlord({ ...commonFields, role: 'Landlord' } as User);
            } else if (rest.role === 'Tenant') {
                addTenant({ 
                    ...commonFields, 
                    unit: '', rentAmount: 0, onboardingDate: new Date().toISOString().split('T')[0],
                    paymentHistory: [], outstandingBills: [], outstandingFines: [], maintenanceRequests: [] 
                } as TenantProfile);
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

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    <p className="text-lg text-gray-500 mt-1">Centralized control for all system users and credentials.</p>
                 </div>
                 <div className="flex gap-2">
                     <button 
                         onClick={() => window.location.hash = '#/registration/overview'} 
                         className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center shadow-sm"
                     >
                         <span className="mr-2">←</span> Back
                     </button>
                    <button 
                        onClick={() => { setEditUser(null); setIsFormVisible(true); }} 
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-md transition-transform active:scale-95"
                    >
                        <Icon name="plus" className="w-5 h-5 mr-2" /> Add User
                    </button>
                 </div>
            </div>

            {/* List Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
                     <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-gray-600">Filter Role:</span>
                         <select 
                             value={filterRole} 
                             onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
                             className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                         >
                             <option value="All">All Roles</option>
                             <option value="Super Admin">Super Admin</option>
                             <option value="Field Agent">Field Agent</option>
                             <option value="Landlord">Landlord</option>
                             <option value="Tenant">Tenant</option>
                             <option value="Accountant">Accountant</option>
                             <option value="Caretaker">Caretaker</option>
                         </select>
                     </div>
                     <div className="relative w-full md:w-64">
                         <input 
                             type="text" 
                             className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                             placeholder="Search users..."
                             value={searchQuery}
                             onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                         />
                         <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                     </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">
                                        {user.username || <span className="text-gray-400 italic">--</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">{user.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                            user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setViewUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                                                <Icon name="user-circle" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setEditUser(user); setIsFormVisible(true); }} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                                                <Icon name="settings" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setResetUser(user)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="Reset Password">
                                                <Icon name="keys" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                <Icon name="close" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsers.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
                     <span className="text-sm text-gray-600">
                         Showing {Math.min(filteredUsers.length, (currentPage - 1) * entriesPerPage + 1)} to {Math.min(filteredUsers.length, currentPage * entriesPerPage)} of {filteredUsers.length} entries
                     </span>
                     <div className="flex gap-2">
                         <button 
                             onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                             disabled={currentPage === 1}
                             className="px-3 py-1 border bg-white rounded hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
                         >
                             Prev
                         </button>
                         <button 
                             onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                             disabled={currentPage === totalPages}
                             className="px-3 py-1 border bg-white rounded hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
                         >
                             Next
                         </button>
                     </div>
                </div>
            </div>

            {/* Modals */}
            {isFormVisible && <UserForm existingUser={editUser || undefined} onClose={() => { setIsFormVisible(false); setEditUser(null); }} onSave={handleSaveUser} />}
            {viewUser && <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}
            {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSave={handleResetPassword} />}
        </div>
    );
};

export default Users;
