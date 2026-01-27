
import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';

const StaffPerformance: React.FC = () => {
    const { staff, tasks } = useData();

    // Mock calculations
    const leaderboard = useMemo(() => {
        return staff.map(s => {
            const completed = tasks.filter(t => t.assignedTo === s.name && t.status === 'Completed').length;
            const points = completed * 10 + Math.floor(Math.random() * 50); // Mock gamification
            return { ...s, completedTasks: completed, points };
        }).sort((a,b) => b.points - a.points);
    }, [staff, tasks]);

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Staff Performance</h1>
                <p className="text-lg text-gray-500 mt-1">Gamified leaderboards and productivity tracking.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Leaderboard - Main Feature */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b bg-gradient-to-r from-indigo-900 to-blue-800 text-white flex justify-between items-center">
                        <h3 className="text-xl font-bold">Agent Leaderboard</h3>
                        <Icon name="hr" className="w-6 h-6 opacity-80" />
                    </div>
                    <div className="p-2">
                        {leaderboard.map((s, index) => (
                            <div key={s.id} className={`flex items-center p-4 rounded-lg mb-2 ${index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-gray-50'}`}>
                                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${
                                    index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                                    index === 1 ? 'bg-gray-300 text-gray-800' : 
                                    index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-gray-800">{s.name}</h4>
                                    <p className="text-xs text-gray-500">{s.role} • {s.branch}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-extrabold text-lg text-indigo-600">{s.points} XP</p>
                                    <p className="text-xs text-gray-400">{s.completedTasks} Tasks</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side Stats */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <Icon name="check" className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Top Performer</h3>
                        <p className="text-primary font-bold text-xl mt-1">{leaderboard[0]?.name}</p>
                        <p className="text-sm text-gray-500 mt-2">Highest completion rate this month.</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Team Velocity</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Task Resolution</span>
                                    <span className="font-bold">2.4 Days</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full"><div className="bg-blue-500 h-2 rounded-full" style={{width: '70%'}}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Lease Processing</span>
                                    <span className="font-bold">4.1 Days</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full"><div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Response Time</span>
                                    <span className="font-bold">2 Hrs</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full"><div className="bg-purple-500 h-2 rounded-full" style={{width: '95%'}}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffPerformance;
