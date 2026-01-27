
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { MOCK_AFFILIATE_PROFILE } from '../../constants'; 
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

const InviteAffiliateModal: React.FC<{ onClose: () => void; onInvite: (data: any) => void }> = ({ onClose, onInvite }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return alert("Name and Email required");
        onInvite(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1500] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Invite New Affiliate</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
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
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700">Send Invite</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AffiliatePerformanceModal: React.FC<{ affiliate: any; onClose: () => void }> = ({ affiliate, onClose }) => {
    // Mock Chart Data
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Leads',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
            {
                label: 'Conversions',
                data: [2, 3, 20, 5, 1, 4],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1500] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                            {affiliate.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{affiliate.name}</h3>
                            <p className="text-sm text-gray-500">Performance Overview</p>
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
                        <p className="text-xs font-bold text-green-600 uppercase">Signed Leases</p>
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

                    <h4 className="font-bold text-gray-700 mb-3">Recent Referrals</h4>
                    <table className="min-w-full text-sm text-left border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 border-b">Date</th>
                                <th className="px-4 py-2 border-b">Tenant</th>
                                <th className="px-4 py-2 border-b">Status</th>
                                <th className="px-4 py-2 border-b text-right">Comm.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {affiliate.referrals && affiliate.referrals.map((ref: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border-b">{ref.date}</td>
                                    <td className="px-4 py-2 border-b">{ref.tenantName}</td>
                                    <td className="px-4 py-2 border-b">
                                        <span className={`px-2 py-0.5 rounded text-xs ${ref.status === 'Signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {ref.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 border-b text-right font-bold text-gray-700">
                                        {ref.commission.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
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

const AffiliateCard: React.FC<{ affiliate: any; onViewPerformance: (aff: any) => void }> = ({ affiliate, onViewPerformance }) => (
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
        
        <button 
            onClick={() => onViewPerformance(affiliate)}
            className="w-full py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded hover:bg-purple-100 transition-colors"
        >
            View Performance
        </button>
    </div>
);

const Affiliates: React.FC = () => {
    const { addMessage } = useData();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);

    // For demo, we are using the single mock profile. In a real scenario, map through a list of affiliates.
    // Assuming context has `affiliates` array.
    const mockAffiliates = [MOCK_AFFILIATE_PROFILE, { ...MOCK_AFFILIATE_PROFILE, id: 'aff2', name: 'John Connector', referralCode: 'JOHN2025', stats: { leadsReferred: 12, leasesSigned: 2, totalEarned: 5000 }}];

    const handleInvite = (data: any) => {
        // In real app, call API to send invite email
        alert(`Invitation sent to ${data.email} successfully!`);
        setIsInviteModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Affiliate Network</h1>
                    <p className="text-lg text-gray-500 mt-1">Manage partners driving growth to your platform.</p>
                </div>
                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md flex items-center"
                >
                    <Icon name="plus" className="w-4 h-4 mr-2" /> Invite Affiliate
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockAffiliates.map(aff => (
                    <AffiliateCard 
                        key={aff.id} 
                        affiliate={aff} 
                        onViewPerformance={setSelectedAffiliate}
                    />
                ))}
                
                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all min-h-[200px]"
                >
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
        </div>
    );
};

export default Affiliates;
