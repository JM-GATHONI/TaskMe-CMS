
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from './Icon';
import { useData } from '../context/DataContext';
import { exportToCSV, printSection } from '../utils/exportHelper';
import { 
    CASH_FLOW_CHART_DATA,
    TENANT_GROWTH_CHART_DATA,
    AGENT_PERFORMANCE_CHART_DATA,
    LEASE_VACANCY_CHART_DATA,
    MAINTENANCE_PERFORMANCE_CHART_DATA,
    PAYMENT_DISTRIBUTION_CHART_DATA
} from '../constants';

const navigate = (url: string) => {
    window.location.hash = url;
};

// --- Card Styles ---
// Major Cards: Top 8px Primary, Bottom 4px Secondary, Sides 3px Secondary + Vignette Effect
const MAJOR_CARD_CLASSES = "relative bg-white rounded-2xl border-t-[8px] border-t-primary border-b-[4px] border-b-secondary border-x-[3px] border-x-secondary shadow-[inset_0_0_60px_-15px_rgba(157,31,21,0.15)] hover:shadow-lg transition-all duration-300 overflow-hidden";
const SMALL_CARD_CLASSES = "bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden group";

interface InteractiveKpiCardProps {
    stat: {
        title: string;
        value: string | number;
        change?: string;
        changeType?: 'increase' | 'decrease' | 'neutral';
        period?: string;
        link: string;
    };
}

const KpiCard: React.FC<InteractiveKpiCardProps> = ({ stat }) => (
    <div 
        onClick={() => navigate(stat.link)}
        className={`${SMALL_CARD_CLASSES} cursor-pointer`}
    >
        <div className="relative z-10 flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 font-medium text-sm group-hover:text-primary transition-colors">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 my-1">{stat.value}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="chevron-down" className="w-4 h-4 text-gray-400 -rotate-90" />
                </div>
            </div>
            <div className="flex items-center text-xs mt-2">
                <span className={`font-semibold ${
                    stat.changeType === 'increase' ? 'text-green-600' : 
                    stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                }`}>
                    {stat.changeType === 'increase' ? '▲' : stat.changeType === 'decrease' ? '▼' : '•'} {stat.change}
                </span>
                <span className="text-gray-400 ml-1">{stat.period}</span>
            </div>
        </div>
    </div>
);

const Chart: React.FC<{ type: 'line' | 'bar' | 'pie'; data: any; options?: any; }> = ({ type, data, options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !(window as any).Chart) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            chartRef.current = new (window as any).Chart(ctx, {
                type,
                data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                    },
                    ...options
                },
            });
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [type, data, options]);

    return <div className="relative h-72"><canvas ref={canvasRef}></canvas></div>;
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; reportUrl: string; }> = ({ title, children, defaultOpen = false, reportUrl }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="w-full flex justify-between items-center p-4 text-left border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(reportUrl)} className="text-sm font-semibold text-primary hover:text-primary-dark">View Report →</button>
                    <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-light">
                        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className="p-4 bg-gray-50/30">
                    {children}
                </div>
            )}
        </div>
    );
};


