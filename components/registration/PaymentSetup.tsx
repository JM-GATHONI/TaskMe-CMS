
import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import { supabase } from '../../utils/supabaseClient';

const PaymentSetup: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'mpesa' | 'airtel' | 'bank'>('mpesa');
    const [stkTestPhone, setStkTestPhone] = useState('');
    const [stkTestBusy, setStkTestBusy] = useState(false);
    const [stkTestMsg, setStkTestMsg] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data } = await supabase.auth.getSession();
            const p = (data.session?.user?.user_metadata as any)?.phone;
            if (!cancelled && p) setStkTestPhone(String(p));
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    
    // M-Pesa Mock State
    const [mpesaConfig, setMpesaConfig] = useState({
        paybill: '522522',
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
            alert("Please fill in at least Bank Name and Account Number.");
            return;
        }

        if (editingId) {
            // Update existing
            setBankAccounts(prev => prev.map(acc => acc.id === editingId ? { ...acc, ...newBank } : acc));
            alert("Bank account updated successfully.");
        } else {
            // Add new
            setBankAccounts([...bankAccounts, { id: `ba-${Date.now()}`, ...newBank }]);
            alert("Bank account added successfully.");
        }

        // Reset form
        setNewBank({ bankName: '', accountName: '', accountNumber: '', branch: '' });
        setIsAddingBank(false);
        setEditingId(null);
    };

    const handleEditBank = (bank: typeof bankAccounts[0]) => {
        setNewBank({
            bankName: bank.bankName,
            accountName: bank.accountName,
            accountNumber: bank.accountNumber,
            branch: bank.branch
        });
        setEditingId(bank.id);
        setIsAddingBank(true);
    };

    const removeBankAccount = (id: string) => {
        if (confirm("Are you sure you want to remove this bank account?")) {
            setBankAccounts(prev => prev.filter(acc => acc.id !== id));
            // If we were editing the deleted one, close form
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
        alert("Settings Saved Successfully!");
    };

    const handleBack = () => {
        window.location.hash = '#/registration/overview';
    };

    const handleTestStk = async () => {
        setStkTestMsg(null);
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
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
            } catch {
                /* ignore */
            }
            setStkTestMsg(msg);
        } finally {
            setStkTestBusy(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Payment Setup</h1>
                    <p className="text-lg text-gray-500 mt-1">Configure integration with payment providers.</p>
                </div>
                <button onClick={handleSave} className="px-6 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark">
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto">
                        <button 
                            onClick={() => setActiveTab('mpesa')}
                            className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'mpesa' ? 'border-green-500 text-green-600 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            M-Pesa Integration
                        </button>
                        <button 
                            onClick={() => setActiveTab('airtel')}
                            className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'airtel' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            Airtel Money API
                        </button>
                        <button 
                            onClick={() => setActiveTab('bank')}
                            className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'bank' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            Bank Accounts ({bankAccounts.length})
                        </button>
                    </nav>
                </div>

                <div className="p-8">
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
                                            <button 
                                                onClick={() => handleEditBank(bank)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                                title="Edit"
                                            >
                                                {/* Simple Pencil Icon SVG */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => removeBankAccount(bank.id)} 
                                                className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors"
                                                title="Remove"
                                            >
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
