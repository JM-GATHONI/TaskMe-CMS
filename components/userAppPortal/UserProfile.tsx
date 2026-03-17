
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { User, TenantProfile, StaffProfile, RenovationInvestor, Vendor } from '../../types';
import { hashPassword } from '../../utils/security';
import { useProfileDisplay } from '../../hooks/useProfileDisplay';

const UserProfile: React.FC = () => {
    const { currentUser, updateTenant, updateStaff, updateLandlord, updateRenovationInvestor, updateVendor } = useData();
    const { displayName, initial } = useProfileDisplay();
    
    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize data from currentUser
    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                username: currentUser.username || '',
                email: currentUser.email || ''
            }));
            
            // Check for avatar in different possible fields
            const pic = (currentUser as any).avatar || (currentUser as any).profilePicture || (currentUser as any).avatarUrl;
            setProfilePic(pic);
        }
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        // Validation
        if (formData.password && formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setIsSaving(true);
        
        // Prepare update object
        const updateData: any = {
            username: formData.username,
            email: formData.email
        };

        if (profilePic) {
            // Unify avatar field naming for update
            if ('avatar' in currentUser) updateData.avatar = profilePic;
            else if ('profilePicture' in currentUser) updateData.profilePicture = profilePic;
            else if ('avatarUrl' in currentUser) updateData.avatarUrl = profilePic;
            else updateData.avatar = profilePic; // Default fallback
        }

        if (formData.password) {
            updateData.passwordHash = await hashPassword(formData.password);
        }

        // Call specific update function based on role/type
        // Note: Using type guards or checking specific properties would be cleaner, but role check works for now.
        const role = currentUser.role;

        try {
            if (role === 'Tenant') {
                updateTenant(currentUser.id, updateData);
            } else if (['Field Agent', 'Caretaker'].includes(role) || (currentUser as StaffProfile).salaryConfig) {
                // Assuming StaffProfile if role matches staff roles or has salaryConfig
                updateStaff(currentUser.id, updateData);
            } else if (role === 'Landlord' || role === 'Affiliate') {
                updateLandlord(currentUser.id, updateData);
            } else if (role === 'Investor') {
                updateRenovationInvestor(currentUser.id, updateData);
            } else if (role === 'Contractor') {
                 updateVendor(currentUser.id, updateData);
            }

            alert("Profile updated successfully!");
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); // Clear password fields
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhoneClick = () => {
        alert("To update your registered phone number, please contact the main office for verification.");
    };

    if (!currentUser) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl">
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Header / Avatar */}
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-shrink-0 relative group">
                                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {profilePic ? (
                                        <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-gray-400">{initial}</span>
                                    )}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary-dark transition-colors"
                                    title="Upload Photo"
                                >
                                    <Icon name="plus" className="w-4 h-4" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                            </div>
                            
                            <div className="flex-grow space-y-1">
                                <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                                <p className="text-gray-500 font-medium">{currentUser.role} • {('branch' in currentUser) ? (currentUser as any).branch : 'General'}</p>
                                <div className="pt-2">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${currentUser.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {currentUser.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-700 text-lg">Personal Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Read Only)</label>
                                    <input 
                                        value={displayName} 
                                        disabled 
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input 
                                        name="username" 
                                        value={formData.username} 
                                        onChange={handleInputChange} 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="jdoe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input 
                                        name="email" 
                                        type="email"
                                        value={formData.email} 
                                        onChange={handleInputChange} 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <div className="relative" onClick={handlePhoneClick}>
                                        <input 
                                            value={currentUser.phone} 
                                            readOnly 
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-pointer"
                                        />
                                        <div className="absolute right-3 top-3 text-gray-400">
                                            <Icon name="shield" className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Contact office to change phone number.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-700 text-lg">Security</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input 
                                        name="password" 
                                        type="password"
                                        value={formData.password} 
                                        onChange={handleInputChange} 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input 
                                        name="confirmPassword" 
                                        type="password"
                                        value={formData.confirmPassword} 
                                        onChange={handleInputChange} 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <Icon name="check" className="w-5 h-5 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
