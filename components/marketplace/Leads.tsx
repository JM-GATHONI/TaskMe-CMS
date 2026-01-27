
import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';

const STAGES = ['New', 'Contacted', 'Viewing', 'Negotiation', 'Closed'];

const LeadCard: React.FC<{ lead: any; onMove: (id: string, stage: string) => void }> = ({ lead, onMove }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer group relative">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    lead.source === 'Referral' ? 'bg-purple-100 text-purple-700' :
                    lead.source === 'Website' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    {lead.source || 'Walk-in'}
                </span>
                <span className="text-xs text-gray-400">{lead.date}</span>
            </div>
            
            <h4 className="font-bold text-gray-800 text-sm">{lead.name}</h4>
            <p className="text-xs text-gray-500 mb-3">{lead.interest}</p>
            
            <div className="flex items-center gap-2 mb-3">
                <a href={`tel:${lead.contact}`} className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                    <Icon name="communication" className="w-3 h-3" />
                </a>
                <a href={`mailto:?subject=Inquiry`} className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Icon name="mail" className="w-3 h-3" />
                </a>
            </div>

            <div className="border-t pt-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-gray-400">Move to:</span>
                <div className="flex gap-1">
                    {STAGES.filter(s => s !== lead.status).map(s => (
                        <button 
                            key={s} 
                            onClick={(e) => { e.stopPropagation(); onMove(lead.id, s); }}
                            className="w-4 h-4 rounded bg-gray-200 hover:bg-primary hover:text-white text-[8px] flex items-center justify-center"
                            title={s}
                        >
                            {s[0]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Leads: React.FC = () => {
    const { applications, updateApplication } = useData();
    
    // Simulate pipeline status since 'applications' only has basic status
    // In a real app, this would be a field on the application record
    const [localLeads, setLocalLeads] = useState<any[]>([]);

    useMemo(() => {
        // Hydrate from context on load
        const leads = applications.filter(a => a.status !== 'Rejected').map(a => ({
            id: a.id,
            name: a.name,
            contact: a.phone,
            interest: `${a.property} (${a.unit})`,
            date: a.submittedDate,
            status: a.status === 'New' ? 'New' : a.status === 'Approved' ? 'Closed' : 'Contacted', // Map existing
            source: a.source || 'Website'
        }));
        setLocalLeads(leads);
    }, [applications]);

    const moveLead = (id: string, stage: string) => {
        setLocalLeads(prev => prev.map(l => l.id === id ? { ...l, status: stage } : l));
        // Also update backend context
        if (stage === 'Closed') {
            updateApplication(id, { status: 'Approved' });
        } else {
            updateApplication(id, { status: 'Under Review' });
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Sales Pipeline</h1>
                <p className="text-lg text-gray-500 mt-1">Track prospective tenants from inquiry to lease signing.</p>
            </div>
            
            <div className="flex-grow overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {STAGES.map(stage => (
                        <div key={stage} className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col">
                            <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${
                                stage === 'New' ? 'bg-blue-50/50' : 
                                stage === 'Closed' ? 'bg-green-50/50' : ''
                            } rounded-t-xl`}>
                                <h3 className="font-bold text-gray-700 text-sm">{stage}</h3>
                                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-gray-500 shadow-sm border">
                                    {localLeads.filter(l => l.status === stage).length}
                                </span>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto flex-grow">
                                {localLeads.filter(l => l.status === stage).map(lead => (
                                    <LeadCard key={lead.id} lead={lead} onMove={moveLead} />
                                ))}
                                {localLeads.filter(l => l.status === stage).length === 0 && (
                                    <div className="h-full flex items-center justify-center text-gray-300 text-xs italic border-2 border-dashed border-gray-100 rounded-lg">
                                        Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leads;
