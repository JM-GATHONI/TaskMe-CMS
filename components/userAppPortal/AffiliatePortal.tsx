
import React, { useState, useMemo } from 'react';
import { Affiliate } from '../../types';
import Icon from '../Icon';
import AdBanners from './AdBanners';
import { useData } from '../../context/DataContext';
import { websiteLinks } from '../../utils/websiteLinks';

const StatCard: React.FC<{ title: string; value: string | number; color: string; icon: string }> = ({ title, value, color, icon }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4`} style={{ borderLeftColor: color }}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                <Icon name={icon} className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
    </div>
);

const AffiliatePortal: React.FC = () => {
    const { currentUser, leads, applications, rfTransactions, tenants } = useData();

    const affiliate: Affiliate = useMemo(() => {
        if (!currentUser) {
            return {
                id: 'aff-unknown',
                name: 'User',
                referralCode: 'REF2025',
                stats: { leadsReferred: 0, leasesSigned: 0, totalEarned: 0 },
                referrals: [],
            };
        }

        const referralCode =
            (currentUser as any).referralCode ||
            `${String(currentUser.name ?? 'USER').split(' ')[0].toUpperCase() || 'USER'}2025`;

        const myId = currentUser.id;
        const myName = currentUser.name ?? '';
        const thisMonth = new Date().toISOString().slice(0, 7);

        const leadsReferred = (leads ?? []).filter((l: any) => l?.referrerId === myId).length;

        // "Signed" is approximated by approved applications OR active tenants tied to this referrer.
        const leasesSigned =
            (applications ?? []).filter((a: any) => a?.referrerId === myId && a?.status === 'Approved').length +
            (tenants ?? []).filter((t: any) => t?.referrerId === myId && t?.status === 'Active').length;

        const totalEarned = (rfTransactions ?? [])
            .filter((tx: any) => tx?.type === 'Referral Commission' && tx?.partyName === myName)
            .reduce((sum: number, tx: any) => sum + Number(tx?.amount ?? 0), 0);

        const referrals = (applications ?? [])
            .filter((a: any) => a?.referrerId === myId)
            .map((a: any) => {
                const commission = (rfTransactions ?? [])
                    .filter((tx: any) =>
                        tx?.type === 'Referral Commission' &&
                        tx?.partyName === myName &&
                        String(tx?.date ?? '').startsWith(thisMonth) &&
                        String(tx?.description ?? '').toLowerCase().includes(String(a?.name ?? '').toLowerCase())
                    )
                    .reduce((sum: number, tx: any) => sum + Number(tx?.amount ?? 0), 0);

                return {
                    date: a?.submittedDate || new Date().toISOString().split('T')[0],
                    tenantName: a?.name || 'Referral',
                    status: a?.status === 'Approved' ? 'Signed' : 'Pending',
                    commission,
                } as const;
            });

        return {
            id: myId,
            name: currentUser.name || 'User',
            referralCode,
            stats: { leadsReferred, leasesSigned, totalEarned },
            referrals,
        };
    }, [currentUser, leads, applications, rfTransactions, tenants]);
    const [copyText, setCopyText] = useState('Copy Link');

    const handleCopy = () => {
        const link = websiteLinks.referral(affiliate.referralCode);
        navigator.clipboard.writeText(link).then(() => {
            setCopyText('Copied!');
            setTimeout(() => setCopyText('Copy Link'), 2000);
        });
    };

    const handleShare = (platform: string) => {
        alert(`Sharing to ${platform}...`);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                 <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                    <Icon name="revenue" className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
                        <p className="text-purple-200 mb-6">Track your earnings and grow your network.</p>
                        
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 inline-flex flex-col sm:flex-row items-center gap-4">
                            <div className="text-sm font-medium">Your Referral Link:</div>
                            <div className="bg-black/30 px-3 py-1.5 rounded-lg font-mono text-sm tracking-wide">
                                {websiteLinks.referral(affiliate.referralCode)}
                            </div>
                            <button onClick={handleCopy} className="px-4 py-1.5 bg-white text-purple-900 font-bold rounded-lg hover:bg-purple-100 transition-colors text-sm">
                                {copyText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Earnings" value={`KES ${Number(affiliate.stats?.totalEarned ?? 0).toLocaleString()}`} color="#10b981" icon="wallet" />
                <StatCard title="Successful Referrals" value={affiliate.stats.leasesSigned} color="#3b82f6" icon="check" />
                <StatCard title="Pending Leads" value={affiliate.stats.leadsReferred} color="#f59e0b" icon="time" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Referral History</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 uppercase text-xs font-bold text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Tenant Name</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {affiliate.referrals.map((ref, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">{ref.date}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{ref.tenantName}</td>
                                        <td className="px-4 py-3 text-center">
                                             <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                 ref.status === 'Signed' ? 'bg-green-100 text-green-700' : 
                                                 ref.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                 'bg-gray-100 text-gray-600'
                                             }`}>
                                                 {ref.status}
                                             </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">KES {Number(ref.commission ?? 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {affiliate.referrals.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No referrals yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Marketing Assets</h3>
                        <div className="space-y-3">
                            <button onClick={() => handleShare('WhatsApp')} className="w-full flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors">
                                <Icon name="communication" className="w-5 h-5 mr-2" /> Share on WhatsApp
                            </button>
                            <button onClick={() => handleShare('Twitter')} className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors">
                                 Share on Twitter
                            </button>
                             <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                                <Icon name="download" className="w-5 h-5 mr-2" /> Download Banners
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-md text-center">
                        <h4 className="font-bold text-lg mb-2">Pro Tip</h4>
                        <p className="text-sm text-indigo-100 mb-4">Top affiliates share their link in local community groups and property forums.</p>
                    </div>
                </div>
            </div>

            {/* Advert Banners */}
            <AdBanners />
        </div>
    );
};

export default AffiliatePortal;
