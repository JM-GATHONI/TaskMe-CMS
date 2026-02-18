
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { exportToCSV } from '../../utils/exportHelper';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

// --- Helper Chart Component ---
const ChartContainer: React.FC<{ type: 'bar' | 'line' | 'doughnut'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-72' }) => {
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

    return <div className={`relative ${height} w-full`}><canvas ref={canvasRef}></canvas></div>;
};

// --- KPI Card ---
const KpiCard: React.FC<{ title: string; value: string; subtext: string; color: string; icon: string; trend?: 'up' | 'down' | 'neutral' }> = ({ title, value, subtext, color, icon, trend }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4`} style={{ borderLeftColor: color }}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-extrabold text-gray-800 mt-1">{value}</p>
                <div className="flex items-center mt-1">
                    {trend && (
                        <span className={`text-[10px] font-bold mr-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
                            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
                        </span>
                    )}
                    <p className="text-xs text-gray-400">{subtext}</p>
                </div>
            </div>
            <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                <Icon name={icon} className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
    </div>
);

const MarketplaceReporting: React.FC = () => {
    const { leads, marketplaceListings, properties } = useData();
    const [timeRange, setTimeRange] = useState('All Time');

    // --- ANALYTICS CALCULATIONS ---

    const stats = useMemo(() => {
        // 1. Funnel Metrics
        const totalLeads = leads.length;
        const contacted = leads.filter(l => l.status !== 'New').length;
        const viewings = leads.filter(l => ['Viewing', 'Negotiation', 'Closed'].includes(l.status)).length;
        const negotiations = leads.filter(l => ['Negotiation', 'Closed'].includes(l.status)).length;
        const closed = leads.filter(l => l.status === 'Closed').length;

        // Mock Impressions/Clicks based on Leads (Assumed 2% conversion from click to lead, 5% CTR)
        const clicks = totalLeads * 50; 
        const impressions = clicks * 20;

        // 2. Conversion Rates
        const leadToViewRate = totalLeads > 0 ? Math.round((viewings / totalLeads) * 100) : 0;
        const viewToCloseRate = viewings > 0 ? Math.round((closed / viewings) * 100) : 0;
        const globalConversion = totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0;

        // 3. Financials (Estimated)
        // Match closed leads to listings to get price, otherwise default avg
        const revenue = leads.filter(l => l.status === 'Closed').reduce((sum, lead) => {
            // Try to find matching listing by title or loose match
            const listing = marketplaceListings.find(l => l.title === lead.listingTitle) 
                         || marketplaceListings.find(l => lead.listingTitle.includes(l.propertyName));
            
            // Default rent if not found (e.g. 25k) or use listing price
            const val = listing ? listing.price : 25000;
            return sum + val;
        }, 0);

        // 4. Source Breakdown
        const sources: Record<string, number> = {};
        leads.forEach(l => {
            const src = l.source || 'Direct';
            sources[src] = (sources[src] || 0) + 1;
        });

        // 5. Listing Performance
        const listingStats: Record<string, { leads: number, closed: number, title: string }> = {};
        leads.forEach(l => {
            const title = l.listingTitle || 'General Inquiry';
            if (!listingStats[title]) listingStats[title] = { leads: 0, closed: 0, title };
            listingStats[title].leads++;
            if (l.status === 'Closed') listingStats[title].closed++;
        });
        const topListings = Object.values(listingStats).sort((a,b) => b.leads - a.leads).slice(0, 5);

        return {
            impressions, clicks, totalLeads, viewings, negotiations, closed,
            leadToViewRate, viewToCloseRate, globalConversion,
            revenue, sources, topListings
        };
    }, [leads, marketplaceListings]);

    // --- CHART DATA ---

    const funnelChartData = {
        labels: ['Impressions', 'Clicks', 'Leads', 'Viewings', 'Negotiations', 'Closed'],
        datasets: [{
            label: 'Volume',
            data: [stats.impressions, stats.clicks, stats.totalLeads, stats.viewings, stats.negotiations, stats.closed],
            backgroundColor: [
                '#e0e7ff', // Impressions (Lightest)
                '#c7d2fe', // Clicks
                '#818cf8', // Leads
                '#6366f1', // Viewings
                '#4f46e5', // Negotiations
                '#10b981'  // Closed (Green)
            ],
            borderRadius: 4,
            barPercentage: 0.6,
        }]
    };

    const sourceChartData = {
        labels: Object.keys(stats.sources),
        datasets: [{
            data: Object.values(stats.sources),
            backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
            borderWidth: 0
        }]
    };

    // Trend Data (Mocked over last 6 months for demo visualization structure)
    const trendChartData = {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [
            {
                label: 'Leads Generated',
                data: [12, 19, 15, 25, 22, stats.totalLeads], // Ending with current total for context
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Deals Closed',
                data: [2, 4, 3, 6, 5, stats.closed],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const handleExport = () => {
        const data = leads.map(l => ({
            Name: l.tenantName,
            Status: l.status,
            Source: l.source,
            Interest: l.interest,
            Date: l.date
        }));
        exportToCSV(data, 'Marketplace_Report');
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Growth Intelligence</h1>
                    <p className="text-lg text-gray-500 mt-1">Analyze marketing performance, conversion funnels, and revenue attribution.</p>
                </div>
                <div className="flex gap-2">
                    <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Last 30 Days</option>
                        <option>This Quarter</option>
                        <option>All Time</option>
                    </select>
                    <button onClick={handleExport} className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-primary-dark flex items-center">
                        <Icon name="download" className="w-4 h-4 mr-2" /> Export Data
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Total Leads" 
                    value={stats.totalLeads.toString()} 
                    subtext="Potential Tenants" 
                    color="#3b82f6" 
                    icon="tenants" 
                    trend="up"
                />
                <KpiCard 
                    title="Conversion Rate" 
                    value={`${stats.globalConversion}%`} 
                    subtext="Lead to Lease" 
                    color="#10b981" 
                    icon="analytics" 
                    trend="neutral"
                />
                <KpiCard 
                    title="Est. Revenue Generated" 
                    value={`KES ${(stats.revenue/1000).toFixed(1)}k`} 
                    subtext="Annualized Value" 
                    color="#8b5cf6" 
                    icon="revenue" 
                    trend="up"
                />
                <KpiCard 
                    title="Active Listings" 
                    value={marketplaceListings.filter(l => l.status === 'Published').length.toString()} 
                    subtext="Market Exposure" 
                    color="#f59e0b" 
                    icon="marketplace" 
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Funnel Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Acquisition Funnel</h3>
                    <div className="h-72">
                        <ChartContainer 
                            type="bar" 
                            data={funnelChartData} 
                            options={{ 
                                indexAxis: 'y', 
                                scales: { x: { grid: { display: false } } },
                                plugins: { legend: { display: false } }
                            }} 
                        />
                    </div>
                </div>

                {/* Source Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Lead Sources</h3>
                    <div className="h-64 flex justify-center">
                        <ChartContainer 
                            type="doughnut" 
                            data={sourceChartData} 
                            options={{ cutout: '65%' }}
                        />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500">Top Channel: <strong>{Object.keys(stats.sources).reduce((a, b) => stats.sources[a] > stats.sources[b] ? a : b, 'Direct')}</strong></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Trend Analysis */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Growth Trend</h3>
                    <div className="h-72">
                         <ChartContainer type="line" data={trendChartData} />
                    </div>
                 </div>

                 {/* Top Listings Table */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Top Performing Assets</h3>
                    <div className="flex-grow overflow-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Listing / Interest</th>
                                    <th className="px-4 py-3 text-right">Leads</th>
                                    <th className="px-4 py-3 text-right">Closed</th>
                                    <th className="px-4 py-3 text-right">Conv. %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.topListings.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-xs">{item.title}</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">{item.leads}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">{item.closed}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{Math.round((item.closed / item.leads) * 100)}%</td>
                                    </tr>
                                ))}
                                {stats.topListings.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No listing data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default MarketplaceReporting;
