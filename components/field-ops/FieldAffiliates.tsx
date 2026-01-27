
import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { MOCK_AFFILIATE_PROFILE } from '../../constants'; // In real app, fetch list from context

const AffiliateCard: React.FC<{ affiliate: any }> = ({ affiliate }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    {affiliate.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{affiliate.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{affiliate.referralCode}</p>
                </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Active</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
            <div className="bg-gray-50 p-2 rounded">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Leads</p>
                <p className="font-bold">{affiliate.stats.leadsReferred}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Signed</p>
                <p className="font-bold text-blue-600">{affiliate.stats.leasesSigned}</p>
            </div>
             <div className="bg-gray-50 p-2 rounded">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Paid</p>
                <p className="font-bold text-green-600">{(affiliate.stats.totalEarned / 1000).toFixed(1)}k</p>
            </div>
        </div>
        
        <button className="w-full py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded hover:bg-purple-100 transition-colors">
            View Performance
        </button>
    </div>
);

const FieldAffiliates: React.FC = () => {
    // For demo, we are using the single mock profile. In a real scenario, map through a list of affiliates.
    // Assuming context has `affiliates` array.
    const mockAffiliates = [MOCK_AFFILIATE_PROFILE, { ...MOCK_AFFILIATE_PROFILE, id: 'aff2', name: 'John Connector', referralCode: 'JOHN2025', stats: { leadsReferred: 12, leasesSigned: 2, totalEarned: 5000 }}];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Affiliate Network</h1>
                    <p className="text-lg text-gray-500 mt-1">Manage partners driving growth to your platform.</p>
                </div>
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md flex items-center">
                    <Icon name="plus" className="w-4 h-4 mr-2" /> Invite Affiliate
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockAffiliates.map(aff => (
                    <AffiliateCard key={aff.id} affiliate={aff} />
                ))}
                
                <button className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all min-h-[200px]">
                    <Icon name="plus" className="w-10 h-10 mb-2 opacity-50" />
                    <span className="font-bold">Add New Partner</span>
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Pending Payouts</h3>
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Affiliate</th>
                            <th className="px-4 py-3">Referral</th>
                            <th className="px-4 py-3 text-right">Commission</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="px-4 py-3 font-medium">Sarah Linker</td>
                            <td className="px-4 py-3 text-gray-600">Tom Riddle (Lease Signed)</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">KES 3,000</td>
                            <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:underline text-xs font-bold">Approve</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FieldAffiliates;
