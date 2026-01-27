
import React, { useRef, useEffect, useMemo } from 'react';
import { MOCK_WORK_ORDERS, MOCK_TASKS } from '../../../constants';
import Icon from '../../Icon';

const Chart: React.FC<{ type: 'bar' | 'doughnut'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
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

const CostTracking: React.FC = () => {
    const budget = 100000; // Mock Monthly Budget
    
    const costData = useMemo(() => {
        // Use Mock Tasks for richer data if MOCK_WORK_ORDERS is empty
        const source = MOCK_TASKS.length > 0 ? MOCK_TASKS : [];
        let total = 0;
        let labor = 0;
        let materials = 0;
        let travel = 0;

        source.forEach(t => {
            if (t.costs) {
                total += (t.costs.labor + t.costs.materials + t.costs.travel);
                labor += t.costs.labor;
                materials += t.costs.materials;
                travel += t.costs.travel;
            }
        });
        
        // If data is too low for demo visualization, pad it
        if (total === 0) {
            labor = 15000; materials = 25000; travel = 5000; total = 45000;
        }

        return { total, labor, materials, travel };
    }, []);

    const percentageSpent = Math.min(100, Math.round((costData.total / budget) * 100));

    const breakdownData = {
        labels: ['Labor', 'Materials', 'Logistics'],
        datasets: [{
            data: [costData.labor, costData.materials, costData.travel],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/field-operations/maintenance'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Maintenance
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Cost Tracking</h1>
                <p className="text-lg text-gray-500 mt-1">Real-time financial oversight for all maintenance activities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Total Budget (Mo)</p>
                    <h3 className="text-2xl font-extrabold text-gray-800 mt-2">KES {budget.toLocaleString()}</h3>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Total Spent</p>
                    <h3 className="text-2xl font-extrabold text-red-600 mt-2">KES {costData.total.toLocaleString()}</h3>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-500 text-xs font-bold uppercase">Remaining</p>
                    <h3 className="text-2xl font-extrabold text-green-600 mt-2">KES {(budget - costData.total).toLocaleString()}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Budget Utilization</h3>
                    <div className="mb-2 flex justify-between text-sm font-bold text-gray-600">
                        <span>Spent</span>
                        <span>{percentageSpent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden shadow-inner">
                        <div 
                            className={`h-full transition-all duration-1000 ${percentageSpent > 90 ? 'bg-red-500' : percentageSpent > 75 ? 'bg-orange-500' : 'bg-blue-600'}`} 
                            style={{ width: `${percentageSpent}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        {percentageSpent > 90 ? 'Critical: Budget nearly exhausted.' : 'Spending is within safe limits.'}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 w-full text-left">Cost Breakdown</h3>
                    <div className="w-64">
                         <Chart type="doughnut" data={breakdownData} height="h-64" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">High Cost Work Orders</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3">Task / Order</th>
                                <th className="px-4 py-3">Labor</th>
                                <th className="px-4 py-3">Materials</th>
                                <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_TASKS.filter(t => t.costs && (t.costs.labor + t.costs.materials) > 2000).slice(0, 5).map((t, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">{t.title}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.costs?.labor.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.costs?.materials.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                                        KES {((t.costs?.labor||0) + (t.costs?.materials||0) + (t.costs?.travel||0)).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {MOCK_TASKS.filter(t => t.costs && (t.costs.labor + t.costs.materials) > 2000).length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No high-cost items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CostTracking;
