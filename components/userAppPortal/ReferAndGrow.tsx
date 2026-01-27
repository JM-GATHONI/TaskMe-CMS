
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';

const ReferAndGrow: React.FC = () => {
    const { properties, funds } = useData();
    const [activeTab, setActiveTab] = useState<'Campaigns' | 'Calculator' | 'History'>('Campaigns');

    // --- MOCK USER DATA (Simulating currently logged in user) ---
    const user = { name: "Ritch", referralCode: "RITCH2025", tier: "Silver", points: 1250 };

    // --- CALCULATOR STATE ---
    const [calcState, setCalcState] = useState({
        tenantsReferred: 5,
        landlordsReferred: 1,
        landlordPortfolioValue: 500000, // Monthly Rent Roll
        investorsReferred: 2,
        investmentAmount: 100000 // Per Investor
    });

    // --- DERIVED DATA ---
    
    // 1. Vacant Units for Referral
    const vacantUnits = useMemo(() => {
        return properties.flatMap(p => p.units
            .filter(u => u.status === 'Vacant')
            .map(u => ({
                id: u.id,
                title: `${u.unitNumber} at ${p.name}`,
                rent: u.rent || p.defaultMonthlyRent || 0,
                location: p.location || p.branch,
                image: p.profilePictureUrl,
                type: u.unitType || p.type
            }))
        ).slice(0, 6); // Show top 6
    }, [properties]);

    // 2. Active Funds for Referral
    const activeFunds = useMemo(() => funds.filter(f => f.status === 'Active').slice(0, 2), [funds]);

    // 3. Calculator Logic
    const potentialEarnings = useMemo(() => {
        // Tenant: KES 200 per tenant
        const tenantComm = calcState.tenantsReferred * 200;
        
        // Landlord: 10% of Agency Fee (Assuming 8% Agency Fee on Rent Roll) per month * 12 months
        const agencyFee = calcState.landlordPortfolioValue * 0.08;
        const landlordCommMonthly = agencyFee * 0.10;
        const landlordCommAnnual = landlordCommMonthly * 12 * calcState.landlordsReferred;

        // Investor: 2.5% One-off OR 5% Yearly. Let's show max potential (5% yearly)
        const investorCapital = calcState.investorsReferred * calcState.investmentAmount;
        const investorComm = investorCapital * 0.05;

        return {
            total: tenantComm + landlordCommAnnual + investorComm,
            breakdown: { tenant: tenantComm, landlord: landlordCommAnnual, investor: investorComm }
        };
    }, [calcState]);

    // 4. Mock History
    const referralHistory = [
        { date: '2025-11-01', type: 'Tenant', detail: 'John Doe (Unit A1)', status: 'Successful', earned: 200 },
        { date: '2025-11-05', type: 'Investor', detail: 'Alice Smith (Fund I)', status: 'Pending', earned: 0 },
        { date: '2025-10-20', type: 'Landlord', detail: 'Green Heights Apts', status: 'Successful', earned: 4500 },
    ];

    const totalEarned = referralHistory.filter(r => r.status === 'Successful').reduce((a,b) => a + b.earned, 0);

    const handleShareUnit = (unit: any) => {
        const msg = `Hey! Check out this ${unit.type} at ${unit.location} going for KES ${unit.rent.toLocaleString()}. Interested? Use my code ${user.referralCode} to book!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleInviteInvestor = (fundName: string) => {
        const msg = `Invest in ${fundName} with TaskMe Realty and earn 30% APY! Use my referral code ${user.referralCode}.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleInviteLandlord = () => {
        const msg = `Are you a landlord? Let TaskMe Realty manage your property. Use my code ${user.referralCode} for a discount on management fees!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Hero */}
            <div className="relative bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Icon name="revenue" className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-yellow-500/30">
                            <Icon name="check" className="w-3 h-3" /> {user.tier} Member
                        </div>
                        <h1 className="text-4xl font-extrabold mb-2">Refer & Grow Rich</h1>
                        <p className="text-blue-100 max-w-xl text-lg">
                            Turn your network into net worth. Earn commissions for every tenant, landlord, or investor you bring to TaskMe.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Earned</p>
                                <p className="text-2xl font-bold text-green-400">KES {totalEarned.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
                                <p className="text-xs text-gray-400 uppercase font-bold">Next Payout</p>
                                <p className="text-2xl font-bold text-white">KES 4,500</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Gamification Card */}
                    <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10 w-full md:w-72">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-gray-300">Next Tier: Gold</span>
                            <span className="text-yellow-400 font-bold">1250 / 2000 XP</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full mb-4">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '62%' }}></div>
                        </div>
                        <p className="text-xs text-gray-400">Refer 3 more tenants to unlock Gold status and earn 5% bonus on all payouts!</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex">
                    {['Campaigns', 'Calculator', 'History'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${
                                activeTab === tab ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB: CAMPAIGNS */}
            {activeTab === 'Campaigns' && (
                <div className="space-y-12 animate-fade-in">
                    
                    {/* 1. Vacant Houses */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Icon name="vacant-house" className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Fill a Vacancy</h2>
                                <p className="text-sm text-gray-500">Refer a tenant to any of these units and earn <span className="font-bold text-green-600">KES 200</span> instantly.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vacantUnits.map(unit => (
                                <div key={unit.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                                    <div className="h-40 bg-gray-100 relative">
                                        {unit.image ? <img src={unit.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-300"><Icon name="branch" className="w-12 h-12" /></div>}
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded">Available</div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800">{unit.title}</h3>
                                        <p className="text-xs text-gray-500 mb-2">{unit.location}</p>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-bold text-blue-600">KES {unit.rent.toLocaleString()}</span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{unit.type}</span>
                                        </div>
                                        <button onClick={() => handleShareUnit(unit)} className="w-full py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors">
                                            <Icon name="communication" className="w-4 h-4 mr-2" /> Share via WhatsApp
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {vacantUnits.length === 0 && <div className="col-span-full p-8 text-center text-gray-400 bg-gray-50 rounded-xl">No vacant units available to refer right now. Good job!</div>}
                        </div>
                    </section>

                    {/* 2. Landlords */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Icon name="landlords" className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Refer a Landlord</h2>
                                <p className="text-sm text-gray-500">Earn <span className="font-bold text-purple-600">10% of our Agency Fee</span> monthly for the entire contract duration.</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-purple-900 mb-2">Passive Income Stream</h3>
                                <p className="text-purple-700 mb-6">
                                    Know a property owner struggling with management? Refer them to TaskMe. If they sign up, you get paid every month they stay with us.
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center text-sm text-gray-600"><Icon name="check" className="w-4 h-4 text-green-500 mr-2" /> Recurring monthly commission</li>
                                    <li className="flex items-center text-sm text-gray-600"><Icon name="check" className="w-4 h-4 text-green-500 mr-2" /> Transparent tracking dashboard</li>
                                    <li className="flex items-center text-sm text-gray-600"><Icon name="check" className="w-4 h-4 text-green-500 mr-2" /> No cap on earnings</li>
                                </ul>
                                <button onClick={handleInviteLandlord} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md transition-colors flex items-center">
                                    <Icon name="communication" className="w-5 h-5 mr-2" /> Send Proposal
                                </button>
                            </div>
                            <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-purple-100 text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase">Potential Earnings</p>
                                <p className="text-3xl font-extrabold text-gray-800 my-2">KES 5,000</p>
                                <p className="text-xs text-gray-500">Per month, for an average apartment block.</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. R-REITS */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Icon name="reits" className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Refer an Investor</h2>
                                <p className="text-sm text-gray-500">Earn <span className="font-bold text-orange-600">2.5% One-off</span> or <span className="font-bold text-orange-600">5% Yearly</span> on invested capital.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeFunds.map(fund => (
                                <div key={fund.id} className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg text-gray-800">{fund.name}</h3>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">{fund.targetApy} APY</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-6">{fund.description}</p>
                                    <button onClick={() => handleInviteInvestor(fund.name)} className="w-full py-2 border-2 border-orange-500 text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center">
                                        <Icon name="communication" className="w-4 h-4 mr-2" /> Invite Investor
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* TAB: CALCULATOR */}
            {activeTab === 'Calculator' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 animate-fade-in max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Income Simulator</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            {/* Sliders */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">Vacant Houses Filled</label>
                                    <span className="text-sm font-bold text-blue-600">{calcState.tenantsReferred}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="50" value={calcState.tenantsReferred} 
                                    onChange={e => setCalcState({...calcState, tenantsReferred: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">x KES 200 each</p>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">Landlords Referred</label>
                                    <span className="text-sm font-bold text-purple-600">{calcState.landlordsReferred}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="10" value={calcState.landlordsReferred} 
                                    onChange={e => setCalcState({...calcState, landlordsReferred: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">Portfolio Rent Roll: KES {calcState.landlordPortfolioValue.toLocaleString()}/mo</p>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-700">Investors Referred</label>
                                    <span className="text-sm font-bold text-orange-600">{calcState.investorsReferred}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="20" value={calcState.investorsReferred} 
                                    onChange={e => setCalcState({...calcState, investorsReferred: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">Avg Investment: KES {calcState.investmentAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center">
                            <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider text-center mb-4">Estimated Annual Earnings</h3>
                            <div className="text-center mb-6">
                                <span className="text-5xl font-extrabold text-gray-900">KES {(potentialEarnings.total).toLocaleString()}</span>
                            </div>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tenant Comm.</span>
                                    <span className="font-bold text-blue-600">KES {potentialEarnings.breakdown.tenant.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Landlord Comm. (Recurring)</span>
                                    <span className="font-bold text-purple-600">KES {potentialEarnings.breakdown.landlord.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Investor Comm. (5%)</span>
                                    <span className="font-bold text-orange-600">KES {potentialEarnings.breakdown.investor.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'History' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Referral History</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Details</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Earned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {referralHistory.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">{item.date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                                                item.type === 'Tenant' ? 'bg-blue-100 text-blue-700' :
                                                item.type === 'Investor' ? 'bg-orange-100 text-orange-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.detail}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold ${item.status === 'Successful' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">KES {item.earned.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferAndGrow;
