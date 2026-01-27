
import React from 'react';
import Icon from '../Icon';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AcquisitionInsights: React.FC = () => {
    // Mock Data
    const funnelData = {
        labels: ['Impressions', 'Site Visits', 'Inquiries', 'Tours', 'Applications', 'Leases Signed'],
        datasets: [{
            label: 'Conversion Count',
            data: [15000, 4500, 800, 250, 120, 85],
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    };

    const sourceData = {
        labels: ['Facebook Ads', 'Google Search', 'Referrals', 'Property Portals', 'Walk-ins'],
        datasets: [{
            data: [35, 25, 20, 15, 5],
            backgroundColor: ['#1877F2', '#DB4437', '#10b981', '#f59e0b', '#6b7280'],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Acquisition Insights</h1>
                <p className="text-lg text-gray-500 mt-1">Analyze lead generation, conversion funnels, and marketing ROI.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Leads (MTD)</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">214</p>
                    <p className="text-xs text-green-600 mt-1 font-bold">▲ 12%</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Cost Per Lead</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">KES 450</p>
                    <p className="text-xs text-red-600 mt-1 font-bold">▼ 5% (Better)</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Conv. Rate</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">10.6%</p>
                    <p className="text-xs text-green-600 mt-1 font-bold">▲ 1.2%</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Avg. Time to Lease</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">14 Days</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Leasing Funnel</h3>
                    <div className="h-72">
                        <Bar 
                            data={funnelData} 
                            options={{ 
                                indexAxis: 'y', 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } } 
                            }} 
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Lead Sources</h3>
                    <div className="h-64 flex justify-center">
                        <Doughnut 
                            data={sourceData} 
                            options={{ 
                                cutout: '60%', 
                                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } 
                            }} 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Channel Performance Matrix</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Channel</th>
                                <th className="px-4 py-3 text-right">Spend</th>
                                <th className="px-4 py-3 text-right">Leads</th>
                                <th className="px-4 py-3 text-right">Leases</th>
                                <th className="px-4 py-3 text-right">CPA (Cost per Acq)</th>
                                <th className="px-4 py-3 text-right">ROI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">Facebook Ads</td>
                                <td className="px-4 py-3 text-right text-red-600">KES 15,000</td>
                                <td className="px-4 py-3 text-right">120</td>
                                <td className="px-4 py-3 text-right">8</td>
                                <td className="px-4 py-3 text-right font-bold">KES 1,875</td>
                                <td className="px-4 py-3 text-right text-green-600">4.5x</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">Google Ads</td>
                                <td className="px-4 py-3 text-right text-red-600">KES 25,000</td>
                                <td className="px-4 py-3 text-right">80</td>
                                <td className="px-4 py-3 text-right">12</td>
                                <td className="px-4 py-3 text-right font-bold">KES 2,083</td>
                                <td className="px-4 py-3 text-right text-green-600">5.2x</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">Referrals</td>
                                <td className="px-4 py-3 text-right text-red-600">KES 5,000</td>
                                <td className="px-4 py-3 text-right">45</td>
                                <td className="px-4 py-3 text-right">15</td>
                                <td className="px-4 py-3 text-right font-bold">KES 333</td>
                                <td className="px-4 py-3 text-right text-green-600">18.0x</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AcquisitionInsights;
