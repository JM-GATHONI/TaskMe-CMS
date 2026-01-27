import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Property, Unit, User, Task, Bill, Fund, Investment, TenantProfile } from '../../types';
import Icon from '../Icon';
import { exportToCSV, printSection } from '../../utils/exportHelper';

// --- HELPER COMPONENTS (Ported from ActiveLandlords) ---

const Chart: React.FC<{ type: 'line' | 'bar'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
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

const MetricCard: React.FC<{ title: string; value: string; subtext?: string; color: 'blue' | 'green' | 'red' | 'orange' | 'indigo' }> = ({ title, value, subtext, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[color]} flex flex-col justify-between h-full transition-transform hover:-translate-y-1 shadow-sm`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</p>
            <div>
                <p className="text-2xl font-extrabold mt-1">{value}</p>
                {subtext && <p className="text-xs mt-1 opacity-80">{subtext}</p>}
            </div>
        </div>
    );
};

const UnitBox: React.FC<{ unit: Unit; tenant?: TenantProfile; isNewTenant?: boolean }> = ({ unit, tenant, isNewTenant }) => {
    const statusColor = useMemo(() => {
        if (unit.status === 'Vacant') return 'bg-red-50 border-red-200 text-red-800';
        if (unit.status === 'Under Maintenance') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        if (tenant?.status === 'Notice') return 'bg-orange-50 border-orange-200 text-orange-800';
        if (tenant?.status === 'Overdue') return 'bg-red-50 border-red-200 text-red-900';
        return 'bg-green-50 border-green-200 text-green-800';
    }, [unit.status, tenant]);

    return (
        <div className={`p-3 rounded-lg border ${statusColor} flex flex-col justify-between h-28 text-xs relative group cursor-pointer transition-all hover:shadow-md overflow-hidden`} onClick={() => tenant ? window.location.hash = `#/tenants/active-tenants?tenantId=${tenant.id}` : null}>
            <div className="flex justify-between items-start">
                <span className="font-bold text-lg">{unit.unitNumber}</span>
                <span className="opacity-70 bg-white/50 px-1.5 py-0.5 rounded">{unit.bedrooms}BR</span>
            </div>
           
            <div className="mt-1">
                {tenant ? (
                    <>
                        <p className="font-semibold truncate text-sm" title={tenant.name}>{tenant.name}</p>
                        {isNewTenant && (
                            <div className="inline-block bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded mt-1 font-bold uppercase shadow-sm">
                                New
                            </div>
                        )}
                    </>
                ) : (
                    <span className="italic opacity-60 text-sm">{unit.status}</span>
                )}
            </div>

            <div className="mt-auto pt-2 border-t border-black/5 flex justify-between items-center">
                <span className="opacity-80 font-mono">{unit.rent ? `KES ${unit.rent.toLocaleString()}` : '-'}</span>
                {tenant?.leaseEnd && (
                    <span className="text-[9px] opacity-70">
                        End: {new Date(tenant.leaseEnd).toLocaleDateString(undefined, {month:'short', year:'2-digit'})}
                    </span>
                )}
            </div>

            {tenant?.status === 'Notice' && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    VACATING
                </div>
            )}
             {tenant?.status === 'Overdue' && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    ARREARS
                </div>
            )}
        </div>
    );
};

// --- MODALS ---

