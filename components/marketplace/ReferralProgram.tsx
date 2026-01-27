
import React, { useState } from 'react';
import Icon from '../Icon';

const ReferralProgram: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const referralLink = "https://taskme.re/ref/USER123";

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Refer & Earn Rewards</h1>
                <p className="text-lg text-gray-500 mt-1">Unlock exclusive perks by growing the community.</p>
            </div>

            {/* Hero Card */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Icon name="revenue" className="w-40 h-40 text-white" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-yellow-300 font-bold uppercase text-xs tracking-widest">
                        <Icon name="check" className="w-4 h-4" /> Gold Tier Status
                    </div>
                    <h2 className="text-4xl font-extrabold mb-4">Earn KES 2,000 per Referral</h2>
                    <p className="text-blue-100 max-w-lg mb-8">
                        Share your unique link. When your friend signs a lease or invests, you get paid instantly to your wallet.
                    </p>
                    
                    <div className="bg-white p-2 rounded-xl shadow-lg max-w-md flex items-center">
                        <input 
                            type="text" 
                            readOnly 
                            value={referralLink} 
                            className="flex-grow p-3 text-gray-600 text-sm outline-none font-mono bg-transparent"
                        />
                        <button 
                            onClick={handleCopy}
                            className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${copied ? 'bg-green-600' : 'bg-gray-900 hover:bg-black'}`}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase">Total Earned</p>
                    <p className="text-3xl font-extrabold text-green-600 mt-2">KES 12,500</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase">Successful Referrals</p>
                    <p className="text-3xl font-extrabold text-blue-600 mt-2">8</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs font-bold uppercase">Pending</p>
                    <p className="text-3xl font-extrabold text-orange-500 mt-2">3</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tiers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Reward Tiers</h3>
                    <div className="space-y-4">
                        <div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-60">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600 mr-4">1</div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-700">Bronze</h4>
                                <p className="text-xs text-gray-500">1-5 Referrals • KES 500/ref</p>
                            </div>
                            <Icon name="check" className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex items-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-yellow-800 mr-4">2</div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-yellow-800">Gold (Current)</h4>
                                <p className="text-xs text-yellow-700">6-15 Referrals • KES 2,000/ref</p>
                            </div>
                            <Icon name="check" className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex items-center p-3 rounded-lg bg-white border border-gray-200 border-dashed">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 mr-4">3</div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-400">Platinum</h4>
                                <p className="text-xs text-gray-400">15+ Referrals • KES 5,000/ref</p>
                            </div>
                            <span className="text-xs text-gray-400">Locked</span>
                        </div>
                    </div>
                </div>

                {/* Wallet */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Rewards Wallet</h3>
                        <p className="text-4xl font-extrabold text-gray-900 mb-6">KES 4,500 <span className="text-sm font-medium text-gray-500">Available</span></p>
                        
                        <div className="space-y-2">
                             <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                <span>Recent: John Doe (Signed)</span>
                                <span className="font-bold text-green-600">+2,000</span>
                            </div>
                             <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                <span>Recent: Alice Smith (Invested)</span>
                                <span className="font-bold text-green-600">+2,500</span>
                            </div>
                        </div>
                    </div>
                    
                    <button className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md mt-6">
                        Withdraw to M-Pesa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralProgram;
