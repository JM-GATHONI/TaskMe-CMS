
import { MarketplaceListing, Lead, FundiJob } from '../types';

/**
 * Simulates API calls for the public-facing website.
 * In a real application, these would be fetch requests to your backend.
 * Here, we interact with the local storage or a mock database.
 */

// Simulate latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const websiteApi = {
    // 1. Fetch Published Listings
    getPublishedListings: async (type?: 'Rent' | 'Sale' | 'AirBnB'): Promise<MarketplaceListing[]> => {
        await delay(500); // Simulate network delay
        // For production, this should query a real API.
        // For now, return an empty list and rely on Supabase-backed data in the main app.
        return [];
    },

    // 2. Simulate AirBnB Booking
    bookAirBnB: async (listingId: string, guestDetails: any, dates: { checkIn: string, checkOut: string }) => {
        await delay(1000);
        console.log(`Booking request for ${listingId}`, guestDetails, dates);
        // Returns a mock payment/booking confirmation
        return {
            success: true,
            bookingId: `BK-${Date.now()}`,
            message: "Booking request sent to host. Awaiting confirmation."
        };
    },

    // 3. Inquiry for Sale/Rent
    submitInquiry: async (listingId: string, contactDetails: any, message: string) => {
        await delay(800);
        console.log(`Inquiry for ${listingId}: ${message}`, contactDetails);
        return {
            success: true,
            message: "Inquiry sent to agent. They will contact you shortly."
        };
    },

    // 4. Fetch New Leads (Admin Side)
    // Simulates fetching leads submitted via contact forms on the website
    fetchLeads: async (): Promise<Lead[]> => {
        await delay(1200); // Network simulation
        
        // Return some random mock leads simulating recent activity
        const mockNames = ['Alice Wonder', 'Bob Builder', 'Charlie Chaplin', 'David Data'];
        const mockInterests = ['2BR Apartment', 'Office Space', 'Studio', '3BR Villa'];
        
        const newLeads: Lead[] = Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => ({
            id: `web-lead-${Date.now()}-${i}`,
            tenantName: mockNames[Math.floor(Math.random() * mockNames.length)],
            contact: `07${Math.floor(Math.random() * 90000000 + 10000000)}`,
            email: `lead${Date.now()}${i}@example.com`,
            interest: mockInterests[Math.floor(Math.random() * mockInterests.length)],
            status: 'New',
            source: 'Website',
            date: new Date().toISOString().split('T')[0],
            assignedAgent: 'Unassigned',
            listingTitle: 'General Inquiry',
            notes: 'Submitted via website contact form.'
        }));
        
        return newLeads;
    },

    // 5. Fetch Fundi Jobs (Admin/Fundi Side)
    // Simulates fetching job requests made to fundis via the website
    fetchFundiJobs: async (): Promise<FundiJob[]> => {
        await delay(1000);
        // Mock returning a new job randomly
        const shouldAddJob = Math.random() > 0.5;
        if (!shouldAddJob) return [];

        const trades = ['Plumber', 'Electrician', 'Painter'];
        const trade = trades[Math.floor(Math.random() * trades.length)];
        
        const newJob: FundiJob = {
            id: `job-web-${Date.now()}`,
            fundiId: 'v4', // Mocking mapping to Joseph Kamau for demo
            fundiName: 'Joseph Kamau',
            clientName: 'Web User',
            clientPhone: `07${Math.floor(Math.random() * 90000000 + 10000000)}`,
            location: 'Nairobi West',
            description: `Urgent request for ${trade}`,
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            source: 'Website'
        };
        return [newJob];
    }
};
