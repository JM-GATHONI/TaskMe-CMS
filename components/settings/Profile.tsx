
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

const Profile: React.FC = () => {
    const { systemSettings, updateSystemSettings } = useData();
    const [companyName, setCompanyName] = useState(systemSettings.companyName || '');
    
    // Sync state if context changes
    useEffect(() => {
        setCompanyName(systemSettings.companyName);
    }, [systemSettings]);

    const handleSave = () => {
        updateSystemSettings({ companyName });
        alert("System settings updated.");
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <button onClick={() => window.location.hash = '#/dashboard'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Dashboard
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">System Profile</h1>
                <p className="text-lg text-gray-500 mt-1">Manage company branding and global settings.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm space-y-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">General Information</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input 
                            value={companyName} 
                            onChange={e => setCompanyName(e.target.value)} 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-shadow"
                        />
                    </div>
                    
                    {/* Logo upload is handled in Header, but could be added here too if needed */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                        <p><strong>Note:</strong> Use the header logo area to update your company logo and profile picture.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-md transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
