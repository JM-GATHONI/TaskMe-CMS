
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { INITIAL_FUNDS } from '../../constants';

type UserPersona = 'Tenant' | 'Landlord' | 'Investor';
type PageType = 'Home' | 'Properties' | 'Funds' | 'About';

// --- HELPER: Investment Rates Logic ---
const getTierRates = (months: number) => {
    if (months >= 24) return { apy: 30, monthly: 2.5 };
    if (months >= 18) return { apy: 26.4, monthly: 2.2 };
    if (months >= 12) return { apy: 24, monthly: 2.0 };
    return { apy: 18, monthly: 1.5 };
};

// --- MODAL: REQUEST CALL BACK (For Landlords/General) ---
const CallbackModal: React.FC<{ onClose: () => void; type?: string }> = ({ onClose, type = 'General' }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', topic: type === 'Landlord' ? 'Property Management' : 'General Inquiry' });
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
                            <h3 className="text-xl font-bold text-gray-800">
                                {type === 'Landlord' ? 'List Your Property' : 'Request Call Back'}
                            </h3>
                            <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            {type === 'Landlord' 
                                ? "Interested in our management services? Leave your details and our acquisition team will contact you within 24 hours." 
                                : "Leave your details and our team will contact you shortly."}
                        </p>
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

// --- MODALS: INVESTMENT & BOOKING ---
const InvestmentModal: React.FC<{ 
    fund: any; 
    onClose: () => void;
}> = ({ fund, onClose }) => {
    const [step, setStep] = useState<'auth' | 'config' | 'payment' | 'processing' | 'success'>('auth');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [amount, setAmount] = useState<string>('');
    const [duration, setDuration] = useState<number>(12);
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [txCode, setTxCode] = useState('');

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
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800">{step === 'success' ? 'Investment Confirmed' : `Invest: ${fund.name}`}</h3>
                        {step !== 'success' && <p className="text-xs text-gray-500">Step {step === 'auth' ? '1' : step === 'config' ? '2' : '3'} of 3</p>}
                    </div>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {step === 'auth' && (
                        <div className="space-y-6">
                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'register' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>New Investor</button>
                                <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'login' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Log In</button>
                            </div>
                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                                {authMode === 'register' && <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label><input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. John Doe" /></div>}
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label><input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="john@example.com" /></div>
                                {authMode === 'register' && <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label><input type="tel" required value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="07..." /></div>}
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label><input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary/20" placeholder="••••••••" /></div>
                                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark transition-transform active:scale-95">Continue</button>
                            </form>
                        </div>
                    )}
                    {step === 'config' && (
                        <div className="space-y-5">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Investment Amount (KES)</label><input type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 border rounded-lg text-lg font-bold outline-none focus:border-primary" placeholder="Min 5,000"/></div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration</label>
                                <div className="grid grid-cols-2 gap-2">{[6, 12, 18, 24].map(d => (<button key={d} onClick={() => setDuration(d)} className={`p-3 rounded-lg border text-sm font-bold transition-all ${duration === d ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}>{d} Months</button>))}</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                                <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Target APY</span><span className="font-bold text-blue-700 text-lg">{rates.apy}%</span></div>
                                <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Monthly Return</span><span className="font-bold text-green-600 text-lg">{rates.monthly}%</span></div>
                                <div className="border-t border-blue-200 pt-2 mt-2"><div className="flex justify-between items-center"><span className="text-sm font-bold text-gray-700">Est. Monthly Payout</span><span className="font-bold text-gray-800">KES {estMonthlyReturn.toLocaleString()}</span></div><p className="text-xs text-gray-500 mt-1 text-right">Total Profit: KES {estTotalReturn.toLocaleString()}</p></div>
                            </div>
                            <div className="flex gap-3"><button onClick={() => setStep('auth')} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Back</button><button onClick={handleConfigSubmit} className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-md">Next: Payment</button></div>
                        </div>
                    )}
                    {(step === 'payment' || step === 'processing' || step === 'success') && (
                        <div className="relative">
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .mpesa-spinner { width: 60px; height: 60px; border: 5px solid rgba(31, 159, 33, 0.2); border-top: 5px solid #1F9F21; border-radius: 50%; margin: 0 auto 25px; animation: spin 1s linear infinite; } .loading-dots span { display: inline-block; width: 8px; height: 8px; background-color: #1F9F21; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both; } .loading-dots span:nth-child(1) { animation-delay: 0s; } .loading-dots span:nth-child(2) { animation-delay: 0.2s; } .loading-dots span:nth-child(3) { animation-delay: 0.4s; }`}</style>
                            {step === 'payment' && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-6 text-center"><p className="text-xs text-green-700 font-bold uppercase mb-1">Amount to Pay</p><p className="text-2xl font-extrabold text-green-800">KES {parseFloat(amount).toLocaleString()}</p></div>
                                    <div><label className="block mb-1 font-semibold text-gray-700 text-xs uppercase">M-Pesa Number</label><input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} className="w-full p-3 border-2 border-[#c8e6c9] rounded-xl text-base focus:outline-none focus:border-[#1F9F21] transition-colors" placeholder="07..."/></div>
                                    <div className="flex gap-3 pt-2"><button onClick={() => setStep('config')} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Back</button><button onClick={handleProcessPayment} className="flex-[2] py-3.5 bg-gradient-to-r from-[#1F9F21] to-[#177D1A] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95">Pay & Invest</button></div>
                                </div>
                            )}
                            {step === 'processing' && <div className="py-10 text-center"><div className="mpesa-spinner"></div><p className="text-xl font-semibold text-[#1a365d] mb-2">Processing Investment...</p><p className="text-[#4a904a] font-medium">Check your phone for the M-Pesa prompt.</p><div className="loading-dots flex justify-center gap-1.5 mt-6"><span></span><span></span><span></span></div></div>}
                            {step === 'success' && <div className="text-center py-6"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Icon name="check" className="w-8 h-8" /></div><h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome Aboard!</h3><p className="text-gray-600 text-sm mb-6">Your investment of <strong>KES {parseFloat(amount).toLocaleString()}</strong> in {fund.name} is active.</p><button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">Go to Investor Dashboard</button></div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BookingModal: React.FC<{ unit: any; discount: number; onClose: () => void; }> = ({ unit, discount, onClose }) => {
    return <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-bold text-xl">Booking</h3><button onClick={onClose}><Icon name="close" className="w-5 h-5"/></button></div>
            <p className="text-gray-500 mb-4">Book Unit {unit.unitNumber}. Functionality simulated.</p>
            <button onClick={onClose} className="w-full py-3 bg-primary text-white rounded-xl font-bold">Close Demo</button>
        </div>
    </div>;
};


// --- FULL PAGES ---

const AboutUsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-white animate-fade-in flex flex-col">
             {/* Sticky Header for Page */}
             <div className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
                 <button onClick={onBack} className="flex items-center text-gray-600 hover:text-primary font-bold transition-colors">
                    <Icon name="chevron-down" className="w-5 h-5 mr-2 rotate-90" />
                    Back to Home
                </button>
                <div className="text-xl font-bold text-gray-800">About Us</div>
             </div>

            <div className="overflow-y-auto flex-grow">
                {/* Hero Section */}
                <div className="relative h-[500px] flex items-center justify-center bg-gray-900 text-white text-center px-6 overflow-hidden">
                    <div className="absolute inset-0 opacity-40">
                         <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover" alt="Nairobi Skyline" />
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">Building the Future of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">African Real Estate</span></h1>
                        <p className="text-xl md:text-2xl text-gray-200 font-light">We bridge the gap between technology, capital, and community.</p>
                    </div>
                </div>

                {/* Mission & Vision */}
                <div className="py-20 px-6 max-w-6xl mx-auto">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                         <div>
                             <h4 className="text-primary font-bold uppercase tracking-wider text-sm mb-2">Our Mission</h4>
                             <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Simplifying Property for Everyone</h2>
                             <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                 TaskMe Realty was born from a simple idea: Real estate should be transparent, accessible, and efficient. 
                                 Whether you are renting your first home, managing a portfolio, or looking to invest, we provide the digital infrastructure to make it seamless.
                             </p>
                             <div className="flex gap-4">
                                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex-1">
                                     <h3 className="font-bold text-gray-800 text-2xl">100%</h3>
                                     <p className="text-sm text-gray-500">Digital Workflow</p>
                                 </div>
                                 <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex-1">
                                     <h3 className="font-bold text-gray-800 text-2xl">24/7</h3>
                                     <p className="text-sm text-gray-500">Support System</p>
                                 </div>
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <img src="https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" className="rounded-2xl shadow-lg mt-8" alt="Office" />
                             <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" className="rounded-2xl shadow-lg" alt="Modern Home" />
                         </div>
                     </div>
                </div>

                {/* Stats Section */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 py-20 text-white">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
                            <div className="p-4">
                                <p className="text-5xl font-extrabold mb-2">500+</p>
                                <p className="text-blue-200 font-medium uppercase text-sm tracking-widest">Units Managed</p>
                            </div>
                            <div className="p-4">
                                <p className="text-5xl font-extrabold mb-2">KES 400M</p>
                                <p className="text-blue-200 font-medium uppercase text-sm tracking-widest">Assets Under Mgmt</p>
                            </div>
                            <div className="p-4">
                                <p className="text-5xl font-extrabold mb-2">98%</p>
                                <p className="text-blue-200 font-medium uppercase text-sm tracking-widest">Occupancy Rate</p>
                            </div>
                            <div className="p-4">
                                <p className="text-5xl font-extrabold mb-2">50+</p>
                                <p className="text-blue-200 font-medium uppercase text-sm tracking-widest">Completed Projects</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Values / The TaskMe Difference */}
                <div className="py-20 px-6 max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">The TaskMe Difference</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">We combine local market expertise with world-class technology.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Icon name="settings" className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Tech-First Approach</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Our proprietary dashboard handles everything from automated rent collection via M-Pesa to real-time maintenance tracking.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <Icon name="revenue" className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Wealth Creation</h3>
                            <p className="text-gray-600 leading-relaxed">
                                We don't just manage; we grow. Our R-REITs renovation funds allow anyone to invest in high-yield property projects with as little as KES 5,000.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <Icon name="check" className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">Transparent Integrity</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Full visibility for landlords and investors. Real-time reports, audit trails, and no hidden fees. Trust is our currency.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Team Section Placeholder */}
                <div className="bg-gray-50 py-20 px-6">
                    <div className="max-w-6xl mx-auto text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-12">Meet The Team</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                             {[1,2,3,4].map((i) => (
                                 <div key={i} className="flex flex-col items-center group">
                                     <div className="w-32 h-32 rounded-full bg-gray-300 mb-4 overflow-hidden border-4 border-white shadow-md grayscale group-hover:grayscale-0 transition-all duration-500">
                                         <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="Team" className="w-full h-full object-cover" />
                                     </div>
                                     <h4 className="font-bold text-gray-800">Team Member {i}</h4>
                                     <p className="text-sm text-gray-500">Position</p>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PropertiesPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { properties } = useData();
    const listings = useMemo(() => {
        return properties.flatMap(p => p.units.filter(u => u.status === 'Vacant').map(u => ({
            id: u.id, title: `${u.unitNumber} at ${p.name}`, location: p.location || p.branch, price: u.rent || p.defaultMonthlyRent || 0, image: p.profilePictureUrl, type: u.unitType || 'Apartment', beds: u.bedrooms, baths: u.bathrooms
        })));
    }, [properties]);

    return (
        <div className="min-h-screen bg-gray-50 animate-fade-in flex flex-col">
            <div className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
                 <button onClick={onBack} className="flex items-center text-gray-600 hover:text-primary font-bold transition-colors">
                    <Icon name="chevron-down" className="w-5 h-5 mr-2 rotate-90" />
                    Back to Home
                </button>
                <div className="text-xl font-bold text-gray-800">Featured Properties</div>
             </div>

            <div className="max-w-7xl mx-auto px-6 py-12 w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Find Your Perfect Home</h1>
                    <p className="text-gray-500 mt-2">Browse our exclusive selection of verified, move-in ready units.</p>
                </div>

                {listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {listings.map(l => (
                            <div key={l.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                                <div className="h-56 bg-gray-200 relative overflow-hidden">
                                    {l.image ? <img src={l.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={l.title} /> : <div className="flex items-center justify-center h-full text-gray-300"><Icon name="branch" className="w-16 h-16 opacity-50" /></div>}
                                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Available</div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <h3 className="font-bold text-gray-800 text-xl mb-1 line-clamp-1 group-hover:text-primary transition-colors">{l.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4 flex items-center"><Icon name="branch" className="w-4 h-4 mr-1 text-gray-400"/> {l.location}</p>
                                    
                                    <div className="flex gap-3 mb-6 text-xs font-medium text-gray-600">
                                        <span className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{l.beds} Beds</span>
                                        <span className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{l.baths} Baths</span>
                                        <span className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{l.type}</span>
                                    </div>
                                    
                                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold">Rent</p>
                                            <p className="text-xl font-extrabold text-blue-600">KES {l.price.toLocaleString()}</p>
                                        </div>
                                        <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-lg">View</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                        <Icon name="search" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-600">No properties available</h3>
                        <p className="text-gray-400 mt-2">Check back later or contact us for upcoming listings.</p>
                     </div>
                )}
            </div>
        </div>
    );
}

const FundsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { funds } = useData();
    const activeFunds = funds.length > 0 ? funds : INITIAL_FUNDS; 

    return (
        <div className="min-h-screen bg-gray-50 animate-fade-in flex flex-col">
             <div className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
                 <button onClick={onBack} className="flex items-center text-gray-600 hover:text-primary font-bold transition-colors">
                    <Icon name="chevron-down" className="w-5 h-5 mr-2 rotate-90" />
                    Back to Home
                </button>
                <div className="text-xl font-bold text-gray-800">Investment Funds</div>
             </div>

             <div className="max-w-7xl mx-auto px-6 py-12 w-full">
                <div className="mb-10 text-center max-w-3xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Renovation Funds (R-REITs)</h1>
                    <p className="text-lg text-gray-500">
                        Invest in high-yield, short-term property renovation projects. 
                        We upgrade assets, increase value, and share the profits with you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activeFunds.map(fund => (
                        <div key={fund.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                            <div className="h-52 bg-gray-800 relative">
                                    {fund.projectPic ? <img src={fund.projectPic} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={fund.name} /> : <div className="flex items-center justify-center h-full text-gray-500"><Icon name="reits" className="w-16 h-16 opacity-30" /></div>}
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide border border-gray-200">{fund.status}</div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                    <h3 className="text-white font-bold text-2xl">{fund.name}</h3>
                                </div>
                            </div>
                            <div className="p-8 flex-grow flex flex-col">
                                <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">{fund.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                                        <p className="text-[10px] text-green-700 uppercase font-bold tracking-wider">Target Return</p>
                                        <p className="text-2xl font-extrabold text-green-800">{fund.targetApy}</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                                        <p className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Term</p>
                                        <p className="text-2xl font-extrabold text-blue-800">12-24 Mo</p>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                        <span>Raised: {(fund.capitalRaised/1000000).toFixed(1)}M</span>
                                        <span>Target: {(fund.targetCapital/1000000).toFixed(1)}M</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-6">
                                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, (fund.capitalRaised/fund.targetCapital)*100)}%` }}></div>
                                    </div>
                                    <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl transform active:scale-95">
                                        View Investment Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const LandingHeader: React.FC<{ 
    persona: UserPersona; 
    onSwitch: (p: UserPersona) => void; 
    referrerName: string;
    onNavigate: (page: PageType) => void;
}> = ({ persona, onSwitch, referrerName, onNavigate }) => (
    <div className="bg-white shadow-sm sticky top-0 z-40 transition-all">
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200 w-full md:w-auto mx-auto md:mx-0">
                <Icon name="stack" className="w-3 h-3" />
                <span className="truncate max-w-[200px] md:max-w-none">taskme.re/invite/{referrerName.toLowerCase().replace(' ', '')}</span>
            </div>
            <div className="hidden md:flex gap-2">
                <span className="font-bold mr-2">Viewing as:</span>
                {(['Tenant', 'Landlord', 'Investor'] as UserPersona[]).map(p => (
                    <button key={p} onClick={() => onSwitch(p)} className={`px-2 py-0.5 rounded ${persona === p ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{p}</button>
                ))}
            </div>
        </div>
        
        <div className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
            <div 
                className="flex items-center gap-2 text-primary font-bold text-xl cursor-pointer"
                onClick={() => onNavigate('Home')}
            >
                <div className="p-2 bg-primary rounded-lg text-white"><Icon name="branch" className="w-6 h-6" /></div>
                TaskMe Realty
            </div>
            <div className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
                <button onClick={() => onNavigate('Properties')} className="hover:text-primary transition-colors uppercase tracking-wide text-xs">Properties</button>
                <button onClick={() => onNavigate('Funds')} className="hover:text-primary transition-colors uppercase tracking-wide text-xs">Renovation Funds</button>
                <button onClick={() => onNavigate('About')} className="hover:text-primary transition-colors uppercase tracking-wide text-xs">About Us</button>
            </div>
            <button className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-md transition-transform active:scale-95 text-sm">
                {persona === 'Tenant' ? 'Find a Home' : persona === 'Landlord' ? 'List Property' : 'Start Investing'}
            </button>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center py-3 text-sm font-medium shadow-inner">
            🎉 <span className="font-bold">{referrerName}</span> invited you! Join today for exclusive perks.
        </div>
    </div>
);

const TenantView: React.FC<{ referrerName: string }> = ({ referrerName }) => {
    const { properties } = useData();
    const [location, setLocation] = useState('All Locations');
    const [type, setType] = useState('All Types');
    const [priceRange, setPriceRange] = useState('Any Price');
    const [bookingUnit, setBookingUnit] = useState<any>(null);
    const [discountActive, setDiscountActive] = useState(false);

    const vacantUnits = useMemo(() => {
        return properties.flatMap(p => p.units.filter(u => u.status === 'Vacant').map(u => ({...u, propertyName: p.name, location: p.location || p.branch, image: p.profilePictureUrl, amenities: u.amenities || ['Water', 'Security'], rent: u.rent || p.defaultMonthlyRent || 0, type: u.unitType || 'Standard'})));
    }, [properties]);

    const locations = useMemo(() => ['All Locations', ...new Set(vacantUnits.map(u => u.location))], [vacantUnits]);
    const types = useMemo(() => ['All Types', ...new Set(vacantUnits.map(u => u.type))], [vacantUnits]);
    const prices = ['Any Price', '< 10k', '10k - 20k', '20k - 40k', '40k+'];

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

    const handleClaimOffer = () => { setDiscountActive(true); document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth' }); };

    return (
        <div className="animate-fade-in">
            <div className="relative bg-gray-900 text-white py-24 px-6 text-center overflow-hidden">
                <div className="absolute inset-0 opacity-40"><img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" className="w-full h-full object-cover" alt="Apartment" /></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">Find Your Next Home <br/> <span className="text-primary-light">Hassle-Free</span></h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto">{referrerName} thinks you'll love living with us. Browse verified listings, pay rent via M-Pesa, and enjoy 24/7 support.</p>
                    <div className="bg-white p-3 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-gray-200">
                            <label className="block text-xs text-gray-500 font-bold uppercase mb-1 text-left px-3 pt-1">Location</label>
                            <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 bg-transparent text-gray-800 font-semibold focus:outline-none appearance-none cursor-pointer">{locations.map(l => <option key={l} value={l}>{l}</option>)}</select>
                            <Icon name="chevron-down" className="w-4 h-4 text-gray-400 absolute right-4 bottom-3 pointer-events-none" />
                        </div>
                        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-gray-200">
                            <label className="block text-xs text-gray-500 font-bold uppercase mb-1 text-left px-3 pt-1">House Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 bg-transparent text-gray-800 font-semibold focus:outline-none appearance-none cursor-pointer">{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
                            <Icon name="chevron-down" className="w-4 h-4 text-gray-400 absolute right-4 bottom-3 pointer-events-none" />
                        </div>
                        <div className="flex-1 relative">
                            <label className="block text-xs text-gray-500 font-bold uppercase mb-1 text-left px-3 pt-1">Budget</label>
                            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full p-2 bg-transparent text-gray-800 font-semibold focus:outline-none appearance-none cursor-pointer">{prices.map(p => <option key={p} value={p}>{p}</option>)}</select>
                            <Icon name="chevron-down" className="w-4 h-4 text-gray-400 absolute right-4 bottom-3 pointer-events-none" />
                        </div>
                        <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md">Search</button>
                    </div>
                </div>
            </div>
            <div id="listings-section" className="max-w-6xl mx-auto px-6 py-16">
                <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold text-gray-800">Available Units {location !== 'All Locations' && `in ${location}`}</h2>{discountActive && <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-bold animate-pulse">Offer Applied: KES 1,000 Discount!</span>}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {filteredUnits.length > 0 ? filteredUnits.map(unit => (
                        <div key={unit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                            <div className="h-48 bg-gray-200 relative">
                                {unit.image ? <img src={unit.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Property" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100"><Icon name="vacant-house" className="w-12 h-12 opacity-20" /></div>}
                                <div className="absolute top-3 right-3"><span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded shadow">Available</span></div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4"><p className="text-white font-bold text-lg">KES {unit.rent.toLocaleString()} <span className="text-xs font-normal">/ month</span></p></div>
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-primary transition-colors">{unit.propertyName}</h3>
                                <p className="text-gray-500 text-sm flex items-center mb-2"><Icon name="branch" className="w-4 h-4 mr-1" /> {unit.location} • {unit.unitNumber}</p>
                                <p className="text-sm text-gray-600 mb-4 flex-grow">{unit.bedrooms} Bedrooms • {unit.bathrooms} Bath • {unit.type}</p>
                                <button onClick={() => setBookingUnit(unit)} className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow transition-transform active:scale-95">Book Now</button>
                            </div>
                        </div>
                    )) : <div className="col-span-3 text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"><Icon name="search" className="w-12 h-12 text-gray-300 mx-auto mb-3" /><h3 className="text-lg font-bold text-gray-600">No units found</h3></div>}
                </div>
            </div>
            {!discountActive && (
                <div className="bg-blue-50 py-12 text-center">
                    <div className="max-w-4xl mx-auto px-6">
                        <h3 className="text-2xl font-bold text-blue-900 mb-4">🎁 Exclusive Welcome Gift</h3>
                        <p className="text-blue-700 mb-6">Sign a lease this week and get <span className="font-bold">KES 1,000 OFF</span> your first month's rent as a referral bonus from {referrerName}!</p>
                        <button onClick={handleClaimOffer} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg transition-transform active:scale-95">Claim Offer</button>
                    </div>
                </div>
            )}
            {bookingUnit && <BookingModal unit={bookingUnit} discount={discountActive ? 1000 : 0} onClose={() => setBookingUnit(null)} />}
        </div>
    );
};

const LandlordView: React.FC<{ referrerName: string }> = ({ referrerName }) => {
    const [showContact, setShowContact] = useState(false);

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
                                        <button onClick={() => setShowContact(true)} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark md:py-4 md:text-lg md:px-10">
                                            List Property
                                        </button>
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
            {showContact && <CallbackModal onClose={() => setShowContact(false)} type="Landlord" />}
        </div>
    );
};

const InvestorView: React.FC<{ referrerName: string }> = ({ referrerName }) => {
    const [investingFund, setInvestingFund] = useState<any>(null);
    const [isCallbackOpen, setIsCallbackOpen] = useState(false);

    const handleStartInvesting = () => {
        const fundsGrid = document.getElementById('funds-grid');
        if (fundsGrid) {
            fundsGrid.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
                        onClick={handleStartInvesting}
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
    const [currentPage, setCurrentPage] = useState<PageType>('Home');
    
    const referrer = staff[0]?.name || 'A Friend';

    if (currentPage === 'About') return <AboutUsPage onBack={() => setCurrentPage('Home')} />;
    if (currentPage === 'Properties') return <PropertiesPage onBack={() => setCurrentPage('Home')} />;
    if (currentPage === 'Funds') return <FundsPage onBack={() => setCurrentPage('Home')} />;

    return (
        <div className="min-h-screen bg-white font-sans relative">
            <LandingHeader 
                persona={activePersona} 
                onSwitch={setActivePersona} 
                referrerName={referrer}
                onNavigate={setCurrentPage}
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
