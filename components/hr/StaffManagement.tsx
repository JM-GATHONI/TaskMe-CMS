
import React, { useState, useMemo, useEffect } from 'react';
import { StaffProfile, BusinessUnit, SalaryType, UserRole, StaffDeduction } from '../../types';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { printSection } from '../../utils/exportHelper';

// --- Card Style ---
const UNIT_CARD_CLASSES = "bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden";

interface UnitConfig {
    name: BusinessUnit;
    icon: string;
    color: string;
}

const BUSINESS_UNITS: UnitConfig[] = [
    { name: 'Management', icon: 'user-circle', color: 'text-purple-600' },
    { name: 'Administration', icon: 'stack', color: 'text-blue-600' },
    { name: 'Security', icon: 'shield', color: 'text-red-600' },
    { name: 'Rental Management', icon: 'tenants', color: 'text-green-600' },
    { name: 'R-Reits', icon: 'reits', color: 'text-yellow-600' },
    { name: 'Cleaning', icon: 'maintenance', color: 'text-cyan-600' },
    { name: 'Maintenance', icon: 'tools', color: 'text-orange-600' },
];

// --- Modals ---

const OtpModal: React.FC<{ onClose: () => void; onSuccess: () => void; message?: string }> = ({ onClose, onSuccess, message }) => {
    const [otp, setOtp] = useState('');
    
    const handleVerify = () => {
        if (otp === '1234') { // Mock OTP
            onSuccess();
        } else {
            alert('Invalid OTP. Try 1234.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1600] backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Icon name="shield" className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Security Verification</h3>
                <p className="text-sm text-gray-500 mb-6">{message || 'Enter the code sent to your phone to confirm changes.'}</p>
                <input 
                    className="w-full p-3 text-center text-2xl font-bold tracking-widest border rounded-lg mb-6 focus:ring-2 focus:ring-primary outline-none" 
                    placeholder="0 0 0 0"
                    maxLength={4}
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    autoFocus
                />
                <button onClick={handleVerify} className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors">Verify Code</button>
            </div>
        </div>
    );
};

const DeductionManagerModal: React.FC<{ staff: StaffProfile; onClose: () => void; onUpdate: (updatedStaff: StaffProfile) => void }> = ({ staff, onClose, onUpdate }) => {
    const [deductionType, setDeductionType] = useState<'Recurring' | 'One-Off'>('Recurring');
    const [category, setCategory] = useState<'Sacco' | 'Chama' | 'Fine' | 'Lost Item' | 'Other'>('Sacco');
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const handleSave = () => {
        if (!name || !amount) return alert("Name and Amount required.");
        
        let newDeductions = [...(staff.deductions || [])];
        
        if (editingId) {
            // Update existing
            newDeductions = newDeductions.map(d => d.id === editingId ? {
                ...d,
                name,
                amount: parseFloat(amount),
                type: deductionType,
                category
            } : d);
        } else {
            // Add new
            const newDeduction: StaffDeduction = {
                id: `ded-${Date.now()}`,
                name,
                amount: parseFloat(amount),
                type: deductionType,
                category,
                dateAdded: new Date().toISOString().split('T')[0]
            };
            newDeductions.push(newDeduction);
        }
        
        const updatedStaff = { ...staff, deductions: newDeductions };
        onUpdate(updatedStaff);
        
        // Reset form
        setName(''); setAmount(''); setEditingId(null);
        alert(editingId ? "Deduction updated." : "Deduction added.");
    };

    const handleEdit = (deduction: StaffDeduction) => {
        setEditingId(deduction.id);
        setName(deduction.name);
        setAmount(deduction.amount.toString());
        setDeductionType(deduction.type);
        setCategory(deduction.category);
    };

    const handleRemove = (id: string) => {
        if (window.confirm("Are you sure you want to remove this deduction?")) {
            const updatedStaff = { ...staff, deductions: (staff.deductions || []).filter(d => d.id !== id) };
            onUpdate(updatedStaff);
            if (editingId === id) {
                setEditingId(null);
                setName('');
                setAmount('');
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName('');
        setAmount('');
        setDeductionType('Recurring');
        setCategory('Sacco');
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1500] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Manage Deductions</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="p-6">
                    <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-700 uppercase">{editingId ? 'Edit Deduction' : 'Add New Deduction'}</h4>
                            {editingId && <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700">Cancel Edit</button>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={deductionType} onChange={e => setDeductionType(e.target.value as any)} className="p-2 border rounded text-sm bg-white">
                                <option value="Recurring">Recurring (Monthly)</option>
                                <option value="One-Off">One-Off</option>
                            </select>
                            <select value={category} onChange={e => setCategory(e.target.value as any)} className="p-2 border rounded text-sm bg-white">
                                <option value="Sacco">Sacco Savings</option>
                                <option value="Chama">Chama Savings</option>
                                <option value="Fine">Fine / Penalty</option>
                                <option value="Lost Item">Lost Item Replacement</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Description (e.g. Feb Fine)" className="flex-grow p-2 border rounded text-sm" />
                            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" className="w-24 p-2 border rounded text-sm" />
                            <button onClick={handleSave} className="px-4 bg-primary text-white rounded text-sm font-bold shadow-sm hover:bg-primary-dark transition-colors">
                                {editingId ? 'Save' : 'Add'}
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase mb-2">Active Deductions</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(staff.deductions || []).length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No deductions found.</p>}
                            {(staff.deductions || []).map(d => (
                                <div key={d.id} className={`flex justify-between items-center p-3 border rounded transition-colors ${editingId === d.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white hover:bg-gray-50'}`}>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{d.name}</p>
                                        <p className="text-xs text-gray-500">{d.category} • {d.type}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-red-600 text-sm">- {d.amount.toLocaleString()}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(d)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                                                <Icon name="settings" className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleRemove(d.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                                                <Icon name="close" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AttendanceManagerModal: React.FC<{ staff: StaffProfile; onClose: () => void; onUpdate: (updatedStaff: StaffProfile) => void }> = ({ staff, onClose, onUpdate }) => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [absentDays, setAbsentDays] = useState<number[]>([]);
    
    useEffect(() => {
        const record = staff.attendanceRecord?.[month] || [];
        setAbsentDays(record);
    }, [staff, month]);

    const toggleDay = (day: number) => {
        const newDays = absentDays.includes(day) 
            ? absentDays.filter(d => d !== day)
            : [...absentDays, day];
        setAbsentDays(newDays);
    };

    const handleSave = () => {
        const newRecord = { ...(staff.attendanceRecord || {}), [month]: absentDays };
        const updatedStaff = { ...staff, attendanceRecord: newRecord };
        onUpdate(updatedStaff);
        alert("Attendance saved successfully.");
        onClose();
    };
    
    const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
    const dailyRate = (staff.salaryConfig?.amount || 0) / 30;
    const deduction = dailyRate * absentDays.length;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1500] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Manage Attendance</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="p-2 border rounded text-sm font-medium" />
                        <div className="text-right">
                             <p className="text-xs text-gray-500 uppercase font-bold">Absent Deduction</p>
                             <p className="text-lg font-bold text-red-600">KES {deduction.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">Click days where staff did not report to work:</p>
                    <div className="grid grid-cols-7 gap-2 mb-6">
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                            <button 
                                key={day} 
                                onClick={() => toggleDay(day)}
                                className={`p-2 rounded text-xs font-bold transition-colors ${absentDays.includes(day) ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    
                    <button onClick={handleSave} className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-md">Save Attendance</button>
                </div>
            </div>
        </div>
    );
};

const PayslipGeneratorModal: React.FC<{ staff: StaffProfile; onClose: () => void }> = ({ staff, onClose }) => {
    const { properties, tenants } = useData();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    
    // Performance Metrics State (For Target Based)
    const [collectionRate, setCollectionRate] = useState(0); 
    const [occupancyRate, setOccupancyRate] = useState(0);   

    // Automatic calculation for Field Agents
    useEffect(() => {
        if (staff.role === 'Field Agent' && staff.salaryConfig?.type === 'Target Based') {
            // 1. Find properties assigned to this agent
            const assignedProperties = properties.filter(p => p.assignedAgentId === staff.id);
            
            if (assignedProperties.length > 0) {
                // Calculate Occupancy Rate
                let totalUnits = 0;
                let occupiedUnits = 0;
                
                assignedProperties.forEach(p => {
                    totalUnits += p.units.length;
                    occupiedUnits += p.units.filter(u => u.status === 'Occupied').length;
                });

                const calculatedOccupancy = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
                setOccupancyRate(Math.round(calculatedOccupancy));

                // Calculate Collection Rate for the selected month
                let totalExpectedRent = 0;
                let totalCollectedRent = 0;

                const propertyIds = assignedProperties.map(p => p.id);
                // Tenants belonging to these properties
                const relevantTenants = tenants.filter(t => propertyIds.includes(t.propertyId || ''));

                relevantTenants.forEach(t => {
                    if (t.status !== 'Vacated' && t.status !== 'Evicted') {
                        totalExpectedRent += t.rentAmount;
                    }
                    const payment = t.paymentHistory.find(p => p.date.startsWith(month) && p.status === 'Paid');
                    if (payment) {
                         totalCollectedRent += t.rentAmount; 
                    }
                });

                const calculatedCollection = totalExpectedRent > 0 ? (totalCollectedRent / totalExpectedRent) * 100 : 0;
                setCollectionRate(Math.round(calculatedCollection));
            } else {
                setCollectionRate(0);
                setOccupancyRate(0);
            }
        }
    }, [staff, month, properties, tenants]);

    const handleShare = (method: 'WhatsApp' | 'Email' | 'SMS') => {
        const message = `Dear ${staff.name}, your payslip for ${month} is ready. Net Pay: KES ${net.toLocaleString()}.`;
        if (method === 'WhatsApp') window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        if (method === 'Email') window.open(`mailto:${staff.email}?subject=Payslip ${month}&body=${encodeURIComponent(message)}`, '_blank');
        if (method === 'SMS') window.open(`sms:${staff.phone}?body=${encodeURIComponent(message)}`, '_blank');
    };
    
    const handleDownload = () => {
        printSection('printable-payslip', `Payslip-${staff.name}-${month}`);
    };

    // Calculation Logic
    let basic = 0;
    let commission = 0;
    let rentComponent = 0;
    let occupancyComponent = 0;
    const isTargetBased = staff.salaryConfig?.type === 'Target Based';

    if (isTargetBased) {
        const targetSalary = staff.salaryConfig?.amount || 0;
        const halfTarget = targetSalary / 2;
        rentComponent = halfTarget * (collectionRate / 100);
        occupancyComponent = halfTarget * (occupancyRate / 100);
    } else {
        basic = staff.salaryConfig?.amount || 0;
        if (staff.salaryConfig?.type === 'Commission') {
             commission = basic * ((staff.salaryConfig.commissionRate || 0)/100);
        }
    }
    
    // Deductions Calculation
    const absentDays = staff.attendanceRecord?.[month]?.length || 0;
    const dailyRate = (staff.salaryConfig?.amount || 0) / 30;
    const absenteeismDeduction = Math.round(absentDays * dailyRate);
    
    const recurringDeductions = (staff.deductions || []).filter(d => d.type === 'Recurring').reduce((sum, d) => sum + d.amount, 0);
    const oneOffDeductions = (staff.deductions || []).filter(d => d.type === 'One-Off').reduce((sum, d) => sum + d.amount, 0);

    const gross = isTargetBased ? (rentComponent + occupancyComponent) : (basic + commission);
    const tax = gross * 0.15; // Mock Tax
    const nhif = 1500;
    const nssf = 1080;
    const totalDeductions = tax + nhif + nssf + absenteeismDeduction + recurringDeductions + oneOffDeductions;
    const net = gross - totalDeductions;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1400] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Generate Payslip</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                    <div className="flex items-center gap-4">
                        <label className="font-medium text-gray-700">Select Period:</label>
                        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="p-2 border rounded-md" />
                    </div>

                    {isTargetBased && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                            <h4 className="font-bold text-blue-800 text-sm flex items-center">
                                Performance Metrics 
                                <span className="ml-2 text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Auto-Calculated</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-blue-700 mb-1">Avg. Rent Collection</label>
                                    <span className="font-bold text-gray-700">{collectionRate}%</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-700 mb-1">Avg. House Occupancy</label>
                                    <span className="font-bold text-gray-700">{occupancyRate}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Area */}
                    <div id="printable-payslip" className="border p-6 rounded-lg bg-gray-50 text-sm">
                        <div className="text-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-bold text-primary uppercase">TaskMe Realty</h2>
                            <p className="text-gray-500">Payslip for {month}</p>
                        </div>
                        <div className="flex justify-between mb-4">
                            <div>
                                <p><strong>Name:</strong> {staff.name}</p>
                                <p><strong>Role:</strong> {staff.role}</p>
                                <p><strong>Dept:</strong> {staff.department}</p>
                            </div>
                            <div className="text-right">
                                <p><strong>Method:</strong> {staff.bankDetails?.defaultMethod || 'Bank'}</p>
                                {staff.bankDetails?.defaultMethod === 'M-Pesa' ? (
                                     <p><strong>Phone:</strong> {staff.bankDetails?.mpesaNumber}</p>
                                ) : (
                                    <p><strong>Bank:</strong> {staff.bankDetails?.bankName}</p>
                                )}
                                <p><strong>PIN:</strong> {staff.bankDetails?.kraPin}</p>
                            </div>
                        </div>
                        
                        <table className="w-full mb-4">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-1">Description</th>
                                    <th className="text-right py-1">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isTargetBased ? (
                                    <>
                                        <tr>
                                            <td>Rent Collection ({collectionRate}%)</td>
                                            <td className="text-right">{rentComponent.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td>House Occupancy ({occupancyRate}%)</td>
                                            <td className="text-right">{occupancyComponent.toLocaleString()}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <>
                                        <tr><td>Basic Salary ({staff.salaryConfig?.type})</td><td className="text-right">{basic.toLocaleString()}</td></tr>
                                        {commission > 0 && <tr><td>Commissions</td><td className="text-right">{commission.toLocaleString()}</td></tr>}
                                    </>
                                )}
                                
                                <tr><td className="pt-2 font-bold">Gross Pay</td><td className="pt-2 text-right font-bold">{gross.toLocaleString()}</td></tr>
                                
                                <tr><td colSpan={2} className="py-2 text-xs font-bold text-gray-500 uppercase">Deductions</td></tr>
                                
                                {absentDays > 0 && (
                                    <tr>
                                        <td className="text-red-600 pl-2">Absenteeism ({absentDays} Days)</td>
                                        <td className="text-right text-red-600">-{absenteeismDeduction.toLocaleString()}</td>
                                    </tr>
                                )}
                                {(staff.deductions || []).map(d => (
                                    <tr key={d.id}>
                                        <td className="text-red-600 pl-2">{d.name} ({d.category})</td>
                                        <td className="text-right text-red-600">-{d.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                
                                <tr><td className="text-red-600 pl-2">PAYE (Tax)</td><td className="text-right text-red-600">-{tax.toLocaleString()}</td></tr>
                                <tr><td className="text-red-600 pl-2">NHIF</td><td className="text-right text-red-600">-{nhif.toLocaleString()}</td></tr>
                                <tr><td className="text-red-600 pl-2">NSSF</td><td className="text-right text-red-600">-{nssf.toLocaleString()}</td></tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-300">
                                    <td className="py-2 font-bold text-lg">Net Pay</td>
                                    <td className="py-2 text-right font-bold text-lg text-primary">KES {net.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => handleShare('WhatsApp')} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"><Icon name="communication" className="w-5 h-5"/></button>
                        <button onClick={() => handleShare('Email')} className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"><Icon name="mail" className="w-5 h-5"/></button>
                        <button onClick={() => handleShare('SMS')} className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"><Icon name="communication" className="w-5 h-5"/></button>
                    </div>
                    <button onClick={handleDownload} className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow hover:bg-primary-dark flex items-center">
                        <Icon name="download" className="w-4 h-4 mr-2" /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

const StaffFormModal: React.FC<{ 
    unit: BusinessUnit; 
    existingStaff?: StaffProfile;
    onClose: () => void; 
    onSave: (staff: StaffProfile) => void 
}> = ({ unit, existingStaff, onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [showOtp, setShowOtp] = useState(false);
    const [formData, setFormData] = useState<Partial<StaffProfile>>(() => {
        if (existingStaff) {
            return { ...existingStaff };
        }
        return {
            name: '', email: '', phone: '', role: 'Field Agent', status: 'Active', branch: 'Headquarters',
            department: unit,
            salaryConfig: { type: 'Monthly', amount: 0 },
            bankDetails: { bankName: '', accountNumber: '', kraPin: '', mpesaNumber: '', defaultMethod: 'Bank' },
            leaveBalance: { annual: 21 },
            commissions: [],
            deductions: [],
            attendanceRecord: {},
            avatar: ''
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseFloat(value) : value;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: val } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }
    };

    const handleProceedSave = () => {
        if (!formData.name || !formData.email) return alert("Name and Email required");
        
        const staffToSave = {
            ...formData,
            id: existingStaff ? existingStaff.id : `staff-${Date.now()}`,
            payrollInfo: { 
                baseSalary: formData.salaryConfig?.amount || 0, 
                nextPaymentDate: formData.payrollInfo?.nextPaymentDate || new Date().toISOString().split('T')[0] 
            }
        } as StaffProfile;

        onSave(staffToSave);
    };

    const handleSubmit = () => {
        // Check if sensitive payment details changed (requiring OTP)
        if (existingStaff) {
            const oldBank = existingStaff.bankDetails;
            const newBank = formData.bankDetails;
            
            const hasChanged = 
                oldBank?.accountNumber !== newBank?.accountNumber ||
                oldBank?.bankName !== newBank?.bankName ||
                oldBank?.mpesaNumber !== newBank?.mpesaNumber ||
                oldBank?.defaultMethod !== newBank?.defaultMethod;

            if (hasChanged) {
                setShowOtp(true);
                return;
            }
        }
        
        handleProceedSave();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1400] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">{existingStaff ? 'Edit Staff Member' : `Add New Staff (${unit})`}</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>
                
                <div className="p-8 space-y-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <h4 className="font-bold text-gray-700 border-b pb-2">Personal Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="p-2 border rounded" />
                                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" />
                                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="p-2 border rounded" />
                                <select name="role" value={formData.role} onChange={handleChange} className="p-2 border rounded bg-white">
                                    <option>Branch Manager</option><option>Field Agent</option><option>Accountant</option><option>Caretaker</option><option>Super Admin</option>
                                </select>
                                <select name="branch" value={formData.branch} onChange={handleChange} className="p-2 border rounded bg-white">
                                    <option>Headquarters</option><option>Kericho Branch</option><option>Kisii Branch</option>
                                </select>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button onClick={() => setStep(2)} className="px-6 py-2 bg-primary text-white rounded font-bold">Next: Financials</button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="space-y-4 animate-fade-in">
                            <h4 className="font-bold text-gray-700 border-b pb-2">Payroll & Financials</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Salary Type</label>
                                    <select name="salaryConfig.type" value={formData.salaryConfig?.type} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                                        <option value="Monthly">Monthly Fixed</option>
                                        <option value="Target Based">Target Based (Split)</option>
                                        <option value="Commission">Commission Only</option>
                                        <option value="Per Project">Per Project</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        {formData.salaryConfig?.type === 'Target Based' ? 'Total Target Salary (KES)' : 'Base Amount / Fee'}
                                    </label>
                                    <input name="salaryConfig.amount" type="number" value={formData.salaryConfig?.amount} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Amount" />
                                </div>
                            </div>

                            {formData.salaryConfig?.type === 'Target Based' && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                                    <p className="font-bold mb-1"><Icon name="info" className="w-4 h-4 inline mr-1"/> Split Logic:</p>
                                    <ul className="list-disc list-inside ml-1 space-y-1 text-xs">
                                        <li><strong>Rent Collection (50%):</strong> KES {(formData.salaryConfig.amount || 0) / 2} (Paid based on % collected)</li>
                                        <li><strong>House Occupancy (50%):</strong> KES {(formData.salaryConfig.amount || 0) / 2} (Paid based on % occupancy)</li>
                                    </ul>
                                    <p className="text-xs mt-2 italic text-blue-600">Note: Ensure this agent is assigned to properties in the Landlord module for tracking.</p>
                                </div>
                            )}

                            {formData.salaryConfig?.type === 'Commission' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commission Rate (%)</label>
                                    <input name="salaryConfig.commissionRate" type="number" value={formData.salaryConfig?.commissionRate || ''} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g. 10" />
                                </div>
                            )}

                            <h5 className="font-bold text-sm text-gray-600 mt-4">Payment Details</h5>
                            
                            {/* Default Method Toggle */}
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Preferred Method:</span>
                                <div className="flex gap-3">
                                    <label className={`cursor-pointer px-3 py-1 rounded text-sm border ${formData.bankDetails?.defaultMethod === 'Bank' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-gray-300 text-gray-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="bankDetails.defaultMethod" 
                                            value="Bank" 
                                            checked={formData.bankDetails?.defaultMethod === 'Bank'} 
                                            onChange={handleChange} 
                                            className="hidden"
                                        /> Bank Transfer
                                    </label>
                                    <label className={`cursor-pointer px-3 py-1 rounded text-sm border ${formData.bankDetails?.defaultMethod === 'M-Pesa' ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'border-gray-300 text-gray-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="bankDetails.defaultMethod" 
                                            value="M-Pesa" 
                                            checked={formData.bankDetails?.defaultMethod === 'M-Pesa'} 
                                            onChange={handleChange} 
                                            className="hidden"
                                        /> M-Pesa
                                    </label>
                                </div>
                            </div>

                            {/* Dynamic Fields based on Method */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                {formData.bankDetails?.defaultMethod === 'Bank' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                                            <input name="bankDetails.bankName" value={formData.bankDetails?.bankName} onChange={handleChange} placeholder="e.g. KCB" className="w-full p-2 border rounded bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                                            <input name="bankDetails.accountNumber" value={formData.bankDetails?.accountNumber} onChange={handleChange} placeholder="0000..." className="w-full p-2 border rounded bg-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">M-Pesa Number</label>
                                        <input name="bankDetails.mpesaNumber" value={formData.bankDetails?.mpesaNumber} onChange={handleChange} placeholder="07..." className="w-full p-2 border rounded bg-white" />
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">KRA PIN (Required)</label>
                                    <input name="bankDetails.kraPin" value={formData.bankDetails?.kraPin} onChange={handleChange} placeholder="A00..." className="w-full p-2 border rounded bg-white uppercase" />
                                </div>
                            </div>

                            <div className="flex justify-between pt-6">
                                <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 rounded text-gray-700">Back</button>
                                <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow-md">
                                    Save Staff
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {showOtp && (
                <OtpModal 
                    message="Changing payment details requires authentication."
                    onClose={() => setShowOtp(false)} 
                    onSuccess={() => { setShowOtp(false); handleProceedSave(); }} 
                />
            )}
        </div>
    );
};

const StaffManagement: React.FC = () => {
    const { staff, addStaff, updateStaff } = useData();
    const [selectedUnit, setSelectedUnit] = useState<BusinessUnit | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [staffForPayslip, setStaffForPayslip] = useState<StaffProfile | null>(null);
    const [staffForDeductions, setStaffForDeductions] = useState<StaffProfile | null>(null);
    const [staffForAttendance, setStaffForAttendance] = useState<StaffProfile | null>(null);
    const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSaveStaff = (staffData: StaffProfile) => {
        if (editingStaff) {
            updateStaff(staffData.id, staffData);
        } else {
            addStaff(staffData);
        }
        setIsAddModalOpen(false);
        setEditingStaff(null);
    };

    const handleUpdateStaffData = (updatedStaff: StaffProfile) => {
        updateStaff(updatedStaff.id, updatedStaff);
        
        // Ensure local state for modals also updates to prevent stale data
        if (staffForDeductions && staffForDeductions.id === updatedStaff.id) {
            setStaffForDeductions(updatedStaff);
        }
        if (staffForAttendance && staffForAttendance.id === updatedStaff.id) {
            setStaffForAttendance(updatedStaff);
        }
    };

    const handleAddClick = () => {
        setEditingStaff(null);
        setIsAddModalOpen(true);
    }

    const handleEditClick = (staffMember: StaffProfile) => {
        setEditingStaff(staffMember);
        setIsAddModalOpen(true);
    }

    const filteredStaff = useMemo(() => {
        if (!selectedUnit) return [];
        return staff.filter(s => 
            s.department === selectedUnit && 
            (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [staff, selectedUnit, searchQuery]);

    const unitStats = useMemo(() => {
        const stats: Record<string, { count: number, totalSalary: number }> = {};
        BUSINESS_UNITS.forEach(u => {
            const unitStaff = staff.filter(s => s.department === u.name);
            stats[u.name] = {
                count: unitStaff.length,
                totalSalary: unitStaff.reduce((sum, s) => sum + (s.salaryConfig?.amount || 0), 0)
            };
        });
        return stats;
    }, [staff]);

    return (
        <div className="space-y-8">
            {selectedUnit && (
                <button onClick={() => setSelectedUnit(null)} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                    <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Staff Management
                </button>
            )}
            
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{selectedUnit ? selectedUnit : 'Staff Management'}</h1>
                    <p className="text-lg text-gray-500 mt-1">
                        {selectedUnit ? `Manage personnel in ${selectedUnit}` : 'Organize your team by Business Unit.'}
                    </p>
                </div>
                {selectedUnit && (
                    <button 
                        onClick={handleAddClick}
                        className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark shadow-sm flex items-center"
                    >
                        <Icon name="plus" className="w-4 h-4 mr-2" /> Add Staff
                    </button>
                )}
            </div>

            {/* Business Unit Grid */}
            {!selectedUnit && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {BUSINESS_UNITS.map((unit) => (
                        <div 
                            key={unit.name} 
                            onClick={() => setSelectedUnit(unit.name)}
                            className={UNIT_CARD_CLASSES}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-full bg-opacity-10 ${unit.color.replace('text-', 'bg-')}`}>
                                    <Icon name={unit.icon} className={`w-6 h-6 ${unit.color}`} />
                                </div>
                                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                                    {unitStats[unit.name].count} Staff
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{unit.name}</h3>
                            <p className="text-xs text-gray-500">Payroll: KES {unitStats[unit.name].totalSalary.toLocaleString()}</p>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-primary transition-colors"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detailed Staff List */}
            {selectedUnit && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <div className="relative w-64">
                            <input 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search staff..." 
                                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                            />
                            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-white text-gray-500 uppercase text-xs font-bold border-b">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Salary Config</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStaff.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {s.avatar || s.name.charAt(0)}
                                            </div>
                                            {s.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{s.role}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex flex-col text-xs">
                                                <span>{s.email}</span>
                                                <span>{s.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex flex-col text-xs">
                                                <span className="font-bold">{s.salaryConfig?.type}</span>
                                                <span>KES {s.salaryConfig?.amount.toLocaleString()}</span>
                                                {s.salaryConfig?.type === 'Target Based' && <span className="text-[9px] text-blue-600 italic">(Split 50/50)</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(s)}
                                                    className="text-gray-600 hover:text-primary font-medium text-xs border border-gray-200 px-3 py-1 rounded hover:bg-gray-50"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => setStaffForDeductions(s)}
                                                    className="text-orange-600 hover:text-orange-800 font-medium text-xs border border-orange-200 px-3 py-1 rounded hover:bg-orange-50"
                                                >
                                                    Deductions
                                                </button>
                                                <button 
                                                    onClick={() => setStaffForAttendance(s)}
                                                    className="text-purple-600 hover:text-purple-800 font-medium text-xs border border-purple-200 px-3 py-1 rounded hover:bg-purple-50"
                                                >
                                                    Attendance
                                                </button>
                                                <button 
                                                    onClick={() => setStaffForPayslip(s)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                                                >
                                                    Payslip
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStaff.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No staff found in this unit.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isAddModalOpen && selectedUnit && (
                <StaffFormModal 
                    unit={selectedUnit} 
                    existingStaff={editingStaff || undefined}
                    onClose={() => { setIsAddModalOpen(false); setEditingStaff(null); }} 
                    onSave={handleSaveStaff} 
                />
            )}

            {staffForPayslip && (
                <PayslipGeneratorModal 
                    staff={staffForPayslip} 
                    onClose={() => setStaffForPayslip(null)} 
                />
            )}

            {staffForDeductions && (
                <DeductionManagerModal
                    staff={staffForDeductions}
                    onClose={() => setStaffForDeductions(null)}
                    onUpdate={handleUpdateStaffData}
                />
            )}

            {staffForAttendance && (
                <AttendanceManagerModal
                    staff={staffForAttendance}
                    onClose={() => setStaffForAttendance(null)}
                    onUpdate={handleUpdateStaffData}
                />
            )}
        </div>
    );
};

export default StaffManagement;
