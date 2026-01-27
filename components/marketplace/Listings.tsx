
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';

// --- Constants ---

const RESIDENTIAL_TYPES = [
    'Single Room', 'Double Room', 'Studio Apartment', 'Bedsitter', 
    '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', 
    '3 Bedroom Own Compound', '4 Bedroom Own Compound', '5 Bedroom Own Compound', 
    'Bungalow', 'Mansionnate', 'Condo', 'Villa'
];

const COMMERCIAL_TYPES = [
    'Garages', 'Offices', 'Shops', 'Godowns', 'Retail Space'
];

const RENT_RANGES = [
    { label: 'Below KES 5,000', min: 0, max: 5000 },
    { label: 'KES 5,000 - 10,000', min: 5000, max: 10000 },
    { label: 'KES 10,000 - 20,000', min: 10000, max: 20000 },
    { label: 'KES 20,000 - 50,000', min: 20000, max: 50000 },
    { label: 'KES 50,000 - 100,000', min: 50000, max: 100000 },
    { label: 'KES 100,000+', min: 100000, max: Infinity },
];

const SALE_RANGES = [
    { label: 'Below KES 1M', min: 0, max: 1000000 },
    { label: 'KES 1M - 5M', min: 1000000, max: 5000000 },
    { label: 'KES 5M - 10M', min: 5000000, max: 10000000 },
    { label: 'KES 10M - 20M', min: 10000000, max: 20000000 },
    { label: 'KES 20M - 50M', min: 20000000, max: 50000000 },
    { label: 'KES 50M+', min: 50000000, max: Infinity },
];

