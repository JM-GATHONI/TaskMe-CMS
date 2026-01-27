
import React, { useRef, useEffect } from 'react';
import { MOCK_REIT_METRICS } from '../../constants';
import Icon from '../Icon';

const Chart: React.FC<{ type: 'line' | 'bar'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-80' }) => {
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

const PortfolioPerformance: React.FC = () => {
    
    const navData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Fund NAV (Net Asset Value)',
                data: [10.0, 10.2, 10.5, 10.8, 11.2, 11.5],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const rentCollectionData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Rent Collected (KES M)',
                data: [1.2, 1.3, 1.25, 1.4, 1.35, 1.5],
                backgroundColor: '#10b981',
            }
        ]
    };

    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/reits/investment-plans'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Funds
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Renovation Fund Performance</h1>
                <p className="text-lg text-gray-500 mt-1">Transparency into how your capital works.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_REIT_METRICS.map((m, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{m.title}</p>
                        <p className="text-2xl font-bold text-gray-800 mt-2">{m.value}</p>
                        <p className={`text-xs mt-1 font-semibold ${m.change?.includes('+') ? 'text-green-600' : 'text-gray-400'}`}>{m.change}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">NAV Growth per Share</h3>
                    <Chart type="line" data={navData} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Underlying Rent Collection</h3>
                    <Chart type="bar" data={rentCollectionData} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Asset Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Property Asset</th>
                                <th className="px-4 py-2">Location</th>
                                <th className="px-4 py-2 text-center">Occupancy</th>
                                <th className="px-4 py-2 text-right">Valuation</th>
                                <th className="px-4 py-2 text-right">Yield</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">Riverside Block C</td>
                                <td className="px-4 py-3 text-gray-600">Kericho</td>
                                <td className="px-4 py-3 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">98%</span></td>
                                <td className="px-4 py-3 text-right">KES 45M</td>
                                <td className="px-4 py-3 text-right font-bold">12.4%</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">Green Valley Ph2</td>
                                <td className="px-4 py-3 text-gray-600">Kisii</td>
                                <td className="px-4 py-3 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Under Renovation</span></td>
                                <td className="px-4 py-3 text-right">KES 22M</td>
                                <td className="px-4 py-3 text-right font-bold">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PortfolioPerformance;
