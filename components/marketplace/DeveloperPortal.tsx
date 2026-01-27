
import React from 'react';
import { MOCK_DEVELOPER_PROJECTS } from '../../constants';
import Icon from '../Icon';

const ProjectCard: React.FC<{ project: any }> = ({ project }) => {
    const progress = Math.round((project.unitsSold / project.totalUnits) * 100);
    
    // Mock Unit Matrix Generation
    const units = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        status: i < (project.unitsSold / project.totalUnits) * 20 ? 'Sold' : Math.random() > 0.7 ? 'Reserved' : 'Available'
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
            <div className="h-40 bg-gray-800 relative">
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white tracking-wide">{project.name}</h3>
                </div>
                <div className="absolute bottom-4 left-4 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                    {project.totalUnits} Units Total
                </div>
            </div>
            
            <div className="p-6">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Sales Progress</p>
                        <p className="text-xl font-extrabold text-gray-800">{project.unitsSold} <span className="text-sm text-gray-500 font-normal">Sold</span></p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
                    <div className="h-3 rounded-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Unit Availability</p>
                    <div className="grid grid-cols-10 gap-1">
                        {units.map(u => (
                            <div 
                                key={u.id} 
                                className={`h-3 w-3 rounded-sm ${u.status === 'Sold' ? 'bg-red-500' : u.status === 'Reserved' ? 'bg-yellow-400' : 'bg-green-500'}`}
                                title={`Unit ${u.id + 1}: ${u.status}`}
                            ></div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
                        <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Avail</span>
                        <span className="flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span> Sold</span>
                        <span className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span> Rsrvd</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-50">
                    <button className="flex-1 py-2 text-xs font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Documents</button>
                    <button className="flex-1 py-2 text-xs font-bold bg-primary text-white rounded hover:bg-primary-dark">Manage Units</button>
                </div>
            </div>
        </div>
    );
};

const DeveloperPortal: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Developer Launchpad</h1>
                <p className="text-lg text-gray-500 mt-1">Manage sales, inventory, and marketing for off-plan developments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {MOCK_DEVELOPER_PROJECTS.map(project => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                
                {/* New Project Placeholder */}
                <button className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-12 hover:border-primary hover:bg-blue-50/30 transition-all group min-h-[400px]">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-primary transition-colors">
                        <Icon name="plus" className="w-8 h-8 text-gray-400 group-hover:text-primary" />
                    </div>
                    <h3 className="font-bold text-gray-600 group-hover:text-primary">Launch New Project</h3>
                    <p className="text-sm text-gray-400 mt-1">Setup inventory & marketing</p>
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Recent Sales Activity</h3>
                    <button className="text-sm text-primary font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-700 rounded-full">
                                    <Icon name="check" className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Unit A-{100 + i} Sold</p>
                                    <p className="text-xs text-gray-500">Golden Heights • Agent Mike</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-gray-400">2 hrs ago</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeveloperPortal;
