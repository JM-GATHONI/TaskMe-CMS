
import React from 'react';
import { useData } from '../../context/DataContext';

const LeaveAttendance: React.FC = () => {
    const { staff } = useData();

    return (
        <div className="space-y-8">
            <button onClick={() => window.location.hash = '#/hr-payroll/staff-management'} className="group flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                <span className="transform transition-transform group-hover:-translate-x-1 mr-2">←</span> Back to Staff Management
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Leave & Attendance</h1>
                <p className="text-lg text-gray-500 mt-1">Manage staff time off.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staff.map(s => (
                        <div key={s.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-800">{s.name}</h3>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                            </div>
                            <p className="text-sm text-gray-500">{s.role}</p>
                            <div className="mt-3 flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Annual Leave</p>
                                    <p className="text-xl font-bold text-blue-600">{s.leaveBalance.annual} Days</p>
                                </div>
                                <button className="text-xs text-primary font-semibold hover:underline">Manage</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LeaveAttendance;
