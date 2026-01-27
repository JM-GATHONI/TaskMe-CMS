
import React, { useRef, useEffect } from 'react';
import Icon from '../Icon';

const Chart: React.FC<{ type: 'bar' | 'line'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
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

const MarketplaceReporting: React.FC = () => {
    // Mock Data
    const funnelData = {
        labels: ['Impressions', 'Clicks', 'Leads', 'Tours', 'Leases'],
        datasets: [{
            label: 'Conversion Funnel',
            data: [15000, 3200, 450, 120, 45],
            backgroundColor: ['#e0e7ff', '#c7d2fe', '#818cf8', '#6366f1', '#4f46e5'],
            borderRadius: 4
        }]
    };

    const sourceData = {
        labels: ['Facebook', 'Google', 'Referrals', 'Direct'],
        datasets: [
            {
                label: 'Leads Generated',
                data: [120, 80, 150, 100],
                backgroundColor: '#3b82f6',
            },
            {
                label: 'Cost Per Lead (KES)',
                data: [450, 600, 0, 0],
                backgroundColor: '#ef4444',
                type: 'line'
            }
        ]
    };

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Growth Intelligence</h1>
                <p className="text-lg text-gray-500 mt-1">Analyze marketing performance and acquisition costs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Total Leads (Mo)</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">450</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">10.2%</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Cost Per Lease</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">KES 1,200</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Referral %</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">33%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Marketing Funnel</h3>
                    <Chart type="bar" data={funnelData} options={{ indexAxis: 'y' }} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Channel Performance & CPA</h3>
                    <Chart type="bar" data={sourceData} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Campaign ROI</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3">Campaign</th>
                                <th className="px-4 py-3 text-right">Spend</th>
                                <th className="px-4 py-3 text-right">Leads</th>
                                <th className="px-4 py-3 text-right">Leases</th>
                                <th className="px-4 py-3 text-right">Revenue Generated</th>
                                <th className="px-4 py-3 text-right">ROI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">Summer Move-in Special (FB)</td>
                                <td className="px-4 py-3 text-right text-red-600">KES 15,000</td>
                                <td className="px-4 py-3 text-right">120</td>
                                <td className="px-4 py-3 text-right">8</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600">KES 240,000</td>
                                <td className="px-4 py-3 text-right font-bold text-blue-600">16x</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">Google Search (Nairobi Apts)</td>
                                <td className="px-4 py-3 text-right text-red-600">KES 25,000</td>
                                <td className="px-4 py-3 text-right">80</td>
                                <td className="px-4 py-3 text-right">12</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600">KES 480,000</td>
                                <td className="px-4 py-3 text-right font-bold text-blue-600">19.2x</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceReporting;
