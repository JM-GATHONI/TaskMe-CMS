
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Icon from './Icon';
import { StaffProfile, TenantProfile } from '../types';
import { supabase } from '../utils/supabaseClient';

const ROLES = ['Landlord', 'Tenant', 'Investor', 'Affiliate', 'Contractor', 'Field Agent', 'Caretaker'] as const;

interface SignUpProps {
    onLogin: (user: StaffProfile | TenantProfile) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onLogin }) => {
    const { systemSettings } = useData();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        idNumber: '',
        email: '',
        password: '',
        role: ROLES[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { firstName, lastName, phone, idNumber, email, password, role } = formData;
            if (!email || !password) {
                setError('Email and password are required.');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }

            const fullName = [firstName, lastName].filter(Boolean).join(' ') || email;

            console.log('[Supabase] auth.signUp');
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role,
                        full_name: fullName,
                        first_name: firstName,
                        last_name: lastName,
                        phone,
                        id_number: idNumber,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message ?? 'Sign up failed');
                return;
            }

            if (!data.user) {
                setError('Sign up failed. Please try again.');
                return;
            }

            setSuccess(true);

            // Try auto sign-in (works if email confirmation is disabled)
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!signInError && signInData?.user && signInData?.session) {
                const user = signInData.user;
                let resolvedRole: StaffProfile['role'] = ((user.user_metadata as any)?.role ?? role) as any;
                try {
                    const { data: roleRow } = await supabase
                        .schema('app')
                        .from('user_roles')
                        .select('role:roles(name)')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    if (roleRow?.role?.name) resolvedRole = roleRow.role.name as any;
                } catch (_) {}

                const { data: staffRows } = await supabase
                    .schema('app')
                    .from('staff_profiles')
                    .select('id,name,role,email,phone,branch,status,salaryConfig,bankDetails,payrollInfo,leaveBalance,commissions,deductions,attendanceRecord')
                    .eq('id', user.id)
                    .limit(1);
                const staffRow = staffRows?.[0] ?? null;

                const loggedIn: StaffProfile = {
                    id: user.id,
                    name: (staffRow?.name ?? fullName ?? user.email ?? 'User') as string,
                    role: (staffRow?.role ?? resolvedRole) as StaffProfile['role'],
                    email: (user.email ?? staffRow?.email ?? email) as string,
                    phone: (staffRow?.phone ?? phone) as string,
                    branch: (staffRow?.branch ?? (user.user_metadata as any)?.branch ?? 'Headquarters') as any,
                    status: (staffRow?.status ?? 'Active') as any,
                    avatar: ((staffRow?.name ?? fullName ?? user.email ?? 'U') as string).split(' ').map((n: string) => n[0]).join(''),
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
                return;
            }

            // Email confirmation required — stay on success screen and link to login
        } catch (err: any) {
            setError(err?.message ?? 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = 'w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-700 text-sm';
    const selectClass = 'w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-700 text-sm';

    if (success) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center py-4 px-4 overflow-y-auto" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')` }}>
                <div className="w-full max-w-[320px] md:max-w-[360px] bg-white/95 rounded-2xl shadow-2xl relative z-10 transform transition-all duration-500 animate-fade-in border-2 border-primary">
                    <div className="bg-white p-6 text-center rounded-t-2xl">
                        <div className="mx-auto w-full h-40 flex items-center justify-center relative overflow-hidden">
                            {systemSettings.logo ? (
                                <img src={systemSettings.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                            ) : (
                                <Icon name="branch" className="w-24 h-24 text-primary" />
                            )}
                        </div>
                    </div>
                    <div className="px-5 py-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <Icon name="check" className="w-6 h-6" />
                        </div>
                        <h2 className="text-base font-bold text-gray-800">Account Created</h2>
                        <p className="text-[10px] text-gray-500">
                            Check your email to confirm your account, then sign in.
                        </p>
                        <a href="#/" className="block w-full py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg transition-all text-center">
                            Back to Login
                        </a>
                    </div>
                </div>
                <div className="absolute bottom-4 text-white/50 text-[10px] z-10 text-center w-full px-4">
                    &copy; {new Date().getFullYear()} {systemSettings.companyName || 'TaskMe Realty'}. All rights reserved.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center py-4 px-4 overflow-y-auto" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')` }}>
            <div className="w-full max-w-[360px] md:max-w-[400px] bg-white/95 rounded-2xl shadow-2xl relative z-10 transform transition-all duration-500 animate-fade-in border-2 border-primary max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-white p-6 text-center rounded-t-2xl flex-shrink-0">
                    <div className="mx-auto w-full h-32 flex items-center justify-center relative overflow-hidden">
                        {systemSettings.logo ? (
                            <img src={systemSettings.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                        ) : (
                            <Icon name="branch" className="w-20 h-20 text-primary" />
                        )}
                    </div>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="text-center mb-3 bg-primary py-3 rounded-lg shadow-sm">
                            <h2 className="text-base font-bold text-white">Create Account</h2>
                            <p className="text-[10px] text-white/90">Sign up for TaskMe</p>
                        </div>

                        {error && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative group">
                                <Icon name="user-circle" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                <input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="First name"
                                    autoComplete="given-name"
                                />
                            </div>
                            <div className="relative group">
                                <Icon name="user-circle" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                <input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="Last name"
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <Icon name="communication" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            <input
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="+254 7XX XXX XXX"
                                autoComplete="tel"
                            />
                        </div>

                        <div className="relative group">
                            <Icon name="leases" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            <input
                                name="idNumber"
                                value={formData.idNumber}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="I.D number"
                            />
                        </div>

                        <div className="relative group">
                            <Icon name="mail" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Email"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="relative group">
                            <Icon name="shield" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Password"
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>

                        <div>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={selectClass}
                                required
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all transform active:scale-95 flex justify-center items-center"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Sign Up'}
                        </button>

                        <p className="text-center text-xs text-gray-600 mt-2">
                            Already have an account?{' '}
                            <a href="#/" className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors">
                                Sign in
                            </a>
                        </p>
                    </form>
                </div>
            </div>

            <div className="absolute bottom-4 text-white/50 text-[10px] z-10 text-center w-full px-4">
                &copy; {new Date().getFullYear()} {systemSettings.companyName || 'TaskMe Realty'}. All rights reserved.
            </div>
        </div>
    );
};

export default SignUp;
