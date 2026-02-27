import React, { useState, useEffect } from 'react';
import { useData } from '../context/SupabaseDataContext';
import { authService } from '../services/api';
import { supabase } from '../lib/supabase';
import Icon from './Icon';
import { User, StaffProfile, TenantProfile } from '../types';

interface AuthProps {
    onLogin: (user: Partial<User> | StaffProfile | TenantProfile) => void;
}

type AuthView = 'login' | 'register' | 'forgot' | 'verify-reset' | 'new-password';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const { systemSettings, staff, landlords, tenants, renovationInvestors, vendors, roles } = useData();
    const [view, setView] = useState<AuthView>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form States
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        phone: '', idNumber: '', role: 'Tenant' as string
    });
    const [resetData, setResetData] = useState({ email: '' });

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // User already logged in, get their profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile) {
                    onLogin(profile as User);
                }
            }
        };
        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile) {
                    onLogin(profile as User);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [onLogin]);

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await authService.signIn(loginData.email, loginData.password);
            
            if (error) {
                setError(error.message || 'Invalid email or password');
                return;
            }

            if (data.user) {
                // Get the user profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    setError('Failed to load user profile');
                    return;
                }

                onLogin(profile as User);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (registerData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await authService.signUp(
                registerData.email,
                registerData.password,
                {
                    name: registerData.name,
                    phone: registerData.phone,
                    id_number: registerData.idNumber,
                    role: registerData.role
                }
            );

            if (error) {
                setError(error.message || 'Registration failed');
                return;
            }

            setSuccess('Registration successful! Please check your email to verify your account, then log in.');
            setView('login');
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await authService.resetPassword(resetData.email);
            
            if (error) {
                setError(error.message || 'Failed to send reset email');
                return;
            }

            setSuccess('Password reset email sent! Check your inbox.');
            setView('login');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleOptions = () => {
        const availableRoles = roles.length > 0 ? roles : [
            { name: 'Tenant', description: 'Tenant portal access' },
            { name: 'Landlord', description: 'Property owner access' },
            { name: 'Field Agent', description: 'Field operations' },
            { name: 'Investor', description: 'Investment platform access' },
            { name: 'Contractor', description: 'Vendor/contractor access' },
            { name: 'Affiliate', description: 'Referral partner access' }
        ];
        
        return availableRoles.filter(r => 
            !['Super Admin', 'Branch Manager', 'Accountant'].includes(r.name)
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
                        <Icon name="logo" className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        {systemSettings.companyName || 'TaskMe Realty'}
                    </h1>
                    <p className="text-gray-400 mt-2">Property Management Platform</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <Icon name="close" className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                            <Icon name="check" className="w-5 h-5" />
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={loginData.email}
                                    onChange={handleLoginChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="Enter your email"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-gray-600">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setView('forgot')}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                            <div className="text-center text-sm text-gray-600">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setView('register')}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Register
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Register Form */}
                    {view === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={registerData.name}
                                    onChange={handleRegisterChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={registerData.email}
                                    onChange={handleRegisterChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={registerData.phone}
                                        onChange={handleRegisterChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="07XXXXXXXX"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                                    <input
                                        type="text"
                                        name="idNumber"
                                        value={registerData.idNumber}
                                        onChange={handleRegisterChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="ID Number"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    name="role"
                                    value={registerData.role}
                                    onChange={handleRegisterChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    {getRoleOptions().map(r => (
                                        <option key={r.name} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Min 6 characters"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={registerData.confirmPassword}
                                    onChange={handleRegisterChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                            <div className="text-center text-sm text-gray-600">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Forgot Password Form */}
                    {view === 'forgot' && (
                        <form onSubmit={handleForgotPassword} className="space-y-5">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                                    <Icon name="lock" className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Reset Password</h3>
                                <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a reset link</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={resetData.email}
                                    onChange={(e) => setResetData({ email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                            <div className="text-center text-sm text-gray-600">
                                Remember your password?{' '}
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-gray-500 text-sm">
                    <p>© 2025 {systemSettings.companyName || 'TaskMe Realty'}. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
