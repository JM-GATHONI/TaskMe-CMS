
import React from 'react';
import { MOCK_SCHEDULED_REPORTS } from '../../constants';
import Icon from '../Icon';

const ScheduledReports: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Scheduled Reports</h1>
                    <p className="text-lg text-gray-500 mt-1">Automated insights delivered to your inbox.</p>
                </div>
                <button className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary-dark flex items-center">
                    <Icon name="plus" className="w-4 h-4 mr-2" /> New Schedule
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 uppercase text-gray-500 text-xs font-bold">
                        <tr>
                            <th className="px-4 py-3">Report Name</th>
                            <th className="px-4 py-3">Frequency</th>
                            <th className="px-4 py-3">Recipients</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {MOCK_SCHEDULED_REPORTS.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 font-bold text-gray-800">{r.name}</td>
                                <td className="px-4 py-4 text-gray-600">{r.frequency}</td>
                                <td className="px-4 py-4 text-gray-600">3 Recipients</td>
                                <td className="px-4 py-4 text-center">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button className="text-gray-400 hover:text-red-500">
                                        <Icon name="close" className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduledReports;
