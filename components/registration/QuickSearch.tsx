
import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../Icon';
import { SearchResult } from '../../types';
import { useData } from '../../context/DataContext';
import { exportToCSV, printSection } from '../../utils/exportHelper';
import { fmtDate } from '../../utils/date';

// --- Helper Functions ---

const getDaysOverdue = (rentDueDate: number) => {
    const now = new Date();
    const dueDay = rentDueDate || 5;
    let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
    
    // If today is before the due day, the arrears are likely from previous month
    if (now.getDate() < dueDay) {
        dueDate = new Date(now.getFullYear(), now.getMonth() - 1, dueDay);
    }
    
    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days, date: fmtDate(dueDate) };
};

const QuickSearch: React.FC = () => {
    const { tenants, properties, staff } = useData(); // Added staff for agent lookup

    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [activeDateRange, setActiveDateRange] = useState<string>('');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    
    // Updated Filters
    const FILTERS = ['Paid', 'Arrears', 'Unpaid Fines', 'Paid Fines', 'Deposits Paid', 'Deposit Refunds', 'Unpaid Deposit', 'Partial Payments', 'Vacant Units'];

    // Intelligent Keyword Mapping
    const KEYWORD_MAP: Record<string, string> = {
        'paid': 'Paid',
        'payment': 'Paid',
        'payments': 'Paid',
        'arrears': 'Arrears',
        'debt': 'Arrears',
        'overdue': 'Arrears',
        'fine': 'Unpaid Fines',
        'fines': 'Unpaid Fines',
        'unpaid fines': 'Unpaid Fines',
        'paid fines': 'Paid Fines',
        'penalty': 'Unpaid Fines',
        'penalties': 'Unpaid Fines',
        'deposit': 'Deposits Paid',
        'deposits': 'Deposits Paid',
        'deposit paid': 'Deposits Paid',
        'refund': 'Deposit Refunds',
        'refunds': 'Deposit Refunds',
        'deposit refunds': 'Deposit Refunds',
        'partial': 'Partial Payments',
        'partial payments': 'Partial Payments',
        'vacant': 'Vacant Units',
        'vacancy': 'Vacant Units',
        'empty': 'Vacant Units'
    };

    // Handle URL Query Params & Hash Changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.includes('?')) {
                const queryString = hash.split('?')[1];
                const urlParams = new URLSearchParams(queryString);
                const q = urlParams.get('q');
                const f = urlParams.get('filters');
                
                const dr = urlParams.get('dr');
                const drFrom = urlParams.get('dr_from');
                const drTo = urlParams.get('dr_to');
                if (dr) { setActiveDateRange(dr); if (drFrom) setCustomFrom(drFrom); if (drTo) setCustomTo(drTo); }
                else { setActiveDateRange(''); setCustomFrom(''); setCustomTo(''); }
                if (q) {
                    const lowerQ = q.toLowerCase().trim();
                    if (KEYWORD_MAP[lowerQ]) {
                        setActiveFilter(KEYWORD_MAP[lowerQ]);
                        setQuery(''); 
                    } else {
                        setQuery(q);
                        if (!f) setActiveFilter('All');
                    }
                } else if (f) {
                    const filterName = decodeURIComponent(f.split(',')[0]);
                    if (FILTERS.includes(filterName)) {
                         setActiveFilter(filterName);
                         setQuery('');
                    } else {
                        setActiveFilter('All');
                    }
                }
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Intelligent Switching on Local Search Input
    useEffect(() => {
        const lowerQ = query.toLowerCase().trim();
        if (KEYWORD_MAP[lowerQ] && activeFilter !== KEYWORD_MAP[lowerQ]) {
            setActiveFilter(KEYWORD_MAP[lowerQ]);
            setQuery('');
        }
    }, [query, activeFilter]);

    // --- Data Processing for Specific Views ---

    const tableData = useMemo(() => {
        const lowerQ = query.toLowerCase();
        
        // --- Special Handling for Vacant Units (Derived from Properties, not Tenants) ---
        if (activeFilter === 'Vacant Units') {
             const vacantList: any[] = [];
             properties.forEach(p => {
                 p.units.forEach(u => {
                     if (u.status === 'Vacant') {
                         if (!query || 
                             p.name.toLowerCase().includes(lowerQ) || 
                             u.unitNumber.toLowerCase().includes(lowerQ) ||
                             (p.location && p.location.toLowerCase().includes(lowerQ))
                            ) {
                                const agent = staff.find(s => s.id === p.assignedAgentId);
                                vacantList.push({
                                    id: u.id,
                                    property: p.name,
                                    unit: u.unitNumber,
                                    location: p.location || p.branch,
                                    agent: agent ? agent.name : 'Unassigned',
                                    rent: `KES ${(u.rent || p.defaultMonthlyRent || 0).toLocaleString()}`,
                                    val: u.rent || 0,
                                    status: 'Vacant',
                                    type: u.unitType || p.type
                                });
                            }
                     }
                 });
             });
             return vacantList;
        }

        // --- Standard Tenant Filtering ---
        const searchedTenants = tenants.filter(t => 
            !query || 
            t.name.toLowerCase().includes(lowerQ) ||
            t.idNumber.includes(lowerQ) ||
            t.unit.toLowerCase().includes(lowerQ) || 
            (t.propertyName && t.propertyName.toLowerCase().includes(lowerQ))
        );

        if (activeFilter === 'Paid') {
            // Show all paid transactions for searched tenants
            return searchedTenants.flatMap(t => 
                t.paymentHistory
                    .filter(p => p.status === 'Paid')
                    .map(p => ({
                        id: `${t.id}-${p.reference}`,
                        tenant: t.name,
                        property: `${t.propertyName} - ${t.unit}`,
                        amountDisplay: p.amount,
                        val: parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0,
                        date: p.date,
                        method: p.method
                    }))
            );
        }

        if (activeFilter === 'Arrears') {
            return searchedTenants
                .filter(t => t.status === 'Overdue')
                .map(t => {
                    const { days, date } = getDaysOverdue(t.rentDueDate);
                    const lastPay = t.paymentHistory[0]; 
                    const paidVal = lastPay ? parseFloat(lastPay.amount.replace(/[^0-9.]/g, '')) : 0;
                    const isPartial = paidVal > 0 && paidVal < t.rentAmount;
                    const outstandingBalance = isPartial ? t.rentAmount - paidVal : t.rentAmount;

                    return {
                        id: t.id,
                        tenant: t.name,
                        property: `${t.propertyName} - ${t.unit}`,
                        amountDisplay: `KES ${outstandingBalance.toLocaleString()}`,
                        val: outstandingBalance,
                        partial: isPartial ? `Yes (Paid ${paidVal.toLocaleString()})` : 'No',
                        daysOverdue: days,
                        dueDate: date
                    };
                });
        }

        if (activeFilter === 'Unpaid Fines') {
            return searchedTenants
                .filter(t => t.outstandingFines.some(f => f.status === 'Pending'))
                .flatMap(t => t.outstandingFines
                    .filter(f => f.status === 'Pending')
                    .map(fine => ({
                        id: fine.id,
                        tenant: t.name,
                        property: `${t.propertyName} - ${t.unit}`,
                        type: fine.type,
                        amountDisplay: `KES ${fine.amount.toLocaleString()}`,
                        val: fine.amount,
                        date: fine.date,
                        status: fine.status
                    })));
        }

        if (activeFilter === 'Paid Fines') {
            // Assuming fines with status 'Paid' are kept in history or outstandingFines
            return searchedTenants
                .filter(t => t.outstandingFines.some(f => f.status === 'Paid'))
                .flatMap(t => t.outstandingFines
                    .filter(f => f.status === 'Paid')
                    .map(fine => ({
                        id: fine.id,
                        tenant: t.name,
                        property: `${t.propertyName} - ${t.unit}`,
                        type: fine.type,
                        amountDisplay: `KES ${fine.amount.toLocaleString()}`,
                        val: fine.amount,
                        date: fine.date,
                        status: fine.status
                    })));
        }

        if (activeFilter === 'Deposits Paid') {
            return searchedTenants
                .filter(t => t.depositPaid > 0 && ['Active', 'Overdue', 'Notice'].includes(t.status))
                .map(t => ({
                    id: t.id,
                    tenant: t.name,
                    property: `${t.propertyName} - ${t.unit}`,
                    amountDisplay: `KES ${t.depositPaid.toLocaleString()}`,
                    val: t.depositPaid,
                    date: t.onboardingDate,
                    status: 'Held'
                }));
        }

        if (activeFilter === 'Deposit Refunds') {
            return searchedTenants
                .filter(t => t.depositPaid > 0 && ['Vacated', 'Evicted', 'Blacklisted'].includes(t.status))
                .map(t => ({
                    id: t.id,
                    tenant: t.name,
                    property: `${t.propertyName} - ${t.unit}`,
                    amountDisplay: `KES ${t.depositPaid.toLocaleString()}`,
                    val: t.depositPaid,
                    date: t.leaseEnd || 'N/A',
                    status: 'Refund Pending'
                }));
        }
        
        if (activeFilter === 'Partial Payments') {
            return searchedTenants
                .filter(t => ['Active', 'Overdue', 'Notice'].includes(t.status) && Number(t.rentAmount ?? 0) > 0)
                .flatMap(t =>
                    (t.paymentHistory || [])
                        .map(p => {
                            const paidVal = parseFloat(String(p.amount || '0').replace(/[^0-9.]/g, '')) || 0;
                            if (paidVal <= 0 || paidVal >= t.rentAmount) return null;
                            const balance = t.rentAmount - paidVal;
                            return {
                                id: `${t.id}-${p.reference || p.date}`,
                                tenant: t.name,
                                property: `${t.propertyName} - ${t.unit}`,
                                amountDisplay: `KES ${balance.toLocaleString()}`,
                                val: balance,
                                paid: `KES ${paidVal.toLocaleString()}`,
                                expected: `KES ${t.rentAmount.toLocaleString()}`,
                                date: p.date || 'N/A',
                                status: 'Partial',
                            };
                        })
                        .filter(item => item !== null)
                );
        }

        if (activeFilter === 'Unpaid Deposit') {
            return searchedTenants
                .filter(t => (!t.depositPaid || t.depositPaid === 0) && ['Active', 'Overdue', 'Notice'].includes(t.status))
                .map(t => ({
                    id: t.id,
                    tenant: t.name,
                    property: `${t.propertyName} - ${t.unit}`,
                    amountDisplay: `KES ${t.rentAmount.toLocaleString()}`,
                    val: t.rentAmount,
                    date: t.onboardingDate || 'N/A',
                    status: 'Unpaid'
                }));
        }

        return [];
    }, [tenants, query, activeFilter, properties, staff]);

    // --- Date Range Filtering ---
    const dateBounds = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const shift = (base: Date, days: number) => { const r = new Date(base); r.setDate(r.getDate() + days); return r; };
        if (!activeDateRange) return null;
        if (activeDateRange === 'Today') return { from: today, to: shift(today, 1) };
        if (activeDateRange === 'Yesterday') return { from: shift(today, -1), to: today };
        if (activeDateRange.startsWith('Day:')) { const x = new Date(activeDateRange.slice(4)); return { from: x, to: shift(x, 1) }; }
        if (activeDateRange === 'This Week') { const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7)); return { from: mon, to: shift(mon, 7) }; }
        if (activeDateRange === 'Last Week') { const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7); return { from: mon, to: shift(mon, 7) }; }
        if (activeDateRange === 'This Month') return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
        if (activeDateRange === 'This Quarter') { const q = Math.floor(today.getMonth() / 3); return { from: new Date(today.getFullYear(), q * 3, 1), to: new Date(today.getFullYear(), q * 3 + 3, 1) }; }
        if (activeDateRange === 'This Year') return { from: new Date(today.getFullYear(), 0, 1), to: new Date(today.getFullYear() + 1, 0, 1) };
        if (activeDateRange === 'Custom' && customFrom && customTo) return { from: new Date(customFrom), to: new Date(new Date(customTo).getTime() + 86400000) };
        return null;
    }, [activeDateRange, customFrom, customTo]);

    const filteredTableData = useMemo(() => {
        if (!dateBounds) return tableData;
        return tableData.filter((row: any) => {
            if (!row.date || row.date === 'N/A') return true;
            const d = new Date(row.date);
            if (isNaN(d.getTime())) return true;
            return d >= dateBounds.from && d < dateBounds.to;
        });
    }, [tableData, dateBounds]);

    const activeDateRangeLabel = activeDateRange
        ? activeDateRange.startsWith('Day:')
            ? activeDateRange.slice(4)
            : activeDateRange === 'Custom' && customFrom && customTo
                ? `${customFrom} → ${customTo}`
                : activeDateRange
        : '';

    // --- Calculate Totals ---
    const summaryStats = useMemo(() => {
        if (activeFilter === 'All') return null;

        const count = filteredTableData.length;
        const totalAmount = filteredTableData.reduce((sum, row: any) => sum + (row.val || 0), 0);

        // For Vacant Units, totalAmount represents Potential Rent
        return { count, totalAmount };
    }, [filteredTableData, activeFilter]);


    // --- Generic Search Logic (Fallback) ---
    useEffect(() => {
        if (activeFilter !== 'All') return;

        if (query.length > 1) {
             const lowerQ = query.toLowerCase();
             const searchResults: SearchResult[] = [];

             tenants.forEach(t => {
                 if (t.name.toLowerCase().includes(lowerQ) || t.unit.toLowerCase().includes(lowerQ)) {
                     searchResults.push({ id: t.id, type: 'Tenant', title: t.name, subtitle: `${t.propertyName} - ${t.unit}`, status: t.status });
                 }
             });
             
             properties.forEach(p => {
                 if (p.name.toLowerCase().includes(lowerQ)) {
                     searchResults.push({ id: p.id, type: 'Property', title: p.name, subtitle: p.branch, status: p.status });
                 }
             });

             setResults(searchResults);
        } else {
            setResults([]);
        }
    }, [query, activeFilter, tenants, properties]);


    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleExportCSV = () => {
        if (activeFilter === 'All' || filteredTableData.length === 0) {
            alert("No data to export for this view.");
            return;
        }
        exportToCSV(filteredTableData, `${activeFilter}_Report${activeDateRangeLabel ? `_${activeDateRangeLabel}` : ''}`);
    };

    const handlePrint = () => {
        if (activeFilter === 'All') {
            window.print();
        } else {
            printSection('quick-search-results', `${activeFilter} Report`);
        }
    };

    const toggleFilter = (filter: string) => {
        // If clicking Vacant Units, redirect to the new report page (Requested in prompt)
        if (filter === 'Vacant Units') {
            window.location.hash = '#/reports-analytics/reports/vacancy-reports';
            return;
        }
        
        setActiveFilter(prev => prev === filter ? 'All' : filter);
        setActiveDateRange('');
        setCustomFrom('');
        setCustomTo('');
        setQuery(''); 
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Quick Search & Reports</h1>
                    <p className="text-lg text-gray-500 mt-1">Find records and generate instant operational lists.</p>
                </div>
                <button 
                    onClick={() => window.location.hash = '#/dashboard'} 
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-sm transition-colors flex items-center"
                >
                    <span className="mr-2">←</span> Back
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2 no-print">
                {FILTERS.map(filter => {
                    const isActive = activeFilter === filter;
                    return (
                        <button 
                            key={filter} 
                            onClick={() => toggleFilter(filter)}
                            className={`px-4 py-2 text-sm rounded-full focus:outline-none transition-all duration-200 shadow-sm ${
                            isActive 
                                ? 'bg-primary text-white font-bold transform scale-105' 
                                : filter === 'Vacant Units' ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {filter}
                        </button>
                    );
                })}
            </div>

            {activeDateRangeLabel && (
                <div className="flex items-center gap-2 mt-2 no-print">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Period:</span>
                    <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">{activeDateRangeLabel}</span>
                    <button onClick={() => { setActiveDateRange(''); setCustomFrom(''); setCustomTo(''); }} className="text-xs text-gray-400 hover:text-red-500 font-bold ml-1" title="Clear date filter">✕ Clear</button>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-2 mt-4 no-print">
                <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        value={query}
                        onChange={handleSearchInput}
                        placeholder={`Search ${activeFilter === 'All' ? 'everything' : 'within ' + activeFilter}...`}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-primary-light focus:border-primary-light text-lg shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Icon name="search" className="w-6 h-6 text-gray-400" />
                    </div>
                </div>
                {activeFilter !== 'All' && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={handleExportCSV}
                            className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-sm flex items-center justify-center whitespace-nowrap transition-colors"
                        >
                            <Icon name="download" className="w-5 h-5 mr-2" /> CSV
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="flex-1 md:flex-none px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-sm flex items-center justify-center whitespace-nowrap transition-colors"
                        >
                            <Icon name="download" className="w-5 h-5 mr-2" /> PDF / Print
                        </button>
                    </div>
                )}
            </div>

            {/* --- SUMMARY TOTALS --- */}
            <div id="quick-search-results">
                {activeFilter !== 'All' && summaryStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-400">
                            <p className="text-sm text-gray-500 font-medium uppercase">Count</p>
                            <p className="text-2xl font-bold text-gray-800">{summaryStats.count} Records</p>
                        </div>
                        <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${
                            activeFilter.includes('Arrears') || activeFilter.includes('Unpaid') || activeFilter.includes('Refunds') || activeFilter.includes('Partial') ? 'border-red-500' : 
                            'border-green-500'
                        }`}>
                            <p className="text-sm text-gray-500 font-medium uppercase">
                                Total {activeFilter.includes('Vacant') ? 'Potential Rent' : activeFilter.includes('Partial') ? 'Balance Due' : activeFilter}
                            </p>
                            <p className={`text-2xl font-bold ${
                                activeFilter.includes('Arrears') || activeFilter.includes('Unpaid') || activeFilter.includes('Refunds') || activeFilter.includes('Partial') ? 'text-red-600' : 
                                'text-green-600'
                            }`}>KES {summaryStats.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {activeFilter === 'All' ? (
                    // GENERIC RESULTS
                    <div className="bg-white p-6 rounded-xl shadow-sm min-h-[300px]">
                        {results.length > 0 ? (
                            <div>
                                <h3 className="text-md font-semibold text-gray-500 uppercase tracking-wider border-b pb-2 mb-3">Top Results</h3>
                                <ul className="space-y-2">
                                    {results.map(result => (
                                        <li key={result.id}>
                                            <button onClick={() => { /* Navigate to profile */ }} className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{result.title}</p>
                                                    <p className="text-sm text-gray-500">{result.subtitle}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800`}>{result.status}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 flex flex-col items-center justify-center h-full">
                                <Icon name="search" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Use filters above or type to search across the platform.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // SPECIFIC TABLES
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    {activeFilter === 'Vacant Units' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Unit</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Location</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Rent</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Agent</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Paid' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Amount Paid</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Method</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Arrears' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Outstanding</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Partial?</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Days Overdue</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Due Date</th>
                                        </tr>
                                    )}
                                    {(activeFilter === 'Unpaid Fines' || activeFilter === 'Paid Fines') && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Deposits Paid' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Deposit Held</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Paid On</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Deposit Refunds' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Refund Amount</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Move Out Date</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Unpaid Deposit' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Expected Deposit</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Move-in Date</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Partial Payments' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Expected Rent</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Amount Paid</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Balance</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Last Payment Date</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredTableData.map((row: any) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                             {activeFilter === 'Vacant Units' && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-gray-800">{row.property}</td>
                                                    <td className="px-6 py-4 text-gray-600">{row.unit}</td>
                                                    <td className="px-6 py-4 text-gray-600">{row.location}</td>
                                                    <td className="px-6 py-4 text-gray-600">{row.type}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.rent}</td>
                                                    <td className="px-6 py-4 text-gray-600">{row.agent}</td>
                                                </>
                                            )}
                                            {activeFilter === 'Paid' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.method}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                </>
                                            )}
                                            {activeFilter === 'Arrears' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.partial}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">{row.daysOverdue} Days</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.dueDate}</td>
                                                </>
                                            )}
                                            {(activeFilter === 'Unpaid Fines' || activeFilter === 'Paid Fines') && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-gray-800">{row.type}</td>
                                                    <td className={`px-6 py-4 text-right font-bold ${activeFilter === 'Paid Fines' ? 'text-green-600' : 'text-orange-600'}`}>{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs ${activeFilter === 'Paid Fines' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{row.status}</span></td>
                                                </>
                                            )}
                                            {activeFilter === 'Deposits Paid' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-blue-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                    <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{row.status}</span></td>
                                                </>
                                            )}
                                            {activeFilter === 'Deposit Refunds' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                    <td className="px-6 py-4 text-center"><span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">{row.status}</span></td>
                                                </>
                                            )}
                                            {activeFilter === 'Unpaid Deposit' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                    <td className="px-6 py-4 text-center"><span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">{row.status}</span></td>
                                                </>
                                            )}
                                            {activeFilter === 'Partial Payments' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right text-gray-600">{row.expected}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.paid}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredTableData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No records found for {activeFilter}{activeDateRangeLabel ? ` (${activeDateRangeLabel})` : ''}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickSearch;
