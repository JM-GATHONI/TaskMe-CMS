
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { NAVIGATION_ITEMS } from '../../constants';
import Icon from '../Icon';

const Permissions: React.FC = () => {
    const { roles, updateRole } = useData();
    const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || '');
    const [selectedModule, setSelectedModule] = useState(NAVIGATION_ITEMS[0].name);

    // Get selected role object
    const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);

    // Handle toggling permission
    const handleToggle = (path: string) => {
        if (!selectedRole) return;

        let newAccessList = [...(selectedRole.accessibleSubmodules || [])];
        if (newAccessList.includes(path)) {
            newAccessList = newAccessList.filter(p => p !== path);
        } else {
            newAccessList.push(path);
        }

        updateRole(selectedRole.id, { accessibleSubmodules: newAccessList });
    };

    // Toggle All for current module
    const handleToggleAllInModule = (allow: boolean) => {
        if (!selectedRole) return;
        const currentModuleItem = NAVIGATION_ITEMS.find(i => i.name === selectedModule);
        if (!currentModuleItem) return;

        let newAccessList = [...(selectedRole.accessibleSubmodules || [])];
        
        currentModuleItem.subModules.forEach(sub => {
            const path = `${selectedModule}/${sub}`;
            if (allow) {
                if (!newAccessList.includes(path)) newAccessList.push(path);
            } else {
                newAccessList = newAccessList.filter(p => p !== path);
            }
        });

        // Also handle parent module visibility logic implicitly or explicitly
        // If allowing all, ensure parent is allowed (if we track parent separately, which we simplify here)
        
        updateRole(selectedRole.id, { accessibleSubmodules: newAccessList });
    };

    // Get submodules for selected module
    const currentSubModules = useMemo(() => {
        return NAVIGATION_ITEMS.find(i => i.name === selectedModule)?.subModules || [];
    }, [selectedModule]);

    if (!selectedRole) return <div className="p-8">No roles defined.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Permissions</h1>
                    <p className="text-lg text-gray-500 mt-1">Configure module and sub-module access for roles.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">User Role</label>
                        <select 
                            value={selectedRoleId} 
                            onChange={e => setSelectedRoleId(e.target.value)} 
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-shadow"
                        >
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Module</label>
                        <select 
                            value={selectedModule} 
                            onChange={e => setSelectedModule(e.target.value)} 
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-shadow"
                        >
                            {NAVIGATION_ITEMS.map(item => (
                                <option key={item.name} value={item.name}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
                        <h3 className="font-bold text-gray-700">Sub-menus in {selectedModule}</h3>
                        <div className="space-x-3">
                            <button 
                                onClick={() => handleToggleAllInModule(true)} 
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700 shadow-sm"
                            >
                                Select All
                            </button>
                            <button 
                                onClick={() => handleToggleAllInModule(false)} 
                                className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded font-bold hover:bg-gray-50"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                        {currentSubModules.map(sub => {
                            const path = `${selectedModule}/${sub}`;
                            const isAllowed = selectedRole.accessibleSubmodules.includes(path);
                            
                            return (
                                <div key={sub} className="p-4 flex items-center justify-between hover:bg-white transition-colors group">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-lg mr-4 ${isAllowed ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                            <Icon name={isAllowed ? 'check' : 'close'} className="w-4 h-4" />
                                        </div>
                                        <span className={`font-medium ${isAllowed ? 'text-gray-900' : 'text-gray-500'}`}>{sub}</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={isAllowed} 
                                            onChange={() => handleToggle(path)} 
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900 w-12">{isAllowed ? 'Allow' : 'Deny'}</span>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start">
                    <Icon name="info" className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Changes to permissions take effect immediately for users with this role. 
                        Unticking a sub-module will hide it from the user's navigation and restrict access.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Permissions;
