
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { NAVIGATION_ITEMS, WIDGET_REGISTRY } from '../../constants';
import Icon from '../Icon';
import { Role } from '../../types';

// Fallback for modules without specific widgets defined
const DEFAULT_WIDGETS = [
    { id: 'default_header', name: 'Page Header' },
    { id: 'default_stats', name: 'Summary Statistics' },
    { id: 'default_table', name: 'Main Data Table' }
];

const Widgets: React.FC = () => {
    const { roles, updateRole } = useData();
    const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
    const [selectedModuleName, setSelectedModule] = useState<string>('Dashboard');

    // Derived State
    const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);
    
    // Get available widgets for the selected module
    const availableWidgets = useMemo(() => {
        // Match partial module names if exact match not found (e.g. "Tenants/Overview" -> "Tenants")
        const key = Object.keys(WIDGET_REGISTRY).find(k => selectedModuleName.startsWith(k));
        return key ? WIDGET_REGISTRY[key] : DEFAULT_WIDGETS;
    }, [selectedModuleName]);

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRoleId(e.target.value);
    };

    const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModule(e.target.value);
    };

    const toggleWidgetAccess = (widgetId: string) => {
        if (!selectedRole) return;
        
        const currentAccess = selectedRole.widgetAccess || [];
        let newAccess: string[];

        if (currentAccess.includes(widgetId)) {
            newAccess = currentAccess.filter(id => id !== widgetId);
        } else {
            newAccess = [...currentAccess, widgetId];
        }

        updateRole(selectedRole.id, { widgetAccess: newAccess });
    };

    const handleSelectAll = (select: boolean) => {
        if (!selectedRole) return;
        
        const widgetIds = availableWidgets.map(w => w.id);
        const currentAccess = selectedRole.widgetAccess || [];
        let newAccess: string[];

        if (select) {
            // Add all missing IDs
            const missing = widgetIds.filter(id => !currentAccess.includes(id));
            newAccess = [...currentAccess, ...missing];
        } else {
            // Remove all current module IDs
            newAccess = currentAccess.filter(id => !widgetIds.includes(id));
        }
        
        updateRole(selectedRole.id, { widgetAccess: newAccess });
    };

    if (!selectedRole) return <div className="p-8">No roles available.</div>;

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Widgets Permissions</h1>
                    <p className="text-lg text-gray-500 mt-1">Configure visibility of dashboard components per user role.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">User Role</label>
                        <select 
                            value={selectedRoleId} 
                            onChange={handleRoleChange} 
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-shadow text-gray-700 font-medium"
                        >
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Submenu Module</label>
                        <select 
                            value={selectedModuleName} 
                            onChange={handleModuleChange} 
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-shadow text-gray-700 font-medium"
                        >
                            {NAVIGATION_ITEMS.map(item => (
                                <React.Fragment key={item.name}>
                                    <option value={item.name}>{item.name}</option>
                                    {item.subModules.map(sub => (
                                        <option key={`${item.name}/${sub}`} value={`${item.name}/${sub}`}>&nbsp;&nbsp;&nbsp;{sub}</option>
                                    ))}
                                </React.Fragment>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-gray-700">Widgets</h3>
                        <div className="space-x-3">
                            <button 
                                onClick={() => handleSelectAll(true)} 
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded font-bold hover:bg-blue-100 border border-blue-200 transition-colors"
                            >
                                Allow All
                            </button>
                            <button 
                                onClick={() => handleSelectAll(false)} 
                                className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded font-bold hover:bg-gray-50 transition-colors"
                            >
                                Disallow All
                            </button>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                        {availableWidgets.map((widget, index) => {
                            const isAllowed = (selectedRole.widgetAccess || []).includes(widget.id);
                            
                            return (
                                <div key={widget.id} className={`flex items-center justify-between p-4 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50`}>
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-lg mr-4 ${isAllowed ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                            <Icon name={isAllowed ? 'check' : 'close'} className="w-4 h-4" />
                                        </div>
                                        <span className={`font-medium ${isAllowed ? 'text-gray-900' : 'text-gray-500'}`}>{widget.name}</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={isAllowed} 
                                            onChange={() => toggleWidgetAccess(widget.id)} 
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-bold text-gray-700 w-16 text-right">{isAllowed ? 'Allow' : 'Deny'}</span>
                                    </label>
                                </div>
                            );
                        })}
                         {availableWidgets.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No configurable widgets for this module.</div>
                        )}
                    </div>
                </div>
                
                 <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
                    <Icon name="info" className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <p className="text-sm text-blue-800">
                        <strong>Configuration Note:</strong> Changes to widget permissions are applied immediately. 
                        Users will see the updated dashboard layout upon their next login or page refresh.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Widgets;
