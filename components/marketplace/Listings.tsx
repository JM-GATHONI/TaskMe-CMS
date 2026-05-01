
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Icon from '../Icon';
import { MarketplaceListing, Unit, Property } from '../../types';

// --- Types for Form ---
type ListingType = 'Rent' | 'Sale' | 'AirBnB';

// --- MODAL: Add/Edit Listing ---
const ListingModal: React.FC<{ 
    listing?: MarketplaceListing | null; 
    onClose: () => void; 
    onSave: (l: MarketplaceListing) => void;
    properties: Property[];
    landlords: any[];
    staff: any[];
}> = ({ listing, onClose, onSave, properties, landlords, staff }) => {
    // Determine initial entry mode
    const isSystemProp = listing ? properties.some(p => p.id === listing.propertyId) : true;
    
    // Stage 1: Select Type
    const [type, setType] = useState<ListingType>(listing?.type || 'Rent');
    const [entryMode, setEntryMode] = useState<'System' | 'Manual'>(isSystemProp ? 'System' : 'Manual');
    
    // Stage 2: Select Unit (if new)
    const [selectedPropId, setSelectedPropId] = useState(listing?.propertyId || '');
    const [selectedUnitId, setSelectedUnitId] = useState(listing?.unitId || '');

    // Stage 3: Details
    const [formData, setFormData] = useState<Partial<MarketplaceListing>>(listing || {
        title: '', description: '', price: 0, currency: 'KES', features: [], images: [], status: 'Draft',
        propertyId: '', propertyName: '', unitId: '', unitNumber: '', location: '', zone: '',
        airbnbConfig: { cleaningFee: 0, checkInTime: '14:00', checkOutTime: '11:00', maxGuests: 2, houseRules: '', amenities: [] },
        saleConfig: { titleDeedType: 'Freehold', landSize: '', financingAvailable: false, propertyCategory: 'House', usageType: 'Residential' },
        ownerDetails: { name: '', contact: '', email: '', rating: 5, reviews: 0 }
    });

    // Valid Units (Vacant) - Though now we primarily edit existing auto-listings
    const availableProperties = properties.filter(p => p.units.some(u => u.status === 'Vacant'));
    const selectedProperty = properties.find(p => p.id === selectedPropId);
    const availableUnits = selectedProperty?.units.filter(u => u.status === 'Vacant' || u.id === listing?.unitId) || [];

    // Auto-fill Owner Details & Title when Unit Selected (Only for System mode)
    useEffect(() => {
        if (entryMode === 'System' && selectedPropId && selectedUnitId && !listing) {
            const prop = properties.find(p => p.id === selectedPropId);
            const unit = prop?.units.find(u => u.id === selectedUnitId);
            const landlord = landlords.find(l => l.id === prop?.landlordId);
            const assignedAgent = staff.find((s: any) => s.id === prop?.assignedAgentId);
            const affiliate = landlords.find(l => l.role === 'Affiliate' && l.id === prop?.landlordId);
            const contactOwner = assignedAgent || affiliate || landlord;

            if (prop && unit) {
                setFormData(prev => ({
                    ...prev,
                    title: `${prop.name} - ${unit.unitNumber}`,
                    description: `${unit.bedrooms} Bedroom unit in ${prop.location || prop.branch}.`,
                    price: type === 'Rent' ? (unit.rent || prop.defaultMonthlyRent || 0) : 0, // Default rent price
                    propertyName: prop.name,
                    unitNumber: unit.unitNumber,
                    location: prop.location || prop.branch || '',
                    zone: prop.zone || '',
                    pinLocationUrl: prop.pinLocationUrl || '',
                    ownerDetails: {
                        name: contactOwner?.name || 'Management',
                        contact: contactOwner?.phone || '',
                        email: contactOwner?.email || '',
                        rating: 5,
                        reviews: 0
                    }
                }));
            }
        }
    }, [selectedPropId, selectedUnitId, properties, landlords, staff, listing, type, entryMode]);

    const handleFeatures = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Simple comma split
        const val = e.target.value;
        setFormData(prev => ({ ...prev, features: val.split(',') }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const promises = files.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(promises).then(base64Images => {
                setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...base64Images] }));
            });
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = () => {
        // Validation
        if (entryMode === 'System' && (!selectedPropId || !selectedUnitId)) {
            alert("Please select a property and unit.");
            return;
        }
        if (entryMode === 'Manual' && (!formData.propertyName || !formData.location)) {
            alert("Please enter Property Name and Location.");
            return;
        }
        if (!formData.title || !formData.price) {
            alert("Please complete Title and Price.");
            return;
        }

        const finalListing: MarketplaceListing = {
            id: listing?.id || `lst-${Date.now()}`,
            propertyId: entryMode === 'System' ? selectedPropId : (listing?.propertyId || `manual-prop-${Date.now()}`),
            propertyName: formData.propertyName || '',
            unitId: entryMode === 'System' ? selectedUnitId : (listing?.unitId || `manual-unit-${Date.now()}`),
            unitNumber: formData.unitNumber || (entryMode === 'Manual' ? 'Main' : ''),
            type,
            status: formData.status || 'Draft',
            price: Number(formData.price),
            currency: formData.currency || 'KES',
            description: formData.description || '',
            title: formData.title || '',
            location: formData.location || '',
            zone: formData.zone || '',
            pinLocationUrl: formData.pinLocationUrl || '',
            images: formData.images || [],
            features: formData.features?.map(s => s.trim()) || [],
            airbnbConfig: type === 'AirBnB' ? formData.airbnbConfig : undefined,
            saleConfig: type === 'Sale' ? formData.saleConfig : undefined,
            ownerDetails: formData.ownerDetails || { name: 'Owner', contact: '', email: '' },
            dateCreated: listing?.dateCreated || new Date().toISOString()
        };

        onSave(finalListing);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[1500] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800">{listing ? 'Edit Listing' : 'Create New Listing'}</h3>
                    <button onClick={onClose}><Icon name="close" className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-6">
                    {/* Listing Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Listing Type</label>
                        <div className="flex gap-4">
                            {['Rent', 'Sale', 'AirBnB'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => !listing && setType(t as any)} // Disable change if editing existing
                                    disabled={!!listing}
                                    className={`flex-1 py-3 border rounded-xl text-sm font-bold transition-all ${
                                        type === t ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Entry Mode Toggle (Only for new or when applicable) */}
                    {(type === 'Sale' || type === 'AirBnB') && (
                        <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-lg">
                            <button 
                                onClick={() => setEntryMode('System')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md ${entryMode === 'System' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                            >
                                Link to Managed Unit
                            </button>
                            <button 
                                onClick={() => setEntryMode('Manual')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md ${entryMode === 'Manual' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                            >
                                Manual Entry
                            </button>
                        </div>
                    )}

                    {/* Unit Selection / Manual Entry */}
                    {entryMode === 'System' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property</label>
                                    <select 
                                        value={selectedPropId} 
                                        onChange={e => setSelectedPropId(e.target.value)} 
                                        disabled={!!listing}
                                        className="w-full p-2.5 border rounded-lg bg-white"
                                    >
                                        <option value="">Select Property</option>
                                        {availableProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit</label>
                                    <select 
                                        value={selectedUnitId} 
                                        onChange={e => setSelectedUnitId(e.target.value)} 
                                        disabled={!selectedPropId || !!listing}
                                        className="w-full p-2.5 border rounded-lg bg-white"
                                    >
                                        <option value="">Select Unit</option>
                                        {availableUnits.map(u => <option key={u.id} value={u.id}>{u.unitNumber} ({u.unitType || `${u.bedrooms}BR`})</option>)}
                                    </select>
                                </div>
                            </div>
                            {selectedUnitId && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                                        <input
                                            value={formData.location || ''}
                                            onChange={e => setFormData({...formData, location: e.target.value})}
                                            className="w-full p-2.5 border rounded-lg"
                                            placeholder="e.g. Kericho"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zone</label>
                                        <input
                                            value={formData.zone || ''}
                                            onChange={e => setFormData({...formData, zone: e.target.value})}
                                            className="w-full p-2.5 border rounded-lg"
                                            placeholder="e.g. Brooke"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Manual Property Details</div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Property Name</label>
                                <input 
                                    value={formData.propertyName}
                                    onChange={e => setFormData({...formData, propertyName: e.target.value})}
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="e.g. Sunset Villa"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Number/Name</label>
                                <input 
                                    value={formData.unitNumber}
                                    onChange={e => setFormData({...formData, unitNumber: e.target.value})}
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="e.g. House No. 5"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                                <input 
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="e.g. Kericho"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zone</label>
                                <input 
                                    value={formData.zone || ''}
                                    onChange={e => setFormData({...formData, zone: e.target.value})}
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="e.g. Brooke"
                                />
                             </div>
                        </div>
                    )}

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Images <span className="text-gray-400 font-normal">(Min 3 recommended)</span></label>
                        <div className="grid grid-cols-4 gap-3 mb-2">
                            {formData.images?.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => removeImage(idx)} 
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                    >
                                        <Icon name="close" className="w-3 h-3"/>
                                    </button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 aspect-square transition-colors hover:border-primary">
                                <Icon name="plus" className="w-8 h-8 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-2 font-bold">Add Photos</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Core Details */}
                    <div className="space-y-4 border-t pt-4">
                        <input 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full p-3 text-lg font-bold border-b focus:border-primary outline-none"
                            placeholder="Listing Title (e.g. Luxury 2BR in Kilimani)"
                        />
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    {type === 'Rent' ? 'Monthly Rent' : type === 'Sale' ? 'Sale Price' : 'Nightly Rate'} (KES)
                                </label>
                                <input 
                                    type="number"
                                    value={formData.price || ''} 
                                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                                    className="w-full p-2 border rounded-lg font-mono text-gray-800 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Publish Status</label>
                                <select 
                                    value={formData.status} 
                                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                                    className="w-full p-2 border rounded-lg bg-white"
                                >
                                    <option value="Draft">Draft (Hidden)</option>
                                    <option value="Published">Published (Live)</option>
                                </select>
                            </div>
                        </div>
                        <textarea 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full p-3 border rounded-lg text-sm"
                            rows={3}
                            placeholder="Detailed description..."
                        />
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Google / Pin Location URL</label>
                            <input
                                value={formData.pinLocationUrl || ''}
                                onChange={e => setFormData({ ...formData, pinLocationUrl: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm"
                                placeholder="https://maps.google.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Features (comma separated)</label>
                            <input 
                                value={formData.features?.join(',')} 
                                onChange={handleFeatures}
                                className="w-full p-2 border rounded-lg text-sm"
                                placeholder="WiFi, Gym, Parking, Balcony..."
                            />
                        </div>
                    </div>

                    {/* AirBnB Specifics */}
                    {type === 'AirBnB' && (
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4">
                            <h4 className="font-bold text-purple-800 text-sm">AirBnB Settings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                     <input 
                                        type="number" 
                                        placeholder="Cleaning Fee" 
                                        value={formData.airbnbConfig?.cleaningFee || ''}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            airbnbConfig: { ...formData.airbnbConfig!, cleaningFee: e.target.value === '' ? '' as any : Number(e.target.value) }
                                        })}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">One-time fee per booking.</p>
                                </div>
                                <div>
                                    <input 
                                        type="number" 
                                        placeholder="Max Guests" 
                                        value={formData.airbnbConfig?.maxGuests || ''}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            airbnbConfig: { ...formData.airbnbConfig!, maxGuests: e.target.value === '' ? '' as any : Number(e.target.value) }
                                        })}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Maximum occupancy.</p>
                                </div>
                                <div>
                                    <input 
                                        placeholder="Check-in (e.g. 14:00)" 
                                        value={formData.airbnbConfig?.checkInTime}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            airbnbConfig: { ...formData.airbnbConfig!, checkInTime: e.target.value }
                                        })}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Earliest arrival time.</p>
                                </div>
                                <div>
                                    <input 
                                        placeholder="Check-out (e.g. 11:00)" 
                                        value={formData.airbnbConfig?.checkOutTime}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            airbnbConfig: { ...formData.airbnbConfig!, checkOutTime: e.target.value }
                                        })}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Latest departure time.</p>
                                </div>
                            </div>
                            <textarea 
                                placeholder="House Rules..." 
                                value={formData.airbnbConfig?.houseRules}
                                onChange={e => setFormData({
                                    ...formData, 
                                    airbnbConfig: { ...formData.airbnbConfig!, houseRules: e.target.value }
                                })}
                                className="w-full p-2 border rounded text-sm h-20"
                            />
                        </div>
                    )}

                    {/* Sale Specifics */}
                    {type === 'Sale' && (
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                            <h4 className="font-bold text-blue-800 text-sm">Sale Settings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-blue-800/70 uppercase mb-1">Property Category</label>
                                    <select 
                                        value={formData.saleConfig?.propertyCategory || 'House'}
                                        onChange={e => setFormData({ ...formData, saleConfig: { ...formData.saleConfig!, propertyCategory: e.target.value as any } })}
                                        className="w-full p-2 border rounded text-sm bg-white"
                                    >
                                        <option value="House">House</option>
                                        <option value="Apartment">Apartment</option>
                                        <option value="Land">Land</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800/70 uppercase mb-1">Usage Type</label>
                                    <select 
                                        value={formData.saleConfig?.usageType || 'Residential'}
                                        onChange={e => setFormData({ ...formData, saleConfig: { ...formData.saleConfig!, usageType: e.target.value as any } })}
                                        className="w-full p-2 border rounded text-sm bg-white"
                                    >
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </div>
                                <div>
                                     <label className="block text-xs font-bold text-blue-800/70 uppercase mb-1">Title Type</label>
                                     <select 
                                        value={formData.saleConfig?.titleDeedType}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            saleConfig: { ...formData.saleConfig!, titleDeedType: e.target.value }
                                        })}
                                        className="w-full p-2 border rounded text-sm bg-white"
                                    >
                                        <option>Freehold</option>
                                        <option>Leasehold</option>
                                        <option>Sectional Title</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800/70 uppercase mb-1">Land/Floor Size</label>
                                    <input 
                                        placeholder="e.g. 0.5 Acre / 150sqm" 
                                        value={formData.saleConfig?.landSize}
                                        onChange={e => setFormData({
                                            ...formData, 
                                            saleConfig: { ...formData.saleConfig!, landSize: e.target.value }
                                        })}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center text-sm text-blue-900 font-medium">
                                <input 
                                    type="checkbox" 
                                    checked={formData.saleConfig?.financingAvailable}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        saleConfig: { ...formData.saleConfig!, financingAvailable: e.target.checked }
                                    })}
                                    className="mr-2 h-4 w-4 text-blue-600 rounded"
                                />
                                Financing / Mortgage Available
                            </label>
                        </div>
                    )}

                    {/* Owner Details (Read Only Review or Manual Input if not system) */}
                    <div className="p-4 bg-gray-50 rounded border border-gray-200 text-sm text-gray-500">
                        {entryMode === 'System' ? (
                            <><strong>Owner Contact (For Inquiries):</strong> {formData.ownerDetails?.name} | {formData.ownerDetails?.contact}</>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-500 uppercase">Owner Details (Manual)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold mb-1 text-xs">Owner Name</label>
                                        <input 
                                            value={formData.ownerDetails?.name}
                                            onChange={e => setFormData({...formData, ownerDetails: {...formData.ownerDetails!, name: e.target.value}})}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 text-xs">Contact Phone</label>
                                        <input 
                                            value={formData.ownerDetails?.contact}
                                            onChange={e => setFormData({...formData, ownerDetails: {...formData.ownerDetails!, contact: e.target.value}})}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 text-xs">Email Address</label>
                                        <input 
                                            type="email"
                                            value={formData.ownerDetails?.email}
                                            onChange={e => setFormData({...formData, ownerDetails: {...formData.ownerDetails!, email: e.target.value}})}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                     <div>
                                        <label className="block font-bold mb-1 text-xs">Rating (0-5)</label>
                                        <input 
                                            type="number"
                                            max={5}
                                            min={0}
                                            step={0.1}
                                            value={formData.ownerDetails?.rating}
                                            onChange={e => setFormData({...formData, ownerDetails: {...formData.ownerDetails!, rating: parseFloat(e.target.value) || 0}})}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 text-xs">Review Count</label>
                                        <input 
                                            type="number"
                                            value={formData.ownerDetails?.reviews ?? ''}
                                            onChange={e => setFormData({...formData, ownerDetails: {...formData.ownerDetails!, reviews: e.target.value === '' ? '' as any : parseInt(e.target.value) || 0}})}
                                            className="w-full p-2 border rounded bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark shadow-md">
                        {formData.status === 'Published' ? 'Publish Now' : 'Save Draft'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ListingCard: React.FC<{ listing: MarketplaceListing; onEdit: () => void; onDelete: () => void; onMarkOccupied: () => void }> = ({ listing, onEdit, onDelete, onMarkOccupied }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full relative">
        <div className="h-40 bg-gray-200 relative overflow-hidden">
            {listing.images[0] ? (
                <img src={listing.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={listing.title} />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                    <Icon name="vacant-house" className="w-12 h-12 opacity-20" />
                </div>
            )}
            <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase ${
                listing.status === 'Published' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
                {listing.status}
            </div>
             <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase ${
                listing.type === 'AirBnB' ? 'bg-pink-500 text-white' : 
                listing.type === 'Sale' ? 'bg-blue-600 text-white' : 
                'bg-orange-500 text-white'
            }`}>
                {listing.type}
            </div>
            {listing.images.length > 1 && (
                 <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center">
                     <Icon name="stack" className="w-3 h-3 mr-1" /> {listing.images.length}
                 </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-8">
                <p className="text-white font-bold text-lg">KES {Number(listing.price ?? 0).toLocaleString()}</p>
            </div>
        </div>
        
        <div className="p-5 flex-grow flex flex-col">
            <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{listing.title}</h3>
            <p className="text-xs text-gray-500 mb-3 flex items-center">
                <Icon name="branch" className="w-3 h-3 mr-1 text-gray-400"/> {listing.location}
            </p>
            
            {listing.type === 'AirBnB' && (
                <div className="text-xs text-gray-600 mb-3 bg-pink-50 p-2 rounded">
                    Guests: {listing.airbnbConfig?.maxGuests} • Rules: {listing.airbnbConfig?.houseRules ? 'Yes' : 'No'}
                </div>
            )}
            {listing.type === 'Sale' && (
                <div className="text-xs text-gray-600 mb-3 bg-blue-50 p-2 rounded flex flex-wrap gap-2">
                    <span>{listing.saleConfig?.propertyCategory}</span>
                    <span>•</span>
                    <span>{listing.saleConfig?.usageType}</span>
                    <span>•</span>
                    <span>{listing.saleConfig?.titleDeedType}</span>
                </div>
            )}

            <div className="mt-auto flex gap-2 pt-3 border-t border-gray-50">
                <button onClick={onEdit} className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded hover:bg-gray-200 transition-colors">
                    Edit Details
                </button>
                <button onClick={onDelete} className="px-2 py-1.5 bg-white border border-red-200 text-red-500 text-xs font-bold rounded hover:bg-red-50">
                    <Icon name="trash" className="w-3 h-3" />
                </button>
            </div>
            
            {listing.status === 'Published' && (
                <button onClick={onMarkOccupied} className="w-full mt-2 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 shadow-sm">
                    Mark Occupied / Sold
                </button>
            )}
            {listing.status === 'Published' && listing.pinLocationUrl && (
                <a
                    href={listing.pinLocationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full mt-2 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded hover:bg-blue-100 shadow-sm text-center block"
                >
                    Open Map Pin
                </a>
            )}
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const Listings: React.FC = () => {
    const { properties, landlords, staff, marketplaceListings, addMarketplaceListing, updateMarketplaceListing, deleteMarketplaceListing, markUnitOccupied } = useData();
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);
    const [filterType, setFilterType] = useState('All');

    // --- Derived Data ---
    
    // Auto-populated listing logic is handled in DataContext now.
    // marketplaceListings contains automatically created listings from vacant units.
    
    const displayedListings = useMemo(() => {
        return marketplaceListings.filter(l => filterType === 'All' || l.type === filterType);
    }, [marketplaceListings, filterType]);

    // --- Actions ---

    const handleSave = (listing: MarketplaceListing) => {
        if (editingListing) {
            updateMarketplaceListing(listing.id, listing);
        } else {
            addMarketplaceListing(listing);
        }
        setIsModalOpen(false);
        setEditingListing(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this listing? If the unit is still vacant, it may auto-repopulate.")) {
            deleteMarketplaceListing(id);
        }
    };

    const handleMarkOccupied = (listing: MarketplaceListing) => {
        const action = listing.type === 'Sale' ? 'Sold' : 'Occupied';
        if (confirm(`Mark this unit as ${action}? This will remove the listing and update property records.`)) {
            markUnitOccupied(listing.propertyId, listing.unitId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Listings Manager</h1>
                    <p className="text-lg text-gray-500 mt-1">
                        Control public inventory. Vacant units are 
                        <span className="text-green-600 font-bold ml-1">automatically added</span> here.
                    </p>
                </div>
                <div className="flex bg-green-50 p-2 rounded-xl border border-green-200 text-green-800 text-sm font-bold items-center">
                    <Icon name="check" className="w-4 h-4 mr-2" />
                    Auto-Sync Active: Vacancies are pushed to Website API.
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div className="flex gap-2">
                    {['All', 'Rent', 'Sale', 'AirBnB'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                filterType === type ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => { setEditingListing(null); setIsModalOpen(true); }}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-dark shadow-sm flex items-center"
                >
                    <Icon name="plus" className="w-4 h-4 mr-2" /> New Listing
                </button>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedListings.map(l => (
                    <ListingCard 
                        key={l.id} 
                        listing={l} 
                        onEdit={() => { setEditingListing(l); setIsModalOpen(true); }}
                        onDelete={() => handleDelete(l.id)}
                        onMarkOccupied={() => handleMarkOccupied(l)}
                    />
                ))}
                {displayedListings.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Icon name="search" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No listings found. Vacant units will appear here automatically.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <ListingModal 
                    listing={editingListing} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    properties={properties}
                    landlords={landlords}
                    staff={staff}
                />
            )}
        </div>
    );
};

export default Listings;
