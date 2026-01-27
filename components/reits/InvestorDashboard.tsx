
import React, { useState, useRef, useEffect } from 'react';
import { MOCK_INVESTOR_PROFILE } from '../../constants';
import { RFTransaction } from '../../types';
import Icon from '../Icon';

const KpiCard: React.FC<{ title: string; value: string | number; subtext?: string; icon: string; color: string }> = ({ title, value, subtext, icon, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 flex justify-between items-start transition-transform hover:-translate-y-1" style={{ borderColor: color }}>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800 my-1">{typeof value === 'number' ? `KES ${value.toLocaleString()}` : value}</p>
            {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
        <div className="p-2 rounded-full bg-gray-50">
            <Icon name={icon} className="w-6 h-6 text-gray-400" />
        </div>
    </div>
);

const Chart: React.FC<{ type: 'line' | 'doughnut'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
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
                    plugins: { legend: { position: 'bottom' } },
                    ...options
                },
            });
        }
        return () => chartRef.current?.destroy();
    }, [type, data, options]);

    return <div className={`relative ${height}`}><canvas ref={canvasRef}></canvas></div>;
};

const InvestorDashboard: React.FC = () => {
    const [profile] = useState(MOCK_INVESTOR_PROFILE);

    // Mock Holdings Data
    const holdings = [
        { name: 'Renovation Fund I', invested: 150000, currentVal: 162000, return: '+8%' },
        { name: 'Stable Income Trust', invested: 50000, currentVal: 51500, return: '+3%' },
    ];

    const performanceData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Portfolio Value (KES)',
            data: [100000, 102000, 155000, 158000, 210000, 213500],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const allocationData = {
        labels: ['Renovation Fund', 'Income Trust', 'Cash Balance'],
        datasets: [{
            data: [162000, 51500, 5000],
            backgroundColor: ['#3b82f6', '#8b5cf6', '#e5e7eb'],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Investor Dashboard</h1>
                    <p className="text-lg text-gray-500 mt-1">Welcome back, {profile.name}.</p>
                </div>
                <button onClick={() => window.location.hash = '#/reits/investment-plans'} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark shadow-md transition-colors">
                    Browse Renovation Funds
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="Total Portfolio Value" 
                    value={213500} 
                    subtext="+12.5% all-time return" 
                    icon="reits" 
                    color="#10b981"
                />
                <KpiCard 
                    title="Total Earnings" 
                    value={profile.totalReturns} 
                    subtext="Interest & Dividends Paid" 
                    icon="revenue" 
                    color="#3b82f6"
                />
                <KpiCard 
                    title="Pending Payout" 
                    value={profile.nextPayout.amount} 
                    subtext={`Expected on ${profile.nextPayout.date}`} 
                    icon="payments" 
                    color="#f59e0b"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Portfolio Growth</h3>
                    <Chart type="line" data={performanceData} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Asset Allocation</h3>
                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-xs">
                            <Chart type="doughnut" data={allocationData} height="h-56" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Current Holdings</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fund Name</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invested Capital</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Return</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {holdings.map((h, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{h.name}</td>
                                    <td className="px-6 py-4 text-right text-gray-600">KES {h.invested.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">KES {h.currentVal.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-green-600 font-bold">{h.return}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary hover:underline text-sm font-medium">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvestorDashboard;