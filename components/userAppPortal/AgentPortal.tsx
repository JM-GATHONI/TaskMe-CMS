
import React, { useMemo, useState, useEffect } from 'react';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';
import { PropertyForm } from '../registration/Properties';
import { Property, TenantApplication, User, TenantProfile, Task, TaskStatus, TaskPriority, LandlordApplication, StaffProfile } from '../../types';
import { CollectionManagerModal } from '../operations/TaskManagement';
import { ApplicationFormModal, UnifiedRecord } from '../tenants/Applications';
import { NewApplicationModal, ExtendedLandlordApp } from '../landlords/Applications';
import AdBanners from './AdBanners';

// ... (Previous Helper Components like KpiCard and TaskDetailModal remain unchanged) ...
// Since I am modifying the full file to ensure context safety, I include them below.

const KpiCard: React.FC<{ title: string; value: string; subtext?: string; icon: string; color: string }> = ({ title, value, subtext, icon, color }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4`} style={{ borderLeftColor: color }}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
                <Icon name={icon} className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
    </div>
);

const TaskDetailModal: React.FC<{ task: Task; onClose: () => void; onUpdate: (task: Task) => void }> = ({ task, onClose, onUpdate }) => {
    const [status, setStatus] = useState(task.status);
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        const updatedTask = { 
            ...task, 
            status, 
            history: [...task.history, { id: `h-${Date.now()}`, timestamp: new Date().toLocaleString(), event: `Status updated to ${status}. Note: ${notes}` }]
        };
        onUpdate(updatedTask);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[1700] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Manage Task</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded border">
                        <p className="font-bold text-gray-800">{task.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <div className="flex gap-2 mt-2 text-xs text-gray-500">
                            <span>{task.property}</span> • <span>{task.tenant.name}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                            <option value="Issued">Issued</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Update Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded" rows={3} placeholder="Describe work done or status update..."></textarea>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded text-gray-700 font-bold">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded font-bold">Update Task</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgentPortal: React.FC = () => {
    const { 
        staff, tasks, properties, applications, tenants, landlords, 
        addApplication, addLandlord, addProperty, updateProperty, 
        updateTask, addTenant, addMessage, updateTenant, addLandlordApplication,
        currentUser
    } = useData();
    
    // Updated tab state to include Vacancies and reordered
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Tasks' | 'Vacancies' | 'My Properties' | 'My Tenants' | 'My Landlords'>('Dashboard');
    
    const [modalOpen, setModalOpen] = useState<'none' | 'addTenant' | 'addLandlord' | 'addProperty'>('none');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedCollectionTenant, setSelectedCollectionTenant] = useState<TenantProfile | null>(null);
    const [taskTypeFilter, setTaskTypeFilter] = useState<'Work Orders' | 'Collections'>('Work Orders');
    const [tenantFilter, setTenantFilter] = useState('All');

    const agent = useMemo(() => {
        if (currentUser && currentUser.role === 'Field Agent') {
            return currentUser as StaffProfile;
        }
        return staff.find(s => s.role === 'Field Agent') || staff[0];
    }, [staff, currentUser]);

    // Live Data Filters
    const myTasks = useMemo(() => tasks.filter(t => t.assignedTo === agent.name && t.status !== 'Closed'), [tasks, agent]);
    const myProperties = useMemo(() => properties.filter(p => p.assignedAgentId === agent.id), [properties, agent]);
    const myPropertyIds = useMemo(() => myProperties.map(p => p.id), [myProperties]);
    const myTenants = useMemo(() => tenants.filter(t => t.propertyId && myPropertyIds.includes(t.propertyId)), [tenants, myPropertyIds]);
    const myLandlords = useMemo(() => landlords.filter(l => myProperties.some(p => p.landlordId === l.id)), [landlords, myProperties]);

    // NEW: My Vacant Units
    const myVacantUnits = useMemo(() => {
        return myProperties.flatMap(p => 
            p.units.filter(u => u.status === 'Vacant').map(u => ({
                ...u,
                propertyName: p.name,
                location: p.location || p.branch,
                defaultRent: u.rent || p.defaultMonthlyRent
            }))
        );
    }, [myProperties]);

    const filteredMyTenants = useMemo(() => {
        let result = myTenants;
        switch (tenantFilter) {
            case 'Arrears': return result.filter(t => t.status === 'Overdue');
            case 'Fines': return result.filter(t => t.outstandingFines.some(f => f.status === 'Pending'));
            case 'Partial':
                return result.filter(t => {
                    if (t.status !== 'Overdue') return false;
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const paid = t.paymentHistory
                        .filter(p => p.date.startsWith(currentMonth) && p.status === 'Paid')
                        .reduce((sum, p) => sum + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);
                    return paid > 0 && paid < t.rentAmount;
                });
            case 'No Deposit': return result.filter(t => (t.depositPaid || 0) <= 0);
            case 'No Lease': return result.filter(t => t.leaseType === 'Open' || !t.leaseEnd);
            default: return result;
        }
    }, [myTenants, tenantFilter]);

    const collectionTasks = useMemo(() => myTenants.filter(t => t.status === 'Overdue'), [myTenants]);

    const totalCommission = useMemo(() => {
        return (agent.commissions || []).reduce((sum, c) => sum + c.amount, 0);
    }, [agent]);

    const myLeads = useMemo(() => applications.filter(a => a.status === 'New' || a.status === 'Under Review'), [applications]);
    
    const occupancyRate = useMemo(() => {
        const totalUnits = myProperties.reduce((acc, p) => acc + p.units.length, 0);
        const occupied = myProperties.reduce((acc, p) => acc + p.units.filter(u => u.status === 'Occupied').length, 0);
        return totalUnits > 0 ? Math.round((occupied/totalUnits)*100) : 0;
    }, [myProperties]);

    const collectionStats = useMemo(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const expected = myTenants.reduce((sum, t) => sum + (t.status !== 'Vacated' ? t.rentAmount : 0), 0);
        const collected = myTenants.reduce((sum, t) => {
            return sum + t.paymentHistory.filter(p => p.date.startsWith(currentMonth) && p.status === 'Paid').reduce((s, p) => s + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0), 0);
        }, 0);
        const rate = expected > 0 ? Math.round((collected/expected)*100) : 0;
        return { collected, rate };
    }, [myTenants]);

    const handleRegisterTenant = (data: UnifiedRecord) => {
        // ... (existing logic) ...
        if (data.recordType === 'Application') {
             const newApp: TenantApplication = {
                id: `app-${Date.now()}`,
                name: data.name || '',
                phone: data.phone || '',
                email: data.email || '',
                property: data.propertyName,
                propertyId: data.propertyId,
                unit: data.unit,
                unitId: data.unitId,
                status: 'New',
                submittedDate: new Date().toISOString().split('T')[0],
                source: 'Agent',
                rentAmount: data.rentAmount,
                depositPaid: data.depositPaid
            };
            addApplication(newApp);
            alert("Tenant application submitted for review.");
        } else {
             const newTenant: TenantProfile = {
                 id: data.id || `t-${Date.now()}`,
                 name: data.name || '',
                 email: data.email || '',
                 phone: data.phone || '',
                 status: 'Active',
                 propertyId: data.propertyId,
                 propertyName: data.propertyName,
                 unitId: data.unitId,
                 unit: data.unit || '',
                 rentAmount: data.rentAmount || 0,
                 depositPaid: data.depositPaid || 0,
                 onboardingDate: data.rentStartDate || new Date().toISOString().split('T')[0],
                 idNumber: data.idNumber || '',
                 paymentHistory: [],
                 outstandingBills: [],
                 outstandingFines: [],
                 maintenanceRequests: [],
                 notes: [],
                 leaseType: 'Fixed',
                 rentDueDate: 5
             };
             addTenant(newTenant);
             alert("Tenant registered active successfully.");
        }
        setModalOpen('none');
    };

    const handleRegisterLandlord = (app: ExtendedLandlordApp) => {
        addLandlordApplication(app as unknown as LandlordApplication);
        setModalOpen('none');
        alert("Landlord application submitted successfully.");
    };

    const handleAddProperty = (prop: Property) => {
        if (prop.id) updateProperty(prop.id, prop);
        else addProperty({ ...prop, id: `prop-${Date.now()}`, units: [], assignedAgentId: agent.id });
        setModalOpen('none');
        alert("Property added/updated successfully.");
    };

    const handleUpdateTask = (updatedTask: Task) => {
        updateTask(updatedTask.id, updatedTask);
        setSelectedTask(null);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600 border-2 border-white shadow-sm">
                        {agent.avatar || agent.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{agent.name}</h1>
                        <p className="text-sm text-gray-500">{agent.role} • {agent.branch}</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    <button onClick={() => setModalOpen('addTenant')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm flex items-center text-sm">
                        <Icon name="plus" className="w-4 h-4 mr-2"/> Tenant
                    </button>
                     <button onClick={() => setModalOpen('addLandlord')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-sm flex items-center text-sm">
                        <Icon name="plus" className="w-4 h-4 mr-2"/> Landlord
                    </button>
                     <button onClick={() => setModalOpen('addProperty')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm flex items-center text-sm">
                        <Icon name="plus" className="w-4 h-4 mr-2"/> Property
                    </button>
                </div>
            </div>

            {/* Navigation Tabs - Reordered */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
                {['Dashboard', 'Tasks', 'Vacancies', 'My Properties', 'My Tenants', 'My Landlords'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white shadow text-primary' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Dashboard' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard title="Commissions (YTD)" value={`KES ${Number(totalCommission ?? 0).toLocaleString()}`} subtext="Paid & Pending" icon="revenue" color="#10b981" />
                        <KpiCard title="Active Leads" value={myLeads.length.toString()} subtext="Potential Tenants" icon="tenants" color="#3b82f6" />
                        <KpiCard title="Collection Rate" value={`${collectionStats.rate}%`} subtext={`KES ${(collectionStats.collected/1000).toFixed(1)}k Collected`} icon="payments" color="#f59e0b" />
                        <KpiCard title="Portfolio Occ." value={`${occupancyRate}%`} subtext={`${myProperties.length} Properties`} icon="branch" color="#8b5cf6" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* High Priority Tasks */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                Priority Tasks
                            </h3>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {myTasks.length > 0 ? myTasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTask(task)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {task.priority}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">{new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{task.property} • {task.tenant.name}</p>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-400 py-8 text-sm">No active tasks assigned.</p>
                                )}
                            </div>
                        </div>

                        {/* Collections Snapshot */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                 <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                 Overdue Collections ({collectionTasks.length})
                            </h3>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                 {collectionTasks.length > 0 ? collectionTasks.slice(0, 5).map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                                            <p className="text-xs text-red-500 font-bold">Arrears: KES {Number(t.rentAmount ?? 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500">{t.unit} - {t.propertyName}</p>
                                        </div>
                                        <button onClick={() => setSelectedCollectionTenant(t)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100">
                                            Action
                                        </button>
                                    </div>
                                 )) : (
                                     <p className="text-center text-gray-400 py-8 text-sm">No pending collections.</p>
                                 )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'My Properties' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Assigned Portfolio</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myProperties.map(prop => (
                            <div key={prop.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group">
                                 <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{prop.name}</h4>
                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold">{prop.type}</span>
                                 </div>
                                 <p className="text-xs text-gray-500 mb-3">{prop.location || prop.branch}</p>
                                 <div className="flex justify-between text-xs font-medium text-gray-600 bg-gray-50 p-2 rounded">
                                     <span>{prop.units.length} Units</span>
                                     <span>{prop.units.filter(u => u.status === 'Occupied').length} Occupied</span>
                                 </div>
                            </div>
                        ))}
                        {myProperties.length === 0 && <p className="col-span-3 text-center text-gray-400 py-4">No properties assigned.</p>}
                    </div>
                </div>
            )}
            
            {/* NEW: Vacancies Tab */}
            {activeTab === 'Vacancies' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Icon name="vacant-house" className="w-5 h-5 mr-2 text-red-500"/>
                        My Vacant Units ({myVacantUnits.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myVacantUnits.length > 0 ? myVacantUnits.map(unit => (
                            <div key={unit.id} className="p-4 border border-red-200 bg-red-50/20 rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-gray-800">{unit.unitNumber}</h4>
                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">VACANT</span>
                                </div>
                                <p className="text-xs text-gray-600 font-bold mb-1">{unit.propertyName}</p>
                                <p className="text-xs text-gray-500 mb-3">{unit.location}</p>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                    <span className="font-bold text-blue-600 text-sm">KES {Number(unit.defaultRent ?? 0).toLocaleString()}</span>
                                    <button 
                                        className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-700"
                                        onClick={() => {
                                            // Pre-fill tenant registration form would be ideal here
                                            setModalOpen('addTenant');
                                        }}
                                    >
                                        Register Tenant
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-12 text-center">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                                    <Icon name="check" className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700">Fully Occupied!</h3>
                                <p className="text-gray-500 text-sm">Great job. You have no vacant units in your assigned properties.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'My Tenants' && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="text-lg font-bold text-gray-800">Managed Tenants</h3>
                        <div className="flex flex-wrap gap-2 items-center">
                            <button 
                                onClick={() => setModalOpen('addTenant')}
                                className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:bg-primary-dark flex items-center mr-2"
                            >
                                <Icon name="plus" className="w-3 h-3 mr-1"/> Register Tenant
                            </button>
                            {['All', 'Arrears', 'Fines', 'Partial', 'No Deposit', 'No Lease'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setTenantFilter(filter)}
                                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                                        tenantFilter === filter 
                                        ? 'bg-primary text-white border-primary' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Property</th>
                                    <th className="px-4 py-3">Unit</th>
                                    <th className="px-4 py-3">Rent</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredMyTenants.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{t.phone}</td>
                                        <td className="px-4 py-3 text-gray-600">{t.propertyName}</td>
                                        <td className="px-4 py-3 text-gray-600">{t.unit}</td>
                                        <td className="px-4 py-3 text-gray-800 font-bold">KES {t.rentAmount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${t.status === 'Active' ? 'bg-green-100 text-green-700' : t.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span></td>
                                    </tr>
                                ))}
                                {filteredMyTenants.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No tenants found for filter "{tenantFilter}".</td></tr>}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}

            {activeTab === 'My Landlords' && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Associated Landlords</h3>
                        <button 
                            onClick={() => setModalOpen('addLandlord')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:bg-purple-700 flex items-center"
                        >
                            <Icon name="plus" className="w-3 h-3 mr-1"/> Register Landlord
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myLandlords.map(l => (
                            <div key={l.id} className="p-4 border rounded-lg flex items-center gap-4 hover:shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                    {l.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{l.name}</h4>
                                    <p className="text-xs text-gray-500">{l.phone}</p>
                                </div>
                            </div>
                        ))}
                        {myLandlords.length === 0 && <p className="col-span-2 text-center text-gray-400 py-4">No landlords associated.</p>}
                    </div>
                </div>
            )}
            
            {activeTab === 'Tasks' && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b flex gap-4 bg-gray-50">
                        <button 
                            onClick={() => setTaskTypeFilter('Work Orders')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${taskTypeFilter === 'Work Orders' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}
                        >
                            Work Orders ({myTasks.filter(t => t.status !== 'Completed').length})
                        </button>
                        <button 
                            onClick={() => setTaskTypeFilter('Collections')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${taskTypeFilter === 'Collections' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border'}`}
                        >
                            Collections ({collectionTasks.length})
                        </button>
                    </div>

                    {taskTypeFilter === 'Work Orders' && (
                        <div className="overflow-auto flex-grow p-4">
                            <div className="space-y-3">
                                {myTasks.length > 0 ? myTasks.map(task => (
                                    <div key={task.id} className="p-4 bg-white border rounded-xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTask(task)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {task.priority}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">{new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{task.property} • {task.tenant.name}</p>
                                        <div className="mt-3 flex justify-end">
                                            <button className="text-xs font-bold text-primary hover:underline">Update Status</button>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-400 py-8 text-sm">No active tasks assigned.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {taskTypeFilter === 'Collections' && (
                        <div className="p-4 grid grid-cols-1 gap-4 overflow-auto flex-grow">
                            {collectionTasks.map(tenant => (
                                <div key={tenant.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{tenant.name}</h4>
                                            <p className="text-xs text-gray-500">{tenant.propertyName} - {tenant.unit}</p>
                                        </div>
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Overdue</span>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded text-red-800 font-bold text-lg mb-3 text-center">
                                        KES {tenant.rentAmount.toLocaleString()}
                                    </div>
                                    
                                    {/* History Snippet */}
                                    {tenant.collectionHistory && tenant.collectionHistory.length > 0 && (
                                        <div className="mb-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            <p className="font-bold text-gray-400 uppercase text-[10px]">Last Interaction:</p>
                                            <p>{tenant.collectionHistory[0].date.split(',')[0]} - {tenant.collectionHistory[0].outcome}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                            <a href={`tel:${tenant.phone}`} className="flex items-center justify-center py-2 border border-gray-300 rounded hover:bg-gray-50 font-bold text-xs text-gray-700">
                                            <Icon name="communication" className="w-3 h-3 mr-1"/> Call
                                        </a>
                                        <button 
                                            onClick={() => setSelectedCollectionTenant(tenant)} 
                                            className="flex items-center justify-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold text-xs"
                                        >
                                            Log Feedback
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {collectionTasks.length === 0 && (
                                <div className="col-span-full p-8 text-center text-gray-400 bg-green-50 rounded-lg border border-green-100">
                                    <Icon name="check" className="w-12 h-12 text-green-300 mx-auto mb-2" />
                                    <p>No collection tasks! All assigned tenants are up to date.</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
            )}

            {/* Modals for Adding Entities */}
            {modalOpen === 'addTenant' && (
                <ApplicationFormModal 
                    onClose={() => setModalOpen('none')} 
                    onSave={handleRegisterTenant} 
                    properties={myProperties} 
                    record={{ recordType: 'Application', displayStatus: 'New', source: 'Agent' }}
                />
            )}
            {modalOpen === 'addLandlord' && (
                <NewApplicationModal 
                    onClose={() => setModalOpen('none')} 
                    onSave={handleRegisterLandlord} 
                />
            )}
            {modalOpen === 'addProperty' && (
                <PropertyForm 
                    property={{ assignedAgentId: agent.id, branch: agent.branch, floors: 1 }} 
                    onCancel={() => setModalOpen('none')} 
                    onSave={handleAddProperty}
                    landlords={landlords}
                    staff={staff}
                />
            )}
            {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateTask} />}
            {selectedCollectionTenant && (
                <CollectionManagerModal 
                    tenant={selectedCollectionTenant} 
                    onClose={() => setSelectedCollectionTenant(null)} 
                    onUpdateTenant={updateTenant} 
                    onSendMessage={addMessage} 
                />
            )}

            {/* Advert Banners */}
            <AdBanners />
        </div>
    );
};

export default AgentPortal;
