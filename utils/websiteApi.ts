
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
        await delay(1200);
        // Real leads should come from your website backend integration; return none until wired.
        return [];
    },

    // 5. Fetch Fundi Jobs (Admin/Fundi Side)
    // Simulates fetching job requests made to fundis via the website
    fetchFundiJobs: async (): Promise<FundiJob[]> => {
        await delay(1000);
        return [];
    }
};