const IncomeStatementModal: React.FC<{ 
    data: any; 
    period: string;
    landlord: User;
    onClose: () => void; 
}> = ({ data, period, landlord, onClose }) => {
    
    const handlePrint = () => {
        printSection('printable-income-statement', `Income Statement - ${landlord.name} - ${period}`);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[1400] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] animate-fade-in">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-800">Statement View</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="p-8 overflow-y-auto flex-grow bg-white" id="printable-income-statement">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">TR</div>
                            <div>
                                <h1 className="text-2xl font-bold text-primary uppercase tracking-tight">TaskMe Realty</h1>
                                <p className="text-xs text-gray-500 font-medium">Property Management Systems</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Income Statement</h2>
                            <p className="text-sm text-gray-600">Period: <strong>{period}</strong></p>
                        </div>
                    </div>

                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Landlord</p>
                        <h3 className="text-lg font-bold text-gray-900">{landlord.name}</h3>
                        <p className="text-sm text-gray-600">{landlord.email} | {landlord.phone}</p>
                    </div>

                    {/* Financial Table */}
                    <table className="w-full text-sm mb-6">
                        <thead>
                            <tr className="border-b-2 border-gray-800">
                                <th className="text-left py-2 font-bold text-gray-700 uppercase text-xs">Description</th>
                                <th className="text-left py-2 font-bold text-gray-700 uppercase text-xs">Category</th>
                                <th className="text-right py-2 font-bold text-gray-700 uppercase text-xs">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="py-3 font-bold text-gray-800" colSpan={2}>Gross Rental Revenue</td>
                                <td className="py-3 text-right font-bold text-gray-800">KES {data.grossRevenueMonth.toLocaleString()}</td>
                            </tr>

                            {/* Deductions Breakdown */}
                            {data.detailedDeductions.length > 0 && (
                                <tr className="bg-red-50">
                                    <td colSpan={3} className="py-2 pl-2 text-xs font-bold text-red-800 uppercase tracking-wider">Less: Deductions</td>
                                </tr>
                            )}

                            {data.detailedDeductions.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-2 pl-4 text-gray-600">{item.description}</td>
                                    <td className="py-2 text-gray-500 text-xs">{item.category}</td>
                                    <td className="py-2 text-right text-red-600">- KES {item.amount.toLocaleString()}</td>
                                </tr>
                            ))}

                            <tr className="border-t-2 border-gray-200">
                                <td className="py-3 font-bold text-gray-700" colSpan={2}>Total Deductions</td>
                                <td className="py-3 text-right font-bold text-red-700">- KES {data.monthlyDeductions.toLocaleString()}</td>
                            </tr>

                            <tr className="bg-gray-100 font-extrabold border-t-2 border-gray-800 text-lg">
                                <td className="py-4 pl-4 uppercase text-gray-900" colSpan={2}>Net Income (Payout)</td>
                                <td className="py-4 text-right pr-4 text-green-700">KES {data.netIncome.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-12 text-xs text-gray-400 text-center border-t pt-4">
                        <p>Generated on {new Date().toLocaleDateString()}</p>
                        <p>This is a computer generated document and does not require a signature.</p>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300">Close</button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-primary text-white rounded-md font-medium flex items-center hover:bg-primary-dark shadow-sm">
                        <Icon name="download" className="w-4 h-4 mr-2" /> Print / PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

const NewRequestModal: React.FC<{ 
    type: 'General' | 'Maintenance' | 'Eviction';
    landlord: User;
    onClose: () => void;
    onSubmit: (req: any) => void;
}> = ({ type, landlord, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [property, setProperty] = useState('');

    const handleSubmit = () => {
        onSubmit({ title, description: desc, property, type });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[1400] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{type} Request</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input placeholder="Subject" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                        <input placeholder="Property Name (Optional)" value={property} onChange={e => setProperty(e.target.value)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                        <textarea placeholder="Describe the request..." value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary/50 outline-none"/>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark shadow-sm">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LandlordInvestModal: React.FC<{ 
    fund: Fund; 
    landlordName: string;
    onClose: () => void; 
    onConfirm: (amount: number) => void;
}> = ({ fund, landlordName, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState<'input' | 'success'>('input');

    const handleInvest = () => {
        if (!amount || parseFloat(amount) <= 0) return alert("Enter a valid amount");
        // Simulate processing
        setTimeout(() => {
            setStep('success');
        }, 1000);
    };

    const handleFinish = () => {
        onConfirm(parseFloat(amount));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[1500] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Invest in {fund.name}</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>

                {step === 'input' ? (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                            <p><strong>Investor:</strong> {landlordName}</p>
                            <p><strong>Target APY:</strong> {fund.targetApy}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                className="w-full p-3 border rounded-lg font-bold"
                                placeholder="50,000"
                            />
                        </div>
                        <div className="text-xs text-gray-500">
                            Funds will be deducted from your pending payout or payable via M-Pesa.
                        </div>
                        <button onClick={handleInvest} className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark">
                            Confirm Investment
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="check" className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Investment Successful!</h3>
                        <p className="text-gray-600 mt-2">You have invested KES {parseFloat(amount).toLocaleString()}.</p>
                        <button onClick={handleFinish} className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg">
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const LandlordsPortal: React.FC = () => {
    const { landlords, properties, tenants, tasks, deductionRules, bills, funds, addInvestment, rfTransactions, investments } = useData();
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'financials' | 'requests' | 'growth'>('dashboard');
    const [financialPeriod, setFinancialPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    
    // Modals
    const [isStatementOpen, setIsStatementOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestType, setRequestType] = useState<'General' | 'Maintenance' | 'Eviction'>('General');
    const [selectedInvestFund, setSelectedInvestFund] = useState<Fund | null>(null);

    // Multi-Select Properties State
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

    // 1. Identify Current Landlord (Simulation)
    const currentLandlord = useMemo(() => {
        return landlords.find(l => l.name === 'Peter Owner') || landlords[0];
    }, [landlords]);

    // 2. Filter Data Context
    const allLandlordProperties = useMemo(() => properties.filter(p => p.landlordId === currentLandlord?.id), [properties, currentLandlord]);
    
    const myProperties = useMemo(() => {
        if (selectedPropertyIds.length === 0) return allLandlordProperties;
        return allLandlordProperties.filter(p => selectedPropertyIds.includes(p.id));
    }, [allLandlordProperties, selectedPropertyIds]);

    const myTenants = useMemo(() => tenants.filter(t => myProperties.some(p => p.id === t.propertyId)), [tenants, myProperties]);
    const myTasks = useMemo(() => tasks.filter(t => myProperties.some(p => p.name === t.property)), [tasks, myProperties]);

    // 3. Invest & Earn Data
    const referralEarnings = useMemo(() => {
        return rfTransactions.filter(tx => 
            tx.type === 'Referral Commission' && 
            tx.partyName === currentLandlord?.name
        ).reduce((sum, tx) => sum + tx.amount, 0);
    }, [rfTransactions, currentLandlord]);

    const myActiveInvestments = useMemo(() => {
        // Mock matching investments by investor name usually, but for demo we filter by hardcoded ID or assume link
        // Here assuming we fetch by landlord ID match in a real backend, or simulating via name
        return investments.filter(inv => inv.status === 'Active' /* && inv.investorId === currentLandlord.id */);
    }, [investments]);

    const activeInvestmentTotal = myActiveInvestments.reduce((sum, inv) => sum + inv.amount, 0);

    const commissionHistory = useMemo(() => {
        return rfTransactions.filter(tx => tx.type === 'Referral Commission' && tx.partyName === currentLandlord?.name);
    }, [rfTransactions, currentLandlord]);


    // 3. Calculate Financials (Same logic as ActiveLandlords)
    const financials = useMemo(() => {
        const grossRevenueMonth = myTenants.reduce((sum, t) => sum + (t.status !== 'Overdue' ? (t.rentAmount || 0) : 0), 0);
        const allTimeRevenue = grossRevenueMonth * 12; // Mock projection
        const unpaidRevenue = myTenants.reduce((sum, t) => sum + (t.status === 'Overdue' ? (t.rentAmount || 0) : 0), 0);
       
        const detailedDeductions: Array<{ category: string; description: string; amount: number }> = [];

        // Placement Fees
        const newTenants = myTenants.filter(t => t.onboardingDate.startsWith(financialPeriod));
        const placementFeeDeduction = newTenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0);
        if (placementFeeDeduction > 0) {
             newTenants.forEach(t => detailedDeductions.push({ category: 'Placement Fees', description: `Placement Fee: ${t.name}`, amount: t.rentAmount || 0 }));
        }

        // Rule Deductions
        let ruleDeductionsTotal = 0;
        deductionRules.filter(r => 
            r.status === 'Active' &&
            (r.applicability === 'Global' || (r.applicability === 'Specific Landlord' && r.targetId === currentLandlord?.id) || (r.applicability === 'Specific Property' && myProperties.some(p => p.id === r.targetId)))
        ).forEach(r => {
            let amount = r.type === 'Fixed' ? r.value : (grossRevenueMonth * (r.value / 100));
            ruleDeductionsTotal += amount;
            detailedDeductions.push({ category: 'Management & Rules', description: r.name, amount });
        });

        // Bills
        const periodBills = bills.filter(b => myProperties.some(p => p.id === b.propertyId) && b.invoiceDate.startsWith(financialPeriod));
        const billDeductionsTotal = periodBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        periodBills.forEach(b => detailedDeductions.push({ category: 'Bills & Utilities', description: `${b.category} - ${b.vendor}`, amount: Number(b.amount) || 0 }));

        // Maintenance
        const periodTasks = myTasks.filter(t => (t.status === 'Completed' || t.status === 'Closed') && t.dueDate.startsWith(financialPeriod));
        const maintenanceDeductionsTotal = periodTasks.reduce((sum, t) => sum + ((t.costs?.labor || 0) + (t.costs?.materials || 0) + (t.costs?.travel || 0)), 0);
        periodTasks.forEach(t => {
            const cost = (t.costs?.labor || 0) + (t.costs?.materials || 0) + (t.costs?.travel || 0);
            if (cost > 0) detailedDeductions.push({ category: 'Maintenance', description: `Maint: ${t.title} (${t.property})`, amount: cost });
        });

        const totalDeductions = ruleDeductionsTotal + billDeductionsTotal + maintenanceDeductionsTotal + placementFeeDeduction;
       
        return { grossRevenueMonth, unpaidRevenue, monthlyDeductions: totalDeductions, netIncome: grossRevenueMonth - totalDeductions, detailedDeductions };
    }, [myTenants, myProperties, deductionRules, bills, myTasks, financialPeriod, currentLandlord]);

    // Occupancy
    const totalUnits = myProperties.reduce((acc, p) => acc + p.units.length, 0);
    const occupiedUnits = myProperties.reduce((acc, p) => acc + p.units.filter(u => u.status === 'Occupied').length, 0);
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const vacantCount = totalUnits - occupiedUnits;

    // Payment Performance Chart Data
    const collectionData = {
        labels: ['1st', '5th', '10th', '15th', '20th', '25th', '30th'],
        datasets: [{
            label: 'Collection %',
            data: [10, 45, 60, 75, 80, 85, 92],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    // Group units for Property View
    const propertyLayouts = useMemo(() => {
        return myProperties.map(prop => {
            const floors: Record<number, Unit[]> = {};
            if (prop.floors) { for(let i=0; i<prop.floors; i++) floors[i] = []; }
            prop.units.forEach(u => {
                const floorNum = u.floor !== undefined ? u.floor : 0;
                if (!floors[floorNum]) floors[floorNum] = [];
                floors[floorNum].push(u);
            });
            
            // Calculate Prop Specific Stats
            const propTenants = tenants.filter(t => t.propertyId === prop.id);
            const newTenantsCount = propTenants.filter(t => new Date(t.onboardingDate) >= new Date(new Date().setDate(new Date().getDate() - 30))).length;
            const arrearsCount = propTenants.filter(t => t.status === 'Overdue').length;

            return { ...prop, floors, newTenantsCount, arrearsCount };
        });
    }, [myProperties, tenants]);

    // Referrals
    const referralLinkAgency = `https://taskme.re/join/landlord?ref=${currentLandlord?.id}`;
    const referralLinkInvestor = `https://taskme.re/invest?ref=${currentLandlord?.id}`;

    const handleCopy = (text: string) => { navigator.clipboard.writeText(text); alert("Link copied to clipboard!"); };

    const handleShare = (platform: string, link: string) => {
        alert(`Opening ${platform} to share: ${link}`);
    };

    const handleInvestmentConfirm = (amount: number) => {
        if (selectedInvestFund && currentLandlord) {
            const newInv: Investment = { id: `inv-${Date.now()}`, fundId: selectedInvestFund.id, fundName: selectedInvestFund.name, amount: amount, date: new Date().toISOString().split('T')[0], strategy: 'Monthly Payout', status: 'Active', accruedInterest: 0 };
            addInvestment(newInv);
            setSelectedInvestFund(null);
        }
    };

    const submitRequest = (req: any) => {
        alert(`${req.type} request submitted: ${req.title}`);
        setIsRequestModalOpen(false);
    };

    const togglePropertySelection = (id: string) => {
        setSelectedPropertyIds(prev => 
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    if (!currentLandlord) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm">
                        {currentLandlord.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{currentLandlord.name}</h1>
                        <p className="text-sm text-gray-500">Landlord Portal • {myProperties.length} Properties</p>
                    </div>
                </div>
                <div className="bg-gray-100 p-1 rounded-lg flex overflow-x-auto">
                    {['dashboard', 'properties', 'financials', 'requests', 'growth'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-colors whitespace-nowrap ${
                                activeTab === tab ? 'bg-white text-primary shadow' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab === 'growth' ? 'Invest & Earn' : tab === 'properties' ? 'My Properties' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard title="Net Payout (Est)" value={`KES ${(financials.netIncome).toLocaleString()}`} subtext="Pending Disbursement" color="green" />
                        <MetricCard title="Unpaid Rent" value={`KES ${(financials.unpaidRevenue).toLocaleString()}`} subtext="Arrears" color="red" />
                        <MetricCard title="Occupancy" value={`${occupancyRate}%`} subtext={`${occupiedUnits}/${totalUnits} Units`} color="blue" />
                        <MetricCard title="Vacant" value={vacantCount.toString()} subtext="Ready to Let" color="orange" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Collection Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Collection Performance</h3>
                            <Chart type="line" data={collectionData} height="h-64" />
                        </div>

                        {/* Alerts & Quick Actions */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Alerts</h3>
                                <div className="space-y-3">
                                    {vacantCount > 0 && (
                                        <div className="p-3 bg-red-50 text-red-800 rounded border border-red-100 text-sm flex items-start">
                                            <Icon name="vacant-house" className="w-4 h-4 mr-2 mt-0.5" />
                                            <span>{vacantCount} Vacant Units require marketing.</span>
                                        </div>
                                    )}
                                    {financials.unpaidRevenue > 0 && (
                                        <div className="p-3 bg-orange-50 text-orange-800 rounded border border-orange-100 text-sm flex items-start">
                                            <Icon name="arrears" className="w-4 h-4 mr-2 mt-0.5" />
                                            <span>KES {financials.unpaidRevenue.toLocaleString()} in arrears.</span>
                                        </div>
                                    )}
                                    <div className="p-3 bg-blue-50 text-blue-800 rounded border border-blue-100 text-sm flex items-start">
                                        <Icon name="check" className="w-4 h-4 mr-2 mt-0.5" />
                                        <span>System is up to date.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button onClick={() => { setRequestType('Maintenance'); setIsRequestModalOpen(true); }} className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-bold text-gray-700 flex items-center transition-colors">
                                        <Icon name="tools" className="w-4 h-4 mr-3 text-primary" /> Report Maintenance
                                    </button>
                                    <button onClick={() => { setIsStatementOpen(true); }} className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-bold text-gray-700 flex items-center transition-colors">
                                        <Icon name="download" className="w-4 h-4 mr-3 text-primary" /> Download Statement
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MY PROPERTIES TAB */}
            {activeTab === 'properties' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Multi-Select Filter */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Filter Properties</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedPropertyIds([])}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedPropertyIds.length === 0 ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                All Properties
                            </button>
                            {allLandlordProperties.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => togglePropertySelection(p.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center ${selectedPropertyIds.includes(p.id) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                >
                                    {p.name}
                                    {selectedPropertyIds.includes(p.id) && <Icon name="check" className="w-3 h-3 ml-1" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {propertyLayouts.map(prop => (
                        <div key={prop.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        {prop.name}
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${prop.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {prop.status}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500">{prop.location || prop.branch} • {prop.units.length} Units</p>
                                </div>
                                <div className="flex gap-2">
                                    {prop.newTenantsCount > 0 && (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-1.5 animate-pulse"></span>
                                            {prop.newTenantsCount} New Tenants
                                        </span>
                                    )}
                                    {prop.arrearsCount > 0 && (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center">
                                            <span className="w-2 h-2 bg-red-600 rounded-full mr-1.5"></span>
                                            {prop.arrearsCount} Arrears
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(prop.floors).sort((a,b) => Number(a[0]) - Number(b[0])).map(([floorNum, units]: [string, Unit[]]) => (
                                    <div key={floorNum}>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
                                            {Number(floorNum) === 0 ? 'Ground Floor' : `Floor ${floorNum}`}
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                            {units.map(u => {
                                                const t = myTenants.find(tn => tn.unitId === u.id);
                                                const isNew = t ? (new Date(t.onboardingDate) >= new Date(new Date().setDate(new Date().getDate() - 30))) : false;
                                                return <UnitBox key={u.id} unit={u} tenant={t} isNewTenant={isNew} />;
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FINANCIALS TAB */}
            {activeTab === 'financials' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">Statement Period:</label>
                            <input
                                type="month"
                                value={financialPeriod}
                                onChange={e => setFinancialPeriod(e.target.value)}
                                className="p-2 border rounded-md text-sm font-medium bg-gray-50"
                            />
                        </div>
                        <button onClick={() => setIsStatementOpen(true)} className="px-4 py-2 bg-primary text-white font-bold rounded-md shadow-sm hover:bg-primary-dark flex items-center">
                            <Icon name="revenue" className="w-4 h-4 mr-2" /> View Full Report
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Summary List */}
                        <div className="space-y-4">
                            <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 font-medium">Gross Revenue</span>
                                <span className="text-gray-900 font-bold">KES {financials.grossRevenueMonth.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-red-50 rounded-lg text-red-800">
                                <span className="font-medium">Total Deductions</span>
                                <span className="font-bold">- KES {financials.monthlyDeductions.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between p-4 bg-green-50 rounded-lg text-green-800 border border-green-200">
                                <span className="font-bold uppercase">Net Payout</span>
                                <span className="font-extrabold text-xl">KES {financials.netIncome.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Deductions Chart/List */}
                        <div className="border rounded-lg p-4 bg-white">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Deductions Breakdown</h4>
                            <div className="space-y-2 text-sm">
                                {financials.detailedDeductions.slice(0, 5).map((d, i) => (
                                    <div key={i} className="flex justify-between">
                                        <span className="text-gray-600">{d.description}</span>
                                        <span className="text-red-500 font-medium">{d.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                {financials.detailedDeductions.length > 5 && (
                                    <p className="text-xs text-gray-400 text-center pt-2">...and {financials.detailedDeductions.length - 5} more</p>
                                )}
                                {financials.detailedDeductions.length === 0 && <p className="text-gray-400 italic">No deductions.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">My Requests</h2>
                        <div className="flex gap-2">
                            <button onClick={() => { setRequestType('General'); setIsRequestModalOpen(true); }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-700">General</button>
                            <button onClick={() => { setRequestType('Maintenance'); setIsRequestModalOpen(true); }} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded text-sm font-bold text-blue-700">Maintenance</button>
                            <button onClick={() => { setRequestType('Eviction'); setIsRequestModalOpen(true); }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded text-sm font-bold text-red-700">Eviction</button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Mock requests for landlord view */}
                        <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-gray-800">Roof Leak - Block A</span>
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">Pending</span>
                            </div>
                            <p className="text-sm text-gray-600">Submitted on 2025-11-12. Awaiting contractor assignment.</p>
                        </div>
                        <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow bg-gray-50 opacity-75">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-gray-800">Monthly Statement Inquiry</span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">Resolved</span>
                            </div>
                            <p className="text-sm text-gray-600">Submitted on 2025-10-05. Statement resent via email.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* GROWTH (INVEST) TAB */}
            {activeTab === 'growth' && (
                <div className="animate-fade-in space-y-8">
                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
                        <div className="relative z-10 max-w-3xl">
                            <h2 className="text-3xl font-bold mb-4">Grow Your Wealth with TaskMe</h2>
                            <p className="text-blue-100 mb-8 text-lg">
                                Leverage your position. Earn passive income by referring peers or investing your payout surplus into high-yield projects.
                            </p>
                            <div className="flex flex-wrap gap-6">
                                <div>
                                    <p className="text-xs text-blue-300 uppercase font-bold mb-1">Total Referral Earnings</p>
                                    <p className="text-3xl font-extrabold">KES {referralEarnings.toLocaleString()}</p>
                                </div>
                                <div className="w-px bg-blue-700 h-12 hidden sm:block"></div>
                                <div>
                                    <p className="text-xs text-blue-300 uppercase font-bold mb-1">Active R-REIT Investments</p>
                                    <p className="text-3xl font-extrabold">KES {activeInvestmentTotal.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <Icon name="reits" className="absolute -right-10 -bottom-10 w-80 h-80 text-white/5" />
                    </div>

                    {/* My Investments & Earnings */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Active Investments */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">My Active Investments</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-3 py-2">Fund</th>
                                            <th className="px-3 py-2 text-right">Amount</th>
                                            <th className="px-3 py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {myActiveInvestments.length > 0 ? myActiveInvestments.map((inv, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 font-medium">{inv.fundName}</td>
                                                <td className="px-3 py-2 text-right">KES {inv.amount.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded font-bold">{inv.status}</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400 italic">No active investments found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                         {/* Commission History */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Commission History</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="px-3 py-2">Date</th>
                                            <th className="px-3 py-2">Description</th>
                                            <th className="px-3 py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {commissionHistory.length > 0 ? commissionHistory.map((tx, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 text-gray-600">{tx.date}</td>
                                                <td className="px-3 py-2 font-medium">{tx.description || 'Referral Commission'}</td>
                                                <td className="px-3 py-2 text-right text-green-600 font-bold">KES {tx.amount.toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400 italic">No commissions earned yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Referral Center */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Referral Center</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Refer Landlord */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <Icon name="landlords" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg">Refer a Landlord</h4>
                                        <p className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded inline-block mt-1">Earn 10% of Mgmt Fee</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-6 flex-grow">
                                    Invite other property owners to join TaskMe Realty. You earn a recurring commission on the management fees we collect from their properties.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input readOnly value={referralLinkAgency} className="flex-grow p-2.5 bg-gray-50 border rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none" />
                                        <button onClick={() => handleCopy(referralLinkAgency)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300">Copy</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleShare('WhatsApp', referralLinkAgency)} className="py-2 bg-green-50 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100 flex items-center justify-center">
                                            <Icon name="communication" className="w-4 h-4 mr-2" /> WhatsApp
                                        </button>
                                        <button onClick={() => handleShare('SMS', referralLinkAgency)} className="py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-100 flex items-center justify-center">
                                            <Icon name="mail" className="w-4 h-4 mr-2" /> Message
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Refer Investor */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                        <Icon name="revenue" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg">Refer R-REIT Investor</h4>
                                        <p className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded inline-block mt-1">Earn 2.5% Commission</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-6 flex-grow">
                                    Know someone looking for high-yield investments? Invite them to our Renovation Funds. You earn a one-off commission on their invested capital.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input readOnly value={referralLinkInvestor} className="flex-grow p-2.5 bg-gray-50 border rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-purple-100 outline-none" />
                                        <button onClick={() => handleCopy(referralLinkInvestor)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300">Copy</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleShare('WhatsApp', referralLinkInvestor)} className="py-2 bg-green-50 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100 flex items-center justify-center">
                                            <Icon name="communication" className="w-4 h-4 mr-2" /> WhatsApp
                                        </button>
                                        <button onClick={() => handleShare('SMS', referralLinkInvestor)} className="py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-100 flex items-center justify-center">
                                            <Icon name="mail" className="w-4 h-4 mr-2" /> Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Investment Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                             <h3 className="text-xl font-bold text-gray-800">Invest in R-REITs</h3>
                             <button onClick={() => window.location.hash = '#/reits/investment-plans'} className="text-sm text-primary font-bold hover:underline">View All Funds</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {funds.filter(f => f.status === 'Active').slice(0, 3).map(fund => (
                                <div key={fund.id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-white">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-gray-800 text-lg line-clamp-1">{fund.name}</h4>
                                        <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded whitespace-nowrap">30% APY</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{fund.description}</p>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span>Progress</span>
                                            <span className="font-bold">{Math.round((fund.capitalRaised/fund.targetCapital)*100)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${(fund.capitalRaised/fund.targetCapital)*100}%` }}></div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedInvestFund(fund)}
                                        className="w-full py-2.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
                                    >
                                        Invest Now
                                    </button>
                                </div>
                            ))}
                            {funds.filter(f => f.status === 'Active').length === 0 && (
                                <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                                    No active funds available for investment right now.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {isStatementOpen && (
                <IncomeStatementModal 
                    data={financials} 
                    period={financialPeriod} 
                    landlord={currentLandlord} 
                    onClose={() => setIsStatementOpen(false)} 
                />
            )}

            {isRequestModalOpen && (
                <NewRequestModal 
                    type={requestType} 
                    landlord={currentLandlord} 
                    onClose={() => setIsRequestModalOpen(false)} 
                    onSubmit={submitRequest} 
                />
            )}

            {selectedInvestFund && currentLandlord && (
                <LandlordInvestModal 
                    fund={selectedInvestFund} 
                    landlordName={currentLandlord.name} 
                    onClose={() => setSelectedInvestFund(null)} 
                    onConfirm={handleInvestmentConfirm} 
                />
            )}
        </div>
    );
};

export default LandlordsPortal;