
import React, { useState } from 'react';
import Icon from '../Icon';

const Constants: React.FC = () => {
    // Initial state matching the screenshot context
    const [formData, setFormData] = useState({
        software: 'Sella',
        platform: 'IzzyLipa',
        supportTel: '742200790',
        senderEmail: 'noreply@izzylipa.com',
        replyEmail: 'noreply@izzylipa.com',
        emailPassword: '................',
        botKey: 'U4saZ0mFwuLXdE1JzxeS',
        firebaseKey: 'AAAA5i0EUvo:APA91bE1X39KhEivx5BAS07QRrMsLefr2RqOgGDp_V9cNzOBe3RrNLEF_CZT-y_JWoS9lB1dW3ytpT0j5siqMjaVdKNO9MdT1CDVYLYaiANLHUW4c',
        companyWebsite: 'https://www.izzylipa.com/',
        currencySymbol: 'Kshs.',
        shortcode: '854921',
        consumerKey: 'SGxGmO0vlH45T2zlZROJDHHlMZL4PAq7',
        secretKey: 'xr4lAj1YA1XAhf4k',
        passkey: '7ba3d2c636f36b9362a7ad45cfea9d2e14f2e38c324fa404462e6ea2f26738c',
        initiator: 'MATHENGE JOSEPH',
        securityCredential: 'PYLJVE8UdHRoP/fIPmXHi8TwcMfX/HzEhhGWeQwB6wza8XA3XfDOLo/EW',
        ziraPayApiKey: 'aG1Zb5M24SLtzwKUq9AuDhWF8DJk7Hjr', // Replaces Paytrigger
        cloudRunApiKey: 'f42ada7ef3fd456d8935ba547432f678', // Replaces Nouvopay
        repossessionPeriod: '7'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = () => {
        alert("Software constants updated successfully!");
    };

    const handleBack = () => {
        window.location.hash = '#/settings/profile';
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                {/* Header Title / Breadcrumb Simulation */}
                <h1 className="text-2xl font-normal text-gray-800">Software Constants</h1>
                <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                    <Icon name="dashboard" className="w-3 h-3" />
                    <span className="cursor-pointer hover:text-gray-800" onClick={() => window.location.hash = '#/dashboard'}>Home</span> 
                    <span>&gt;</span> 
                    <span>Info</span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-none">
                {/* Header Bar */}
                <div className="bg-orange-100/50 px-6 py-4 border-b border-orange-200">
                    <h1 className="text-lg font-bold text-gray-700">Software Constants</h1>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Software</label>
                            <input 
                                name="software"
                                value={formData.software} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Platform</label>
                            <input 
                                name="platform"
                                value={formData.platform} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Support Tel</label>
                            <input 
                                name="supportTel"
                                value={formData.supportTel} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Sender Email</label>
                            <input 
                                name="senderEmail"
                                value={formData.senderEmail} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Reply Email</label>
                            <input 
                                name="replyEmail"
                                value={formData.replyEmail} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Email Password</label>
                            <input 
                                type="password"
                                name="emailPassword"
                                value={formData.emailPassword} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <label className="block text-sm font-bold text-gray-800 mb-1">Bot Key</label>
                            <input 
                                name="botKey"
                                value={formData.botKey} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <label className="block text-sm font-bold text-gray-800 mb-1">Firebase Key</label>
                            <input 
                                name="firebaseKey"
                                value={formData.firebaseKey} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                         <div className="lg:col-span-3">
                            <label className="block text-sm font-bold text-gray-800 mb-1">Company Website</label>
                            <input 
                                name="companyWebsite"
                                value={formData.companyWebsite} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Currency Symbol</label>
                            <input 
                                name="currencySymbol"
                                value={formData.currencySymbol} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-800 mb-1">Shortcode</label>
                             <input 
                                name="shortcode"
                                value={formData.shortcode} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                         <div className="hidden lg:block"></div>

                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1">Consumer Key</label>
                                <input 
                                    name="consumerKey"
                                    value={formData.consumerKey} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1">Secret Key</label>
                                <input 
                                    name="secretKey"
                                    value={formData.secretKey} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        
                        <div className="lg:col-span-3">
                            <label className="block text-sm font-bold text-gray-800 mb-1">Passkey</label>
                             <input 
                                name="passkey"
                                value={formData.passkey} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-bold text-gray-800 mb-1">Initiator</label>
                            <input 
                                name="initiator"
                                value={formData.initiator} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                         
                        <div className="lg:col-span-3">
                            <label className="block text-sm font-bold text-gray-800 mb-1">Security Credential</label>
                            <input 
                                name="securityCredential"
                                value={formData.securityCredential} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="lg:col-span-2">
                             <label className="block text-sm font-bold text-gray-800 mb-1">Zira Pay API Key</label>
                             <input 
                                name="ziraPayApiKey"
                                value={formData.ziraPayApiKey} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                         <div className="lg:col-span-1"></div>

                        <div className="lg:col-span-2">
                             <label className="block text-sm font-bold text-gray-800 mb-1">Cloud run API Key</label>
                             <input 
                                name="cloudRunApiKey"
                                value={formData.cloudRunApiKey} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">Repossession Period</label>
                            <input 
                                type="number"
                                name="repossessionPeriod"
                                value={formData.repossessionPeriod} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                             <label className="block text-sm font-bold text-gray-800 mb-1">Logo(PNG/JPEG)</label>
                             <div className="flex items-center">
                                 <label className="cursor-pointer bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200">
                                     Choose File
                                     <input type="file" className="hidden" />
                                 </label>
                                 <span className="ml-3 text-sm text-gray-500">No file chosen</span>
                             </div>
                        </div>

                    </div>

                    {/* Pink Separator Line */}
                    <div className="mt-8 border-b-2 border-pink-500 mb-6"></div>

                    <div className="flex justify-center">
                        <button 
                            onClick={handleUpdate}
                            className="bg-[#2e86bf] hover:bg-blue-700 text-white font-bold py-2 px-6 rounded flex items-center transition-colors text-sm"
                        >
                            <Icon name="stack" className="w-4 h-4 mr-2" /> Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Constants;
