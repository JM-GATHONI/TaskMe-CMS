
import React, { useState } from 'react';
import Icon from '../Icon';
import { useData } from '../../context/DataContext';

const AdBanners: React.FC = () => {
    const { currentUser } = useData();
    const [customContact, setCustomContact] = useState(currentUser?.phone || '');

    // Mock Banner Data
    const banners = [
        {
            id: 'b1',
            title: 'Vacant 2BR at Riverside',
            subtitle: 'Modern finishes, high speed internet.',
            price: 'KES 25,000',
            image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
            type: 'For Rent'
        },
        {
            id: 'b2',
            title: 'Urban Renewal Fund I',
            subtitle: 'Invest and earn 30% APY.',
            price: 'Min KES 50k',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
            type: 'Investment'
        }
    ];

    const handleDownload = (bannerTitle: string) => {
        const contact = customContact.trim() ? customContact : 'Contact Office';
        alert(`Generating PDF for "${bannerTitle}" with contact info: ${contact}... (Mock Download)`);
    };

    return (
        <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Featured Opportunities</h3>
                    <p className="text-gray-500 text-sm">Share these with your network.</p>
                </div>
                
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase">Your Contact Info:</span>
                    <input 
                        type="text" 
                        value={customContact}
                        onChange={(e) => setCustomContact(e.target.value)}
                        placeholder="Add your phone..."
                        className="border-none outline-none text-sm font-medium text-gray-800 w-32 bg-transparent"
                    />
                    <Icon name="settings" className="w-4 h-4 text-gray-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map(banner => (
                    <div key={banner.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group relative">
                        <div className="h-48 relative">
                            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                                {banner.type}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <h4 className="text-xl font-bold">{banner.title}</h4>
                                <p className="text-white/80 text-sm">{banner.subtitle}</p>
                            </div>
                        </div>
                        
                        <div className="p-4 flex justify-between items-center bg-gray-50">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Price / Return</p>
                                <p className="text-lg font-bold text-primary">{banner.price}</p>
                            </div>
                            <button 
                                onClick={() => handleDownload(banner.title)}
                                className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-colors text-sm font-bold shadow-sm"
                            >
                                <Icon name="download" className="w-4 h-4 mr-2" /> Download Poster
                            </button>
                        </div>
                        
                        {/* Overlay showing customization preview */}
                        {customContact && (
                            <div className="absolute bottom-20 right-4 bg-white/90 backdrop-blur text-gray-800 text-[10px] px-2 py-1 rounded shadow border border-gray-200">
                                Contact: {customContact}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdBanners;
