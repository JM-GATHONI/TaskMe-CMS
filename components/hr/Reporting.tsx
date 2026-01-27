
import React from 'react';

const HRReporting: React.FC = () => {
    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/hr-payroll/staff-management'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Staff Management
            </button>
             <div>
                <h1 className="text-3xl font-bold text-gray-800">HR & Payroll Reporting</h1>
                <p className="text-lg text-gray-500 mt-1">Strategic insights.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
                Charts Placeholder
            </div>
        </div>
    );
};

export default HRReporting;
