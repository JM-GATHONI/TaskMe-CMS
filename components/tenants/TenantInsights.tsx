
import React, { useMemo, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { getRentDueDay, getRentGraceDays } from '../../utils/rentSchedule';

const Chart: React.FC<{ type: 'bar' | 'doughnut' | 'line'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
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
                    plugins: { 
                        legend: { 
                            position: 'bottom',
                            labels: { usePointStyle: true, boxWidth: 8 }
                        } 
                    },
                    ...options
                },
            });
        }
        return () => chartRef.current?.destroy();
    }, [type, data, options]);

    return <div className={`relative ${height}`}><canvas ref={canvasRef}></canvas></div>;
};

const InsightMetricCard: React.FC<{ title: string; value: string; change: string; isPositive: boolean; icon: string; color: string }> = ({ title, value, change, isPositive, icon, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
            </div>
            <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                <Icon name={icon} className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
        <div className="mt-3 flex items-center text-xs font-medium">
            <span className={`${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {isPositive ? '▲' : '▼'} {change}
            </span>
            <span className="text-gray-400 ml-1">vs last month</span>
        </div>
    </div>
);

const TenantInsights: React.FC = () => {
    const { tenants, properties, tasks } = useData();

    // --- Data Calculations ---

    // 1. Occupancy & Unit Preference
    const unitTypeData = useMemo(() => {
        const typeCounts: Record<string, number> = {};
        tenants.forEach(t => {
            // Derive type from unit number or mock it if specific type field missing in tenant
            // Using a simplified heuristic: "1BR", "2BR" etc. based on properties context
            const unitProp = properties.find(p => p.id === t.propertyId)?.units.find(u => u.id === t.unitId);
            const type = unitProp ? (unitProp.unitType || (unitProp.bedrooms > 0 ? `${unitProp.bedrooms} Bedroom` : 'Studio')) : 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        return typeCounts;
    }, [tenants, properties]);

    // 2. Lease Expiry Forecast (Next 6 Months)
    const expiryForecast = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const counts = new Array(6).fill(0);
        const now = new Date();
        
        tenants.forEach(t => {
            if (t.leaseEnd) {
                const date = new Date(t.leaseEnd);
                const diffMonth = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
                if (diffMonth >= 0 && diffMonth < 6) {
                    counts[diffMonth]++;
                }
            }
        });
        
        // Generate labels dynamically starting from current month
        const labels = counts.map((_, i) => {
            const d = new Date();
            d.setMonth(now.getMonth() + i);
            return d.toLocaleString('default', { month: 'short' });
        });

        return { labels, counts };
    }, [tenants]);

    // 3. Risk Analysis
    const atRiskTenants = useMemo(() => {
        return tenants.filter(t => 
            t.status === 'Overdue' || 
            t.status === 'Notice' || 
            (t.leaseEnd && new Date(t.leaseEnd) < new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000))
        ).map(t => ({
            id: t.id,
            name: t.name,
            unit: t.unit,
            riskFactor: t.status === 'Overdue' ? 'Arrears' : t.status === 'Notice' ? 'Moving Out' : 'Expiring Lease',
            amount: t.status === 'Overdue' ? t.rentAmount : 0
        }));
    }, [tenants]);

    // 4. Metrics (derived from live tenant + payment data)
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);

    const paymentCompliance = useMemo(() => {
        const pool = tenants.filter(t => ['Active', 'Notice', 'Overdue'].includes(t.status));
        if (pool.length === 0) return 0;

        const compliant = pool.filter(t => {
            const dueDay = getRentDueDay(t);
            const graceDays = getRentGraceDays(t);
            const lateStartDay = dueDay + graceDays;

            const paidThisMonth = (t.paymentHistory || [])
                .filter(p => p.date.startsWith(currentMonthPrefix) && p.status === 'Paid')
                // Use the earliest paid entry for "habit" classification this month.
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (!paidThisMonth.length) return false;
            const payDate = new Date(paidThisMonth[0].date);
            const payDom = payDate.getDate();
            return payDom <= lateStartDay;
        }).length;

        return Math.round((compliant / pool.length) * 100);
    }, [tenants, currentMonthPrefix]);

    const retentionRate = useMemo(() => {
        const longTenants = tenants.filter(t => {
            if (!t.onboardingDate) return false;
            const ageDays = (Date.now() - new Date(t.onboardingDate).getTime()) / 86400000;
            return ageDays >= 365;
        });
        if (longTenants.length === 0) return 100;
        const stillThere = longTenants.filter(t =>
            ['Active', 'Notice', 'Overdue'].includes(t.status),
        ).length;
        return Math.round((stillThere / longTenants.length) * 100);
    }, [tenants]);

    const avgTenancy = useMemo(() => {
        const active = tenants.filter(
            t => t.onboardingDate && ['Active', 'Notice', 'Overdue'].includes(t.status),
        );
        if (active.length === 0) return '—';
        let totalYears = 0;
        for (const t of active) {
            const start = new Date(t.onboardingDate!).getTime();
            totalYears += (Date.now() - start) / (365.25 * 86400000);
        }
        return `${(totalYears / active.length).toFixed(1)} Yrs`;
    }, [tenants]);

    const maintSatisfaction = useMemo(() => {
        let resolved = 0;
        let total = 0;
        for (const t of tenants) {
            for (const r of t.requests || []) {
                total++;
                if (r.status === 'Converted to Task' || r.status === 'Approved') resolved++;
            }
        }
        if (total === 0) return { scoreLabel: '—', subLabel: 'No request data' };
        const ratio = resolved / total;
        const outOf5 = Math.min(5, Math.max(0, ratio * 5));
        return { scoreLabel: `${outOf5.toFixed(1)}/5.0`, subLabel: `${Math.round(ratio * 100)}% closed` };
    }, [tenants]);

    // --- Chart Configurations ---

    const expiryChartData = {
        labels: expiryForecast.labels,
        datasets: [{
            label: 'Leases Expiring',
            data: expiryForecast.counts,
            backgroundColor: '#F39C2A',
            borderRadius: 4,
            barThickness: 20
        }]
    };

    const unitPreferenceChartData = {
        labels: Object.keys(unitTypeData),
        datasets: [{
            data: Object.values(unitTypeData),
            backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    };

    const paymentBehaviorChartData = useMemo(() => {
        const labels = ['On-Time', 'Late (<7 Days)', 'Late (>7 Days)', 'Default'];
        let onTime = 0;
        let lateShort = 0;
        let lateLong = 0;
        let def = 0;
        const billable = tenants.filter(t => ['Active', 'Notice', 'Overdue'].includes(t.status));

        for (const t of billable) {
            const dueDay = getRentDueDay(t);
            const graceDays = getRentGraceDays(t);
            const lateStartDay = dueDay + graceDays;

            const paidThisMonth = (t.paymentHistory || [])
                .filter(p => p.date.startsWith(currentMonthPrefix) && p.status === 'Paid')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const todayDom = new Date().getDate();

            // No paid entry this month: classify by how far we are into late window.
            if (!paidThisMonth.length) {
                if (t.status === 'Overdue' && todayDom > lateStartDay) {
                    def++;
                    continue;
                }

                const daysLatePotential = todayDom - lateStartDay;
                if (daysLatePotential <= 0) onTime++;
                else if (daysLatePotential <= 7) lateShort++;
                else lateLong++;
                continue;
            }

            // Paid entry exists: classify based on when the rent was actually paid this month.
            const payDom = new Date(paidThisMonth[0].date).getDate();
            const daysLateActual = payDom - lateStartDay;

            if (daysLateActual <= 0) onTime++;
            else if (daysLateActual <= 7) lateShort++;
            else lateLong++;
        }

        const sum = onTime + lateShort + lateLong + def || 1;
        const pct = (n: number) => Math.round((n / sum) * 100);
        return {
            labels,
            datasets: [
                {
                    data: [pct(onTime), pct(lateShort), pct(lateLong), pct(def)],
                    backgroundColor: ['#10b981', '#facc15', '#f97316', '#ef4444'],
                    borderWidth: 0,
                },
            ],
        };
    }, [tenants, currentMonthPrefix]);

    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/tenants/overview'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Overview
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Tenant Insights</h1>
                <p className="text-lg text-gray-500 mt-1">Deep analytics on tenant behavior, lease health, and retention.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InsightMetricCard title="Retention Rate" value={`${retentionRate}%`} change="Live data" isPositive={true} icon="check" color="#10b981" />
                <InsightMetricCard title="Avg. Tenancy" value={avgTenancy} change="Live data" isPositive={true} icon="leases" color="#3b82f6" />
                <InsightMetricCard title="Payment Compliance" value={`${paymentCompliance}%`} change="This month" isPositive={paymentCompliance >= 50} icon="payments" color="#f59e0b" />
                <InsightMetricCard title="Maint. Satisfaction" value={maintSatisfaction.scoreLabel} change={maintSatisfaction.subLabel} isPositive={true} icon="maintenance" color="#8b5cf6" />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lease Expiry Forecast */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Lease Expiry Forecast</h3>
                        <button className="text-sm text-primary hover:underline font-medium" onClick={() => window.location.hash = '#/general-operations/leases/renewals'}>View Renewals</button>
                    </div>
                    <Chart type="bar" data={expiryChartData} height="h-72" />
                </div>

                {/* Unit Type Preference */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Unit Type Demand</h3>
                    <div className="flex items-center justify-center h-64">
                        <Chart type="doughnut" data={unitPreferenceChartData} options={{ cutout: '70%' }} height="h-56" />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-4">Distribution of occupied units by type.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Behavior */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Habits</h3>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2">
                            <Chart type="doughnut" data={paymentBehaviorChartData} options={{ cutout: '60%', plugins: { legend: { display: false } } }} height="h-48" />
                        </div>
                        <div className="w-full md:w-1/2 space-y-3">
                            {paymentBehaviorChartData.labels.map((label, i) => (
                                <div key={label} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: paymentBehaviorChartData.datasets[0].backgroundColor[i] }}></span>
                                        <span className="text-sm text-gray-600">{label}</span>
                                    </div>
                                    <span className="font-bold text-gray-800">{paymentBehaviorChartData.datasets[0].data[i]}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* At Risk List */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">At-Risk Tenants</h3>
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{atRiskTenants.length} Flagged</span>
                    </div>
                    <div className="overflow-y-auto max-h-64 pr-2">
                        {atRiskTenants.length > 0 ? (
                            <ul className="space-y-2">
                                {atRiskTenants.map(t => (
                                    <li key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => window.location.hash = `#/tenants/active-tenants?tenantId=${t.id}`}>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{t.name}</p>
                                            <p className="text-xs text-gray-500">{t.unit}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                                t.riskFactor === 'Arrears' ? 'bg-red-50 text-red-700 border-red-200' : 
                                                t.riskFactor === 'Moving Out' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {t.riskFactor}
                                            </span>
                                            {t.amount > 0 && <p className="text-xs text-red-600 font-semibold mt-1">KES {t.amount.toLocaleString()}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8">No tenants currently flagged as high risk.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantInsights;
