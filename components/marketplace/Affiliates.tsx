
import React, { useRef, useEffect } from 'react';
import { MOCK_AFFILIATE_PROFILE } from '../../constants';
import Icon from '../Icon';

const Chart: React.FC<{ type: 'bar' | 'line'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-48' }) => {
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
                    plugins: { legend: { display: false } },
                    ...options
                },
            });
        }
        return () => chartRef.current?.destroy();
    }, [type, data, options]);

    return <div className={`relative ${height}`}><canvas ref={canvasRef}></canvas></div>;
};

const Affiliates: React.FC = () => {
    const affiliate = MOCK_AFFILIATE_PROFILE;

    const performanceData = {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [{
            label: 'Commissions',
            data: [5000, 7500, 6000, 12000, 15000, 36000],
            backgroundColor: '#8b5cf6',
            borderRadius: 4
        }]
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Affiliate Command Center</h1>
                    <p className="text-lg text-gray-500 mt-1">Track referrals, commissions, and partner performance.</p>
                </div>
                <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold flex items-center">
                    <Icon name="reits" className="w-5 h-5 mr-2" />
                    Code: {affiliate.referralCode}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold">Leads Referred</p>
                            <p className="text-3xl font-extrabold text-gray-800 mt-1">{affiliate.stats.leadsReferred}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold">Conversions</p>
                            <p className="text-3xl font-extrabold text-blue-600 mt-1">{affiliate.stats.leasesSigned}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Earnings</p>
                            <p className="text-3xl font-extrabold text-green-600 mt-1">KES {affiliate.stats.totalEarned.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Commission Performance</h3>
                        <Chart type="bar" data={performanceData} />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Referral History</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Tenant</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {affiliate.referrals.map((ref, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-600">{ref.date}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{ref.tenantName}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${ref.status === 'Signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {ref.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-800">KES {ref.commission.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Tools */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-700 to-indigo-800 p-6 rounded-2xl text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Marketing Kit</h3>
                        <p className="text-purple-200 text-sm mb-6">Boost your referrals with professional banners and templates.</p>
                        <div className="space-y-3">
                            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors">
                                <Icon name="download" className="w-4 h-4 mr-2" /> Social Media Pack
                            </button>
                            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors">
                                <Icon name="mail" className="w-4 h-4 mr-2" /> Email Templates
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Top Performers</h3>
                        <ul className="space-y-4">
                            {[1, 2, 3].map((rank) => (
                                <li key={rank} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${rank === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {rank}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Agent {String.fromCharCode(64 + rank)}</p>
                                            <p className="text-xs text-gray-500">{10 - rank}0 Referrals</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-600">KES {(15 - rank * 2)}k</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Affiliates;
