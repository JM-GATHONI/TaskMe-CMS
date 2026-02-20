
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CommissionRule, User } from '../../types';
import Icon from '../Icon';

const RatesAndRules: React.FC = () => {
    const { commissionRules, updateCommissionRule, users, updateUser } = useData();
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

    const handleGlobalRuleChange = (field: keyof CommissionRule, value: any) => {
        updateCommissionRule({ ...referralRule, [field]: value });
    };

    const handleUserOverride = () => {
        if (!selectedUser) return;
        // Logic to update user with new referral config would go here
        // For now, we'll just simulate it or assume updateUser handles it
        // In a real app, we'd have a specific form for this
        alert(`Configure override for ${selectedUser.name}`);
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
                                value={referralRule.rateValue}
                                onChange={(e) => handleGlobalRuleChange('rateValue', parseFloat(e.target.value))}
                                className="p-3 border rounded-lg flex-1 font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            This rate applies to all users unless a specific override is set.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">User Overrides</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search user to override..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                            <Icon name="search" className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                        
                        {searchTerm && (
                            <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg absolute w-full z-10">
                                {filteredUsers.map(user => (
                                    <div 
                                        key={user.id} 
                                        onClick={() => {
                                            const type = prompt("Enter Rate Type (KES or %)", user.referralConfig?.rateType || 'KES');
                                            if (!type) return;
                                            const val = prompt("Enter Rate Value", user.referralConfig?.rateValue?.toString() || '0');
                                            if (!val) return;
                                            
                                            updateUser({
                                                ...user,
                                                referralConfig: { rateType: type as any, rateValue: parseFloat(val) }
                                            });
                                            setSearchTerm('');
                                        }}
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
                </div>
            </div>
        </div>
    );
};

export default RatesAndRules;
