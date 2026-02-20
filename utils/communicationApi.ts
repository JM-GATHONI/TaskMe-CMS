
import { Message } from '../types';

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
        await delay(800);
        
        // Mock Validation
        if (!to) return { success: false, error: 'Recipient number missing' };

        return { 
            success: true, 
            messageId: `sms-${Date.now()}`,
            providerRef: `AT_${Math.floor(Math.random() * 100000)}` // Mock provider ID
        };
    },

    /**
     * Send Email via SMTP/API (e.g. SendGrid, Mailgun)
     */
    sendEmail: async (to: string, subject: string, body: string, from: string): Promise<SendResult> => {
        console.log(`[API Push] Sending Email... To: ${to}, From: ${from}`);
        await delay(1200);

        if (!to.includes('@')) return { success: false, error: 'Invalid email address' };

        return { 
            success: true, 
            messageId: `email-${Date.now()}`,
            providerRef: `SG.${Math.random().toString(36).substr(2, 9)}`
        };
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
            providerRef: `wamid.${Math.floor(Math.random() * 1000000)}`
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

        const newMessages: Message[] = [];
        
        // Randomly simulate an incoming message for demonstration
        if (Math.random() > 0.6) {
            const types: ('SMS' | 'Email' | 'WhatsApp')[] = ['SMS', 'Email', 'WhatsApp'];
            const type = types[Math.floor(Math.random() * types.length)];
            const senders = ['John Doe', 'Alice Smith', 'PowerWorks Electric', 'Equity Bank'];
            const sender = senders[Math.floor(Math.random() * senders.length)];

            newMessages.push({
                id: `inc-${Date.now()}`,
                recipient: { name: 'Property Management', contact: 'System' },
                content: `[Auto-Reply from ${type}] This is a simulated incoming message received via the Pull API.`,
                channel: type,
                status: 'Read', // Marked as read for demo, usually 'Delivered'
                timestamp: new Date().toLocaleString(),
                priority: 'Normal',
                isIncoming: true
            });
        }

        return newMessages;
    },

    /**
     * Fetch Delivery Status Reports (DLRs)
     */
    pullDeliveryReports: async (messageIds: string[]): Promise<Record<string, string>> => {
        console.log(`[API Pull] Fetching DLRs for ${messageIds.length} messages...`);
        await delay(600);
        
        const updates: Record<string, string> = {};
        messageIds.forEach(id => {
            // Randomly mark as Delivered or Read
            updates[id] = Math.random() > 0.5 ? 'Read' : 'Delivered';
        });
        return updates;
    }
};
