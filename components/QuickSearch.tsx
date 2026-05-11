
import React, { useState, useEffect, useMemo } from 'react';
import Icon from './Icon';
import { SearchResult } from '../types';
import { useData } from '../context/DataContext';
import { exportToCSV, printSection } from '../utils/exportHelper';
import { fmtDate } from '../utils/date';

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
    const { tenants, properties, externalTransactions } = useData();

    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [activeDateRange, setActiveDateRange] = useState<string>('');
    const [customDrFrom, setCustomDrFrom] = useState('');
    const [customDrTo, setCustomDrTo] = useState('');
    const [activeDatePeriod, setActiveDatePeriod] = useState<string | null>(null);
    const [results, setResults] = useState<SearchResult[]>([]);
    
    // Updated Filters
    const FILTERS = ['Paid', 'Unpaid', 'Arrears', 'Unpaid Fines', 'Paid Fines', 'Deposits Paid', 'Deposit Refunds', 'Unpaid Deposit', 'Partial Payments'];

    // Intelligent Keyword Mapping
    const KEYWORD_MAP: Record<string, string> = {
        'paid': 'Paid',
        'payment': 'Paid',
        'payments': 'Paid',
        'unpaid': 'Unpaid',
        'not paid': 'Unpaid',
        'no payment': 'Unpaid',
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
        'deposit refunds': 'Deposit Refunds'
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
                
                const dr = urlParams.get('dr') || '';
                const drFrom = urlParams.get('dr_from') || '';
                const drTo = urlParams.get('dr_to') || '';
                setActiveDateRange(dr);
                setCustomDrFrom(drFrom);
                setCustomDrTo(drTo);

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
                    setActiveFilter(f.split(',')[0]);
                    setQuery('');
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

    // --- Date Range Helper ---
    const parseFlexDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        // YYYY-MM-DD — parse as local midnight to avoid UTC offset issues (e.g. UTC+3)
        const isoPlain = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoPlain) return new Date(+isoPlain[1], +isoPlain[2] - 1, +isoPlain[3]);
        // ISO with time component or other formats — let the browser parse
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        // DD/MM/YYYY
        const dmy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmy) { d = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]); if (!isNaN(d.getTime())) return d; }
        // MM/DD/YYYY
        const mdy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mdy) { d = new Date(+mdy[3], +mdy[1] - 1, +mdy[2]); if (!isNaN(d.getTime())) return d; }
        return null;
    };

    const isInDateRange = (dateStr?: string): boolean => {
        if (!activeDateRange) return true;
        if (!dateStr) return false;
        const parsed = parseFlexDate(dateStr);
        if (!parsed) return false;
        const today = new Date(); today.setHours(0,0,0,0);
        const target = new Date(parsed); target.setHours(0,0,0,0);
        if (activeDateRange === 'Today') return target.getTime() === today.getTime();
        if (activeDateRange === 'Yesterday') {
            const y = new Date(today); y.setDate(today.getDate() - 1);
            return target.getTime() === y.getTime();
        }
        if (activeDateRange.startsWith('Day:')) {
            const specific = new Date(activeDateRange.slice(4)); specific.setHours(0,0,0,0);
            return target.getTime() === specific.getTime();
        }
        if (activeDateRange === 'This Week') {
            const dow = today.getDay(); const diff = dow === 0 ? 6 : dow - 1;
            const start = new Date(today); start.setDate(today.getDate() - diff);
            return target >= start && target <= today;
        }
        if (activeDateRange === 'Last Week') {
            const dow = today.getDay(); const diff = dow === 0 ? 6 : dow - 1;
            const endLW = new Date(today); endLW.setDate(today.getDate() - diff - 1);
            const startLW = new Date(endLW); startLW.setDate(endLW.getDate() - 6);
            return target >= startLW && target <= endLW;
        }
        if (activeDateRange === 'This Month') {
            return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
        }
        if (activeDateRange === 'This Quarter') {
            const q = Math.floor(today.getMonth() / 3);
            const qStart = new Date(today.getFullYear(), q * 3, 1);
            const qEnd = new Date(today.getFullYear(), q * 3 + 3, 0);
            return target >= qStart && target <= qEnd;
        }
        if (activeDateRange === 'This Year') return target.getFullYear() === today.getFullYear();
        if (activeDateRange === 'Last Month') {
            const lmStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            return target >= lmStart && target <= lmEnd;
        }
        if (activeDateRange === 'Custom' && customDrFrom && customDrTo) {
            const from = new Date(customDrFrom); from.setHours(0,0,0,0);
            const to = new Date(customDrTo); to.setHours(23,59,59,999);
            return target >= from && target <= to;
        }
        return true;
    };

    // --- Data Processing for Specific Views ---

    const tableData = useMemo(() => {
        const lowerQ = query.toLowerCase();
        
        // Filter tenants first based on search query
        const searchedTenants = tenants.filter(t => 
            !query || 
            t.name.toLowerCase().includes(lowerQ) ||
            t.idNumber.includes(lowerQ) ||
            t.unit.toLowerCase().includes(lowerQ) || 
            (t.propertyName && t.propertyName.toLowerCase().includes(lowerQ))
        );

        if (activeFilter === 'Paid') {
            const historyEntries = searchedTenants.flatMap(t =>
                t.paymentHistory
                    .filter(p => p.status === 'Paid' && isInDateRange(p.date))
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
            // Dedup set: all references already captured in paymentHistory across ALL tenants
            const historyRefs = new Set(
                tenants.flatMap(t => t.paymentHistory.flatMap(p => [p.reference, (p as any).transactionCode].filter(Boolean)))
            );
            // Merge matched M-Pesa C2B transactions not already in paymentHistory
            const externalEntries = (externalTransactions || [])
                .filter(tx =>
                    tx.matched &&
                    tx.type === 'M-Pesa' &&
                    isInDateRange(tx.date) &&
                    !historyRefs.has(tx.reference) &&
                    !(tx.transactionCode && historyRefs.has(tx.transactionCode))
                )
                .map(tx => {
                    const matched = tenants.find(t => t.id === tx.matchedTenantId);
                    return {
                        id: `ext-${tx.id}`,
                        tenant: matched?.name ?? tx.name,
                        property: matched ? `${matched.propertyName} - ${matched.unit}` : tx.account,
                        amountDisplay: `KES ${Number(tx.amount).toLocaleString()}`,
                        val: Number(tx.amount) || 0,
                        date: tx.date,
                        method: 'M-Pesa C2B'
                    };
                });
            return [...historyEntries, ...externalEntries]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        if (activeFilter === 'Unpaid') {
            const now = new Date();
            const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            return searchedTenants
                .filter(t => {
                    if (!['Active', 'Overdue', 'Notice'].includes(t.status)) return false;
                    if (!Number(t.rentAmount ?? 0)) return false;
                    // Only flag as unpaid once the due date has passed this cycle
                    const dueDay = t.rentDueDate || 5;
                    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
                    if (dueDate > now) return false;
                    // Apply period filter to the due date (so 'This Month', 'Last Month' etc. work)
                    if (!isInDateRange(dueDate.toISOString().split('T')[0])) return false;
                    // Sum all payments in the current calendar month
                    const totalPaidThisMonth = t.paymentHistory.reduce((sum, p) => {
                        const parsed = parseFlexDate(p.date);
                        if (!parsed) return sum;
                        const pk = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
                        if (pk !== currentPeriod) return sum;
                        return sum + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0);
                    }, 0);
                    // Unpaid = zero payment this month (partial payers are excluded)
                    return totalPaidThisMonth === 0;
                })
                .map(t => {
                    const dueDay = t.rentDueDate || 5;
                    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
                    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000));
                    const rent = Number(t.rentAmount);
                    const bills = (t.outstandingBills ?? [])
                        .filter((b: any) => b.status === 'Pending')
                        .reduce((s: number, b: any) => s + Number(b.amount ?? 0), 0);
                    const totalDue = rent + bills;
                    return {
                        id: t.id,
                        tenant: t.name,
                        property: `${t.propertyName} - ${t.unit}`,
                        amountDisplay: `KES ${totalDue.toLocaleString()}`,
                        val: totalDue,
                        rent,
                        bills,
                        totalDue,
                        dueDate: fmtDate(dueDate),
                        daysOverdue,
                        status: t.status
                    };
                });
        }

        if (activeFilter === 'Arrears') {
            const now = new Date();
            const MAX_LOOKBACK = 24; // months

            return searchedTenants.flatMap(t => {
                if (!['Active', 'Overdue', 'Notice'].includes(t.status)) return [];
                if (!Number(t.rentAmount ?? 0)) return [];

                // Build map: how much was paid in each YYYY-MM billing period
                const paidByPeriod: Record<string, number> = {};
                t.paymentHistory.forEach(p => {
                    const parsed = parseFlexDate(p.date);
                    if (!parsed) return;
                    const pk = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
                    paidByPeriod[pk] = (paidByPeriod[pk] || 0) + (parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0);
                });

                // Walk back month-by-month and accumulate unpaid shortfalls
                let totalArrears = 0;
                let monthsMissed = 0;
                const activationDate = t.activationDate ? parseFlexDate(t.activationDate) : null;

                for (let i = 1; i <= MAX_LOOKBACK; i++) {
                    const y = now.getMonth() - i < 0 ? now.getFullYear() - Math.ceil((i - now.getMonth()) / 12) : now.getFullYear();
                    const mRaw = ((now.getMonth() - i) % 12 + 12) % 12;
                    const checkStart = new Date(y, mRaw, 1);
                    if (activationDate && checkStart < new Date(activationDate.getFullYear(), activationDate.getMonth(), 1)) break;
                    const pk = `${checkStart.getFullYear()}-${String(checkStart.getMonth() + 1).padStart(2, '0')}`;
                    const paid = paidByPeriod[pk] || 0;
                    const shortfall = Number(t.rentAmount) - paid;
                    if (shortfall > 0) {
                        totalArrears += shortfall;
                        monthsMissed++;
                    }
                }

                // Also respect admin-set arrears field — use whichever is higher
                const adminArrears = Math.max(0, Number((t as any).arrears ?? 0));
                const finalArrears = Math.max(totalArrears, adminArrears);

                if (finalArrears <= 0) return [];

                // Date range: only apply if a range is actively selected;
                // compare against last month's due date so 'Last Month' works naturally
                if (activeDateRange) {
                    const prevDueDay = t.rentDueDate || 5;
                    const prevDue = new Date(now.getFullYear(), now.getMonth() - 1, prevDueDay);
                    if (!isInDateRange(prevDue.toISOString().split('T')[0])) return [];
                }

                const { days, date } = getDaysOverdue(t.rentDueDate);

                return [{
                    id: t.id,
                    tenant: t.name,
                    property: `${t.propertyName} - ${t.unit}`,
                    amountDisplay: `KES ${finalArrears.toLocaleString()}`,
                    val: finalArrears,
                    monthsMissed,
                    daysOverdue: days,
                    dueDate: date
                }];
            });
        }

        if (activeFilter === 'Unpaid Fines') {
            return searchedTenants
                .filter(t => t.outstandingFines.some(f => f.status === 'Pending' && isInDateRange(f.date)))
                .flatMap(t => t.outstandingFines
                    .filter(f => f.status === 'Pending' && isInDateRange(f.date))
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
            return searchedTenants
                .filter(t => t.outstandingFines.some(f => f.status === 'Paid' && isInDateRange(f.date)))
                .flatMap(t => t.outstandingFines
                    .filter(f => f.status === 'Paid' && isInDateRange(f.date))
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
                .filter(t => t.depositPaid > 0 && ['Active', 'Overdue', 'Notice'].includes(t.status) && isInDateRange(t.onboardingDate))
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
                .filter(t => t.depositPaid > 0 && ['Vacated', 'Evicted', 'Blacklisted'].includes(t.status) && isInDateRange(t.leaseEnd))
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

        if (activeFilter === 'Unpaid Deposit') {
            return searchedTenants
                .filter(t => (!t.depositPaid || t.depositPaid === 0) && ['Active', 'Overdue', 'Notice'].includes(t.status) && isInDateRange(t.onboardingDate))
                .map(t => ({
                    id: t.id,
                    tenant: t.name,
                    property: `${t.propertyName} - ${t.unit}`,
                    amountDisplay: `KES ${t.rentAmount.toLocaleString()}`,
                    val: t.rentAmount,
                    date: t.onboardingDate || 'N/A',
                    status: t.status
                }));
        }

        if (activeFilter === 'Partial Payments') {
            const now = new Date();
            const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            return searchedTenants.flatMap(t => {
                if (!['Active', 'Overdue', 'Notice'].includes(t.status)) return [];
                if (!Number(t.rentAmount ?? 0)) return [];
                // Group all payment entries by billing period (YYYY-MM)
                const byPeriod: Record<string, { totalPaid: number; latestDate: string; methods: string[] }> = {};
                t.paymentHistory.forEach(p => {
                    const parsed = parseFlexDate(p.date);
                    if (!parsed) return;
                    const periodKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
                    if (!byPeriod[periodKey]) byPeriod[periodKey] = { totalPaid: 0, latestDate: p.date, methods: [] };
                    const paid = parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0;
                    byPeriod[periodKey].totalPaid += paid;
                    if (new Date(p.date) > new Date(byPeriod[periodKey].latestDate)) {
                        byPeriod[periodKey].latestDate = p.date;
                    }
                    if (p.method && !byPeriod[periodKey].methods.includes(p.method)) {
                        byPeriod[periodKey].methods.push(p.method);
                    }
                });

                return Object.entries(byPeriod)
                    .filter(([periodKey, { totalPaid, latestDate }]) => {
                        if (totalPaid <= 0 || totalPaid >= Number(t.rentAmount)) return false;
                        // Default (no date range): show current month partials only
                        // With date range: filter by the latest payment date in that period
                        if (!activeDateRange) return periodKey === currentPeriod;
                        return isInDateRange(latestDate);
                    })
                    .map(([periodKey, { totalPaid, latestDate, methods }]) => {
                        const [yr, mo] = periodKey.split('-');
                        const period = new Date(+yr, +mo - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                        return {
                            id: `${t.id}-${periodKey}`,
                            tenant: t.name,
                            property: `${t.propertyName} - ${t.unit}`,
                            amountDisplay: `KES ${totalPaid.toLocaleString()}`,
                            val: totalPaid,
                            expected: Number(t.rentAmount),
                            shortfall: Number(t.rentAmount) - totalPaid,
                            date: latestDate,
                            period,
                            method: methods.join(', ') || '—'
                        };
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
        }

        return [];
    }, [tenants, query, activeFilter, activeDateRange, customDrFrom, customDrTo]);

    // --- Calculate Totals ---
    const summaryStats = useMemo(() => {
        if (activeFilter === 'All') return null;

        const count = tableData.length;
        const totalAmount = tableData.reduce((sum, row: any) => sum + (row.val || 0), 0);

        return { count, totalAmount };
    }, [tableData, activeFilter]);


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
        if (activeFilter === 'All' || tableData.length === 0) {
            alert("No data to export for this view.");
            return;
        }
        exportToCSV(tableData, `${activeFilter}_Report`);
    };

    const handlePrint = () => {
        if (activeFilter === 'All') {
            window.print();
        } else {
            printSection('quick-search-results', `${activeFilter} Report`);
        }
    };

    const timePeriodButtons = useMemo(() => {
        const today = new Date();
        const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const iso = (d: Date) => d.toISOString().split('T')[0];
        const days = Array.from({ length: 5 }, (_, i) => {
            const d = new Date(today); d.setDate(today.getDate() - i);
            return { label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : fmt(d), value: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `Day:${iso(d)}` };
        });
        return [...days,
            { label: 'This Week', value: 'This Week' },
            { label: 'Last Week', value: 'Last Week' },
            { label: 'This Month', value: 'This Month' },
            { label: 'Last Month', value: 'Last Month' },
            { label: 'This Quarter', value: 'This Quarter' },
            { label: 'This Year', value: 'This Year' },
            { label: 'Custom Range', value: 'Custom' },
        ];
    }, []);

    const handleTimePeriodSelect = (period: string) => {
        if (period === 'Custom') { setActiveDatePeriod('Custom'); return; }
        setActiveDatePeriod(period);
        setActiveDateRange(period);
        setCustomDrFrom('');
        setCustomDrTo('');
    };

    const handleCustomDateApply = () => {
        if (!customDrFrom || !customDrTo) return alert('Select both From and To dates.');
        setActiveDateRange('Custom');
        setActiveDatePeriod('Custom');
    };

    const clearPeriod = () => {
        setActiveDatePeriod(null);
        setActiveDateRange('');
        setCustomDrFrom('');
        setCustomDrTo('');
    };

    const toggleFilter = (filter: string) => {
        setActiveFilter(prev => prev === filter ? 'All' : filter);
        setQuery('');
        setActiveDatePeriod(null);
        setActiveDateRange('');
        setCustomDrFrom('');
        setCustomDrTo('');
    };

    return (
        <div className="space-y-6">
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

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 no-print">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(filter => {
                        const isActive = activeFilter === filter;
                        return (
                            <button 
                                key={filter} 
                                onClick={() => toggleFilter(filter)}
                                className={`px-4 py-2 text-sm rounded-full focus:outline-none transition-all duration-200 shadow-sm ${
                                isActive 
                                    ? 'bg-primary text-white font-bold transform scale-105' 
                                    : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {filter}{isActive ? ' ▾' : ''}
                            </button>
                        );
                    })}
                </div>

                {activeFilter !== 'All' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Filter <span className="text-primary">{activeFilter}</span> by period:
                            </span>
                            <button onClick={() => clearPeriod()} className="ml-auto text-xs text-gray-400 hover:text-red-500 font-bold">✕ Clear Period</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {timePeriodButtons.map(btn => (
                                <button
                                    key={btn.value}
                                    onClick={() => handleTimePeriodSelect(btn.value)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                                        activeDatePeriod === btn.value
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                        {activeDatePeriod === 'Custom' && (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <label className="text-xs font-medium text-gray-600">From:</label>
                                <input type="date" value={customDrFrom} onChange={e => setCustomDrFrom(e.target.value)} className="p-1.5 border rounded text-sm" />
                                <label className="text-xs font-medium text-gray-600">To:</label>
                                <input type="date" value={customDrTo} onChange={e => setCustomDrTo(e.target.value)} className="p-1.5 border rounded text-sm" />
                                <button onClick={handleCustomDateApply} className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded hover:bg-primary-dark">Apply</button>
                            </div>
                        )}
                    </div>
                )}

            <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
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
                            activeFilter.includes('Arrears') || activeFilter.includes('Unpaid') || activeFilter.includes('Refunds') ? 'border-red-500' : 
                            'border-green-500'
                        }`}>
                            <p className="text-sm text-gray-500 font-medium uppercase">
                                Total {activeFilter}
                            </p>
                            <p className={`text-2xl font-bold ${
                                activeFilter.includes('Arrears') || activeFilter.includes('Unpaid') || activeFilter.includes('Refunds') ? 'text-red-600' : 
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
                                    {activeFilter === 'Paid' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Amount Paid</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Method</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Unpaid' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Rent</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Bills</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Total Due</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Due Date</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Days Overdue</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Arrears' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Total Outstanding</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Months in Arrears</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Days Overdue</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Last Due Date</th>
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
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Rent Amount</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Move In Date</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    )}
                                    {activeFilter === 'Partial Payments' && (
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Tenant</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Property</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Period</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Paid</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Expected</th>
                                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Shortfall</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Last Payment</th>
                                            <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase">Method</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {tableData.map((row: any) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            {activeFilter === 'Paid' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-green-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.method}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                </>
                                            )}
                                            {activeFilter === 'Unpaid' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right text-gray-700">KES {(row.rent || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-gray-500">
                                                        {row.bills > 0
                                                            ? <span className="text-orange-600 font-semibold">KES {row.bills.toLocaleString()}</span>
                                                            : <span className="text-gray-300">—</span>
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">KES {(row.totalDue || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.dueDate}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">{row.daysOverdue}d overdue</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">{row.status}</span></td>
                                                </>
                                            )}
                                            {activeFilter === 'Arrears' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">{row.monthsMissed} {row.monthsMissed === 1 ? 'Month' : 'Months'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">{row.daysOverdue} Days</span>
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
                                                    <td className="px-6 py-4 text-right font-bold text-pink-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.date}</td>
                                                    <td className="px-6 py-4 text-center"><span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">{row.status}</span></td>
                                                </>
                                            )}
                                            {activeFilter === 'Partial Payments' && (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{row.tenant}</td>
                                                    <td className="px-6 py-4 text-gray-500">{row.property}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{row.period}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-yellow-600">{row.amountDisplay}</td>
                                                    <td className="px-6 py-4 text-right text-gray-500">KES {(row.expected || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">KES {(row.shortfall || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{fmtDate(row.date)}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{row.method}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {tableData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                No records found for {activeFilter}.
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
