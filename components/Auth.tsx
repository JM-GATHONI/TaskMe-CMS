
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
    const {
        systemSettings,
        staff,
        landlords,
        tenants,
        renovationInvestors,
        vendors,
        addTenant,
        addLandlord,
        addRenovationInvestor,
        addVendor,
        addStaff,
        deleteTenant,
        deleteLandlord,
        deleteRenovationInvestor,
        deleteVendor,
        deleteStaff,
    } = useData();
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [loginData, setLoginData] = useState({ identifier: '', password: '' });
    const [resetData, setResetData] = useState({ identifier: '', code: '', newPassword: '' });

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        try {
            const { identifier, password } = loginData;

            // Allow login via email or phone.
            let loginEmail = identifier.trim();
            if (!loginEmail.includes('@')) {
                // Treat identifier as phone: resolve to email using app_state lists.
                const byPhone =
                    staff.find(s => s.phone === loginEmail) ||
                    landlords.find(l => l.phone === loginEmail) ||
                    tenants.find(t => t.phone === loginEmail) ||
                    renovationInvestors.find(i => i.phone === loginEmail) ||
                    vendors.find(v => v.phone === loginEmail);

                if (!byPhone?.email) {
                    alert('No user found for this phone number.');
                    return;
                }
                loginEmail = byPhone.email;
            }

            console.log('[Supabase] auth.signInWithPassword');
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
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

            let staffRow: any = null;
            if (resolvedRole !== 'Tenant' && resolvedRole !== 'Caretaker') {
                console.log('[Supabase] staff_profiles lookup', { userId: user.id });
                const { data: staffRows, error: staffError } = await supabase
                    .schema('app')
                    .from('staff_profiles')
                    .select('id,name,role,email,phone,branch,status')
                    .eq('id', user.id)
                    .limit(1);

                if (staffError) {
                    console.warn('Error loading staff profile', staffError);
                }

                staffRow = staffRows && staffRows.length > 0 ? staffRows[0] : null;
            }

            const persistedStaff = staff.find(s => s.id === user.id);

            const pickFirstWord = (s: string) => String(s ?? '').trim().split(/\s+/).filter(Boolean)[0] || '';

            // Resolve display name from public.profiles (first_name/full_name), then staff, then email
            let displayName: string = (user.email ?? 'User') as string;
            let profFirst: string | null = null;
            let profFull: string | null = null;
            try {
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('first_name, full_name')
                    .eq('id', user.id)
                    .maybeSingle();
                const first = (prof as any)?.first_name?.trim?.();
                const full = (prof as any)?.full_name?.trim?.();
                profFirst = first || null;
                profFull = full || null;
                if (first) displayName = first;
                else if (full) displayName = full;
                else displayName = (staffRow?.name ?? user.email ?? 'User') as string;
            } catch (_) {
                displayName = (staffRow?.name ?? user.email ?? 'User') as string;
            }

            // Permanent UX: always greet by first name.
            displayName = pickFirstWord(displayName) || (user.email ? pickFirstWord(user.email.split('@')[0]) : '') || 'User';

            // Hardening: ensure public.profiles has a stable first_name/full_name for consistent welcome headers.
            // Never store an email as first_name/full_name.
            try {
                const looksLikeEmail = (s: string) => s.includes('@');
                const candidateFull = String(staffRow?.name ?? (user.user_metadata as any)?.full_name ?? displayName ?? '').trim();
                const safeFull = candidateFull && !looksLikeEmail(candidateFull) ? candidateFull : null;
                const safeFirst = safeFull ? (safeFull.split(/\s+/).filter(Boolean)[0] || null) : null;
                const needUpsert =
                    !profFirst ||
                    looksLikeEmail(String(profFirst)) ||
                    (!profFull || looksLikeEmail(String(profFull)));
                if (needUpsert && safeFirst) {
                    const meta: any = user.user_metadata ?? {};
                    const idNumRaw = String(meta.id_number ?? '').trim();
                    const row: Record<string, unknown> = {
                        id: user.id,
                        role: resolvedRole,
                        first_name: safeFirst,
                        full_name: safeFull,
                        phone: (staffRow?.phone ?? meta.phone ?? null) || null,
                        email: user.email ?? null,
                    };
                    if (idNumRaw) row.id_number = idNumRaw;
                    await supabase.from('profiles').upsert(row, { onConflict: 'id' });
                }
            } catch {
                // non-blocking
            }

            const loggedIn: StaffProfile = {
                id: user.id,
                name: displayName,
                role: (staffRow?.role ?? resolvedRole) as StaffProfile['role'],
                email: (user.email ?? staffRow?.email ?? 'unknown@example.com') as string,
                phone: (staffRow?.phone ?? '') as string,
                branch: (staffRow?.branch ?? (user.user_metadata as any)?.branch ?? 'Headquarters') as any,
                status: (staffRow?.status ?? 'Active') as any,
                avatar: displayName.split(' ').map((n: string) => n[0]).join('') || 'U',
                salaryConfig: persistedStaff?.salaryConfig ?? { type: 'Monthly', amount: 0 },
                bankDetails: persistedStaff?.bankDetails ?? { bankName: '', accountNumber: '', kraPin: '', defaultMethod: 'Bank' },
                payrollInfo: persistedStaff?.payrollInfo ?? { baseSalary: 0, nextPaymentDate: '' },
                leaveBalance: persistedStaff?.leaveBalance ?? { annual: 0 },
                commissions: persistedStaff?.commissions ?? [],
                deductions: persistedStaff?.deductions ?? [],
                attendanceRecord: persistedStaff?.attendanceRecord ?? {},
                passwordHash: '',
            };

            // Attach persisted profile picture (stored in app_state user lists) so it "sticks" across re-login.
            const anyId = user.id;
            const fromLists: any =
                staff.find(s => s.id === anyId) ||
                landlords.find(l => l.id === anyId) ||
                tenants.find(t => t.id === anyId) ||
                renovationInvestors.find(i => i.id === anyId) ||
                vendors.find(v => v.id === anyId) ||
                null;
            const pic = fromLists?.avatar || fromLists?.profilePicture || fromLists?.avatarUrl;
            if (pic) (loggedIn as any).profilePicture = pic;

            // Ensure users signing in through public signup are reflected in app_state user lists.
            // This backfills records when signup auto-signin is skipped due to email confirmation.
            try {
                const uid = user.id;
                const meta: any = user.user_metadata ?? {};
                const base: any = {
                    id: uid,
                    name: displayName || user.email || 'User',
                    username: '',
                    email: (user.email ?? '') as string,
                    phone: (staffRow?.phone ?? meta.phone ?? '') as string,
                    idNumber: (meta.id_number ?? '') as string,
                    status: 'Active',
                };

                if (resolvedRole === 'Tenant') {
                    deleteLandlord(uid);
                    deleteRenovationInvestor(uid);
                    deleteVendor(uid);
                    deleteStaff(uid);
                    if (!tenants.some(t => t.id === uid)) {
                        addTenant({
                            ...base,
                            role: 'Tenant',
                            unit: '',
                            rentAmount: 0,
                            onboardingDate: new Date().toISOString().split('T')[0],
                            paymentHistory: [],
                            outstandingBills: [],
                            outstandingFines: [],
                            maintenanceRequests: [],
                        } as any);
                    }
                } else if (resolvedRole === 'Landlord' || resolvedRole === 'Affiliate') {
                    deleteTenant(uid);
                    deleteRenovationInvestor(uid);
                    deleteVendor(uid);
                    deleteStaff(uid);
                    if (!landlords.some(l => l.id === uid)) {
                        addLandlord({ ...base, role: resolvedRole } as any);
                    }
                } else if (resolvedRole === 'Investor') {
                    deleteTenant(uid);
                    deleteLandlord(uid);
                    deleteVendor(uid);
                    deleteStaff(uid);
                    if (!renovationInvestors.some(i => i.id === uid)) {
                        addRenovationInvestor({
                            ...base,
                            role: 'Investor',
                            joinDate: new Date().toISOString().split('T')[0],
                            status: 'Active',
                        } as any);
                    }
                } else if (resolvedRole === 'Contractor') {
                    deleteTenant(uid);
                    deleteLandlord(uid);
                    deleteRenovationInvestor(uid);
                    deleteStaff(uid);
                    if (!vendors.some(v => v.id === uid)) {
                        addVendor({
                            id: uid,
                            name: base.name,
                            username: '',
                            specialty: 'General',
                            rating: 5,
                            email: base.email,
                            phone: base.phone,
                        } as any);
                    }
                } else {
                    // Staff roles: Field Agent, Caretaker, Accountants, etc.
                    deleteTenant(uid);
                    deleteLandlord(uid);
                    deleteRenovationInvestor(uid);
                    deleteVendor(uid);
                    if (!staff.some(s => s.id === uid)) {
                        addStaff({
                            ...base,
                            role: resolvedRole,
                            branch: (staffRow?.branch ?? meta.branch ?? 'Headquarters') as any,
                            payrollInfo: { baseSalary: 0, nextPaymentDate: '' },
                            leaveBalance: { annual: 0 },
                        } as any);
                    }
                }
            } catch (e) {
                console.warn('Failed to backfill signed-in user into app_state lists (non-blocking)', e);
            }

            onLogin(loggedIn);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetData.identifier) return alert("Please enter your email, username, or phone.");
        // Trigger Supabase reset email (uses Supabase SMTP settings; configure to Resend).
        supabase.auth.resetPasswordForEmail(resetData.identifier).catch((err) => {
            console.warn('[Supabase] resetPasswordForEmail failed', err);
        });
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
                                        type={showPassword ? "text" : "password"}
                                        name="password" 
                                        value={loginData.password} 
                                        onChange={handleLoginChange}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-700 text-sm"
                                        placeholder="Password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.5a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
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

                            <p className="text-center text-xs text-gray-600 mt-3">
                                Don't have an account?{' '}
                                <a href="#/signup" className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors">
                                    Sign up here
                                </a>
                            </p>
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
