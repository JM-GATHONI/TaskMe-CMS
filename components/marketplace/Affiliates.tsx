
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { User, StaffProfile, Lead, RFTransaction } from '../../types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Chart: React.FC<{ type: 'bar'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !(window as any).Chart) return;
        if (chartRef.current) chartRef.current.destroy();

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            chartRef.current = new (window as any).Chart(ctx, {
                type,
                data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...options
                },
            });
        }
        return () => chartRef.current?.destroy();
    }, [type, data, options]);

    return <div className={`relative ${height}`}><canvas ref={canvasRef}></canvas></div>;
};

// Unified Affiliate Type for Display
interface LiveAffiliate {
    id: string;
    name: string;
    email: string;
    role: string;
    type: string; // Freelancer, Agent, Influencer etc.
    referralCode: string;
    stats: {
        leadsReferred: number;
        leasesSigned: number;
        totalEarned: number;
    };
    recentReferrals: Array<{ date: string; name: string; status: string; commission: number }>;
}

const InviteAffiliateModal: React.FC<{ onClose: () => void; onInvite: (data: any) => void }> = ({ onClose, onInvite }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', type: 'Freelancer' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return alert("Name and Email required");
        onInvite(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1500] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Invite New Affiliate</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
                <p className="text-sm text-gray-500 mb-4">Add a freelancer, influencer, or partner to your referral network.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            className="w-full p-2 border rounded" 
                            placeholder="e.g. John Mark"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                        <input 
                            type="email"
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            className="w-full p-2 border rounded" 
                            placeholder="john@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                        <input 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                            className="w-full p-2 border rounded" 
                            placeholder="07..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Affiliate Type</label>
                        <select 
                            value={formData.type} 
                            onChange={e => setFormData({...formData, type: e.target.value})} 
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option value="Freelancer">Freelancer</option>
                            <option value="Influencer">Influencer</option>
                            <option value="Tenant">Tenant</option>
                            <option value="Partner">Corporate Partner</option>
                            <option value="Agent">External Agent</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700 font-bold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 shadow-sm">Send Invite</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AffiliatePerformanceModal: React.FC<{ affiliate: LiveAffiliate; onClose: () => void }> = ({ affiliate, onClose }) => {
    const chartData = useMemo(() => ({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Leads',
                data: [0, 0, 0, 0, 0, affiliate.stats.leadsReferred],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
            {
                label: 'Conversions',
                data: [0, 0, 0, 0, 0, affiliate.stats.leasesSigned],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    }), [affiliate.stats.leadsReferred, affiliate.stats.leasesSigned]);

    return (
        <div className="fixed inset-0 bg-black/50 z-[1500] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                            {affiliate.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{affiliate.name}</h3>
                            <p className="text-sm text-gray-500">{affiliate.type} • Performance Overview</p>
                        </div>
                    </div>
                    <button onClick={onClose}><Icon name="close" className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-xs font-bold text-blue-600 uppercase">Total Leads</p>
                        <p className="text-2xl font-bold text-gray-800">{affiliate.stats.leadsReferred}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-xs font-bold text-green-600 uppercase">Conversions</p>
                        <p className="text-2xl font-bold text-gray-800">{affiliate.stats.leasesSigned}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-xs font-bold text-purple-600 uppercase">Lifetime Earnings</p>
                        <p className="text-2xl font-bold text-gray-800">KES {(affiliate.stats.totalEarned / 1000).toFixed(1)}k</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto mb-4">
                    <h4 className="font-bold text-gray-700 mb-3">Performance Trend</h4>
                    <div className="h-64 border rounded-lg p-2 mb-6">
                         <Chart type="bar" data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>

                    <h4 className="font-bold text-gray-700 mb-3">Recent Activity</h4>
                    <table className="min-w-full text-sm text-left border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 border-b">Date</th>
                                <th className="px-4 py-2 border-b">Referral</th>
                                <th className="px-4 py-2 border-b">Status</th>
                                <th className="px-4 py-2 border-b text-right">Comm.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affiliate.recentReferrals.length > 0 ? affiliate.recentReferrals.map((ref, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border-b">{ref.date}</td>
                                    <td className="px-4 py-2 border-b">{ref.name}</td>
                                    <td className="px-4 py-2 border-b">
                                        <span className={`px-2 py-0.5 rounded text-xs ${ref.status === 'Signed' || ref.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {ref.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 border-b text-right font-bold text-gray-700">
                                        {ref.commission.toLocaleString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-400">No recent activity.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-4 border-t">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700 font-bold hover:bg-gray-200">Close</button>
                </div>
            </div>
        </div>
    );
};

const AffiliateCard: React.FC<{ affiliate: LiveAffiliate; onViewPerformance: (aff: LiveAffiliate) => void }> = ({ affiliate, onViewPerformance }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-lg transition-all group flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 bg-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg shadow-sm border border-white">
                    {affiliate.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">{affiliate.name}</h3>
                    <p className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full w-fit">{affiliate.type}</p>
                </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">Active</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-6 flex-grow">
            <div className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Leads</p>
                <p className="font-bold text-gray-800">{affiliate.stats.leadsReferred}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Signed</p>
                <p className="font-bold text-blue-600">{affiliate.stats.leasesSigned}</p>
            </div>
             <div className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Paid</p>
                <p className="font-bold text-green-600">{(affiliate.stats.totalEarned / 1000).toFixed(1)}k</p>
            </div>
        </div>
        
        <div className="mt-auto">
             <div className="text-xs text-gray-400 font-mono mb-2 text-center bg-gray-50 py-1 rounded border border-dashed border-gray-200">
                Code: <span className="text-gray-600 font-bold select-all">{affiliate.referralCode}</span>
            </div>
            <button 
                onClick={() => onViewPerformance(affiliate)}
                className="w-full py-2 bg-white border border-purple-200 text-purple-700 text-xs font-bold rounded hover:bg-purple-50 transition-colors shadow-sm"
            >
                View Performance
            </button>
        </div>
    </div>
);

const ReviewPayoutModal: React.FC<{
    payout: RFTransaction;
    onClose: () => void;
    onConfirm: (id: string, amount: number, reference: string, date: string) => void;
}> = ({ payout, onClose, onConfirm }) => {
    const [amount, setAmount] = useState(String(payout.amount || ''));
    const [reference, setReference] = useState(payout.reference || '');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    return (
        <div className="fixed inset-0 bg-black/60 z-[1600] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Review & Pay Commission</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm space-y-1">
                        <p className="text-gray-600">Affiliate: <span className="font-bold text-gray-800">{payout.partyName}</span></p>
                        <p className="text-gray-600">Referral: <span className="font-bold text-gray-800">{payout.description || payout.reference}</span></p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (KES)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded" min={0} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reference / Note</label>
                        <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. MPESA REF or Bank TXN" className="w-full p-2 border rounded" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700 font-medium">Cancel</button>
                    <button
                        onClick={() => {
                            const parsedAmt = parseFloat(amount) || 0;
                            if (!parsedAmt || parsedAmt <= 0) return alert('Enter a valid amount.');
                            if (!reference.trim()) return alert('Enter a payment reference.');
                            onConfirm(payout.id, parsedAmt, reference.trim(), date);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                    >
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

const Affiliates: React.FC = () => {
    const { addLandlord, landlords, staff, leads, tenants, rfTransactions, renovationInvestors, applications, updateRFTransaction, addBill, checkPermission, currentUser } = useData();
    const isSuperAdmin = (currentUser as any)?.role === 'Super Admin';
    const canCreate = isSuperAdmin || checkPermission('Marketplace', 'create');
    const canEdit = isSuperAdmin || checkPermission('Marketplace', 'edit');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<LiveAffiliate | null>(null);
    const [reviewPayout, setReviewPayout] = useState<RFTransaction | null>(null);

    const handleConfirmPayout = (id: string, amount: number, reference: string, date: string) => {
        if (!canEdit) return alert('You do not have permission to process payouts.');
        updateRFTransaction(id, { status: 'Completed' as any, amount, reference, date });
        addBill({
            id: `bill-comm-${Date.now()}`,
            vendor: reviewPayout?.partyName || '',
            category: 'Referral Commission',
            amount,
            invoiceDate: date,
            dueDate: date,
            status: 'Paid',
            description: reviewPayout?.description || reviewPayout?.reference || 'Referral Commission',
            propertyId: '',
        } as any);
        alert(`Commission of KES ${amount.toLocaleString()} paid to ${reviewPayout?.partyName}.`);
        setReviewPayout(null);
    };

    // --- AGGREGATE AFFILIATE DATA ---
    const affiliates: LiveAffiliate[] = useMemo(() => {
        // Collect all potential affiliates (Role 'Affiliate' in Landlords/Users, Role 'Field Agent' or 'Affiliate' in Staff)
        // Also map 'Landlords' with specific type logic if needed, but primarily relying on role 'Affiliate'
        const staffAffiliates = staff.filter(s => s.role === 'Field Agent' || (s.role as string) === 'Affiliate').map(s => ({...s, affiliateType: s.role === 'Field Agent' ? 'Agent' : 'Staff Affiliate'}));
        const userAffiliates = landlords.filter(l => l.role === 'Affiliate').map(l => ({...l, affiliateType: 'Freelancer'})); // Default type if not stored, can enhance User model later

        const allPotential = [...staffAffiliates, ...userAffiliates];

        return allPotential.map(user => {
            const userId = user.id;
            
            // 1. Leads Referred (From Leads & Applications)
            const referredLeads = leads.filter(l => l.referrerId === userId);
            const referredApps = applications.filter(a => a.referrerId === userId);
            const totalLeads = referredLeads.length + referredApps.length;

            // 2. Leases Signed (From Tenants)
            const referredTenants = tenants.filter(t => t.referrerId === userId);
            const signedCount = referredTenants.filter(t => t.status === 'Active' || t.status === 'Overdue').length;

            // 3. Earnings (From Transactions)
            const earnings = rfTransactions
                .filter(tx => tx.partyName === user.name && tx.type === 'Referral Commission')
                .reduce((sum, tx) => sum + tx.amount, 0);

            // 4. Recent Activity
            const recentRefs = [
                ...referredTenants.map(t => ({ date: t.onboardingDate, name: t.name, status: 'Signed', commission: 0 })), // Mock comm for list if not linked directly
                ...referredLeads.map(l => ({ date: l.date || '', name: l.tenantName, status: 'Lead', commission: 0 }))
            ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

            return {
                id: userId,
                name: user.name,
                email: user.email,
                role: user.role,
                type: (user as any).affiliateType || 'Freelancer',
                referralCode: `${user.name.split(' ')[0].toUpperCase()}${new Date().getFullYear()}`,
                stats: {
                    leadsReferred: totalLeads,
                    leasesSigned: signedCount,
                    totalEarned: earnings
                },
                recentReferrals: recentRefs
            };
        });
    }, [staff, landlords, leads, tenants, rfTransactions, applications]);

    // Pending referral commissions to review/payout.
    // This was previously missing and caused a runtime crash -> blank page.
    const pendingReferralPayouts = useMemo(() => {
        return (rfTransactions || [])
            .filter(tx => tx.type === 'Referral Commission' && tx.status === 'Pending')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rfTransactions]);


    const handleInvite = (data: any) => {
        if (!canCreate) return alert('You do not have permission to invite affiliates.');
        // Register as a "Landlord" type user but with 'Affiliate' role to grant portal access
        // Ideally we'd have a generic 'User' adder, but addLandlord works for external users in this schema
        const newUser: User = {
            id: `aff-${Date.now()}`,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: 'Affiliate', // This grants them access to Affiliate Portal
            status: 'Active',
            branch: 'Headquarters',
            // @ts-ignore - injecting extra property for local logic until type updated
            affiliateType: data.type
        };
        
        addLandlord(newUser);
        alert(`Invitation sent to ${data.email} successfully! They are now registered as a ${data.type} Affiliate.`);
        setIsInviteModalOpen(false);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Affiliate Network</h1>
                    <p className="text-lg text-gray-500 mt-1">Manage partners, freelancers, and influencers driving growth.</p>
                </div>
                <button 
                    onClick={() => {
                        try {
                            window.location.hash = '#/registration/users?category=affiliates';
                        } catch {
                            setIsInviteModalOpen(true);
                        }
                    }}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md flex items-center transition-transform active:scale-95"
                >
                    <Icon name="plus" className="w-4 h-4 mr-2" /> Invite Affiliate
                </button>
            </div>

            {/* Empty State or Grid */}
            {affiliates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="p-4 bg-purple-50 rounded-full mb-4">
                        <Icon name="revenue" className="w-12 h-12 text-purple-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">No Affiliates Yet</h3>
                    <p className="text-gray-500 max-w-md text-center mt-2">Start your referral program by inviting freelancers, agents, or influencers to promote your properties.</p>
                    <button 
                        onClick={() => {
                            try {
                                window.location.hash = '#/registration/users?category=affiliates';
                            } catch {
                                setIsInviteModalOpen(true);
                            }
                        }}
                        className="mt-6 text-purple-600 font-bold hover:underline"
                    >
                        Send First Invite
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {affiliates.map(aff => (
                        <AffiliateCard 
                            key={aff.id} 
                            affiliate={aff} 
                            onViewPerformance={setSelectedAffiliate}
                        />
                    ))}
                    
                    <button 
                        onClick={() => {
                            try {
                                window.location.hash = '#/registration/users?category=affiliates';
                            } catch {
                                setIsInviteModalOpen(true);
                            }
                        }}
                        className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all min-h-[200px] bg-gray-50 hover:bg-white"
                    >
                        <Icon name="plus" className="w-10 h-10 mb-2 opacity-50" />
                        <span className="font-bold">Add New Partner</span>
                    </button>
                </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Pending Payouts</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3">Affiliate</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Referral</th>
                                <th className="px-4 py-3 text-right">Commission</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingReferralPayouts.map((t) => (
                                <tr key={t.id}>
                                    <td className="px-4 py-3 font-medium">{t.partyName}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs uppercase font-bold">Referral</td>
                                    <td className="px-4 py-3 text-gray-600">{t.description || t.reference}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">KES {Number(t.amount ?? 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right"><button type="button" onClick={() => setReviewPayout(t)} className="text-blue-600 hover:underline text-xs font-bold">Review</button></td>
                                </tr>
                            ))}
                            {pendingReferralPayouts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No pending referral commissions.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isInviteModalOpen && (
                <InviteAffiliateModal 
                    onClose={() => setIsInviteModalOpen(false)}
                    onInvite={handleInvite}
                />
            )}

            {selectedAffiliate && (
                <AffiliatePerformanceModal 
                    affiliate={selectedAffiliate}
                    onClose={() => setSelectedAffiliate(null)}
                />
            )}
            {reviewPayout && (
                <ReviewPayoutModal
                    payout={reviewPayout}
                    onClose={() => setReviewPayout(null)}
                    onConfirm={handleConfirmPayout}
                />
            )}
        </div>
    );
};

export default Affiliates;
