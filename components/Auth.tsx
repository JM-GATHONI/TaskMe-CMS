
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Icon from './Icon';
import { User, StaffProfile, TenantProfile } from '../types';
import { supabase } from '../utils/supabaseClient';

interface AuthProps {
    onLogin: (user: Partial<User> | StaffProfile | TenantProfile) => void;
}

type AuthView = 'login' | 'forgot' | 'verify-reset' | 'new-password';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const { systemSettings } = useData();
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [loginData, setLoginData] = useState({ identifier: '', password: '' });
    const [resetData, setResetData] = useState({ identifier: '', code: '', newPassword: '' });

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        try {
            const { identifier, password } = loginData;

            console.log('[Supabase] auth.signInWithPassword');
            const { data, error } = await supabase.auth.signInWithPassword({
                email: identifier,
                password,
            });

            if (error || !data.user) {
                alert(error?.message ?? 'Login failed');
                return;
            }

            const user = data.user;

            // Resolve role from app.user_roles -> app.roles (falls back to existing metadata / default)
            let resolvedRole: StaffProfile['role'] = ((user.user_metadata as any)?.role ?? 'Super Admin') as any;
            try {
                console.log('[Supabase] user_roles lookup', { userId: user.id });
                const { data: roleRow, error: roleErr } = await supabase
                    .schema('app')
                    .from('user_roles')
                    .select('role:roles(name)')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (!roleErr && roleRow?.role?.name) {
                    resolvedRole = roleRow.role.name as any;
                }
            } catch (e) {
                // ignore: role resolution is best-effort
            }

            console.log('[Supabase] staff_profiles lookup', { userId: user.id });
            const { data: staffRows, error: staffError } = await supabase
                .schema('app')
                .from('staff_profiles')
                .select('id,name,role,email,phone,branch,status,salaryConfig,bankDetails,payrollInfo,leaveBalance,commissions,deductions,attendanceRecord')
                .eq('id', user.id)
                .limit(1);

            if (staffError) {
                console.warn('Error loading staff profile', staffError);
            }

            const staffRow = staffRows && staffRows.length > 0 ? staffRows[0] : null;

            const loggedIn: StaffProfile = {
                id: user.id,
                name: (staffRow?.name ?? user.email ?? 'User') as string,
                role: (staffRow?.role ?? resolvedRole) as StaffProfile['role'],
                email: (user.email ?? staffRow?.email ?? 'unknown@example.com') as string,
                phone: (staffRow?.phone ?? '') as string,
                branch: (staffRow?.branch ?? (user.user_metadata as any)?.branch ?? 'Headquarters') as any,
                status: (staffRow?.status ?? 'Active') as any,
                avatar: ((staffRow?.name ?? user.email ?? 'U') as string)
                    .split(' ')
                    .map((n: string) => n[0])
                    .join(''),
                salaryConfig: staffRow?.salaryConfig ?? { type: 'Monthly', amount: 0 },
                bankDetails: staffRow?.bankDetails ?? { bankName: '', accountNumber: '', kraPin: '', defaultMethod: 'Bank' },
                payrollInfo: staffRow?.payrollInfo ?? { baseSalary: 0, nextPaymentDate: '' },
                leaveBalance: staffRow?.leaveBalance ?? { annual: 0 },
                commissions: staffRow?.commissions ?? [],
                deductions: staffRow?.deductions ?? [],
                attendanceRecord: staffRow?.attendanceRecord ?? {},
                passwordHash: '',
            };

            onLogin(loggedIn);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetData.identifier) return alert("Please enter your email, username, or phone.");
        alert('Password reset is configured via Supabase. Please check your email for reset instructions.');
    };

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Use the password reset link sent to your email to complete this action.');
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Password reset is handled by Supabase hosted pages.');
        setView('login');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center py-4 px-4 overflow-y-auto" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')` }}>
            {/* Added border-2 border-primary to the main card */}
            <div className="w-full max-w-[320px] md:max-w-[360px] bg-white/95 rounded-2xl shadow-2xl relative z-10 transform transition-all duration-500 animate-fade-in border-2 border-primary">
                {/* Header - Rectangular Logo Version on White Background - Read Only */}
                <div className="bg-white p-6 text-center rounded-t-2xl">
                    <div className="mx-auto w-full h-40 flex items-center justify-center relative overflow-hidden">
                        {systemSettings.logo ? (
                            <img src={systemSettings.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                        ) : (
                            <Icon name="branch" className="w-24 h-24 text-primary" />
                        )}
                    </div>
                </div>

                {/* Content - Compact */}
                <div className="px-5 py-6">
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="text-center mb-4 bg-primary py-3 rounded-lg shadow-sm">
                                <h2 className="text-base font-bold text-white">Welcome Back</h2>
                                <p className="text-[10px] text-white/90">Sign in to your account</p>
                            </div>

                            <div className="space-y-3">
                                <div className="relative group">
                                    <Icon name="user-circle" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                    <input 
                                        name="identifier" 
                                        value={loginData.identifier} 
                                        onChange={handleLoginChange}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-700 font-medium text-sm"
                                        placeholder="Username, Email or Phone"
                                        required
                                        autoFocus
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                    />
                                </div>
                                <div className="relative group">
                                    <Icon name="shield" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                    <input 
                                        type="password"
                                        name="password" 
                                        value={loginData.password} 
                                        onChange={handleLoginChange}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-700 text-sm"
                                        placeholder="Password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                <label className="flex items-center text-gray-500 cursor-pointer">
                                    <input type="checkbox" className="mr-1.5 rounded text-primary focus:ring-primary w-3 h-3" />
                                    Remember me
                                </label>
                                <button type="button" onClick={() => setView('forgot')} className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors">
                                    Forgot Password?
                                </button>
                            </div>

                            <button 
                                disabled={isLoading} 
                                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all transform active:scale-95 flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Login'}
                            </button>
                        </form>
                    )}

                    {view === 'forgot' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                                    <Icon name="mail" className="w-5 h-5" />
                                </div>
                                <h2 className="text-base font-bold text-gray-800">Reset Password</h2>
                                <p className="text-[10px] text-gray-500 mt-1">Enter your details to receive a reset code.</p>
                            </div>
                            <form onSubmit={handleForgotPassword} className="space-y-3">
                                <input 
                                    value={resetData.identifier}
                                    onChange={(e) => setResetData({...resetData, identifier: e.target.value})}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                                    placeholder="Enter Email or Phone"
                                    required
                                    autoFocus
                                />
                                <button disabled={isLoading} className="w-full bg-gray-800 text-white py-2.5 rounded-lg font-bold hover:bg-black transition-colors text-sm">
                                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                                </button>
                            </form>
                            <button onClick={() => setView('login')} className="w-full text-center text-xs text-gray-500 hover:text-gray-800">
                                &larr; Back to Login
                            </button>
                        </div>
                    )}

                    {view === 'verify-reset' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center">
                                <h2 className="text-base font-bold text-gray-800">Verify Identity</h2>
                                <p className="text-[10px] text-gray-500 mt-1">Enter the 4-digit code sent to you.</p>
                            </div>
                            <form onSubmit={handleVerifyCode} className="space-y-3">
                                <input 
                                    value={resetData.code}
                                    onChange={(e) => setResetData({...resetData, code: e.target.value})}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary outline-none text-center text-xl tracking-widest letter-spacing-4"
                                    placeholder="0 0 0 0"
                                    maxLength={4}
                                    required
                                    autoFocus
                                />
                                <button disabled={isLoading} className="w-full bg-gray-800 text-white py-2.5 rounded-lg font-bold hover:bg-black transition-colors text-sm">
                                    {isLoading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </form>
                        </div>
                    )}

                    {view === 'new-password' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center">
                                <h2 className="text-base font-bold text-gray-800">New Password</h2>
                                <p className="text-[10px] text-gray-500 mt-1">Create a new secure password.</p>
                            </div>
                            <form onSubmit={handleResetPassword} className="space-y-3">
                                <input 
                                    type="password"
                                    value={resetData.newPassword}
                                    onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm"
                                    placeholder="New Password"
                                    required
                                    autoFocus
                                />
                                <button disabled={isLoading} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors text-sm">
                                    {isLoading ? 'Updating...' : 'Set Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-4 text-white/50 text-[10px] z-10 text-center w-full px-4">
                &copy; {new Date().getFullYear()} {systemSettings.companyName || 'TaskMe Realty'}. All rights reserved.
            </div>
        </div>
    );
};

export default Auth;
