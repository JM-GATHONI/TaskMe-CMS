
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReportCardData } from '../../types';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';

// --- Card Styles ---
const MAJOR_CARD_CLASSES = "relative bg-white rounded-2xl border-t-[8px] border-t-primary border-b-[4px] border-b-secondary border-x-[3px] border-x-secondary shadow-[inset_0_0_60px_-15px_rgba(157,31,21,0.15)] hover:shadow-lg transition-all duration-300 overflow-hidden";

const Chart: React.FC<{ type: 'bar' | 'line'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-20' }) => {
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
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    ...options
                },
            });
        }
        return () => {
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [type, data, options]);

    return <div className={`relative ${height}`}><canvas ref={canvasRef}></canvas></div>;
};

const NavCard: React.FC<{ title: string; icon: string; description: string; link: string; color: string }> = ({ title, icon, description, link, color }) => (
    <div 
        onClick={() => window.location.hash = link}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center hover:border-primary/50 h-full"
    >
        <div className={`p-4 rounded-full bg-opacity-10 mb-4 transition-transform group-hover:scale-110`} style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon name={icon} className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
    </div>
);


const ReportCard: React.FC<{ card: ReportCardData }> = ({ card }) => {
    const colorClasses = {
        primary: 'text-primary',
        secondary: 'text-secondary-dark',
        red: 'text-red-600',
        green: 'text-green-600',
        blue: 'text-blue-600',
        gray: 'text-gray-800'
    };

    const handleClick = () => {
        if (card.link) {
            window.location.hash = card.link;
        }
    };

    return (
        <div 
            onClick={handleClick}
            className={`${MAJOR_CARD_CLASSES} p-5 cursor-pointer group`}
        >
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{card.title}</h3>
                    <Icon name={card.icon} className={`w-6 h-6 ${colorClasses[card.color]} opacity-80 group-hover:opacity-100`} />
                </div>
                <p className={`text-4xl font-bold my-2 ${colorClasses[card.color]}`}>{card.value}</p>
                {card.subtext && <p className="text-sm text-gray-500">{card.subtext}</p>}
                {card.chartData && card.chartType && (
                     <div className="mt-4">
                        <Chart 
                            type={card.chartType} 
                            data={card.chartData} 
                            options={{ scales: { x: { display: true, ticks: { font: { size: 8 } } } } }}
                        />
                    </div>
                )}
                <div className="mt-3 flex items-center text-xs font-semibold text-gray-400 group-hover:text-primary transition-colors">
                    View Details <span className="ml-1">→</span>
                </div>
            </div>
        </div>
    );
};


