
import React, { useState } from 'react';
import { MOCK_REFERRAL_DATA } from '../../constants';
import Icon from '../Icon';

const Referrals: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const referralLink = "https://taskme.re/invest/ref/INVESTOR2025";

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/reits/investment-plans'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Funds
            </button>
            
            <div className="bg-primary/10 border border-primary/20 p-8 rounded-xl text-center max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-primary-dark mb-2">Earn 2.5% Lifetime Commission</h1>
                <p className="text-gray-600 mb-6">
                    Invite friends to invest in TaskMe Renovation Funds. You earn a commission on their returns, forever.
                </p>
                
                <div className="flex items-center max-w-md mx-auto bg-white rounded-lg border border-primary/30 overflow-hidden shadow-sm">
                    <input 
                        type="text" 
                        readOnly 
                        value={referralLink} 
                        className="flex-grow p-3 text-gray-600 text-sm outline-none"
                    />
                    <button 
                        onClick={handleCopy}
                        className={`px-6 py-3 font-bold text-white transition-all ${copied ? 'bg-green-600' : 'bg-primary hover:bg-primary-dark'}`}
                    >
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
                
                <div className="flex justify-center gap-4 mt-6">
                    <button className="flex items-center px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 text-sm font-semibold">
                        <Icon name="communication" className="w-4 h-4 mr-2" /> Share on WhatsApp
                    </button>
                    <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-sm font-semibold">
                        Share on Twitter
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                    <p className="text-gray-500 text-sm font-medium">Total Referrals</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{MOCK_REFERRAL_DATA.stats.count}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                    <p className="text-gray-500 text-sm font-medium">Ref. Assets Managed</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">KES {MOCK_REFERRAL_DATA.stats.activeBalance.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                    <p className="text-gray-500 text-sm font-medium">Commissions Earned</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">KES {MOCK_REFERRAL_DATA.stats.commission.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Referrals</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Active Investment</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Your Commission (MTD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_REFERRAL_DATA.referrals.map((ref, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{ref.name}</td>
                                    <td className="px-6 py-4 text-right text-gray-600">KES {ref.activeBalance.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600">KES {ref.monthlyCommission.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Referrals;
