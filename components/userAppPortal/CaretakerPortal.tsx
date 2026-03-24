
import React, { useState, useMemo } from 'react';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import AdBanners from './AdBanners';
import { useProfileFirstName } from '../../hooks/useProfileFirstName';

const CaretakerPortal: React.FC = () => {
    const { tasks, staff, addTask, updateTask, currentUser, isDataLoading } = useData();
    const [reportDescription, setReportDescription] = useState('');
    // Prefer actual logged-in user if they are a caretaker; otherwise fall back to staff list (demo)
    const caretaker = useMemo(() => {
        if (currentUser && currentUser.role === 'Caretaker') return currentUser;
        return staff.find(s => s.role === 'Caretaker') || staff[0];
    }, [currentUser, staff]);
    const caretakerName = (caretaker as any)?.name as string | undefined;
    const { firstName, loading: profileLoading } = useProfileFirstName({ nameFallback: caretakerName });

    const myTasks = useMemo(() => {
        if (!caretakerName) return [];
        return tasks
            .filter(t => t.assignedTo === caretakerName && t.status !== 'Closed')
            .sort((a,b) => b.priority === 'High' ? 1 : -1);
    }, [tasks, caretakerName]);

    const completedToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        // In real app check completion date
        if (!caretakerName) return 0;
        return tasks.filter(t => t.assignedTo === caretakerName && t.status === 'Completed').length;
    }, [tasks, caretakerName]);

    const handleReportIssue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportDescription) return;

        const newTask: Task = {
            id: `TASK-${Date.now()}`,
            title: 'Issue Reported by Caretaker',
            description: reportDescription,
            status: TaskStatus.Issued,
            priority: TaskPriority.Medium,
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            sla: 24,
            assignedTo: 'Unassigned',
            tenant: { name: 'N/A', unit: 'Common Area' },
            property: caretaker.branch || 'General',
            comments: [],
            history: [{ id: `h-${Date.now()}`, timestamp: new Date().toLocaleString(), event: 'Reported by Caretaker' }],
            attachments: [],
            source: 'Internal',
            costs: { labor: 0, materials: 0, travel: 0 }
        };
        addTask(newTask);
        alert('Issue reported successfully.');
        setReportDescription('');
    };

    const handleMarkComplete = (task: Task) => {
        updateTask(task.id, { 
            status: TaskStatus.Completed,
            history: [...(task.history||[]), { id: `h-${Date.now()}`, timestamp: new Date().toLocaleString(), event: 'Completed by Caretaker' }]
        });
    };

    if (!caretakerName) {
        return <div className="p-8 text-center">{isDataLoading ? 'Loading caretaker portal...' : 'Profile loading or not found...'}</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Caretaker Portal</h1>
                    <p className="text-gray-500">Welcome, {profileLoading ? 'Loading...' : ((firstName ?? '').trim() ? (firstName as string).trim() : caretakerName)}.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Tasks Done Today</p>
                        <p className="text-3xl font-bold text-green-600">{completedToday}</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <Icon name="check" className="w-5 h-5 mr-2 text-blue-600" />
                        My Assignments ({myTasks.length})
                    </h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {myTasks.map(task => (
                            <div key={task.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                        task.priority === 'High' || task.priority === 'Very High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {task.priority}
                                    </span>
                                    <span className="text-xs text-gray-400">{task.property}</span>
                                </div>
                                <p className="font-bold text-gray-800 text-sm mb-1">{task.title}</p>
                                <p className="text-xs text-gray-600 mb-3">{task.description}</p>
                                {task.status !== 'Completed' ? (
                                    <button 
                                        onClick={() => handleMarkComplete(task)}
                                        className="w-full py-2 bg-white border border-green-500 text-green-600 text-xs font-bold rounded hover:bg-green-50 transition-colors"
                                    >
                                        Mark Done
                                    </button>
                                ) : (
                                    <div className="text-center text-xs font-bold text-green-600 bg-green-50 py-1 rounded">Completed</div>
                                )}
                            </div>
                        ))}
                        {myTasks.length === 0 && <p className="text-center text-gray-400 py-6">No pending tasks. Good job!</p>}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Report Issue</h3>
                        <form onSubmit={handleReportIssue} className="space-y-3">
                            <textarea 
                                value={reportDescription}
                                onChange={e => setReportDescription(e.target.value)}
                                placeholder="Describe the issue (e.g. Broken light in corridor)..." 
                                rows={4} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" 
                                required 
                            />
                            <div className="flex items-center gap-2">
                                <button type="button" className="p-2 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">
                                    <Icon name="plus" className="w-5 h-5" />
                                </button>
                                <span className="text-xs text-gray-400">Add Photo</span>
                            </div>
                            <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary-dark">Submit Report</button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Utility Log</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <input placeholder="Unit Number" className="p-2 border rounded text-sm" />
                            <select className="p-2 border rounded text-sm bg-white">
                                <option>Water</option>
                                <option>Electricity</option>
                            </select>
                            <input type="number" placeholder="Current Reading" className="p-2 border rounded text-sm col-span-2" />
                            <button className="col-span-2 py-2 bg-blue-600 text-white font-bold rounded text-sm hover:bg-blue-700">Save Reading</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advert Banners */}
            <AdBanners />
        </div>
    );
};

export default CaretakerPortal;
