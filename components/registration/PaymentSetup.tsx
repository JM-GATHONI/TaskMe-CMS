
import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import { supabase } from '../../utils/supabaseClient';
import { getSupabaseSession } from '../../utils/supabaseClient';
import { useData } from '../../context/DataContext';

const PaymentSetup: React.FC = () => {
    const { properties, landlords, systemSettings, updateSystemSettings } = useData();
    const [activeTab, setActiveTab] = useState<'paybills' | 'mpesa' | 'airtel' | 'bank'>('paybills');
    const [stkTestPhone, setStkTestPhone] = useState('');
    const [stkTestBusy, setStkTestBusy] = useState(false);
    const [stkTestMsg, setStkTestMsg] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const session = await getSupabaseSession();
            const p = (session?.user?.user_metadata as any)?.phone;
            if (!cancelled && p) setStkTestPhone(String(p));
        })();
        return () => { cancelled = true; };
    }, []);

    // Agency primary paybill (editable, persisted in systemSettings)
    const [agencyPaybill, setAgencyPaybill] = useState(systemSettings?.agencyPaybill || '');
    const [agencyPaybillSaved, setAgencyPaybillSaved] = useState(false);

    // Keep local field in sync if systemSettings loads asynchronously
    useEffect(() => {
        if (systemSettings?.agencyPaybill) setAgencyPaybill(systemSettings.agencyPaybill);
    }, [systemSettings?.agencyPaybill]);

    const handleSaveAgencyPaybill = () => {
        updateSystemSettings({ ...systemSettings, agencyPaybill });
        setAgencyPaybillSaved(true);
        setTimeout(() => setAgencyPaybillSaved(false), 2500);
    };

    // M-Pesa Mock State
    const [mpesaConfig, setMpesaConfig] = useState({
        paybill: systemSettings?.agencyPaybill || '522522',
        till: '',
        consumerKey: '********************',
        consumerSecret: '********************',
        passkey: '********************',
        environment: 'Sandbox'
    });

    // Airtel Mock State
    const [airtelConfig, setAirtelConfig] = useState({
        partnerId: 'PARTNER123',
        clientId: '********************',
        clientSecret: '********************',
        grantType: 'client_credentials',
        environment: 'Sandbox'
    });

    // Bank Accounts Array State
    const [bankAccounts, setBankAccounts] = useState([
        { id: 'ba1', bankName: 'KCB Bank', accountName: 'TaskMe Realty Ltd', accountNumber: '1100000000', branch: 'Nairobi CBD' }
    ]);
    const [newBank, setNewBank] = useState({ bankName: '', accountName: '', accountNumber: '', branch: '' });
    const [isAddingBank, setIsAddingBank] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Partial management properties — derive from context
    const partialProperties = properties.filter(p => p.managementType === 'Partial');

    const handleMpesaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setMpesaConfig({ ...mpesaConfig, [e.target.name]: e.target.value });
    };

    const handleAirtelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setAirtelConfig({ ...airtelConfig, [e.target.name]: e.target.value });
    };

    const handleNewBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewBank({ ...newBank, [e.target.name]: e.target.value });
    };

    const handleAddOrUpdateBank = () => {
        if (!newBank.bankName || !newBank.accountNumber) {
            alert('Please fill in at least Bank Name and Account Number.');
            return;
        }
        if (editingId) {
            setBankAccounts(prev => prev.map(acc => acc.id === editingId ? { ...acc, ...newBank } : acc));
            alert('Bank account updated successfully.');
        } else {
            setBankAccounts([...bankAccounts, { id: `ba-${Date.now()}`, ...newBank }]);
            alert('Bank account added successfully.');
        }
        setNewBank({ bankName: '', accountName: '', accountNumber: '', branch: '' });
        setIsAddingBank(false);
        setEditingId(null);
    };

    const handleEditBank = (bank: typeof bankAccounts[0]) => {
        setNewBank({ bankName: bank.bankName, accountName: bank.accountName, accountNumber: bank.accountNumber, branch: bank.branch });
        setEditingId(bank.id);
        setIsAddingBank(true);
    };

    const removeBankAccount = (id: string) => {
        if (confirm('Are you sure you want to remove this bank account?')) {
            setBankAccounts(prev => prev.filter(acc => acc.id !== id));
            if (editingId === id) {
                setIsAddingBank(false);
                setEditingId(null);
                setNewBank({ bankName: '', accountName: '', accountNumber: '', branch: '' });
            }
        }
    };

    const handleCancelBankForm = () => {
        setIsAddingBank(false);
        setEditingId(null);
        setNewBank({ bankName: '', accountName: '', accountNumber: '', branch: '' });
    };

    const handleSave = () => {
        alert('Settings Saved Successfully!');
    };

    const handleTestStk = async () => {
        setStkTestMsg(null);
        const session = await getSupabaseSession();
        const uid = session?.user?.id;
        if (!uid) {
            setStkTestMsg('Sign in first. Test STK uses your account id for the payment row in public.payments.');
            return;
        }
        if (!/^(2547|07)\d{8}$/.test(stkTestPhone.replace(/\s/g, ''))) {
            setStkTestMsg('Enter a valid Kenyan M-Pesa number (07… or 2547…).');
            return;
        }
        setStkTestBusy(true);
        try {
            const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
                body: { phone: stkTestPhone, amount: 1, leaseId: null, userId: uid },
            });
            if (error) throw error;
            const id = String((data as any)?.checkoutRequestId ?? '').trim();
            if (!id) throw new Error('CheckoutRequestID missing from STK response');
            setStkTestMsg(`STK push sent. CheckoutRequestID: ${id}. Approve on the handset; status updates in public.payments.`);
        } catch (e: any) {
            let msg = e?.message ?? 'STK request failed.';
            try {
                const ctx = e?.context;
                if (ctx && typeof ctx.json === 'function') {
                    const body = await ctx.json();
                    if (body?.error) msg = String(body.error);
                }
            } catch { /* ignore */ }
            setStkTestMsg(msg);
        } finally {
            setStkTestBusy(false);
        }
    };

    const tabClass = (tab: typeof activeTab, color: string) =>
        `whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? `border-${color}-500 text-${color}-600 bg-${color}-50` : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Payment Setup</h1>
                    <p className="text-lg text-gray-500 mt-1">Configure payment providers and manage paybill numbers.</p>
                </div>
                <button onClick={handleSave} className="px-6 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark">
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto">
                        <button onClick={() => setActiveTab('paybills')} className={tabClass('paybills', 'purple')}>
                            Paybill Directory
                        </button>
                        <button onClick={() => setActiveTab('mpesa')} className={tabClass('mpesa', 'green')}>
                            M-Pesa Integration
                        </button>
                        <button onClick={() => setActiveTab('airtel')} className={tabClass('airtel', 'red')}>
                            Airtel Money API
                        </button>
                        <button onClick={() => setActiveTab('bank')} className={tabClass('bank', 'blue')}>
                            Bank Accounts ({bankAccounts.length})
                        </button>
                    </nav>
                </div>

                <div className="p-8">

                    {/* ── Paybill Directory ─────────────────────────────────────── */}
                    {activeTab === 'paybills' && (
                        <div className="max-w-3xl space-y-8">
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-start gap-3">
                                <Icon name="info" className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-purple-800 text-sm">Paybill Directory</h4>
                                    <p className="text-purple-700 text-xs mt-1">
                                        The <strong>Agency Paybill</strong> is the primary shortcode used for all <strong>Full Management</strong> properties.
                                        Landlord paybills are automatically listed here for properties registered under <strong>Partial Management</strong> — tenants pay rent directly to those paybills and the agency invoices the landlord end-of-month.
                                    </p>
                                </div>
                            </div>

                            {/* Agency Primary Paybill */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    <h3 className="font-bold text-gray-800">Agency Paybill (Primary)</h3>
                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Full Management</span>
                                </div>
                                <div className="border border-green-200 rounded-xl p-5 bg-green-50/40">
                                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                M-Pesa Paybill / Till Number
                                            </label>
                                            <input
                                                type="text"
                                                value={agencyPaybill}
                                                onChange={e => setAgencyPaybill(e.target.value)}
                                                placeholder="e.g. 522522"
                                                className="w-full p-2.5 border border-green-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 font-mono"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">All Full Management rent payments are collected via this shortcode.</p>
                                        </div>
                                        <button
                                            onClick={handleSaveAgencyPaybill}
                                            className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                                        >
                                            {agencyPaybillSaved ? '✓ Saved' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Landlord Paybills — Partial Management */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                    <h3 className="font-bold text-gray-800">Landlord Paybills</h3>
                                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">Partial Management</span>
                                    <span className="ml-auto text-xs text-gray-400">{partialProperties.length} propert{partialProperties.length === 1 ? 'y' : 'ies'}</span>
                                </div>

                                {partialProperties.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                                        <p className="text-sm text-gray-500 font-medium">No Partial Management properties registered yet.</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            When you register a property under <strong>Partial Management</strong> in{' '}
                                            <a href="#/registration/properties" className="text-primary underline">Registration › Properties</a>,
                                            its landlord paybill will appear here automatically.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {partialProperties.map(prop => {
                                            const landlord = landlords.find(l => l.id === prop.landlordId);
                                            return (
                                                <div key={prop.id} className="border border-orange-200 rounded-xl p-4 bg-orange-50/40 flex flex-col sm:flex-row sm:items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-gray-800 text-sm">{prop.name}</span>
                                                            <span className="text-xs text-gray-400">•</span>
                                                            <span className="text-xs text-gray-500">{prop.branch}</span>
                                                            {prop.units?.length > 0 && (
                                                                <span className="text-xs text-gray-400">{prop.units.length} unit{prop.units.length !== 1 ? 's' : ''}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Landlord: <span className="font-medium text-gray-700">{landlord?.name || '—'}</span>
                                                            {landlord?.phone && <span className="ml-2 text-gray-400">{landlord.phone}</span>}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500 mb-0.5">Paybill / Till</p>
                                                            <p className="font-mono font-bold text-orange-700 text-sm">
                                                                {prop.landlordPaybill || <span className="text-red-500 font-normal">Not set</span>}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={`#/registration/properties`}
                                                            className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Edit property to update paybill"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                                            </svg>
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {partialProperties.some(p => !p.landlordPaybill) && (
                                    <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <Icon name="info" className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-red-700">
                                            Some Partial Management properties are missing a landlord paybill. Edit the property in{' '}
                                            <a href="#/registration/properties" className="underline font-medium">Registration › Properties</a> to add it.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── M-Pesa Integration ────────────────────────────────────── */}
                    {activeTab === 'mpesa' && (
                        <div className="max-w-2xl space-y-6">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-start gap-3">
                                <Icon name="info" className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-green-800 text-sm">M-Pesa Daraja API</h4>
                                    <p className="text-green-700 text-xs mt-1">Ensure your Consumer Key and Secret are from the Daraja portal matching the selected environment.</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-start gap-3">
                                <Icon name="info" className="w-5 h-5 text-amber-700 mt-0.5" />
                                <div className="space-y-2 text-xs text-amber-900">
                                    <p className="font-semibold">Live STK in this product</p>
                                    <p>
                                        Production credentials are not stored by this screen. Configure{' '}
                                        <span className="font-mono">MPESA_CONSUMER_KEY</span>,{' '}
                                        <span className="font-mono">MPESA_CONSUMER_SECRET</span>,{' '}
                                        <span className="font-mono">MPESA_SHORTCODE</span>, and{' '}
                                        <span className="font-mono">MPESA_PASSKEY</span> on the Supabase Edge Function{' '}
                                        <span className="font-mono">mpesa-stk-push</span> (and callback <span className="font-mono">mpesa-callback</span>). The fields below are for planning and demos only until a secure admin vault exists.
                                    </p>
                                    <div className="pt-2 border-t border-amber-200/80 space-y-2">
                                        <p className="font-semibold text-amber-950">Test STK (sandbox or production)</p>
                                        <label className="block text-[11px] font-medium text-amber-950/90">M-Pesa number</label>
                                        <input
                                            type="tel"
                                            value={stkTestPhone}
                                            onChange={e => setStkTestPhone(e.target.value)}
                                            className="w-full max-w-sm p-2 border border-amber-200 rounded-md bg-white text-gray-900"
                                            placeholder="07XXXXXXXX"
                                        />
                                        {stkTestMsg && (
                                            <p className="text-[11px] text-amber-950 whitespace-pre-wrap break-words">{stkTestMsg}</p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleTestStk}
                                            disabled={stkTestBusy}
                                            className="px-4 py-2 bg-amber-800 text-white text-sm font-semibold rounded-md hover:bg-amber-900 disabled:opacity-50"
                                        >
                                            {stkTestBusy ? 'Sending…' : 'Send test STK (KES 1)'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                                    <select name="environment" value={mpesaConfig.environment} onChange={handleMpesaChange} className="w-full p-2 border rounded-md bg-white">
                                        <option>Sandbox</option>
                                        <option>Production</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shortcode Type</label>
                                    <select className="w-full p-2 border rounded-md bg-white">
                                        <option>Paybill</option>
                                        <option>Till Number</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Paybill / Business No</label>
                                    <input name="paybill" value={mpesaConfig.paybill} onChange={handleMpesaChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Till Number (Optional)</label>
                                    <input name="till" value={mpesaConfig.till} onChange={handleMpesaChange} className="w-full p-2 border rounded-md" placeholder="e.g. 123456" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-bold text-gray-800">API Credentials</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Key</label>
                                    <input name="consumerKey" type="password" value={mpesaConfig.consumerKey} onChange={handleMpesaChange} className="w-full p-2 border rounded-md font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Secret</label>
                                    <input name="consumerSecret" type="password" value={mpesaConfig.consumerSecret} onChange={handleMpesaChange} className="w-full p-2 border rounded-md font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lipa na M-Pesa Passkey</label>
                                    <input name="passkey" type="password" value={mpesaConfig.passkey} onChange={handleMpesaChange} className="w-full p-2 border rounded-md font-mono text-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Airtel Money API ──────────────────────────────────────── */}
                    {activeTab === 'airtel' && (
                        <div className="max-w-2xl space-y-6">
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
                                <Icon name="info" className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-800 text-sm">Airtel Money API</h4>
                                    <p className="text-red-700 text-xs mt-1">Configure your Airtel Money integration settings.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                                    <select name="environment" value={airtelConfig.environment} onChange={handleAirtelChange} className="w-full p-2 border rounded-md bg-white">
                                        <option>Sandbox</option>
                                        <option>Production</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                                    <input name="partnerId" value={airtelConfig.partnerId} onChange={handleAirtelChange} className="w-full p-2 border rounded-md" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-bold text-gray-800">API Credentials</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                                    <input name="clientId" type="password" value={airtelConfig.clientId} onChange={handleAirtelChange} className="w-full p-2 border rounded-md font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                                    <input name="clientSecret" type="password" value={airtelConfig.clientSecret} onChange={handleAirtelChange} className="w-full p-2 border rounded-md font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grant Type</label>
                                    <input name="grantType" value={airtelConfig.grantType} onChange={handleAirtelChange} className="w-full p-2 border rounded-md text-sm bg-gray-50" readOnly />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Bank Accounts ─────────────────────────────────────────── */}
                    {activeTab === 'bank' && (
                        <div className="max-w-3xl space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Registered Bank Accounts</h3>
                                <button
                                    onClick={() => {
                                        setEditingId(null);
                                        setNewBank({ bankName: '', accountName: '', accountNumber: '', branch: '' });
                                        setIsAddingBank(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
                                >
                                    + Add Another Bank Account
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {bankAccounts.map(bank => (
                                    <div key={bank.id} className={`border rounded-lg p-4 flex justify-between items-center group transition-colors ${editingId === bank.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-blue-100 bg-blue-50/50 hover:bg-blue-50'}`}>
                                        <div>
                                            <h4 className="font-bold text-blue-800">{bank.bankName}</h4>
                                            <p className="text-sm text-gray-700">{bank.accountNumber}</p>
                                            <p className="text-xs text-gray-500">{bank.accountName} - {bank.branch}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleEditBank(bank)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Edit">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button onClick={() => removeBankAccount(bank.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors" title="Remove">
                                                <Icon name="close" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isAddingBank && (
                                <div className="mt-6 p-6 bg-gray-50 border rounded-xl shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-4">{editingId ? 'Edit Bank Account' : 'Add New Bank Account'}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                            <input name="bankName" value={newBank.bankName} onChange={handleNewBankChange} className="w-full p-2 border rounded-md" placeholder="e.g. Equity Bank" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                            <input name="accountName" value={newBank.accountName} onChange={handleNewBankChange} className="w-full p-2 border rounded-md" placeholder="e.g. TaskMe Realty Ltd" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                            <input name="accountNumber" value={newBank.accountNumber} onChange={handleNewBankChange} className="w-full p-2 border rounded-md font-mono" placeholder="0000000000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                            <input name="branch" value={newBank.branch} onChange={handleNewBankChange} className="w-full p-2 border rounded-md" placeholder="e.g. Westlands" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button onClick={handleCancelBankForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                                        <button onClick={handleAddOrUpdateBank} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
                                            {editingId ? 'Update Account' : 'Add Account'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentSetup;
