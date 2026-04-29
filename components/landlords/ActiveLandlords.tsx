


import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { User, Property, TenantProfile, Task, Unit, TaskStatus, TaskPriority, Bill, Fund, Investment } from '../../types';
import Icon from '../Icon';
import { exportToCSV, printSection } from '../../utils/exportHelper';
import { isAgencyFeeOnRentRule } from '../../utils/landlordPeriodFinancials';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// --- Helper Components ---

const ChartContainer: React.FC<{ type: 'line' | 'bar'; data: any; options?: any; height?: string }> = ({ type, data, options, height = 'h-64' }) => {
    return (
        <div className={`relative ${height} w-full`}>
            {type === 'line' ? <Line data={data} options={options} /> : <Bar data={data} options={options} />}
        </div>
    );
};

const MetricCard: React.FC<{ title: string; value: string; subtext?: string; color: 'blue' | 'green' | 'red' | 'orange' | 'indigo' | 'purple' }> = ({ title, value, subtext, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
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

const AIInsightCard: React.FC<{ title: string; description: string; type: 'success' | 'warning' | 'info'; icon: string }> = ({ title, description, type, icon }) => {
    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-orange-50 border-orange-200 text-orange-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
        <div className={`p-4 rounded-xl border ${styles[type]} shadow-sm flex items-start gap-3 bg-white`}>
            <div className="mt-1 flex-shrink-0 p-1.5 rounded-lg bg-white/50">
                 <Icon name={icon} className="w-5 h-5" />
            </div>
            <div>
                <h4 className="font-bold text-sm mb-1">{title}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{description}</p>
            </div>
        </div>
    );
};

const UnitBox: React.FC<{ unit: Unit; tenant?: TenantProfile; isNewTenant?: boolean; onManage?: () => void }> = ({ unit, tenant, isNewTenant, onManage }) => {
    const statusColor = useMemo(() => {
        // Unit status priorities
        if (unit.status === 'Unhabitable') return 'bg-gray-800 border-gray-900 text-white';
        if (unit.status === 'Distressed') return 'bg-purple-50 border-purple-200 text-purple-800';
        if (unit.status === 'Under Maintenance') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        if (!tenant && unit.status === 'Vacant') return 'bg-red-50 border-red-200 text-red-800';
        if (!tenant && unit.status === 'Occupied') return 'bg-amber-50 border-amber-300 text-amber-800'; // stale — reconciliation will fix
        
        // Tenant statuses
        if (tenant?.houseStatus?.includes('Distressed')) return 'bg-purple-50 border-purple-200 text-purple-800';
        if (tenant?.houseStatus?.includes('Under Maintenance')) return 'bg-orange-50 border-orange-200 text-orange-800';

        if (tenant?.status === 'Notice') return 'bg-orange-50 border-orange-200 text-orange-800';
        if (tenant?.status === 'Overdue') return 'bg-red-50 border-red-200 text-red-900';
        return 'bg-green-50 border-green-200 text-green-800';
    }, [unit.status, tenant]);

    const handleClick = () => {
        if (tenant) {
            window.location.hash = `#/tenants/active-tenants?tenantId=${tenant.id}`;
        } else if (onManage) {
            onManage();
        }
    };

    return (
        <div 
            className={`p-3 rounded-lg border ${statusColor} flex flex-col justify-between h-28 text-xs relative group cursor-pointer transition-all hover:shadow-md overflow-hidden`} 
            onClick={handleClick}
        >
            <div className="flex justify-between items-start">
                <span className="font-bold text-lg">{unit.unitNumber}</span>
                <span className="opacity-70 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{unit.unitType || `${unit.bedrooms}BR`}</span>
            </div>
           
            <div className="mt-1">
                {tenant ? (
                    <>
                        <p className="font-semibold truncate text-sm" title={tenant.name}>{tenant.name}</p>
                        {isNewTenant && (
                            <div className="inline-block bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded mt-1 font-bold uppercase shadow-sm animate-pulse">
                                New Tenant
                            </div>
                        )}
                    </>
                ) : (
                    <span className="italic opacity-80 text-sm font-semibold">{unit.status}</span>
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

            {/* Badges for Unit Status */}
            {!tenant && unit.status === 'Distressed' && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    DISTRESSED
                </div>
            )}
            {!tenant && unit.status === 'Unhabitable' && (
                <div className="absolute top-0 right-0 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    UNHABITABLE
                </div>
            )}
            {!tenant && unit.status === 'Under Maintenance' && (
                <div className="absolute top-0 right-0 bg-yellow-600 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    MAINTENANCE
                </div>
            )}

            {/* Badges for Tenant Status */}
            {tenant?.houseStatus?.includes('Distressed') && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    DISTRESSED
                </div>
            )}
             {tenant?.houseStatus?.includes('Under Maintenance') && !tenant?.houseStatus?.includes('Distressed') && (
                <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    MAINTENANCE
                </div>
            )}

            {!tenant?.houseStatus?.includes('Distressed') && !tenant?.houseStatus?.includes('Under Maintenance') && tenant?.status === 'Notice' && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    VACATING
                </div>
            )}
             {!tenant?.houseStatus?.includes('Distressed') && !tenant?.houseStatus?.includes('Under Maintenance') && tenant?.status === 'Overdue' && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-bl shadow-sm font-bold">
                    ARREARS
                </div>
            )}
        </div>
    );
};

