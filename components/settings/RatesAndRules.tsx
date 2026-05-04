
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { CommissionRule, User } from '../../types';
import Icon from '../Icon';

const RatesAndRules: React.FC = () => {
    const { commissionRules, updateCommissionRule, addCommissionRule, users, updateUser, systemSettings, updateSystemSettings } = useData();
    const bulkSmsEnabled = systemSettings?.bulkSmsEnabled ?? false;

    const handleToggleBulkSms = () => {
        updateSystemSettings({ bulkSmsEnabled: !bulkSmsEnabled });
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Find the global Tenancy Referral Rule
    const referralRule = commissionRules.find(r => r.trigger === 'Tenancy Referral') || {
        id: 'new-ref-rule',
        trigger: 'Tenancy Referral',
        rateType: 'KES',
        rateValue: 200,
        description: 'Default referral bonus',
        appliesTo: 'Tenant'
    };

    // Local state for the input to allow empty/decimal typing
    const [localRateValue, setLocalRateValue] = useState<string>(referralRule.rateValue.toString());

    useEffect(() => {
        setLocalRateValue(referralRule.rateValue.toString());
    }, [referralRule.rateValue]);

    const handleGlobalRuleChange = (field: keyof CommissionRule, value: any) => {
        // Handle NaN for number fields
        const safeValue = (field === 'rateValue' && typeof value === 'number' && isNaN(value)) ? 0 : value;

        if (referralRule.id === 'new-ref-rule') {
            const exists = commissionRules.some(r => r.id === referralRule.id);
            if (!exists) {
                addCommissionRule({ ...referralRule, [field]: safeValue });
                return;
            }
        }
        updateCommissionRule(referralRule.id, { [field]: safeValue });
    };

    const handleRateBlur = () => {
        const val = parseFloat(localRateValue);
        handleGlobalRuleChange('rateValue', isNaN(val) ? 0 : val);
    };

    const [overrideConfig, setOverrideConfig] = useState<{ rateType: 'KES' | '%', rateValue: string | number }>({ rateType: 'KES', rateValue: '' });

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setSearchTerm('');
        if (user.referralConfig) {
            setOverrideConfig(user.referralConfig);
        } else {
            setOverrideConfig({ rateType: 'KES', rateValue: '' });
        }
    };

    const saveUserOverride = () => {
        if (!selectedUser) return;
        updateUser(selectedUser.id, {
            referralConfig: {
                rateType: overrideConfig.rateType,
                rateValue: Number(overrideConfig.rateValue) || 0
            }
        });
        setSelectedUser(null);
        alert(`Override saved for ${selectedUser.name}`);
    };

    const clearUserOverride = () => {
        if (!selectedUser) return;
        updateUser(selectedUser.id, {
            referralConfig: undefined
        });
        setSelectedUser(null);
        alert(`Override removed for ${selectedUser.name}`);
    };

    const filteredUsers = (users || []).filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Rates & Rules</h1>
                    <p className="text-gray-500 mt-1">Manage commission structures and system constants.</p>
                </div>
            </div>

            {/* Global Referral Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Icon name="settings" className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Referral Program Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Global Default Commission</label>
                        <div className="flex gap-4 items-center">
                            <select 
                                value={referralRule.rateType}
                                onChange={(e) => handleGlobalRuleChange('rateType', e.target.value)}
                                className="p-3 border rounded-lg bg-gray-50 font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                <option value="KES">Fixed Amount (KES)</option>
                                <option value="%">Percentage of Rent (%)</option>
                            </select>
                            <input 
                                type="number" 
                                value={localRateValue}
                                onChange={(e) => setLocalRateValue(e.target.value)}
                                onBlur={handleRateBlur}
                                className="p-3 border rounded-lg flex-1 font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            This rate applies to all users unless a specific override is set.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">User Overrides</label>
                        
                        {!selectedUser ? (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search user to override..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                                <Icon name="search" className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                
                                {searchTerm && (
                                    <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg absolute w-full z-10">
                                        {filteredUsers.map(user => (
                                            <div 
                                                key={user.id} 
                                                onClick={() => handleUserSelect(user)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                                            >
                                                <div>
                                                    <p className="font-bold text-sm">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.role}</p>
                                                </div>
                                                {user.referralConfig && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
                                                        {user.referralConfig.rateType === 'KES' ? 'KES ' : ''}{user.referralConfig.rateValue}{user.referralConfig.rateType === '%' ? '%' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="font-bold text-gray-800">{selectedUser.name}</p>
                                        <p className="text-xs text-gray-500">{selectedUser.role}</p>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)} className="text-xs text-gray-400 hover:text-gray-600">Change User</button>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Override Type</label>
                                        <select 
                                            value={overrideConfig.rateType}
                                            onChange={(e) => setOverrideConfig({ ...overrideConfig, rateType: e.target.value as any })}
                                            className="w-full p-2 border rounded bg-white text-sm"
                                        >
                                            <option value="KES">Fixed Amount (KES)</option>
                                            <option value="%">Percentage (%)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Override Value</label>
                                        <input 
                                            type="number" 
                                            value={overrideConfig.rateValue}
                                            onChange={(e) => setOverrideConfig({ ...overrideConfig, rateValue: e.target.value })}
                                            className="w-full p-2 border rounded text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={saveUserOverride} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700">Save Override</button>
                                        <button onClick={clearUserOverride} className="px-3 py-2 bg-red-100 text-red-600 rounded text-sm font-bold hover:bg-red-200">Clear</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Bulk SMS Integration */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <Icon name="communication" className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Bulk SMS Integration</h2>
                        <p className="text-sm text-gray-500">Provider: OnfonMedia &mdash; Sender ID: TASK-ME</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <p className="font-bold text-gray-800">Enable Bulk SMS</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {bulkSmsEnabled
                                ? 'Bulk SMS is active. Automated reminders and manual messages will be sent.'
                                : 'Bulk SMS is off. No messages will be dispatched (manual or automated).'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleBulkSms}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${
                            bulkSmsEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={bulkSmsEnabled ? 'Click to disable Bulk SMS' : 'Click to enable Bulk SMS'}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                bulkSmsEnabled ? 'translate-x-8' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {!bulkSmsEnabled && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <Icon name="info" className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                        <p>Bulk SMS is currently disabled. Any attempt to send a message will display a notice to contact the super-admin to enable it.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RatesAndRules;
