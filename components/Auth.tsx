
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Icon from './Icon';
import { User, StaffProfile, TenantProfile } from '../types';
import { hashPassword } from '../utils/security';

interface AuthProps {
    onLogin: (user: Partial<User> | StaffProfile | TenantProfile) => void;
}

type AuthView = 'login' | 'forgot' | 'verify-reset' | 'new-password';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const { systemSettings, updateSystemSettings, staff, landlords, tenants } = useData();
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [loginData, setLoginData] = useState({ identifier: '', password: '' });
    const [resetData, setResetData] = useState({ identifier: '', code: '', newPassword: '' });

    // Constants
    const SUPER_ADMIN_USERNAME = 'RITCH JR';
    const SUPER_ADMIN_PHONE = '0724620403';
    const SUPER_ADMIN_ID = '26450310';
    // SHA-256 Hash of '123456'
    const SUPER_ADMIN_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

    // Aggregate all users for unified lookup
    const allUsers = useMemo(() => [...staff, ...landlords, ...tenants], [staff, landlords, tenants]);

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    
    const simulateProcessing = (callback: () => void) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            callback();
        }, 1500);
    };

    const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL(file.type));
                };
                img.src = event.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const resizedLogo = await resizeImage(e.target.files[0], 150, 150);
                updateSystemSettings({ logo: resizedLogo });
            } catch (error) {
                console.error("Error processing logo", error);
            }
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        simulateProcessing(async () => {
            const id = loginData.identifier.trim();
            const pass = loginData.password;
            
            // Normalize inputs for robust matching (Mobile keyboards often add spaces or capitalization)
            const idLower = id.toLowerCase();
            const idClean = id.replace(/[\s-]/g, ''); // Remove spaces and dashes for phone matching

            // Hash entered password for comparison
            const passHash = await hashPassword(pass);

            // 1. Super Admin Hardcoded Check (Failsafe)
            const isSuperAdminUser = (idLower === SUPER_ADMIN_USERNAME.toLowerCase());
            const isSuperAdminPhone = (idClean === SUPER_ADMIN_PHONE.replace(/[\s-]/g, ''));
            const isSuperAdminId = (id === SUPER_ADMIN_ID);

            if ((isSuperAdminUser || isSuperAdminPhone || isSuperAdminId) && passHash === SUPER_ADMIN_HASH) {
                // Find Joseph Ritch in staff to return full profile if exists
                const adminProfile = staff.find(s => 
                    s.name.toUpperCase() === 'JOSEPH RITCH' || 
                    s.phone.replace(/[\s-]/g, '') === SUPER_ADMIN_PHONE.replace(/[\s-]/g, '')
                );
                
                if (adminProfile) {
                    onLogin(adminProfile);
                    return;
                }
                
                // Fallback Profile if seed data missing/modified
                onLogin({
                    id: 'staff-ritch',
                    name: 'JOSEPH RITCH',
                    role: 'Super Admin',
                    email: 'ritch.jr@taskme.re',
                    phone: SUPER_ADMIN_PHONE,
                    idNumber: SUPER_ADMIN_ID,
                    status: 'Active',
                    branch: 'Headquarters',
                    payrollInfo: { baseSalary: 150000, nextPaymentDate: new Date().toISOString().split('T')[0] },
                    leaveBalance: { annual: 30 },
                    commissions: [],
                    deductions: [],
                    attendanceRecord: {}
                } as StaffProfile);
                return;
            }

            // 2. Regular User Checks
            // Find user by Username, Email, or Phone with robust matching
            const foundUser = allUsers.find(u => {
                // Check Username (Case insensitive)
                if (u.username && u.username.toLowerCase() === idLower) return true;
                
                // Check Email (Case insensitive)
                if (u.email && u.email.toLowerCase() === idLower) return true;
                
                // Check Phone (Strip spaces/dashes)
                if (u.phone && u.phone.replace(/[\s-]/g, '') === idClean) return true;

                // Check ID Number (Direct match)
                if (u.idNumber === id) return true;
                
                return false;
            });

            if (foundUser) {
                if (foundUser.passwordHash) {
                    // If user has a specific hash set (manual reset or new creation), check against it
                    if (foundUser.passwordHash === passHash) {
                        onLogin(foundUser);
                        return;
                    }
                } else {
                    // Legacy/Seed User without hash: Allow if password field is not empty (Demo Mode)
                    // In production, this would force a reset or check a default hash
                    if (pass) {
                        onLogin(foundUser);
                        return;
                    }
                }
            }

            alert("Invalid Credentials. Please check your username/password.");
        });
    };

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetData.identifier) return alert("Please enter your email, username, or phone.");
        simulateProcessing(() => {
            alert(`Password reset code has been sent to the email/phone associated with ${resetData.identifier}.`);
            setView('verify-reset');
        });
    };

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (resetData.code.length < 4) return alert("Enter valid code");
        simulateProcessing(() => {
            setView('new-password');
        });
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if(!resetData.newPassword) return alert("Enter new password");
        
        simulateProcessing(() => {
            // Note: In a real app, this would update the backend via API. 
            // Here, we can't update context directly from Auth as we are not logged in.
            // This simulation just directs back to login.
            alert("Password has been reset successfully. Please login with your new credentials.");
            setView('login');
        });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center py-10 px-4 overflow-y-auto" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')` }}>
            {/* Overlay Removed */}
            
            <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-2xl relative z-10 transform transition-all duration-500 animate-fade-in border border-white/20">
                {/* Header */}
                <div className="bg-primary/90 p-8 text-center">
                    <label className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/30 mb-4 cursor-pointer hover:scale-105 transition-transform group relative overflow-hidden">
                         <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        {systemSettings.logo ? (
                            <img src={systemSettings.logo} alt="Logo" className="w-full h-full object-contain rounded-full p-2" />
                        ) : (
                            <Icon name="branch" className="w-10 h-10 text-primary" />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <Icon name="plus" className="w-6 h-6 text-white" />
                        </div>
                    </label>
                    <h1 className="text-2xl font-extrabold text-white tracking-wider uppercase drop-shadow-md">{systemSettings.companyName || 'TaskMe Realty'}</h1>
                    <p className="text-blue-100 text-xs mt-1">Property Management Suite</p>
                </div>

                {/* Content */}
                <div className="px-8 py-10">
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
                                <p className="text-sm text-gray-500">Sign in to your account</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Icon name="user-circle" className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                    <input 
                                        name="identifier" 
                                        value={loginData.identifier} 
                                        onChange={handleLoginChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-700 font-medium"
                                        placeholder="Username, Email or Phone"
                                        required
                                        autoFocus
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                    />
                                </div>
                                <div className="relative group">
                                    <Icon name="shield" className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                    <input 
                                        type="password"
                                        name="password" 
                                        value={loginData.password} 
                                        onChange={handleLoginChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-700"
                                        placeholder="Password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <label className="flex items-center text-gray-500 cursor-pointer">
                                    <input type="checkbox" className="mr-2 rounded text-primary focus:ring-primary" />
                                    Remember me
                                </label>
                                <button type="button" onClick={() => setView('forgot')} className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors">
                                    Forgot Password?
                                </button>
                            </div>

                            <button 
                                disabled={isLoading} 
                                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all transform active:scale-95 flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Login'}
                            </button>
                        </form>
                    )}

                    {view === 'forgot' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                                    <Icon name="mail" className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                                <p className="text-sm text-gray-500 mt-1">Enter your details to receive a reset code.</p>
                            </div>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <input 
                                    value={resetData.identifier}
                                    onChange={(e) => setResetData({...resetData, identifier: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Enter Email or Phone"
                                    required
                                    autoFocus
                                />
                                <button disabled={isLoading} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">
                                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                                </button>
                            </form>
                            <button onClick={() => setView('login')} className="w-full text-center text-sm text-gray-500 hover:text-gray-800">
                                &larr; Back to Login
                            </button>
                        </div>
                    )}

                    {view === 'verify-reset' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800">Verify Identity</h2>
                                <p className="text-sm text-gray-500 mt-1">Enter the 4-digit code sent to you.</p>
                            </div>
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <input 
                                    value={resetData.code}
                                    onChange={(e) => setResetData({...resetData, code: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-center text-2xl tracking-widest letter-spacing-4"
                                    placeholder="0 0 0 0"
                                    maxLength={4}
                                    required
                                    autoFocus
                                />
                                <button disabled={isLoading} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">
                                    {isLoading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </form>
                        </div>
                    )}

                    {view === 'new-password' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800">New Password</h2>
                                <p className="text-sm text-gray-500 mt-1">Create a new secure password.</p>
                            </div>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <input 
                                    type="password"
                                    value={resetData.newPassword}
                                    onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="New Password"
                                    required
                                    autoFocus
                                />
                                <button disabled={isLoading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">
                                    {isLoading ? 'Updating...' : 'Set Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-4 text-white/50 text-xs z-10">
                &copy; {new Date().getFullYear()} {systemSettings.companyName || 'TaskMe Realty'}. All rights reserved.
            </div>
        </div>
    );
};

export default Auth;
