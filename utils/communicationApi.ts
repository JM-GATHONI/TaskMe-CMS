
import { Message } from '../types';
import { supabase } from './supabaseClient';

/**
 * Communication Service API
 * Simulates interaction with external providers like Twilio, Africa's Talking, SendGrid, WhatsApp Business API.
 */

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    providerRef?: string;
}

export const communicationApi = {
    // --- PUSH APIS (Sending) ---

    /**
     * Send SMS via Gateway (e.g. Africa's Talking, Twilio)
     */
    sendSMS: async (to: string, content: string, senderId: string): Promise<SendResult> => {
        console.log(`[API Push] Sending SMS... To: ${to}, SenderID: ${senderId}`);
        // Minimal placeholder for future SMS Edge Function (no real provider yet).
        try {
            const { data, error } = await supabase.functions.invoke('send-sms', {
                body: { to, content, senderId },
            });
            if (error) throw error;
            const messageId = (data as any)?.messageId || `sms-${Date.now()}`;
            return { success: true, messageId, providerRef: (data as any)?.providerRef };
        } catch (e: any) {
            await delay(800);
            if (!to) return { success: false, error: 'Recipient number missing' };
            return { 
                success: true, 
                messageId: `sms-${Date.now()}`,
                providerRef: `sms-local-fallback`
            };
        }
    },

    /**
     * Send Email via SMTP/API (e.g. SendGrid, Mailgun)
     */
    sendEmail: async (to: string, subject: string, body: string, from: string): Promise<SendResult> => {
        console.log(`[API Push] Sending Email... To: ${to}, From: ${from}`);
        try {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: { to, subject, html: body },
            });
            if (error) throw error;
            return { 
                success: true, 
                messageId: (data as any)?.messageId || `email-${Date.now()}`,
                providerRef: (data as any)?.providerRef
            };
        } catch (e: any) {
            await delay(1200);
            if (!to.includes('@')) return { success: false, error: 'Invalid email address' };
            return { 
                success: true, 
                messageId: `email-${Date.now()}`,
                providerRef: `email-local-fallback`
            };
        }
    },

    /**
     * Send WhatsApp Message (WhatsApp Business API)
     */
    sendWhatsApp: async (to: string, content: string): Promise<SendResult> => {
        console.log(`[API Push] Sending WhatsApp... To: ${to}`);
        await delay(1000);

        return { 
            success: true, 
            messageId: `wa-${Date.now()}`,
            providerRef: `wa-${Date.now()}`
        };
    },

    /**
     * Send In-App Notification (Firebase/OneSignal)
     */
    sendInApp: async (userId: string, content: string): Promise<SendResult> => {
        console.log(`[API Push] Sending Push Notification... User: ${userId}`);
        await delay(500);

        return { 
            success: true, 
            messageId: `pn-${Date.now()}`,
            providerRef: `fcm-${Date.now()}`
        };
    },

    // --- PULL APIS (Receiving/Syncing) ---

    /**
     * Fetch new messages from all channels (Sync)
     * Simulates polling external APIs for new inbound messages/replies
     */
    pullMessages: async (lastSyncTimestamp: number): Promise<Message[]> => {
        console.log(`[API Pull] Syncing messages since ${new Date(lastSyncTimestamp).toLocaleTimeString()}...`);
        await delay(1500);

        return [];
    },

    /**
     * Fetch Delivery Status Reports (DLRs)
     */
    pullDeliveryReports: async (messageIds: string[]): Promise<Record<string, string>> => {
        console.log(`[API Pull] Fetching DLRs for ${messageIds.length} messages...`);
        await delay(600);
        
        const updates: Record<string, string> = {};
        messageIds.forEach((id) => {
            updates[id] = 'Delivered';
        });
        return updates;
    }
};
