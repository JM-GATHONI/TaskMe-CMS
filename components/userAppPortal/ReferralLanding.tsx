
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { INITIAL_FUNDS } from '../../constants';

type UserPersona = 'Tenant' | 'Landlord' | 'Investor';

// --- HELPER: Investment Rates Logic ---
const getTierRates = (months: number) => {
    if (months >= 24) return { apy: 30, monthly: 2.5 };
    if (months >= 18) return { apy: 26.4, monthly: 2.2 };
    if (months >= 12) return { apy: 24, monthly: 2.0 };
    return { apy: 18, monthly: 1.5 };
};

// --- MODAL: REQUEST CALL BACK ---
const CallbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', topic: 'General Inquiry' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) return alert("Name and Phone are required.");
        
        // Simulate API call
        setTimeout(() => {
            setSubmitted(true);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6" onClick={e => e.stopPropagation()}>
                {!submitted ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Request Call Back</h3>
                            <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">Leave your details and our investment team will contact you within 24 hours.</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                <input 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                <input 
                                    value={formData.phone} 
                                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="07..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Topic</label>
                                <select 
                                    value={formData.topic} 
                                    onChange={e => setFormData({...formData, topic: e.target.value})}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                >
                                    <option>General Inquiry</option>
                                    <option>Renovation Funds</option>
                                    <option>Property Management</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-transform active:scale-95">
                                Request Call
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="check" className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Request Received!</h3>
                        <p className="text-gray-600">We will be in touch shortly.</p>
                        <button onClick={onClose} className="mt-6 text-primary font-bold hover:underline">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MODAL: INVESTMENT FLOW ---
const InvestmentModal: React.FC<{ 
    fund: any; 
    onClose: () => void;
}> = ({ fund, onClose }) => {
    const [step, setStep] = useState<'auth' | 'config' | 'payment' | 'processing' | 'success'>('auth');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    
    // Auth State
    const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '' });
    
    // Config State
    const [amount, setAmount] = useState<string>('');
    const [duration, setDuration] = useState<number>(12);
    
    // Payment State
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [txCode, setTxCode] = useState('');

    // Derived Rates
    const rates = useMemo(() => getTierRates(duration), [duration]);
    const estMonthlyReturn = amount ? (parseFloat(amount) * rates.monthly / 100) : 0;
    const estTotalReturn = amount ? (parseFloat(amount) * (rates.apy / 100) * (duration / 12)) : 0;

    useEffect(() => {
        if (step === 'payment' && userForm.phone) {
            setMpesaPhone(userForm.phone);
        }
    }, [step, userForm.phone]);

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (authMode === 'register' && (!userForm.name || !userForm.phone)) return alert("Please fill all fields");
        if (!userForm.email || !userForm.password) return alert("Please fill all fields");
        setStep('config');
    };

    const handleConfigSubmit = () => {
        if (!amount || parseFloat(amount) < 5000) return alert("Minimum investment is KES 5,000");
        setStep('payment');
    };

    const handleProcessPayment = () => {
        if (!/^(2547|07)\d{8}$/.test(mpesaPhone.replace(/\s/g, ''))) {
            alert('Please enter a valid Kenyan mobile number');
            return;
        }
        setStep('processing');
        setTimeout(() => {
            setTxCode(`INV${Math.floor(Math.random()*100000).toString().padStart(5, '0')}QT`);
            setStep('success');
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800">
                            {step === 'success' ? 'Investment Confirmed' : `Invest: ${fund.name}`}
                        </h3>
                        {step !== 'success' && <p className="text-xs text-gray-500">Step {step === 'auth' ? '1' : step === 'config' ? '2' : '3'} of 3</p>}
                    </div>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    
                    {/* STEP 1: AUTH */}
                    {step === 'auth' && (
                        <div className="space-y-6">
                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'register' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>New Investor</button>
                                <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'login' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Log In</button>
                            </div>
                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                                {authMode === 'register' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                        <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. John Doe" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                    <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="john@example.com" />
                                </div>
                                {authMode === 'register' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                        <input type="tel" required value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="07..." />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                    <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="••••••••" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark transition-transform active:scale-95">Continue</button>
                            </form>
                        </div>
                    )}

                    {/* STEP 2: CONFIGURATION */}
                    {step === 'config' && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Investment Amount (KES)</label>
                                <input 
                                    type="number" 
                                    autoFocus
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                    className="w-full p-3 border rounded-lg text-lg font-bold outline-none focus:border-primary" 
                                    placeholder="Min 5,000"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Investment Duration</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[6, 12, 18, 24].map(d => (
                                        <button 
                                            key={d}
                                            onClick={() => setDuration(d)}
                                            className={`p-3 rounded-lg border text-sm font-bold transition-all ${duration === d ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            {d} Months
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Target APY</span>
                                    <span className="font-bold text-blue-700 text-lg">{rates.apy}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Monthly Return</span>
                                    <span className="font-bold text-green-600 text-lg">{rates.monthly}%</span>
                                </div>
                                <div className="border-t border-blue-200 pt-2 mt-2">
                                     <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-700">Est. Monthly Payout</span>
                                        <span className="font-bold text-gray-800">KES {estMonthlyReturn.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-right">Total Profit: KES {estTotalReturn.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep('auth')} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Back</button>
                                <button onClick={handleConfigSubmit} className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-md">Next: Payment</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PAYMENT */}
                    {(step === 'payment' || step === 'processing' || step === 'success') && (
                        <div className="relative">
                            {/* M-Pesa Styles */}
                            <style>{`
                                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                                .mpesa-spinner { width: 60px; height: 60px; border: 5px solid rgba(31, 159, 33, 0.2); border-top: 5px solid #1F9F21; border-radius: 50%; margin: 0 auto 25px; animation: spin 1s linear infinite; }
                                .loading-dots span { display: inline-block; width: 8px; height: 8px; background-color: #1F9F21; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both; }
                                .loading-dots span:nth-child(1) { animation-delay: 0s; } .loading-dots span:nth-child(2) { animation-delay: 0.2s; } .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
                            `}</style>

                            {step === 'payment' && (
                                <>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-6 text-center">
                                        <p className="text-xs text-green-700 font-bold uppercase mb-1">Amount to Pay</p>
                                        <p className="text-2xl font-extrabold text-green-800">KES {parseFloat(amount).toLocaleString()}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-1 font-semibold text-gray-700 text-xs uppercase">M-Pesa Number</label>
                                            <input 
                                                type="tel" 
                                                value={mpesaPhone} 
                                                onChange={e => setMpesaPhone(e.target.value)} 
                                                className="w-full p-3 border-2 border-[#c8e6c9] rounded-xl text-base focus:outline-none focus:border-[#1F9F21] transition-colors"
                                                placeholder="07..."
                                            />
                                        </div>
                                        
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setStep('config')} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Back</button>
                                            <button onClick={handleProcessPayment} className="flex-[2] py-3.5 bg-gradient-to-r from-[#1F9F21] to-[#177D1A] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95">
                                                Pay & Invest
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 'processing' && (
                                <div className="py-10 text-center">
                                    <div className="mpesa-spinner"></div>
                                    <p className="text-xl font-semibold text-[#1a365d] mb-2">Processing Investment...</p>
                                    <p className="text-[#4a904a] font-medium">Check your phone for the M-Pesa prompt.</p>
                                    <div className="loading-dots flex justify-center gap-1.5 mt-6">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                        <Icon name="check" className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome Aboard!</h3>
                                    <p className="text-gray-600 text-sm mb-6">
                                        Your investment of <strong>KES {parseFloat(amount).toLocaleString()}</strong> in {fund.name} is active.
                                    </p>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left text-sm mb-6">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-500">Transaction ID</span>
                                            <span className="font-mono font-bold text-gray-800">{txCode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Duration</span>
                                            <span className="font-bold text-gray-800">{duration} Months @ {rates.apy}% APY</span>
                                        </div>
                                    </div>

                                    <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">
                                        Go to Investor Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- BOOKING MODAL (EXISTING) ---
const BookingModal: React.FC<{ 
    unit: any; 
    discount: number; 
    onClose: () => void;
}> = ({ unit, discount, onClose }) => {
    const [step, setStep] = useState<'auth' | 'summary' | 'payment' | 'processing' | 'success'>('auth');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    
    // Auth State
    const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '' });
    
    // M-Pesa State
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [txCode, setTxCode] = useState('');

    // Financials
    const deposit = unit.rent; // 1 Month Deposit
    const rent = unit.rent;    // 1 Month Rent
    const subtotal = deposit + rent;
    const totalDue = subtotal - discount;

    useEffect(() => {
        if (step === 'payment' && userForm.phone) {
            setMpesaPhone(userForm.phone);
        }
    }, [step, userForm.phone]);

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authMode === 'register' && (!userForm.name || !userForm.phone)) return alert("Please fill all fields");
        if (!userForm.email || !userForm.password) return alert("Please fill all fields");
        setStep('summary');
    };

    const handleProcessPayment = () => {
        if (!/^(2547|07)\d{8}$/.test(mpesaPhone.replace(/\s/g, ''))) {
            alert('Please enter a valid Kenyan mobile number');
            return;
        }
        setStep('processing');
        setTimeout(() => {
            setTxCode(`LGR${Math.floor(Math.random()*10000).toString().padStart(4, '0')}QT${Math.floor(Math.random()*9)}M`);
            setStep('success');
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800">
                            {step === 'success' ? 'Booking Confirmed' : `Booking: ${unit.unitNumber}`}
                        </h3>
                        <p className="text-xs text-gray-500">{unit.propertyName}</p>
                    </div>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {step === 'auth' && (
                        <div className="space-y-6">
                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'register' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>New Account</button>
                                <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'login' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Log In</button>
                            </div>
                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                                {authMode === 'register' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                        <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. John Doe"/>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                    <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="john@example.com"/>
                                </div>
                                {authMode === 'register' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                        <input type="tel" required value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="07..."/>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                    <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="••••••••"/>
                                </div>
                                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark transition-transform active:scale-95">Continue to Booking</button>
                            </form>
                        </div>
                    )}
                    {step === 'summary' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-3 text-sm uppercase">Payment Breakdown</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600"><span>First Month Rent</span><span>KES {rent.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-gray-600"><span>Security Deposit</span><span>KES {deposit.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-green-600 font-medium"><span>Referral Discount</span><span>- KES {discount.toLocaleString()}</span></div>
                                    <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-extrabold text-lg text-blue-900"><span>Total Due</span><span>KES {totalDue.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep('auth')} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Back</button>
                                <button onClick={() => setStep('payment')} className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition-transform active:scale-95">Proceed to Pay</button>
                            </div>
                        </div>
                    )}
                    {(step === 'payment' || step === 'processing' || step === 'success') && (
                        <div className="relative">
                            {step === 'payment' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-1 font-semibold text-[#2d3748] text-xs uppercase">M-Pesa Number</label>
                                        <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} className="w-full p-3 border-2 border-[#c8e6c9] rounded-xl text-base focus:outline-none focus:border-[#1F9F21] transition-colors" placeholder="07..."/>
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-semibold text-[#2d3748] text-xs uppercase">Amount</label>
                                        <div className="w-full p-3 border-2 border-gray-100 bg-gray-50 rounded-xl text-base font-bold text-gray-800">KES {totalDue.toLocaleString()}</div>
                                    </div>
                                    <button onClick={handleProcessPayment} className="w-full py-3.5 bg-gradient-to-r from-[#1F9F21] to-[#177D1A] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 mt-4">Pay Now</button>
                                </div>
                            )}
                            {step === 'processing' && (
                                <div className="py-10 text-center">
                                    <p className="text-xl font-semibold text-[#1a365d] mb-2">Processing...</p>
                                    <p className="text-[#4a904a] font-medium">Check your phone for the M-Pesa prompt.</p>
                                </div>
                            )}
                            {step === 'success' && (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Icon name="check" className="w-8 h-8" /></div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                                    <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">Go to Dashboard</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const LandingHeader: React.FC<{ 
    persona: UserPersona; 
    onSwitch: (p: UserPersona) => void; 
    referrerName: string;
}> = ({ persona, onSwitch, referrerName }) => (
    <div className="bg-white shadow-sm sticky top-[112px] z-40 transition-all">
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200 w-full md:w-96 mx-auto">
                <Icon name="stack" className="w-3 h-3" />
                <span className="truncate">taskme.re/invite/{referrerName.toLowerCase().replace(' ', '')}</span>
            </div>
            <div className="hidden md:flex gap-2">
                <span className="font-bold mr-2">Viewing as:</span>
                {(['Tenant', 'Landlord', 'Investor'] as UserPersona[]).map(p => (
                    <button 
                        key={p} 
                        onClick={() => onSwitch(p)}
                        className={`px-2 py-0.5 rounded ${persona === p ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
                <div className="p-2 bg-primary rounded-lg text-white"><Icon name="branch" className="w-6 h-6" /></div>
                TaskMe Realty
            </div>
            <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                <a href="#" className="hover:text-primary">Properties</a>
                <a href="#" className="hover:text-primary">Renovation Funds</a>
                <a href="#" className="hover:text-primary">About Us</a>
            </div>
            <button className="px-5 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-md transition-transform active:scale-95">
                {persona === 'Tenant' ? 'Find a Home' : persona === 'Landlord' ? 'List Property' : 'Start Investing'}
            </button>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center py-3 text-sm font-medium">
            🎉 <span className="font-bold">{referrerName}</span> invited you! Join today for exclusive perks.
        </div>
    </div>
);

const TenantView: React.FC<{ referrerName: string }> = ({ referrerName }) => {
    const { properties } = useData();
    const [location, setLocation] = useState('All Locations');
    const [type, setType] = useState('All Types');
    const [priceRange, setPriceRange] = useState('Any Price');
    
    // Booking Logic
    const [bookingUnit, setBookingUnit] = useState<any>(null);
    const [discountActive, setDiscountActive] = useState(false);

    // 1. Aggregate Vacant Units
    const vacantUnits = useMemo(() => {
        return properties.flatMap(p => p.units
            .filter(u => u.status === 'Vacant')
            .map(u => ({
                ...u,
                propertyName: p.name,
                location: p.location || p.branch,
                image: p.profilePictureUrl,
                amenities: u.amenities || ['Water', 'Security'],
                rent: u.rent || p.defaultMonthlyRent || 0,
                type: u.unitType || 'Standard'
            }))
        );
    }, [properties]);

    // 2. Extract Filter Options
    const locations = useMemo(() => ['All Locations', ...new Set(vacantUnits.map(u => u.location))], [vacantUnits]);
    const types = useMemo(() => ['All Types', ...new Set(vacantUnits.map(u => u.type))], [vacantUnits]);
    const prices = ['Any Price', '< 10k', '10k - 20k', '20k - 40k', '40k+'];

    // 3. Filter Logic
    const filteredUnits = useMemo(() => {
        return vacantUnits.filter(u => {
            const matchLoc = location === 'All Locations' || u.location === location;
            const matchType = type === 'All Types' || u.type === type;
            let matchPrice = true;
            if (priceRange === '< 10k') matchPrice = u.rent < 10000;
            else if (priceRange === '10k - 20k') matchPrice = u.rent >= 10000 && u.rent < 20000;
            else if (priceRange === '20k - 40k') matchPrice = u.rent >= 20000 && u.rent < 40000;
            else if (priceRange === '40k+') matchPrice = u.rent >= 40000;

            return matchLoc && matchType && matchPrice;
        });
    }, [vacantUnits, location, type, priceRange]);

    const handleClaimOffer = () => {
        setDiscountActive(true);
        document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="animate-fade-in">
            {/* Hero */}
            <div className="relative bg-gray-900 text-white py-24 px-6 text-center overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                    <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" className="w-full h-full object-cover" alt="Apartment" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        Find Your Next Home <br/> <span className="text-primary-light">Hassle-Free</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
                        {referrerName} thinks you'll love living with us. Browse verified listings, pay rent via M-Pesa, and enjoy 24/7 support.
                    </p>
                    
                    {/* Search Bar */}
                    <div className="bg-white p-3 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-gray-200">
                            <label className="block text-xs text-gray-500 font-bold uppercase mb-1 text-left px-3 pt-1">Location</label>
                            <select 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full p-2 bg-transparent text-gray-800 font-semibold focus:outline-none appearance-none cursor-pointer"
                            >
                                {locations.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <Icon name="chevron-down" className="w-4 h-4 text-gray-400 absolute right-4 bottom-3 pointer-events-none" />
                        </div>
                        
                        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-gray-200">
                            <label className="block text-xs text-gray-500 font-bold uppercase mb-1 text-left px-3 pt-1">House Type</label>
                            <select 
                                value={type} 
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-2 bg-transparent text-gray-800 font-semibold focus:outline-none appearance-none cursor-pointer"
                            >
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Icon name="chevron-down" className="w-4 h-4 text-gray-400 absolute right-4 bottom-3 pointer-events-none" />
                        </div>

                        <div className="flex-1 relative">
                            <label className="block text-xs text-gray-500 font-bold uppercase mb-1 text-left px-3 pt-1">Budget</label>
                            <select 
                                value={priceRange} 
                                onChange={(e) => setPriceRange(e.target.value)}
                                className="w-full p-2 bg-transparent text-gray-800 font-semibold focus:outline-none appearance-none cursor-pointer"
                            >
                                {prices.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <Icon name="chevron-down" className="w-4 h-4 text-gray-400 absolute right-4 bottom-3 pointer-events-none" />
                        </div>

                        <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Listings */}
            <div id="listings-section" className="max-w-6xl mx-auto px-6 py-16">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Available Units {location !== 'All Locations' && `in ${location}`}</h2>
                    {discountActive && <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-bold animate-pulse">Offer Applied: KES 1,000 Discount!</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {filteredUnits.length > 0 ? filteredUnits.map(unit => (
                        <div key={unit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                            <div className="h-48 bg-gray-200 relative">
                                {unit.image ? (
                                    <img src={unit.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Property" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                                        <Icon name="vacant-house" className="w-12 h-12 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded shadow">Available</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                    <p className="text-white font-bold text-lg">KES {unit.rent.toLocaleString()} <span className="text-xs font-normal">/ month</span></p>
                                </div>
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-primary transition-colors">{unit.propertyName}</h3>
                                <p className="text-gray-500 text-sm flex items-center mb-2">
                                    <Icon name="branch" className="w-4 h-4 mr-1" /> {unit.location} • {unit.unitNumber}
                                </p>
                                <p className="text-sm text-gray-600 mb-4 flex-grow">
                                    {unit.bedrooms} Bedrooms • {unit.bathrooms} Bath • {unit.type}
                                </p>
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {unit.amenities.slice(0, 3).map((am: string) => (
                                        <span key={am} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded border">{am}</span>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setBookingUnit(unit)}
                                    className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow transition-transform active:scale-95"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Icon name="search" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-600">No units found</h3>
                            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bonus Banner */}
            {!discountActive && (
                <div className="bg-blue-50 py-12 text-center">
                    <div className="max-w-4xl mx-auto px-6">
                        <h3 className="text-2xl font-bold text-blue-900 mb-4">🎁 Exclusive Welcome Gift</h3>
                        <p className="text-blue-700 mb-6">
                            Sign a lease this week and get <span className="font-bold">KES 1,000 OFF</span> your first month's rent as a referral bonus from {referrerName}!
                        </p>
                        <button onClick={handleClaimOffer} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg transition-transform active:scale-95">Claim Offer</button>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {bookingUnit && (
                <BookingModal 
                    unit={bookingUnit} 
                    discount={discountActive ? 1000 : 0}
                    onClose={() => setBookingUnit(null)} 
                />
            )}
        </div>
    );
};

const LandlordView: React.FC<{ referrerName: string }> = ({ referrerName }) => {
    return (
        <div className="animate-fade-in">
            <div className="relative bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                    <span className="block xl:inline">Maximize your</span>{' '}
                                    <span className="block text-primary xl:inline">property revenue</span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    Join {referrerName} and hundreds of other landlords automating collections, maintenance, and tenant screening with TaskMe Realty.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                    <div className="rounded-md shadow">
                                        <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark md:py-4 md:text-lg md:px-10">
                                            List Property
                                        </a>
                                    </div>
                                    <div className="mt-3 sm:mt-0 sm:ml-3">
                                        <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 md:py-4 md:text-lg md:px-10">
                                            Calculate ROI
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-4xl font-extrabold text-primary mb-2">98%</p>
                        <p className="font-bold text-gray-800">Occupancy Rate</p>
                        <p className="text-sm text-gray-500 mt-2">We fill vacancies faster with verified tenants.</p>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-4xl font-extrabold text-green-600 mb-2">100%</p>
                        <p className="font-bold text-gray-800">Rent Collection</p>
                        <p className="text-sm text-gray-500 mt-2">Automated billing and reminders ensure on-time pay.</p>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-4xl font-extrabold text-blue-600 mb-2">24/7</p>
                        <p className="font-bold text-gray-800">Property Care</p>
                        <p className="text-sm text-gray-500 mt-2">Maintenance requests handled automatically.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InvestorView: React.FC<{ referrerName: string }> = ({ referrerName }) => {
    const [investingFund, setInvestingFund] = useState<any>(null);
    const [isCallbackOpen, setIsCallbackOpen] = useState(false);

    return (
        <div className="animate-fade-in bg-gray-50 min-h-screen">
            <div className="bg-[#0f172a] text-white pt-20 pb-24 px-6 text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wide mb-6 border border-green-500/30">
                    Invited by {referrerName}
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                    Smart Real Estate Investing <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Accessible to Everyone</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
                    Join our Renovation Funds and earn up to <strong>30% APY</strong> backed by tangible assets. Monthly payouts, zero hassle.
                </p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => document.getElementById('funds-grid')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
                    >
                        Start Investing
                    </button>
                    <button
                        onClick={() => setIsCallbackOpen(true)}
                        className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-100 transition-transform"
                    >
                        Request Call Back
                    </button>
                </div>
            </div>

            <div id="funds-grid" className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {INITIAL_FUNDS.slice(0, 3).map(fund => (
                        <div key={fund.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:-translate-y-2 transition-transform duration-300 flex flex-col">
                             <div className="h-48 bg-gray-200 relative">
                                 <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                                    {fund.projectPic ? <img src={fund.projectPic} className="w-full h-full object-cover"/> : <Icon name="branch" className="w-12 h-12 opacity-20" />}
                                 </div>
                                 <div className="absolute top-4 right-4 bg-white text-gray-800 font-bold text-xs px-2 py-1 rounded shadow">
                                    {fund.status}
                                 </div>
                            </div>
                            <div className="p-6 flex-grow flex flex-col">
                                <h3 className="font-bold text-xl text-gray-800 mb-2">{fund.name}</h3>
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Target Return</p>
                                        <p className="text-2xl font-extrabold text-green-600">30% APY</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Payout</p>
                                        <p className="text-lg font-bold text-blue-600">Monthly</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(fund.capitalRaised/fund.targetCapital)*100}%` }}></div>
                                </div>
                                <div className="mt-auto">
                                    <button 
                                        onClick={() => setInvestingFund(fund)}
                                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors shadow-md"
                                    >
                                        Invest Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {investingFund && <InvestmentModal fund={investingFund} onClose={() => setInvestingFund(null)} />}
            {isCallbackOpen && <CallbackModal onClose={() => setIsCallbackOpen(false)} />}
        </div>
    );
};

const ReferralLanding: React.FC = () => {
    const { staff } = useData();
    const [activePersona, setActivePersona] = useState<UserPersona>('Tenant');
    
    const referrer = staff[0]?.name || 'A Friend';

    return (
        <div className="min-h-screen bg-white font-sans">
            <LandingHeader 
                persona={activePersona} 
                onSwitch={setActivePersona} 
                referrerName={referrer}
            />
            
            {activePersona === 'Tenant' && <TenantView referrerName={referrer} />}
            {activePersona === 'Landlord' && <LandlordView referrerName={referrer} />}
            {activePersona === 'Investor' && <InvestorView referrerName={referrer} />}
            
            {/* Simple Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 text-center text-sm">
                <p>&copy; 2025 TaskMe Realty. All rights reserved.</p>
                <div className="flex justify-center gap-4 mt-4">
                    <a href="#" className="hover:text-white">Privacy</a>
                    <a href="#" className="hover:text-white">Terms</a>
                    <a href="#" className="hover:text-white">Contact</a>
                </div>
            </footer>
        </div>
    );
};

export default ReferralLanding;
