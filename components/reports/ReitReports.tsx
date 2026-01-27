
import React, { useRef, useEffect } from 'react';
import { REIT_BALANCE_GROWTH_DATA } from '../../constants';
import Icon from '../Icon';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const KpiCard: React.FC<{ title: string; value: string; subtext?: string; icon: string; color: string }> = ({ title, value, subtext, icon, color }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4`} style={{ borderLeftColor: color }}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-extrabold text-gray-800 mt-1">{value}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                <Icon name={icon} className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
    </div>
);

// --- Chart Helper ---
const Chart: React.FC<{ type: 'line'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
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

const MOCK_REIT_KPIS = [
    { title: 'Total Fund Value', value: 'KES 24.5M', subtext: 'Net Asset Value', icon: 'revenue', color: '#10b981' },
    { title: 'Active Investors', value: '1,842', subtext: '+56 this month', icon: 'hr', color: '#3b82f6' },
    { title: 'Average Return (YTD)', value: '18.5%', subtext: 'Annualized', icon: 'analytics', color: '#f59e0b' },
    { title: 'Payouts This Month', value: 'KES 490K', subtext: 'Distributed on the 15th', icon: 'payments', color: '#8b5cf6' },
];

const ReitReports: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">R-reits Fund Reports</h1>
                    <p className="text-lg text-gray-500 mt-1">Performance and growth metrics for TaskMe Renovation Funds.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_REIT_KPIS.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-gray-800 mb-6">Investor Capital Growth Trend</h2>
                 <div className="h-80">
                    <Chart type="line" data={REIT_BALANCE_GROWTH_DATA} options={{ responsive: true, maintainAspectRatio: false }} />
                 </div>
                 <p className="text-center text-gray-400 text-xs mt-4">
                    Tracks the cumulative growth of investor capital over the last 6 months.
                 </p>
            </div>
        </div>
    );
};

export default ReitReports;
