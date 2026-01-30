
// Security Utilities for TaskMe Realty
// Provides hashing for passwords and obfuscation for local storage persistence.

/**
 * Hashes a password using SHA-256 (Web Crypto API).
 * @param password The plain text password.
 * @returns The hex string of the hash.
 */
export const hashPassword = async (password: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Encrypts data for local storage (Obfuscation).
 * In a production environment, this should use AES-GCM with a user-derived key.
 * For this demo, we use Base64 encoding to prevent plain-text reading in dev tools.
 * @param data The JSON string to encrypt.
 */
export const encryptData = (data: string): string => {
    try {
        // Prefix to identify encrypted data and versioning
        return 'ENC_v1_' + btoa(encodeURIComponent(data));
    } catch (e) {
        console.error("Encryption error", e);
        return data;
    }
};

/**
 * Decrypts data from local storage.
 * @param data The encrypted string.
 */
export const decryptData = (data: string): string => {
    try {
        if (data && data.startsWith('ENC_v1_')) {
            return decodeURIComponent(atob(data.substring(7)));
        }
        // Backward compatibility: return as-is if not encrypted
        return data;
    } catch (e) {
        console.error("Decryption error", e);
        return data; 
    }
};