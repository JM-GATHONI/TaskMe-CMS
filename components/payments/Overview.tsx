
import React, { useRef, useEffect, useMemo } from 'react';
import { PaymentKpi } from '../../types';
import { INCOME_EXPENSE_CHART_DATA, PAYMENT_METHODS_CHART_DATA } from '../../constants';
import { useData } from '../../context/DataContext';

// --- Card Styles ---
const MAJOR_CARD_CLASSES = "relative bg-white rounded-2xl border-t-[8px] border-t-primary border-b-[4px] border-b-secondary border-x-[3px] border-x-secondary shadow-[inset_0_0_60px_-15px_rgba(162,53,74,0.15)] hover:shadow-lg transition-all duration-300 overflow-hidden";

const KpiCard: React.FC<{ stat: PaymentKpi, href: string }> = ({ stat, href }) => (
    <a href={href} className={`${MAJOR_CARD_CLASSES} p-4 block`}>
        <div className="relative z-10">
            <p className="text-gray-500 font-medium text-sm">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-800 my-1">{stat.value}</p>
            <div className="flex items-center text-xs">
                <span className={`font-semibold ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.changeType === 'increase' ? '▲' : '▼'} {stat.change}
                </span>
                <span className="text-gray-400 ml-1">vs last month</span>
            </div>
        </div>
    </a>
);

const Chart: React.FC<{ type: 'line' | 'bar' | 'pie' | 'doughnut'; data: any; options?: any; }> = ({ type, data, options }) => {
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

    return <div className="relative h-80"><canvas ref={canvasRef}></canvas></div>;
};

const PaymentsOverview: React.FC = () => {
    const { tenants } = useData();

    // --- Live Calculations ---
    const kpis = useMemo(() => {
        let totalCollected = 0;
        let outstandingCount = 0;
        let overdueAmount = 0;

        // Calculate based on real tenant data
        tenants.forEach(t => {
            // 1. Collected (Sum of all paid history)
            const tenantPaid = t.paymentHistory.reduce((sum, p) => {
                const amount = parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0;
                return sum + amount;
            }, 0);
            totalCollected += tenantPaid;

            // 2. Outstanding / Overdue
            if (t.status === 'Overdue') {
                outstandingCount++;
                overdueAmount += t.rentAmount; 
            }
        });

        return [
            { title: 'Collected (Total)', value: `KES ${(totalCollected / 1000000).toFixed(2)}M`, change: '12%', changeType: 'increase' },
            { title: 'Outstanding Invoices', value: outstandingCount.toString(), change: '5%', changeType: 'decrease' },
            { title: 'Overdue Amount', value: `KES ${Number(overdueAmount ?? 0).toLocaleString()}`, change: '2%', changeType: 'increase' },
            { title: 'Total Expenses (MTD)', value: 'KES 1.8M', change: '8%', changeType: 'decrease' } 
        ];
    }, [tenants]);

    const recentTransactions = useMemo(() => {
        // Flatten all tenant payment histories into one list
        const allPayments = tenants.flatMap(t => 
            t.paymentHistory.map(p => ({
                id: `${t.id}-${p.reference}`,
                date: p.date,
                tenantName: t.name,
                amount: parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0,
                method: p.method,
                status: p.status,
                reference: p.reference
            }))
        );
        
        return allPayments.slice(0, 10); // Top 10
    }, [tenants]);

    const kpiLinks: Record<string, string> = {
        'Collected (Total)': '#/payments/inbound',
        'Outstanding Invoices': '#/payments/invoices',
        'Overdue Amount': '#/payments/invoices',
        'Total Expenses (MTD)': '#/payments/outbound'
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Payments Overview</h1>
                <p className="text-lg text-gray-500 mt-1">A real-time snapshot of your organization's financial health.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((stat: any) => <KpiCard key={stat.title} stat={stat} href={kpiLinks[stat.title] || '#/payments/overview'} />)}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className={`lg:col-span-3 ${MAJOR_CARD_CLASSES} p-6`}>
                    <div className="relative z-10">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs. Expenses (Last 6 Months)</h3>
                        <Chart type="line" data={INCOME_EXPENSE_CHART_DATA} />
                    </div>
                </div>
                <div className={`lg:col-span-2 ${MAJOR_CARD_CLASSES} p-6`}>
                    <div className="relative z-10">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
                        <Chart type="doughnut" data={PAYMENT_METHODS_CHART_DATA} />
                    </div>
                </div>
            </div>

             {/* Recent Transactions */}
            <div className={`${MAJOR_CARD_CLASSES} p-6`}>
                <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Inbound Transactions</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (KES)</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {recentTransactions.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{log.date}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{log.tenantName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-semibold">{Number(log.amount ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{log.method}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{log.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentsOverview;
