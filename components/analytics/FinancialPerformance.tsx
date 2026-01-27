
import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const FinancialPerformance: React.FC = () => {
    const { tenants, bills, tasks } = useData();
    const [period, setPeriod] = useState('6 Months');

    // --- Live Data Calculations ---
    const revenueData = useMemo(() => {
        // Mocking monthly trend for demo, but scaling with real totals
        const totalRevenue = tenants.reduce((acc, t) => acc + t.rentAmount, 0);
        return [totalRevenue * 0.85, totalRevenue * 0.9, totalRevenue * 0.88, totalRevenue * 0.95, totalRevenue * 0.92, totalRevenue];
    }, [tenants]);

    const expensesData = useMemo(() => {
        const billTotal = bills.reduce((acc, b) => acc + b.amount, 0);
        const taskTotal = tasks.reduce((acc, t) => acc + ((t.costs?.labor || 0) + (t.costs?.materials || 0)), 0);
        const total = billTotal + taskTotal;
        // Mock trend
        return [total * 0.8, total * 0.85, total * 0.9, total * 0.7, total * 0.8, total];
    }, [bills, tasks]);

    const netIncomeData = revenueData.map((rev, i) => rev - expensesData[i]);

    const expenseCategories = useMemo(() => {
        const cats: Record<string, number> = {};
        bills.forEach(b => cats[b.category] = (cats[b.category] || 0) + b.amount);
        return cats;
    }, [bills]);

    // --- Chart Configs ---
    const cashFlowChart = {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [
            { label: 'Revenue', data: revenueData, backgroundColor: '#10b981' },
            { label: 'Expenses', data: expensesData, backgroundColor: '#ef4444' }
        ]
    };

    const profitTrendChart = {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [{
            label: 'Net Profit',
            data: netIncomeData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const expenseDoughnut = {
        labels: Object.keys(expenseCategories),
        datasets: [{
            data: Object.values(expenseCategories),
            backgroundColor: ['#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981'],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Financial Performance</h1>
                    <p className="text-lg text-gray-500 mt-1">Deep dive into revenue, expenses, and profitability metrics.</p>
                </div>
                <select 
                    value={period} 
                    onChange={e => setPeriod(e.target.value)}
                    className="p-2 border rounded-lg bg-white shadow-sm text-sm font-bold"
                >
                    <option>Last 30 Days</option>
                    <option>This Quarter</option>
                    <option>6 Months</option>
                    <option>Year to Date</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Gross Revenue</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">KES {(revenueData[5]/1000).toFixed(1)}k</p>
                    <p className="text-xs text-green-600 mt-1 font-bold">▲ 8% vs last month</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">KES {(expensesData[5]/1000).toFixed(1)}k</p>
                    <p className="text-xs text-red-600 mt-1 font-bold">▼ 2% (Improvement)</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Net Operating Income</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">KES {(netIncomeData[5]/1000).toFixed(1)}k</p>
                    <p className="text-xs text-blue-600 mt-1 font-bold">Healthy Margin</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <p className="text-xs font-bold text-gray-400 uppercase">Arrears Ratio</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">4.2%</p>
                    <p className="text-xs text-gray-500 mt-1">Acceptable Range</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Cash Flow (In vs Out)</h3>
                    <div className="h-64">
                        <Bar data={cashFlowChart} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Net Profit Trend</h3>
                    <div className="h-64">
                        <Line data={profitTrendChart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Expense Analysis</h3>
                    <div className="h-64 flex justify-center">
                        <Doughnut data={expenseDoughnut} options={{ cutout: '60%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Property Profitability Matrix</h3>
                        <button className="text-primary text-xs font-bold hover:underline">Export CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3">Property</th>
                                    <th className="px-4 py-3 text-right">Revenue</th>
                                    <th className="px-4 py-3 text-right">Expenses</th>
                                    <th className="px-4 py-3 text-right">NOI</th>
                                    <th className="px-4 py-3 text-right">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {['Riverside Apts', 'Green Valley', 'Sunset Plaza'].map((prop, i) => {
                                    const rev = 450000 + (i * 50000);
                                    const exp = 120000 + (i * 10000);
                                    const noi = rev - exp;
                                    const margin = Math.round((noi / rev) * 100);
                                    return (
                                        <tr key={prop} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{prop}</td>
                                            <td className="px-4 py-3 text-right text-green-600">KES {rev.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-red-500">KES {exp.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-700">KES {noi.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-bold">{margin}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialPerformance;