// --- Mock Data Generation for Demo ---
// We generate a diverse list to ensure all filters work
const GENERATED_LISTINGS = [
    // Residential Rentals
    { id: 'l1', title: 'Cozy Bedsitter', type: 'Residential', houseType: 'Bedsitter', purpose: 'Rent', price: 4500, location: 'Juja', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80', beds: 0, baths: 1 },
    { id: 'l2', title: 'Modern Studio', type: 'Residential', houseType: 'Studio Apartment', purpose: 'Rent', price: 12000, location: 'Roysambu', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80', beds: 0, baths: 1 },
    { id: 'l3', title: 'Spacious 1 Bedroom', type: 'Residential', houseType: '1 Bedroom', purpose: 'Rent', price: 18000, location: 'Kasarani', image: 'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=400&q=80', beds: 1, baths: 1 },
    { id: 'l4', title: 'Luxury 2 Bedroom', type: 'Residential', houseType: '2 Bedroom', purpose: 'Rent', price: 45000, location: 'Kilimani', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=400&q=80', beds: 2, baths: 2 },
    { id: 'l5', title: 'Family Bungalow', type: 'Residential', houseType: 'Bungalow', purpose: 'Rent', price: 85000, location: 'Karen', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80', beds: 4, baths: 3 },
    { id: 'l6', title: '3 Bedroom Own Compound', type: 'Residential', houseType: '3 Bedroom Own Compound', purpose: 'Rent', price: 60000, location: 'Syokimau', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80', beds: 3, baths: 2 },
    
    // Commercial Rentals
    { id: 'c1', title: 'CBD Office Suite', type: 'Commercial', houseType: 'Offices', purpose: 'Rent', price: 35000, location: 'Nairobi CBD', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', size: '500 sqft' },
    { id: 'c2', title: 'Prime Retail Space', type: 'Commercial', houseType: 'Retail Space', purpose: 'Rent', price: 80000, location: 'Westlands', image: 'https://images.unsplash.com/photo-1519567241046-7f570eee3c9e?auto=format&fit=crop&w=400&q=80', size: '1000 sqft' },
    { id: 'c3', title: 'Industrial Godown', type: 'Commercial', houseType: 'Godowns', purpose: 'Rent', price: 150000, location: 'Mlolongo', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80', size: '5000 sqft' },

    // Properties For Sale
    { id: 's1', title: 'Modern Villa', type: 'Residential', houseType: 'Villa', purpose: 'Sale', price: 45000000, location: 'Runda', image: 'https://images.unsplash.com/photo-1613490493576-2f5037657918?auto=format&fit=crop&w=400&q=80', beds: 5, baths: 5 },
    { id: 's2', title: 'Starter Condo', type: 'Residential', houseType: 'Condo', purpose: 'Sale', price: 8500000, location: 'Kileleshwa', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80', beds: 2, baths: 2 },
    { id: 's3', title: 'Highway Shop', type: 'Commercial', houseType: 'Shops', purpose: 'Sale', price: 3500000, location: 'Thika Road', image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=80', size: '300 sqft' },
    { id: 's4', title: 'Mansionnate in Gated Community', type: 'Residential', houseType: 'Mansionnate', purpose: 'Sale', price: 22000000, location: 'Kitengela', image: 'https://images.unsplash.com/photo-1600596542815-2a4d9fdb252b?auto=format&fit=crop&w=400&q=80', beds: 4, baths: 3 },
    { id: 's5', title: '4 Bedroom Own Compound', type: 'Residential', houseType: '4 Bedroom Own Compound', purpose: 'Sale', price: 18000000, location: 'Ruiru', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80', beds: 4, baths: 3 },
];

const Listings: React.FC = () => {
    const { properties } = useData();
    
    // --- Filters State ---
    const [listingPurpose, setListingPurpose] = useState<'Rent' | 'Sale'>('Rent');
    const [propertyType, setPropertyType] = useState<'Residential' | 'Commercial' | 'All'>('All');
    const [houseType, setHouseType] = useState('All');
    const [location, setLocation] = useState('All Locations');
    const [priceRange, setPriceRange] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Combine Context Data with Mock Data ---
    const allListings = useMemo(() => {
        // Convert context properties to listing format if they have vacant units
        const contextListings = properties.flatMap(p => 
            p.units.filter(u => u.status === 'Vacant').map(u => ({
                id: u.id,
                title: `${p.name} - ${u.unitNumber}`,
                type: p.type === 'Mixed-Use' ? 'Residential' : p.type, // Simplify for filter
                houseType: u.unitType || 'Apartment', // Default fallback
                purpose: 'Rent', // Context props are mostly rental
                price: u.rent || p.defaultMonthlyRent || 0,
                location: p.location || p.branch,
                image: p.profilePictureUrl || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80',
                beds: u.bedrooms,
                baths: u.bathrooms,
                size: undefined
            }))
        );

        // Merge with generated robust data
        return [...contextListings, ...GENERATED_LISTINGS];
    }, [properties]);

    // --- Derived Options ---
    const availableLocations = useMemo(() => 
        ['All Locations', ...new Set(allListings.map(l => l.location).sort())]
    , [allListings]);

    const activeHouseTypes = useMemo(() => {
        if (propertyType === 'Residential') return RESIDENTIAL_TYPES;
        if (propertyType === 'Commercial') return COMMERCIAL_TYPES;
        return [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES].sort();
    }, [propertyType]);

    const activePriceRanges = listingPurpose === 'Rent' ? RENT_RANGES : SALE_RANGES;

    // --- Filtering Logic ---
    const filteredListings = useMemo(() => {
        return allListings.filter(l => {
            // 1. Purpose (Rent/Sale)
            if (l.purpose !== listingPurpose) return false;

            // 2. Property Type
            if (propertyType !== 'All' && l.type !== propertyType) return false;

            // 3. House Type
            if (houseType !== 'All' && l.houseType !== houseType) return false;

            // 4. Location
            if (location !== 'All Locations' && l.location !== location) return false;

            // 5. Price Range
            if (priceRange !== 'All') {
                const range = activePriceRanges.find(r => r.label === priceRange);
                if (range) {
                    if (l.price < range.min || l.price >= range.max) return false;
                }
            }

            // 6. Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = l.title.toLowerCase().includes(q) || 
                              l.location.toLowerCase().includes(q) ||
                              l.houseType.toLowerCase().includes(q);
                if (!match) return false;
            }

            return true;
        });
    }, [allListings, listingPurpose, propertyType, houseType, location, priceRange, searchQuery, activePriceRanges]);

    const handleShare = (title: string) => {
        alert(`Sharing listing "${title}" to social media...`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Property Marketplace</h1>
                    <p className="text-lg text-gray-500 mt-1">Browse available units for rent or purchase.</p>
                </div>
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button 
                        onClick={() => { setListingPurpose('Rent'); setPriceRange('All'); }}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${listingPurpose === 'Rent' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        Properties for Rent
                    </button>
                    <button 
                        onClick={() => { setListingPurpose('Sale'); setPriceRange('All'); }}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${listingPurpose === 'Sale' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        Properties for Sale
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                        <input 
                            type="text" 
                            placeholder="Keyword search..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                        <div className="absolute left-3 top-3 text-gray-400"><Icon name="search" className="w-5 h-5" /></div>
                    </div>

                    {/* Property Type */}
                    <select 
                        value={propertyType} 
                        onChange={e => { setPropertyType(e.target.value as any); setHouseType('All'); }}
                        className="p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                        <option value="All">All Property Types</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                    </select>

                    {/* House Type */}
                    <select 
                        value={houseType} 
                        onChange={e => setHouseType(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                        <option value="All">All House Types</option>
                        {activeHouseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Location */}
                    <select 
                        value={location} 
                        onChange={e => setLocation(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                        {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    {/* Price Range */}
                    <select 
                        value={priceRange} 
                        onChange={e => setPriceRange(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                        <option value="All">Any Price</option>
                        {activePriceRanges.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map(l => (
                    <div key={l.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
                        <div className="h-52 bg-gray-200 relative overflow-hidden">
                            {l.image ? (
                                <img src={l.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={l.title} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                                    <Icon name="vacant-house" className="w-12 h-12 opacity-20" />
                                </div>
                            )}
                            <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded shadow-sm ${l.purpose === 'Sale' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
                                FOR {l.purpose.toUpperCase()}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                                <p className="text-white font-bold text-xl">KES {l.price.toLocaleString()}</p>
                                <p className="text-white/80 text-xs font-medium">{l.houseType}</p>
                            </div>
                        </div>
                        
                        <div className="p-5 flex-grow flex flex-col">
                            <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">{l.title}</h3>
                            <p className="text-xs text-gray-500 mb-3 flex items-center">
                                <Icon name="branch" className="w-3 h-3 mr-1 text-gray-400"/> {l.location}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-600">
                                {l.beds !== undefined && (
                                    <span className="bg-gray-100 px-2 py-1 rounded flex items-center">
                                        <span className="font-bold mr-1">{l.beds}</span> Beds
                                    </span>
                                )}
                                {l.baths !== undefined && (
                                    <span className="bg-gray-100 px-2 py-1 rounded flex items-center">
                                        <span className="font-bold mr-1">{l.baths}</span> Baths
                                    </span>
                                )}
                                {l.size && (
                                    <span className="bg-gray-100 px-2 py-1 rounded flex items-center">
                                        {l.size}
                                    </span>
                                )}
                            </div>

                            <div className="mt-auto flex gap-2 pt-3 border-t border-gray-50">
                                <button className="flex-1 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shadow-sm">
                                    View Details
                                </button>
                                <button onClick={() => handleShare(l.title)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                    <Icon name="communication" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredListings.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Icon name="search" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-600">No listings found</h3>
                        <p className="text-gray-400 mt-1">Try adjusting your filters or search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Listings;
