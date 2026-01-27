
import React, { useState } from 'react';
import { MOCK_PNL_STATEMENT, MOCK_BALANCE_SHEET, MOCK_CASH_FLOW } from '../../constants';
import { printSection } from '../../utils/exportHelper';
import Icon from '../Icon';

const FinancialStatements: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pnl' | 'balance' | 'cashflow'>('pnl');
    const [viewMode, setViewMode] = useState<'Annual' | 'Quarterly' | 'Monthly'>('Monthly');

    const handleDownload = () => {
        printSection('printable-financial-statements', `Financial Statement - ${activeTab.toUpperCase()}`);
    };

    const PnLView = () => (
        <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900">KES {MOCK_PNL_STATEMENT.revenue.value.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase">Net Profit</p>
                    <p className="text-xl font-bold text-green-600">KES {MOCK_PNL_STATEMENT.netProfit.value.toLocaleString()}</p>
                </div>
             </div>

             <div className="border rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">Line Item</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-right">% of Rev</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                         <tr>
                            <td className="px-4 py-3 font-bold text-gray-800">Revenue</td>
                            <td className="px-4 py-3 text-right font-bold">KES {MOCK_PNL_STATEMENT.revenue.value.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">100%</td>
                        </tr>
                        <tr className="bg-red-50/30">
                            <td className="px-4 py-3 pl-8 text-gray-600">Cost of Sales</td>
                            <td className="px-4 py-3 text-right text-red-600">(KES {MOCK_PNL_STATEMENT.cogs.value.toLocaleString()})</td>
                            <td className="px-4 py-3 text-right text-gray-500">26%</td>
                        </tr>
                        <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-3 text-gray-800">Gross Profit</td>
                            <td className="px-4 py-3 text-right">KES {MOCK_PNL_STATEMENT.grossProfit.value.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">74%</td>
                        </tr>
                        <tr className="bg-red-50/30">
                             <td className="px-4 py-3 pl-8 text-gray-600">Operating Expenses</td>
                             <td className="px-4 py-3 text-right text-red-600">(KES {MOCK_PNL_STATEMENT.expenses.value.toLocaleString()})</td>
                             <td className="px-4 py-3 text-right text-gray-500">18%</td>
                        </tr>
                        <tr className="bg-green-50 border-t-2 border-green-200">
                             <td className="px-4 py-4 font-extrabold text-green-900 text-base">Net Profit</td>
                             <td className="px-4 py-4 text-right font-extrabold text-green-700 text-base">KES {MOCK_PNL_STATEMENT.netProfit.value.toLocaleString()}</td>
                             <td className="px-4 py-4 text-right font-bold text-green-700">56%</td>
                        </tr>
                    </tbody>
                </table>
             </div>
        </div>
    );

    const BalanceSheetView = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="border rounded-xl p-6 bg-white shadow-sm">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Assets</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Assets (Cash)</span>
                        <span className="font-medium">KES {MOCK_BALANCE_SHEET.assets.cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Accounts Receivable</span>
                        <span className="font-medium">KES 0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Deposits Held (Restricted)</span>
                        <span className="font-medium">KES {MOCK_BALANCE_SHEET.assets.depositsHeld.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-extrabold pt-4 border-t mt-2 text-lg text-blue-900">
                        <span>Total Assets</span>
                        <span>KES {MOCK_BALANCE_SHEET.assets.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div className="border rounded-xl p-6 bg-white shadow-sm">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Liabilities & Equity</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payouts Payable</span>
                        <span className="font-medium">KES {MOCK_BALANCE_SHEET.liabilities.payoutsDue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Unearned Revenue</span>
                        <span className="font-medium">KES {MOCK_BALANCE_SHEET.liabilities.unearnedFees.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-extrabold pt-4 border-t mt-2 text-lg text-gray-800">
                        <span>Total Liabilities</span>
                        <span>KES {MOCK_BALANCE_SHEET.liabilities.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>
         </div>
    );

    const CashFlowView = () => (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                 <h3 className="font-bold text-gray-700 mb-4">Cash Flow Summary</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-600 font-medium">Operating Activities</span>
                        <span className="font-bold text-green-600">+ KES {MOCK_CASH_FLOW.operating.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-600 font-medium">Investing Activities</span>
                        <span className="font-bold text-red-600">KES {MOCK_CASH_FLOW.investing.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-600 font-medium">Financing Activities</span>
                        <span className="font-bold text-red-600">KES {MOCK_CASH_FLOW.financing.toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="mt-6 pt-4 border-t flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Net Change in Cash</span>
                    <span className="text-2xl font-extrabold text-blue-600">KES {MOCK_CASH_FLOW.netChange.toLocaleString()}</span>
                 </div>
             </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Financial Statements</h1>
                    <p className="text-lg text-gray-500 mt-1">GAAP compliant reports for stakeholders.</p>
                </div>
                <div className="flex gap-3">
                     <select value={viewMode} onChange={e => setViewMode(e.target.value as any)} className="px-3 py-2 bg-white border rounded-lg text-sm font-bold shadow-sm">
                        <option>Monthly</option>
                        <option>Quarterly</option>
                        <option>Annual</option>
                     </select>
                    <button onClick={handleDownload} className="px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black shadow-md flex items-center transition-colors">
                        <Icon name="download" className="w-4 h-4 mr-2" /> PDF Export
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100" id="printable-financial-statements">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
                    <h2 className="text-2xl font-extrabold text-gray-800 uppercase tracking-tight">
                        {activeTab === 'pnl' ? 'Profit & Loss' : activeTab === 'balance' ? 'Balance Sheet' : 'Cash Flow Statement'}
                    </h2>
                    
                    <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0 no-print">
                        <button onClick={() => setActiveTab('pnl')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'pnl' ? 'bg-white text-primary shadow' : 'text-gray-500'}`}>P&L</button>
                        <button onClick={() => setActiveTab('balance')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'balance' ? 'bg-white text-primary shadow' : 'text-gray-500'}`}>Balance Sheet</button>
                        <button onClick={() => setActiveTab('cashflow')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'cashflow' ? 'bg-white text-primary shadow' : 'text-gray-500'}`}>Cash Flow</button>
                    </div>
                </div>

                {activeTab === 'pnl' && <PnLView />}
                {activeTab === 'balance' && <BalanceSheetView />}
                {activeTab === 'cashflow' && <CashFlowView />}
                
                <div className="mt-12 text-center text-xs text-gray-400 pt-8 border-t">
                    <p>Generated by TaskMe Realty System. All figures in KES.</p>
                </div>
            </div>
        </div>
    );
};

export default FinancialStatements;