const QuickStats: React.FC = () => {
    const { tenants, tasks, properties } = useData();
    const [dateRange, setDateRange] = useState('Last 30 Days');
    const [branch, setBranch] = useState('All Branches');

    // --- Helper: Check if date is within selected range ---
    const isInRange = (dateStr?: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        
        // Check for invalid dates
        if (isNaN(date.getTime())) return false;

        // Reset times for accurate date comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        switch (dateRange) {
            case 'Today':
                return compareDate.getTime() === today.getTime();
            case 'This Week': {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                return compareDate >= startOfWeek;
            }
            case 'Last Two Weeks': {
                const twoWeeksAgo = new Date(today);
                twoWeeksAgo.setDate(today.getDate() - 14);
                return compareDate >= twoWeeksAgo;
            }
            case 'Last 30 Days': {
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return compareDate >= thirtyDaysAgo;
            }
            case '90 Days': {
                const ninetyDaysAgo = new Date(today);
                ninetyDaysAgo.setDate(today.getDate() - 90);
                return compareDate >= ninetyDaysAgo;
            }
            case 'This Year':
                return date.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    };

    // --- Helper: Check if item belongs to selected branch ---
    const isInBranch = (propertyId?: string) => {
        if (branch === 'All Branches') return true;
        if (!propertyId) return false; // Orphaned items
        const property = properties.find(p => p.id === propertyId);
        return property?.branch === branch;
    };

    // --- Live Data Calculations ---

    // 1. Membership & Tenants
    const membershipStats = useMemo(() => {
        // Filter Logic
        const filteredTenants = tenants.filter(t => isInBranch(t.propertyId));
        
        const newTenants = filteredTenants.filter(t => isInRange(t.onboardingDate)).length;
        const totalTenants = filteredTenants.length;
        
        // Churn: Tenants who vacated in range
        const churned = filteredTenants.filter(t => (t.status === 'Vacated' || t.status === 'Evicted') && isInRange(t.leaseEnd)).length;
        
        // Occupancy Rate for selected branch
        const branchProperties = branch === 'All Branches' ? properties : properties.filter(p => p.branch === branch);
        const totalUnits = branchProperties.reduce((acc, p) => acc + p.units.length, 0);
        const occupiedUnits = branchProperties.reduce((acc, p) => acc + p.units.filter(u => u.status === 'Occupied').length, 0);
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

        return [
            { title: 'Total Tenants', value: totalTenants, change: newTenants > 0 ? `+${newTenants}` : '0', changeType: 'increase', period: 'new in range', link: '#/reports/tenancy-reports' },
            { title: 'Occupancy Rate', value: `${occupancyRate}%`, change: 'Stable', changeType: 'neutral', period: branch === 'All Branches' ? 'portfolio wide' : 'branch specific', link: '#/reports/property-reports?tab=vacancies' },
            { title: 'New Sign-ups', value: newTenants, change: 'Growth', changeType: 'increase', period: 'in selection', link: '#/tenants/applications' },
            { title: 'Leases Ended', value: churned, change: totalTenants > 0 ? `${((churned/totalTenants)*100).toFixed(1)}%` : '0%', changeType: 'decrease', period: 'churn rate', link: '#/tenants/offboarding' },
        ];
    }, [tenants, properties, dateRange, branch]);

    // 2. Financial Performance
    const financialStats = useMemo(() => {
        let revenue = 0;
        let arrears = 0;
        let countPayments = 0;

        tenants.forEach(t => {
            // Only process tenants in the selected branch
            if (isInBranch(t.propertyId)) {
                // Revenue: Sum of payments in range
                t.paymentHistory.forEach(p => {
                    if (isInRange(p.date)) {
                        revenue += parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0;
                        countPayments++;
                    }
                });

                // Arrears (Snapshot of current state)
                if (t.status === 'Overdue') {
                    arrears += t.rentAmount;
                }
            }
        });

        // Mock Expense Logic tailored to branch scale
        const expenseRatio = 0.15; // 15% of revenue
        const expenses = revenue * expenseRatio;

        return [
            { title: 'Revenue', value: `KES ${(revenue/1000).toFixed(1)}K`, change: `${countPayments} txns`, changeType: 'increase', period: 'volume', link: '#/reports/financial-reports?view=revenue' },
            { title: 'Expenses', value: `KES ${(expenses/1000).toFixed(1)}K`, change: 'Est.', changeType: 'decrease', period: 'vs prev period', link: '#/reports/financial-reports?view=expenses' },
            { title: 'Outstanding', value: `KES ${(arrears/1000).toFixed(1)}K`, change: 'Arrears', changeType: 'decrease', period: 'to collect', link: '#/reports/financial-reports?view=arrears' },
            { title: 'Net Profit', value: `KES ${((revenue - expenses)/1000).toFixed(1)}K`, change: 'Est.', changeType: 'neutral', period: 'margin', link: '#/reports/financial-reports?view=net' },
        ];
    }, [tenants, properties, dateRange, branch]);

    // 3. Operational Activity
    const operationalStats = useMemo(() => {
        // Filter Tasks by Branch (Match task.property name to property.name to check branch)
        const filteredTasks = tasks.filter(t => {
            // Task doesn't store propertyId directly, only property name in mock data.
            // We find the property by name to check its branch.
            const prop = properties.find(p => p.name === t.property);
            return branch === 'All Branches' || (prop && prop.branch === branch);
        });

        // Tasks created in range
        const tasksInRange = filteredTasks.filter(t => isInRange(t.dueDate)); // Using dueDate as proxy
        const completed = tasksInRange.filter(t => t.status === 'Completed' || t.status === 'Closed').length;
        const open = filteredTasks.filter(t => t.status !== 'Completed' && t.status !== 'Closed').length; // Snapshot of all open
        
        const spend = tasksInRange.reduce((acc, t) => acc + (t.costs?.labor || 0) + (t.costs?.materials || 0), 0);

        return [
            { title: 'Active Tasks', value: open, change: 'Pending', changeType: 'neutral', period: 'require action', link: '#/general-operations/task-management' },
            { title: 'Completed', value: completed, change: `${tasksInRange.length > 0 ? Math.round((completed/tasksInRange.length)*100) : 0}%`, changeType: 'increase', period: 'completion rate', link: '#/general-operations/reporting' },
            { title: 'Maint. Spend', value: `KES ${spend.toLocaleString()}`, change: 'Costs', changeType: 'decrease', period: 'in range', link: '#/maintenance/cost-tracking' },
            { title: 'Avg Resolution', value: '2.4 Days', change: '-10%', changeType: 'increase', period: 'faster', link: '#/general-operations/reporting' },
        ];
    }, [tasks, properties, dateRange, branch]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'dateRange') setDateRange(value);
        if (name === 'branch') setBranch(value);
    };

    const handleExport = (type: 'CSV' | 'PDF') => {
        const exportData = [
            ...membershipStats.map(s => ({ Category: 'Membership', ...s })),
            ...financialStats.map(s => ({ Category: 'Financial', ...s })),
            ...operationalStats.map(s => ({ Category: 'Operational', ...s }))
        ];

        if (type === 'CSV') {
            exportToCSV(exportData, `QuickStats_Report_${branch}`);
        } else {
            printSection('quick-stats-content', `Quick Stats Report - ${branch}`);
        }
    };

    const handleBack = () => {
        window.location.hash = '#/dashboard';
    };

    return (
        <div className="space-y-8 pb-8" id="quick-stats-content">
            <button type="button" onClick={handleBack} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors no-print">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Quick Stats & Analytics</h1>
                <p className="text-lg text-gray-500 mt-1">Real-time performance metrics based on live system data.</p>
            </div>

            {/* Filters */}
            <div className={`${MAJOR_CARD_CLASSES} p-4 flex flex-col sm:flex-row gap-4 items-center flex-wrap no-print`}>
                <div className="relative z-10 w-full flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Icon name="search" className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Filter View:</span>
                    </div>
                    
                    <select name="dateRange" value={dateRange} onChange={handleFilterChange} className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:ring-primary focus:border-primary font-medium text-gray-700">
                        <option>Today</option>
                        <option>This Week</option>
                        <option>Last Two Weeks</option>
                        <option>Last 30 Days</option>
                        <option>90 Days</option>
                        <option>This Year</option>
                    </select>

                    <select name="branch" value={branch} onChange={handleFilterChange} className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:ring-primary focus:border-primary font-medium text-gray-700">
                        <option>All Branches</option>
                        <option>Kericho Branch</option>
                        <option>Kisii Branch</option>
                    </select>

                    <div className="flex-grow"></div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleExport('CSV')} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm">CSV</button>
                        <button onClick={() => handleExport('PDF')} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark shadow-sm">PDF Report</button>
                    </div>
                </div>
            </div>
            
            {/* Membership Section */}
            <CollapsibleSection title="Membership & User Insights" defaultOpen reportUrl="#/reports/tenancy-reports">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {membershipStats.map((stat, i) => (
                        <KpiCard key={i} stat={stat as any} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${MAJOR_CARD_CLASSES} p-6`}>
                        <div className="relative z-10">
                            <h4 className="font-semibold mb-4 text-center text-gray-600">Tenant Growth Trend</h4>
                            <Chart type="bar" data={TENANT_GROWTH_CHART_DATA} />
                        </div>
                    </div>
                    <div className={`${MAJOR_CARD_CLASSES} p-6`}>
                        <div className="relative z-10">
                            <h4 className="font-semibold mb-4 text-center text-gray-600">Agent Performance</h4>
                            <Chart type="bar" data={AGENT_PERFORMANCE_CHART_DATA} />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
            
            {/* Financial Section */}
            <CollapsibleSection title="Financial Performance" defaultOpen reportUrl="#/reports/financial-reports">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {financialStats.map((stat, i) => (
                        <KpiCard key={i} stat={stat as any} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${MAJOR_CARD_CLASSES} p-6`}>
                        <div className="relative z-10">
                            <h4 className="font-semibold mb-4 text-center text-gray-600">Cash Flow (In vs Out)</h4>
                            <Chart type="line" data={CASH_FLOW_CHART_DATA} />
                        </div>
                    </div>
                    <div className={`${MAJOR_CARD_CLASSES} p-6`}>
                        <div className="relative z-10">
                            <h4 className="font-semibold mb-4 text-center text-gray-600">Payment Methods</h4>
                            <div className="flex items-center justify-center">
                                <div className="w-64">
                                    <Chart type="pie" data={PAYMENT_DISTRIBUTION_CHART_DATA} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Operations Section */}
            <CollapsibleSection title="Operational Activity" defaultOpen reportUrl="#/reports/task-operations-reports">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {operationalStats.map((stat, i) => (
                        <KpiCard key={i} stat={stat as any} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${MAJOR_CARD_CLASSES} p-6`}>
                        <div className="relative z-10">
                            <h4 className="font-semibold mb-4 text-center text-gray-600">Occupancy vs Vacancy</h4>
                            <Chart type="line" data={LEASE_VACANCY_CHART_DATA} />
                        </div>
                    </div>
                    <div className={`${MAJOR_CARD_CLASSES} p-6`}>
                        <div className="relative z-10">
                            <h4 className="font-semibold mb-4 text-center text-gray-600">Maintenance Categories</h4>
                            <Chart type="bar" data={MAINTENANCE_PERFORMANCE_CHART_DATA} options={{ scales: { x: { stacked: true }, y: { stacked: true } } }}/>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

        </div>
    );
};

export default QuickStats;