// --- Modals ---

export const UnitStatusModal: React.FC<{ 
    unit: Unit; 
    property: Property;
    onClose: () => void;
    onSave: (status: Unit['status']) => void;
}> = ({ unit, property, onClose, onSave }) => {
    const [selectedStatus, setSelectedStatus] = useState<Unit['status']>(unit.status);

    const statuses: Array<{ value: Unit['status']; label: string; color: string }> = [
        { value: 'Vacant', label: 'Vacant (Ready to Let)', color: 'bg-green-100 text-green-800' },
        { value: 'Under Maintenance', label: 'Under Maintenance', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'Distressed', label: 'Distressed', color: 'bg-purple-100 text-purple-800' },
        { value: 'Unhabitable', label: 'Unhabitable', color: 'bg-gray-800 text-white' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1300] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Unit Status</h3>
                <p className="text-sm text-gray-500 mb-6">
                    {property.name} - Unit <strong>{unit.unitNumber}</strong>
                </p>
                
                <div className="space-y-3 mb-6">
                    {statuses.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setSelectedStatus(option.value)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                selectedStatus === option.value 
                                ? `border-primary ring-2 ring-primary/20 ${option.color}` 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <span className="font-bold text-sm">{option.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700 font-medium hover:bg-gray-200">Cancel</button>
                    <button onClick={() => onSave(selectedStatus)} className="px-6 py-2 bg-primary text-white rounded font-bold hover:bg-primary-dark shadow-sm">Save Status</button>
                </div>
            </div>
        </div>
    );
};

export const IncomeStatementModal: React.FC<{ 
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
export const NewRequestModal: React.FC<{ 
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
export const LandlordInvestModal: React.FC<{ 
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

// --- Comprehensive Detail View (REPLACES MODAL, NOW FULL PAGE STYLE) ---

export const LandlordDetailView: React.FC<{
    landlord: User;
    onClose: () => void;
}> = ({ landlord, onClose }) => {
    const { properties, tenants, tasks, deductionRules, bills, addInvestment, updateProperty } = useData();
    const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'financials' | 'communication'>('overview');
    const [financialView, setFinancialView] = useState<'summary' | 'revenue'>('summary');
    const [financialPeriod, setFinancialPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedDayFilter, setSelectedDayFilter] = useState<number>(30); // Default to end of month
    
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
    const [selectedInvestFund, setSelectedInvestFund] = useState<Fund | null>(null);

    const [isStatementOpen, setIsStatementOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestType, setRequestType] = useState<'General' | 'Maintenance' | 'Eviction'>('General');
    
    // State for Unit Status Modal
    const [unitToManage, setUnitToManage] = useState<{unit: Unit, property: Property} | null>(null);

    // --- Data Aggregation ---
    const allLandlordProperties = useMemo(() => properties.filter(p => p.landlordId === landlord.id), [properties, landlord.id]);

    const myProperties = useMemo(() => {
        if (selectedPropertyIds.length === 0) return allLandlordProperties;
        return allLandlordProperties.filter(p => selectedPropertyIds.includes(p.id));
    }, [allLandlordProperties, selectedPropertyIds]);

    const myTenants = useMemo(() => tenants.filter(t => myProperties.some(p => p.id === t.propertyId)), [tenants, myProperties]);

    // Self-heal: correct mismatches between unit.status and actual tenant occupancy.
    //
    // Vacant→Occupied  (forward, safe direction):
    //   Fires when a tenant with an OCCUPYING status has unitId pointing to a Vacant unit.
    //   Uses OCCUPYING_STATUSES so that Vacated/Evicted/etc. tenants don't keep a unit Occupied.
    //
    // Occupied→Vacant  (reverse direction):
    //   Fires ONLY when NO tenant of ANY status has unitId pointing to the unit.
    //   This prevents false-vacancy for tenants whose status is Vacated/Evicted/Blacklisted/
    //   Inactive but whose unitId hasn't been cleared yet — those units must stay Occupied
    //   until the tenant record is fully unlinked.
    //
    // Guard: skip entirely if either properties or the global tenants array haven't loaded.
    //   tenantsSettled uses tenants.length (full array), not myTenants.length (filtered subset),
    //   so a partial hydration state (some tenants present, others not yet) can't pass the guard.
    const OCCUPYING_STATUSES = ['Active', 'Pending', 'PendingAllocation', 'PendingPayment', 'Overdue', 'Notice'];
    useEffect(() => {
        if (allLandlordProperties.length === 0) return;
        const tenantsSettled = tenants.length > 0;
        myProperties.forEach(prop => {
            const staleUnits = prop.units.filter(u => {
                // Forward: any active-status tenant linked to this unit → must be Occupied
                const hasActiveTenant = myTenants.some(t => t.unitId === u.id && OCCUPYING_STATUSES.includes(t.status));
                // Reverse: no tenant of ANY status linked to this unit → must be Vacant
                const hasAnyTenant = tenants.some(t => t.unitId === u.id);
                if (hasActiveTenant && u.status === 'Vacant') return true;
                if (!hasAnyTenant && u.status === 'Occupied' && tenantsSettled) return true;
                return false;
            });
            if (staleUnits.length > 0) {
                const updatedUnits = prop.units.map(u => {
                    const hasActiveTenant = myTenants.some(t => t.unitId === u.id && OCCUPYING_STATUSES.includes(t.status));
                    const hasAnyTenant = tenants.some(t => t.unitId === u.id);
                    if (hasActiveTenant && u.status === 'Vacant') return { ...u, status: 'Occupied' as const };
                    if (!hasAnyTenant && u.status === 'Occupied' && tenantsSettled) return { ...u, status: 'Vacant' as const };
                    return u;
                });
                updateProperty(prop.id, { units: updatedUnits });
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenants, myTenants, myProperties, allLandlordProperties.length]);

    const myTasks = useMemo(() => tasks.filter(t => myProperties.some(p => p.name === t.property)), [tasks, myProperties]);
   
    // Live Financials
    const financials = useMemo(() => {
        const grossRevenueMonth = myTenants.reduce((sum, t) => sum + (t.status !== 'Overdue' ? (t.rentAmount || 0) : 0), 0);
        const allTimeRevenue = grossRevenueMonth * 12; // Mock projection
        const unpaidRevenue = myTenants.reduce((sum, t) => sum + (t.status === 'Overdue' ? (t.rentAmount || 0) : 0), 0);
       
        const detailedDeductions: Array<{ category: string; description: string; amount: number }> = [];

        // 1. Placement Fees (New Tenants in Period, based on property setting)
        const newTenants = myTenants.filter(t => t.onboardingDate.startsWith(financialPeriod));
        let placementFeeDeduction = 0;
        
        newTenants.forEach(t => {
            const prop = properties.find(p => p.id === t.propertyId);
            // Check property specific placement fee setting. Default to true if undefined for backward compatibility/safety
            const isPlacementFeeActive = prop?.placementFee !== false; 

            if (isPlacementFeeActive) {
                const firstMonthRent = Number((t as any).firstMonthRent || 0);
                const amount = firstMonthRent > 0 ? firstMonthRent : (t.rentAmount || 0);
                placementFeeDeduction += amount;
                detailedDeductions.push({
                    category: 'Placement Fees',
                    description: `Placement Fee: ${t.name}`,
                    amount: amount
                });
            }
        });

        // 2. Rule Deductions
        let ruleDeductionsTotal = 0;
        const activeRules = deductionRules.filter(r => 
            r.status === 'Active' &&
            (r.applicability === 'Global' || 
            (r.applicability === 'Specific Landlord' && r.targetId === landlord.id) ||
            (r.applicability === 'Specific Property' && myProperties.some(p => p.id === r.targetId)))
        );

        const baseForAgencyGlobal =
            placementFeeDeduction > 0 ? Math.max(0, grossRevenueMonth - placementFeeDeduction) : grossRevenueMonth;

        activeRules.forEach(r => {
            let amount = 0;
            if (r.type === 'Fixed') {
                amount = r.value;
            } else {
                if (r.applicability === 'Specific Property') {
                    const prop = myProperties.find(p => p.id === r.targetId);
                    if (prop) {
                        let propRevenue = myTenants
                            .filter(t => t.propertyId === prop.id && t.status !== 'Overdue')
                            .reduce((s, t) => s + (t.rentAmount || 0), 0);
                        if (isAgencyFeeOnRentRule(r.name) && placementFeeDeduction > 0) {
                            const placementOnProp = newTenants
                                .filter(t => t.propertyId === prop.id && prop.placementFee !== false)
                                .reduce((s, t) => {
                                    const firstMonthRent = Number((t as any).firstMonthRent || 0);
                                    const amount = firstMonthRent > 0 ? firstMonthRent : (t.rentAmount || 0);
                                    return s + amount;
                                }, 0);
                            propRevenue = Math.max(0, propRevenue - placementOnProp);
                        }
                        amount = propRevenue * (r.value / 100);
                    }
                } else {
                    const base = isAgencyFeeOnRentRule(r.name) ? baseForAgencyGlobal : grossRevenueMonth;
                    amount = base * (r.value / 100);
                }
            }
            ruleDeductionsTotal += amount;
            detailedDeductions.push({
                category: 'Management & Rules',
                description: r.name,
                amount: amount
            });
        });

        // 3. Bill Deductions
        const periodBills = bills.filter(b => 
                myProperties.some(p => p.id === b.propertyId) && 
                b.invoiceDate.startsWith(financialPeriod)
        );
        const billDeductionsTotal = periodBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        
        periodBills.forEach(b => {
            detailedDeductions.push({
                category: 'Bills & Utilities',
                description: `${b.category} - ${b.vendor}`,
                amount: Number(b.amount) || 0
            });
        });

        // 4. Maintenance Deductions
        const periodTasks = myTasks.filter(t => 
            (t.status === 'Completed' || t.status === 'Closed') &&
            t.dueDate.startsWith(financialPeriod) 
        );
        const maintenanceDeductionsTotal = periodTasks.reduce((sum, t) => sum + ((t.costs?.labor || 0) + (t.costs?.materials || 0) + (t.costs?.travel || 0)), 0);

        periodTasks.forEach(t => {
            const cost = (t.costs?.labor || 0) + (t.costs?.materials || 0) + (t.costs?.travel || 0);
            if (cost > 0) {
                detailedDeductions.push({
                    category: 'Maintenance',
                    description: `Maint: ${t.title} (${t.property})`,
                    amount: cost
                });
            }
        });

        const totalDeductions = ruleDeductionsTotal + billDeductionsTotal + maintenanceDeductionsTotal + placementFeeDeduction;
       
        return { 
            grossRevenueMonth, 
            allTimeRevenue, 
            unpaidRevenue, 
            ruleDeductions: ruleDeductionsTotal,
            billDeductions: billDeductionsTotal,
            maintenanceDeductions: maintenanceDeductionsTotal,
            placementFeeDeduction,
            newTenants,
            monthlyDeductions: totalDeductions, 
            netIncome: grossRevenueMonth - totalDeductions,
            activeRules,
            detailedDeductions
        };
    }, [myTenants, myProperties, deductionRules, bills, myTasks, financialPeriod, landlord.id, properties]);

    // Occupancy Stats
    const totalUnits = myProperties.reduce((acc, p) => acc + p.units.length, 0);
    const occupiedUnits = myProperties.reduce((acc, p) => acc + p.units.filter(u => u.status === 'Occupied').length, 0);
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const vacantCount = totalUnits - occupiedUnits;

    // Collection Rate — expected = monthly rent + outstanding deposit (when required); bar caps at 100% width; label can exceed 100% if overpaid
    const collectionStats = useMemo(() => {
        const expectedRentOnly = myTenants
            .filter(t => t.status !== 'Vacated' && t.status !== 'Evicted')
            .reduce((sum, t) => sum + (t.rentAmount || 0), 0);

        const depositOutstanding = myTenants
            .filter(t => t.status !== 'Vacated' && t.status !== 'Evicted')
            .reduce((sum, t) => {
                const prop = properties.find(p => p.id === t.propertyId);
                if (!prop?.deposit?.required) return sum;
                const months = prop.deposit.months ?? 1;
                const full = (t.rentAmount || 0) * months;
                return sum + Math.max(0, full - (t.depositPaid || 0));
            }, 0);

        const expected = expectedRentOnly + depositOutstanding;

        const collected = myTenants.reduce((sum, t) => {
            return sum + t.paymentHistory
                .filter(p => p.date.startsWith(financialPeriod))
                .reduce((s, p) => s + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);
        }, 0);

        const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
        const barWidth = Math.min(rate, 100);
        const health = Math.round((occupancyRate * 0.5) + (rate * 0.5));

        return { expected, collected, rate, health, barWidth };
    }, [myTenants, financialPeriod, occupancyRate, properties]);


    // Payment Performance Graph Data Logic
    const paymentPerformanceLogic = useMemo(() => {
        const days = [1, 5, 10, 15, 20, 25, 30];
        const currentMonthPayments = myTenants.flatMap(t => t.paymentHistory.filter(p => p.date.startsWith(financialPeriod)).map(p => ({
             ...p,
             tenantName: t.name,
             unit: t.unit,
             amountVal: parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0,
             day: parseInt(p.date.split('-')[2])
        }))).sort((a,b) => b.day - a.day);

        const graphData = days.map(day => {
            const collectedUntilDay = currentMonthPayments.filter(p => p.day <= day).reduce((sum, p) => sum + p.amountVal, 0);
            const percentage = collectionStats.expected > 0 ? Math.round((collectedUntilDay / collectionStats.expected) * 100) : 0;
            return { day, percentage };
        });

        const tablePayments = currentMonthPayments.filter(p => p.day <= selectedDayFilter);

        const currentBucket = graphData.find(d => d.day === selectedDayFilter) || graphData[graphData.length-1];

        return { graphData, tablePayments, currentPercentage: currentBucket.percentage };
    }, [myTenants, financialPeriod, collectionStats, selectedDayFilter]);

    const paymentTrendData = {
        labels: paymentPerformanceLogic.graphData.map(d => `${d.day}${d.day === 1 ? 'st' : d.day === 2 ? 'nd' : 'th'}`),
        datasets: [{
            label: 'Collection %',
            data: paymentPerformanceLogic.graphData.map(d => d.percentage),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    // Alerts Logic
    const alerts = useMemo(() => {
        const list = [];
        if (vacantCount > 0) {
            list.push({ 
                type: 'critical', 
                title: `${vacantCount} Vacant Units`,
                text: `Action required to fill vacancies in ${myProperties.filter(p => p.units.some(u => u.status === 'Vacant')).map(p => p.name).join(', ')}.` 
            });
        }
        if (financials.unpaidRevenue > 0) {
            list.push({ 
                type: 'warning', 
                title: 'Collections Alert',
                text: `KES ${financials.unpaidRevenue.toLocaleString()} outstanding from ${myTenants.filter(t => t.status === 'Overdue').length} tenants.` 
            });
        }
        
        list.push({ 
            type: 'info', 
            title: 'Performance',
            text: 'Revenue is stable compared to last month.' 
        });
        
        return list;
    }, [vacantCount, financials.unpaidRevenue, myProperties, myTenants]);


    // Group units by property and floor for visual map
    const propertyLayouts = useMemo(() => {
        return myProperties.map(prop => {
            const unitMap: Record<number, Unit[]> = {};
            if (prop.floors) {
                for(let i=0; i<prop.floors; i++) unitMap[i] = [];
            }
            prop.units.forEach(u => {
                const floorNum = u.floor !== undefined ? u.floor : 0;
                if (!unitMap[floorNum]) unitMap[floorNum] = [];
                unitMap[floorNum].push(u);
            });
            
            const propTenants = tenants.filter(t => t.propertyId === prop.id);
            const newTenantsCount = propTenants.filter(t => new Date(t.onboardingDate) >= new Date(new Date().setDate(new Date().getDate() - 30))).length;
            const arrearsCount = propTenants.filter(t => t.status === 'Overdue').length;
            const distressedCount = propTenants.filter(t => t.houseStatus?.includes('Distressed')).length;
            const maintenanceCount = propTenants.filter(t => t.houseStatus?.includes('Under Maintenance')).length;

            return { ...prop, unitMap, newTenantsCount, arrearsCount, distressedCount, maintenanceCount };
        });
    }, [myProperties, tenants]);

    const handleDownloadStatement = (type: 'Revenue' | 'Income') => {
        if (type === 'Income') {
            setIsStatementOpen(true);
        } else {
            const data = myTenants.map(t => ({
                Tenant: t.name,
                Property: t.propertyName,
                Unit: t.unit,
                Rent: t.rentAmount,
                Status: t.status,
                New_Tenant: t.onboardingDate.startsWith(financialPeriod) ? 'Yes' : 'No',
                Date: new Date().toLocaleDateString()
            }));
            exportToCSV(data, `${landlord.name}_Revenue_Report`);
        }
    };

    const handleNewRequest = (type: 'General' | 'Maintenance' | 'Eviction') => {
        setRequestType(type);
        setIsRequestModalOpen(true);
    }

    const submitRequest = (req: any) => {
        alert(`${req.type} request submitted: ${req.title}`);
        setIsRequestModalOpen(false);
    }

    const togglePropertySelection = (id: string) => {
        setSelectedPropertyIds(prev => 
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleInvestmentConfirm = (amount: number) => {
        if (selectedInvestFund && landlord) {
            const newInv: Investment = { id: `inv-${Date.now()}`, fundId: selectedInvestFund.id, fundName: selectedInvestFund.name, amount: amount, date: new Date().toISOString().split('T')[0], strategy: 'Monthly Payout', status: 'Active', accruedInterest: 0 };
            addInvestment(newInv);
            setSelectedInvestFund(null);
            alert(`Investment of KES ${amount.toLocaleString()} confirmed.`);
        }
    };

    const handleUpdateUnitStatus = (newStatus: Unit['status']) => {
        if (!unitToManage) return;
        const property = unitToManage.property;
        const updatedUnits = property.units.map(u => 
            u.id === unitToManage.unit.id ? { ...u, status: newStatus } : u
        );
        updateProperty(property.id, { units: updatedUnits });
        setUnitToManage(null);
    };
    
    // Calculate arrears count for AI card usage
    const arrearsCount = myTenants.filter(t => t.status === 'Overdue').length;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in"> 
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-white">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-white shadow-sm">
                        {landlord.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{landlord.name}</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Icon name="mail" className="w-3 h-3" /> {landlord.email}
                            <span className="text-gray-300">|</span>
                            <Icon name="communication" className="w-3 h-3" /> {landlord.phone}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100">
                                {myProperties.length} Properties
                            </span>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold rounded border border-purple-100">
                                {totalUnits} Units
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-bold hover:bg-gray-200 flex items-center shadow-sm transition-colors">
                    Close
                </button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200 bg-gray-50 flex-shrink-0 overflow-x-auto">
                <div className="flex space-x-6">
                    {['overview', 'portfolio', 'financials', 'communication'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab as any); setFinancialView('summary'); }}
                            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'portfolio' ? 'Properties & Units' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-8 bg-gray-50/30">
               
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 gap-6">
                        {/* Property Selector */}
                        {allLandlordProperties.length > 1 && (
                            <div className="mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Viewing Data For:</label>
                                <select
                                    className="p-2 border rounded-lg bg-white shadow-sm text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/50 outline-none w-full md:w-64"
                                    value={selectedPropertyIds.length === 1 ? selectedPropertyIds[0] : 'all'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedPropertyIds(val === 'all' ? [] : [val]);
                                    }}
                                >
                                    <option value="all">All Properties ({allLandlordProperties.length})</option>
                                    {allLandlordProperties.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* AI Intelligence Section */}
                        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Icon name="analytics" className="w-32 h-32 text-white" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-sm font-bold mb-3 flex items-center uppercase tracking-wider opacity-90">
                                    <Icon name="analytics" className="w-4 h-4 mr-2 text-yellow-400" />
                                    TaskMe AI Intelligence
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                                     {alerts.map((insight: any, i: number) => (
                                        <AIInsightCard 
                                            key={i}
                                            title={insight.title} 
                                            description={insight.text}
                                            type={insight.type}
                                            icon={insight.type === 'critical' ? 'arrears' : insight.type === 'warning' ? 'task-escalated' : 'check'}
                                        />
                                     ))}
                                </div>
                            </div>
                        </div>

                        {/* Top KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard title="Properties" value={myProperties.length.toString()} subtext="Managed Assets" color="blue" />
                            <MetricCard title="Total Units" value={totalUnits.toString()} subtext="Portfolio Size" color="indigo" />
                            <MetricCard title="Occupancy" value={`${occupancyRate}%`} subtext={`${occupiedUnits} Occupied`} color="green" />
                            <MetricCard title="Collection (MTD)" value={`KES ${(collectionStats.collected/1000).toFixed(1)}k`} subtext={`${collectionStats.rate}% Collected`} color="purple" />
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Performance Graph & Table */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Payment Performance</h3>
                                    
                                    <div className="grid grid-cols-1 gap-8">
                                        {/* Graph */}
                                        <div>
                                            <div className="flex justify-end mb-2">
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                    Collection %
                                                </span>
                                            </div>
                                            <ChartContainer type="line" data={paymentTrendData} options={{ 
                                                responsive: true, 
                                                maintainAspectRatio: false,
                                                scales: { y: { beginAtZero: true, max: 100 } },
                                                plugins: { legend: { display: false } }
                                            }} height="h-64" />
                                            <p className="text-center text-xs text-gray-400 mt-4 italic">Typically 60% of rent is collected by the 10th.</p>
                                        </div>
                                        
                                        {/* Interactive Table */}
                                        <div>
                                            {/* Date Buttons */}
                                            <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-1 rounded-lg">
                                                {[1, 5, 10, 15, 20, 25, 30].map(day => (
                                                    <button
                                                        key={day}
                                                        onClick={() => setSelectedDayFilter(day)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                                            selectedDayFilter === day 
                                                            ? 'bg-green-600 text-white shadow-sm' 
                                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                    >
                                                        {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center mb-3 bg-green-50 p-3 rounded-lg border border-green-100">
                                                <span className="text-sm font-bold text-green-800">Collection by Day {selectedDayFilter}</span>
                                                <span className="text-xl font-extrabold text-green-600">{paymentPerformanceLogic.currentPercentage}%</span>
                                            </div>

                                            <div className="border rounded-lg overflow-hidden h-48 overflow-y-auto">
                                                <table className="min-w-full text-xs text-left">
                                                    <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">TENANT</th>
                                                            <th className="px-3 py-2 text-left">UNIT</th>
                                                            <th className="px-3 py-2 text-right">PAID</th>
                                                            <th className="px-3 py-2 text-right">DATE</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {paymentPerformanceLogic.tablePayments.slice(0, 5).map((p: any, i: number) => (
                                                            <tr key={i} className="border-b border-gray-50 last:border-0">
                                                                <td className="py-2 font-medium text-gray-800">{p.tenantName} <span className="text-gray-400 text-[9px] ml-1">{p.unit}</span></td>
                                                                <td className="py-2 text-gray-500">{p.unit}</td>
                                                                <td className="py-2 text-right text-green-600 font-bold">
                                                                    {p.amount ? p.amount : `KES ${p.amountVal.toLocaleString()}`}
                                                                </td>
                                                                <td className="py-2 text-right text-gray-500">{p.date}</td>
                                                            </tr>
                                                        ))}
                                                        {paymentPerformanceLogic.tablePayments.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-400 italic">No payments recorded by this date.</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Health & Insights */}
                            <div className="space-y-6">
                                {/* Portfolio Health Card */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Portfolio Health</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-medium text-gray-600">Occupancy</span>
                                                <span className="text-sm font-bold text-gray-900">{occupancyRate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${occupancyRate < 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                                                    style={{ width: `${occupancyRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-medium text-gray-600">Collection Efficiency</span>
                                                <span className="text-sm font-bold text-gray-900">{collectionStats.rate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 max-w-full ${collectionStats.rate < 80 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                    style={{ width: `${collectionStats.barWidth}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Insights & Alerts Cards */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Insights & Alerts</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {alerts.map((alert, idx) => (
                                            <div key={idx} className={`p-4 rounded-lg border-l-4 flex items-start ${
                                                alert.type === 'critical' ? 'bg-red-50 border-red-400 text-red-800' :
                                                alert.type === 'warning' ? 'bg-orange-50 border-orange-400 text-orange-800' :
                                                'bg-blue-50 border-blue-400 text-blue-800'
                                            }`}>
                                                <Icon name={alert.type === 'critical' ? 'vacant-house' : alert.type === 'warning' ? 'arrears' : 'analytics'} className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-sm mb-1">{alert.title}</p>
                                                    <p className="text-xs opacity-90">{alert.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'portfolio' && (
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
                                        {prop.distressedCount > 0 && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center">
                                                <span className="w-2 h-2 bg-purple-600 rounded-full mr-1.5 animate-pulse"></span>
                                                {prop.distressedCount} Distressed
                                            </span>
                                        )}
                                        {prop.maintenanceCount > 0 && (
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold flex items-center">
                                                <span className="w-2 h-2 bg-orange-600 rounded-full mr-1.5"></span>
                                                {prop.maintenanceCount} Maint.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {Object.entries(prop.unitMap).sort((a,b) => Number(a[0]) - Number(b[0])).map(([floorNum, units]: [string, Unit[]]) => (
                                        <div key={floorNum}>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
                                                {Number(floorNum) === 0 ? 'Ground Floor' : `Floor ${floorNum}`}
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                                {units.map(u => {
                                                    const t = myTenants.find(tn => tn.unitId === u.id);
                                                    const isNew = t ? (new Date(t.onboardingDate) >= new Date(new Date().setDate(new Date().getDate() - 30))) : false;
                                                    return <UnitBox 
                                                                key={u.id} 
                                                                unit={u} 
                                                                tenant={t} 
                                                                isNewTenant={isNew} 
                                                                onManage={() => setUnitToManage({unit: u, property: prop})}
                                                            />;
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
                        {financialView === 'summary' ? (
                            <>
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
                                    <div className="flex gap-2">
                                        <button onClick={() => setFinancialView('revenue')} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 text-sm flex items-center">
                                            <Icon name="revenue" className="w-4 h-4 mr-2" /> View Tenant Revenue
                                        </button>
                                        <button onClick={() => handleDownloadStatement('Income')} className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary-dark text-sm flex items-center">
                                            <Icon name="download" className="w-4 h-4 mr-2" /> Income Statement
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Income Statement Preview */}
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">Income Statement Preview</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between pb-2 border-b border-gray-100">
                                                <span className="text-gray-600">Total Gross Revenue</span>
                                                <span className="font-bold text-gray-900">KES {financials.grossRevenueMonth.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between pb-2 border-b border-gray-100 text-red-600">
                                                <span>Total Deductions</span>
                                                <span>- KES {financials.monthlyDeductions.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 text-lg font-extrabold text-green-700">
                                                <span>Net Income</span>
                                                <span>KES {financials.netIncome.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deductions Summary */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-xl border-t-4 border-indigo-500 shadow-sm">
                                            <p className="text-xs text-gray-500 uppercase">Placement Fees</p>
                                            <p className="text-xl font-extrabold text-red-600">- KES {financials.placementFeeDeduction.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">
                                                {financials.newTenants.filter(t => {
                                                    const prop = properties.find(p => p.id === t.propertyId);
                                                    return prop?.placementFee !== false;
                                                }).length} Fees Charged
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border-t-4 border-orange-500 shadow-sm">
                                            <p className="text-xs text-gray-500 uppercase">Bills & Utilities</p>
                                            <p className="text-xl font-extrabold text-red-600">- KES {financials.billDeductions.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border-t-4 border-blue-500 shadow-sm">
                                            <p className="text-xs text-gray-500 uppercase">Mgmt & Rules</p>
                                            <p className="text-xl font-extrabold text-red-600">- KES {financials.ruleDeductions.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border-t-4 border-gray-500 shadow-sm">
                                            <p className="text-xs text-gray-500 uppercase">Maintenance</p>
                                            <p className="text-xl font-extrabold text-red-600">- KES {financials.maintenanceDeductions.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Tenant Revenue Report</h3>
                                        <p className="text-sm text-gray-500">Period: {financialPeriod}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setFinancialView('summary')} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 text-sm">
                                            Back to Financials
                                        </button>
                                        <button onClick={() => handleDownloadStatement('Revenue')} className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary-dark text-sm flex items-center">
                                            <Icon name="download" className="w-4 h-4 mr-2" /> Download CSV
                                        </button>
                                    </div>
                                </div>
                               
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Unit</th>
                                                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Rent Amount</th>
                                                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {myTenants.map((t, idx) => {
                                                const isNew = t.onboardingDate.startsWith(financialPeriod);
                                                const prop = properties.find(p => p.id === t.propertyId);
                                                const isPlacementFeeActive = prop?.placementFee !== false;

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{t.propertyName}</td>
                                                        <td className="px-4 py-3 text-gray-600">{t.unit}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-800">KES {(isNew && Number((t as any).firstMonthRent || 0) > 0 ? Number((t as any).firstMonthRent) : t.rentAmount).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isNew ? (
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">NEW</span>
                                                            ) : (
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                    {t.status}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">
                                                            {isNew ? (
                                                                isPlacementFeeActive ? (
                                                                    <span className="text-red-600 font-bold">Placement Fee Applied</span>
                                                                ) : (
                                                                    <span className="text-green-600 font-bold">Placement Fee Inactive (Paid to Landlord)</span>
                                                                )
                                                            ) : (
                                                                <span className="text-green-600">Revenue Recognized</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {myTenants.length === 0 && (
                                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No tenant records found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'communication' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Request Management */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Requests & Feedback</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => handleNewRequest('General')} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">General</button>
                                    <button onClick={() => handleNewRequest('Maintenance')} className="text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">Maintenance</button>
                                    <button onClick={() => handleNewRequest('Eviction')} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Eviction</button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {/* Mock requests for landlord view */}
                                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-sm">Roof Repair Request</span>
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Pending</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">Submitted on 2025-11-10 regarding Block A.</p>
                                </div>
                            </div>
                        </div>

                        {/* Notices & Tasks */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Notices & Active Tasks</h3>
                            <div className="space-y-3">
                                {myTenants.filter(t => t.status === 'Notice').map(t => (
                                    <div key={t.id} className="p-3 bg-orange-50 rounded border border-orange-100 flex items-start">
                                        <Icon name="offboarding" className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-sm text-orange-800">Vacation Notice</p>
                                            <p className="text-xs text-orange-700">Tenant <strong>{t.name}</strong> (Unit {t.unit}) is vacating on {t.leaseEnd}.</p>
                                        </div>
                                    </div>
                                ))}
                                {myTasks.slice(0, 3).map(t => (
                                    <div key={t.id} className="p-3 bg-blue-50 rounded border border-blue-100 flex items-start">
                                        <Icon name="maintenance" className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-sm text-blue-800">{t.title}</p>
                                            <p className="text-xs text-blue-700">{t.property} • {t.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
             {/* MODALS */}
            {isStatementOpen && (
                <IncomeStatementModal 
                    data={financials} 
                    period={financialPeriod} 
                    landlord={landlord} 
                    onClose={() => setIsStatementOpen(false)} 
                />
            )}

            {isRequestModalOpen && (
                <NewRequestModal 
                    type={requestType} 
                    landlord={landlord} 
                    onClose={() => setIsRequestModalOpen(false)} 
                    onSubmit={submitRequest} 
                />
            )}

            {selectedInvestFund && landlord && (
                <LandlordInvestModal 
                    fund={selectedInvestFund} 
                    landlordName={landlord.name} 
                    onClose={() => setSelectedInvestFund(null)} 
                    onConfirm={handleInvestmentConfirm} 
                />
            )}
            
            {unitToManage && (
                <UnitStatusModal
                    unit={unitToManage.unit}
                    property={unitToManage.property}
                    onClose={() => setUnitToManage(null)}
                    onSave={handleUpdateUnitStatus}
                />
            )}
        </div>
    );
};

// --- Landlord Card Component ---

const LandlordCard: React.FC<{ landlord: User; onClick: () => void }> = ({ landlord, onClick }) => {
    const { properties, tenants } = useData();
    const currentMonth = new Date().toISOString().slice(0, 7);
   
    const myProps = useMemo(() => properties.filter(p => p.landlordId === landlord.id), [properties, landlord.id]);
    const propertyIds = myProps.map(p => p.id);

    // Units
    const totalUnits = myProps.reduce((acc, p) => acc + p.units.length, 0);
    const occupiedUnits = myProps.reduce((acc, p) => acc + p.units.filter(u => u.status === 'Occupied').length, 0);
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
   
    // Collection MTD — expected includes monthly rent plus any security deposit still owed (when property requires deposit)
    const myTenants = tenants.filter(t => propertyIds.includes(t.propertyId || ''));
    
    const expectedRent = myTenants
        .filter(t => t.status !== 'Vacated' && t.status !== 'Evicted')
        .reduce((sum, t) => sum + (t.rentAmount || 0), 0);

    const depositOutstanding = myTenants
        .filter(t => t.status !== 'Vacated' && t.status !== 'Evicted')
        .reduce((sum, t) => {
            const prop = myProps.find(p => p.id === t.propertyId);
            if (!prop?.deposit?.required) return sum;
            const months = prop.deposit.months ?? 1;
            const full = (t.rentAmount || 0) * months;
            return sum + Math.max(0, full - (t.depositPaid || 0));
        }, 0);

    const expectedTotal = expectedRent + depositOutstanding;

    const collectedRent = myTenants.reduce((sum, t) => {
         const paid = t.paymentHistory
            .filter(p => p.date.startsWith(currentMonth))
            .reduce((s, p) => s + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);
         return sum + paid;
    }, 0);

    const collectionRate = expectedTotal > 0 ? Math.round((collectedRent / expectedTotal) * 100) : 0;
    const collectionBarWidth = Math.min(collectionRate, 100);

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group flex flex-col h-full"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 border border-gray-200 group-hover:from-primary/10 group-hover:to-primary/20 group-hover:text-primary transition-all">
                    {landlord.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">{landlord.name}</h3>
                    <p className="text-xs text-gray-500">{landlord.phone}</p>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Properties</p>
                    <p className="text-lg font-bold text-gray-800">{myProps.length}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total Units</p>
                    <p className="text-lg font-bold text-gray-800">{totalUnits}</p>
                </div>
            </div>

            {/* Bars */}
            <div className="space-y-3 mb-4">
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-medium text-gray-600">Occupancy</span>
                        <span className={`text-xs font-bold ${occupancyRate < 80 ? 'text-red-500' : 'text-green-600'}`}>{occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${occupancyRate < 80 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${occupancyRate}%` }}
                        ></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-medium text-gray-600">Collection (MTD)</span>
                        <span className={`text-xs font-bold ${collectionRate < 80 ? 'text-orange-500' : 'text-blue-600'}`}>{collectionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 max-w-full ${collectionRate < 80 ? 'bg-orange-500' : 'bg-blue-600'}`}
                            style={{ width: `${collectionBarWidth}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase">Amount Collected (MTD)</p>
                    <p className="text-sm font-bold text-gray-800">KES {(collectedRent/1000).toFixed(1)}k</p>
                </div>
                <button className="text-gray-400 hover:text-primary transition-colors">
                    <Icon name="communication" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const ActiveLandlords: React.FC = () => {
    const { landlords } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLandlord, setSelectedLandlord] = useState<User | null>(null);

    // Auto-open logic if URL param exists (Requested Feature)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('?')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const id = params.get('id');
            if (id) {
                const l = landlords.find(u => u.id === id);
                if (l) setSelectedLandlord(l);
            }
        }
    }, [landlords]);

    const filteredLandlords = useMemo(() =>
        landlords.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    , [landlords, searchQuery]);

    if (selectedLandlord) {
        return (
            <LandlordDetailView
                landlord={selectedLandlord}
                onClose={() => { setSelectedLandlord(null); window.history.pushState(null, '', '#/landlords/active-landlords'); }}
            />
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Active Landlords</h1>
                    <p className="text-lg text-gray-500 mt-1">Manage landlord portfolios, financials, and property health.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search landlords by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                    <div className="absolute left-3 top-3.5 text-gray-400"><Icon name="search" className="w-5 h-5" /></div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLandlords.map(landlord => (
                    <LandlordCard
                        key={landlord.id}
                        landlord={landlord}
                        onClick={() => setSelectedLandlord(landlord)}
                    />
                ))}
            </div>

            {filteredLandlords.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">No landlords found.</p>
                </div>
            )}
        </div>
    );
};

export default ActiveLandlords;