const ReportsOverview: React.FC = () => {
    const [dateRange, setDateRange] = useState('This Month');
    const { tenants, properties, landlords, tasks, getTotalRevenue, getOccupancyRate } = useData();

    // Updated links to match new route structure: #/reports-analytics/reports/[report-name]
    const reportModules = [
        { title: "Tenancy Reports", icon: "tenants", description: "Tenant population, status, and compliance.", link: "#/reports-analytics/reports/tenancy-reports", color: "#3b82f6" },
        { title: "Property Reports", icon: "branch", description: "Portfolio health, occupancy, and landlord performance.", link: "#/reports-analytics/reports/property-reports", color: "#10b981" },
        { title: "Financial Reports", icon: "revenue", description: "Revenue, expenses, arrears, and profitability.", link: "#/reports-analytics/reports/financial-reports", color: "#f59e0b" },
        { title: "Staff Reports", icon: "hr", description: "Personnel, payroll, and role distribution.", link: "#/reports-analytics/reports/staff-reports", color: "#8b5cf6" },
        { title: "Task & Operations", icon: "operations", description: "Operational efficiency and task tracking.", link: "#/reports-analytics/reports/task-operations-reports", color: "#ef4444" },
        { title: "R-REITs Fund", icon: "reits", description: "Fund performance and investor growth.", link: "#/reports-analytics/reports/r-reits-fund", color: "#6366f1" },
        { title: "Compliance & Tax", icon: "accounting", description: "Regulatory tracking and tax obligations.", link: "#/reports-analytics/reports/compliance-tax-reports", color: "#14b8a6" },
        { title: "Custom Reports", icon: "analytics", description: "Build and save custom data views.", link: "#/reports-analytics/reports/custom-reports", color: "#6b7280" },
    ];

    const reportCards: ReportCardData[] = useMemo(() => {
        const totalTenants = tenants.length;
        const totalLandlords = landlords.length;
        const occupancy = getOccupancyRate();
        const revenue = getTotalRevenue();
        const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Received').length;
        const escalatedTasks = tasks.filter(t => t.priority === 'Very High' || t.priority === 'High').length;
        
        // Calculate arrears
        const arrears = tenants.reduce((acc, t) => acc + (t.status === 'Overdue' ? t.rentAmount : 0), 0);
        
        // Calculate vacant units
        const vacantUnits = properties.reduce((acc, p) => acc + p.units.filter(u => u.status === 'Vacant').length, 0);

        return [
            { title: "Total Tenants", value: totalTenants.toString(), icon: 'tenants', link: '#/reports-analytics/reports/tenancy-reports', color: 'primary', subtext: "+56 this month" },
            { title: "Active Landlords", value: totalLandlords.toString(), icon: 'landlords', link: '#/reports-analytics/reports/property-reports?tab=landlords', color: 'primary', subtext: "+4 this month" },
            { title: "Total Branches", value: "2", icon: 'branch', link: '#/reports-analytics/reports/property-reports?tab=branches', color: 'gray', subtext: "Kericho & Kisii" },
            { title: "Active Field Agents", value: "42", icon: 'hr', link: '#/reports-analytics/reports/staff-reports?role=Field Agent', color: 'gray', subtext: "vs 38 last month" },
            
            { title: "Monthly Revenue", value: `KES ${(revenue/1000000).toFixed(1)}M`, icon: 'revenue', link: '#/reports-analytics/reports/financial-reports?view=revenue', color: 'green', subtext: "Target: KES 4.3M" },
            { title: "Monthly Expenses", value: "KES 1.8M", icon: 'expenses', link: '#/reports-analytics/reports/financial-reports?view=expenses', color: 'red', subtext: "Target: KES 2.0M" },
            { title: "On-Time Payments", value: "83%", icon: 'on-time-payment', link: '#/reports-analytics/reports/financial-reports?view=revenue', color: 'green', subtext: "vs 85% last month" },
            { title: "Total Rent Arrears", value: `KES ${(arrears/1000).toFixed(0)}k`, icon: 'arrears', link: '#/reports-analytics/reports/financial-reports?view=arrears', color: 'red', subtext: "from overdue tenants" },

            { title: "Vacant Units", value: vacantUnits.toString(), icon: 'vacant-house', link: '#/reports-analytics/reports/property-reports?tab=vacancies', color: 'blue', subtext: `Occupancy: ${occupancy}%` },
            { title: "Properties", value: properties.length.toString(), icon: 'for-sale', link: '#/reports-analytics/reports/property-reports?tab=branches', color: 'blue', subtext: "Under Management" },

            { title: "Pending Tasks", value: pendingTasks.toString(), icon: 'pending-task', link: '#/reports-analytics/reports/task-operations-reports?status=Pending', color: 'secondary', subtext: "Avg. age: 3 days" },
            { title: "Escalated Tasks", value: escalatedTasks.toString(), icon: 'task-escalated', link: '#/reports-analytics/reports/task-operations-reports?priority=High', color: 'secondary', subtext: "Requires immediate attention" },
        ];
    }, [tenants, properties, landlords, tasks, getTotalRevenue, getOccupancyRate]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Reports Center</h1>
                    <p className="text-lg text-gray-500 mt-1">Central hub for all system reports and analytics.</p>
                </div>
                <div className="bg-white p-1 rounded-lg border border-gray-200 flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold text-gray-500 uppercase">Period:</span>
                    <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-2 py-1 bg-gray-50 border-none rounded-md text-sm font-semibold text-gray-800 focus:ring-0 cursor-pointer">
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>This Quarter</option>
                        <option>Year to Date</option>
                    </select>
                </div>
            </div>

            {/* Module Navigation Grid */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Report Modules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {reportModules.map((mod) => (
                        <NavCard key={mod.title} {...mod} />
                    ))}
                </div>
            </div>

            {/* System Health */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-green-500/20 rounded-full">
                        <Icon name="analytics" className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">System Health</h2>
                        <p className="text-gray-400 text-sm">All modules operating normally.</p>
                    </div>
                </div>
                <div className="flex gap-8 text-center">
                    <div>
                        <p className="text-2xl font-bold">99.9%</p>
                        <p className="text-xs text-gray-400 uppercase">Uptime</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">12ms</p>
                        <p className="text-xs text-gray-400 uppercase">Latency</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-xs text-gray-400 uppercase">Last Sync</p>
                    </div>
                </div>
            </div>
            
            {/* Quick Insights */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Insights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {reportCards.map(card => (
                        <ReportCard key={card.title} card={card} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReportsOverview;
