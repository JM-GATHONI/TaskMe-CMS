import { supabase } from '../lib/supabase';

// ============================================
// STORAGE SERVICE
// Handles file uploads to Supabase Storage
// ============================================

export const STORAGE_BUCKETS = {
  PROFILES: 'profiles',
  PROPERTIES: 'properties',
  DOCUMENTS: 'documents',
  MAINTENANCE: 'maintenance',
  INVOICES: 'invoices'
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// ============================================
// STORAGE SERVICE
// ============================================

export const storageService = {
  // ----------------------------------------
  // Upload a file to a bucket
  // ----------------------------------------
  async uploadFile(
    bucket: StorageBucket,
    path: string,
    file: File
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return { url: null, error };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      return { url: null, error: err as Error };
    }
  },

  // ----------------------------------------
  // Upload multiple files to a bucket
  // ----------------------------------------
  async uploadMultiple(
    bucket: StorageBucket,
    path: string,
    files: File[]
  ): Promise<{ urls: string[]; errors: (Error | null)[] }> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(bucket, path, file))
    );

    return {
      urls: results.map(r => r.url).filter((url): url is string => url !== null),
      errors: results.map(r => r.error)
    };
  },

  // ----------------------------------------
  // Delete a file from a bucket
  // ----------------------------------------
  async deleteFile(
    bucket: StorageBucket,
    path: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  },

  // ----------------------------------------
  // Delete multiple files from a bucket
  // ----------------------------------------
  async deleteMultiple(
    bucket: StorageBucket,
    paths: string[]
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  },

  // ----------------------------------------
  // Get public URL for a file
  // ----------------------------------------
  getPublicUrl(bucket: StorageBucket, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // ----------------------------------------
  // Get signed URL for private files (time-limited)
  // ----------------------------------------
  async getSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return { url: null, error };
      }

      return { url: data.signedUrl, error: null };
    } catch (err) {
      return { url: null, error: err as Error };
    }
  },

  // ----------------------------------------
  // List files in a bucket/path
  // ----------------------------------------
  async listFiles(
    bucket: StorageBucket,
    path: string = ''
  ): Promise<{ files: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        return { files: null, error };
      }

      return { files: data, error: null };
    } catch (err) {
      return { files: null, error: err as Error };
    }
  },

  // ----------------------------------------
  // Check if a file exists
  // ----------------------------------------
  async fileExists(
    bucket: StorageBucket,
    path: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      return data && data.length > 0;
    } catch {
      return false;
    }
  },

  // ----------------------------------------
  // Move/rename a file
  // ----------------------------------------
  async moveFile(
    bucket: StorageBucket,
    fromPath: string,
    toPath: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  },

  // ----------------------------------------
  // Copy a file
  // ----------------------------------------
  async copyFile(
    bucket: StorageBucket,
    fromPath: string,
    toPath: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  }
};

// ============================================
// CONVENIENCE METHODS FOR SPECIFIC BUCKETS
// ============================================

export const profileStorage = {
  async uploadAvatar(userId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.PROFILES, `avatars/${userId}`, file);
  },

  async deleteAvatar(userId: string, fileName: string) {
    return storageService.deleteFile(STORAGE_BUCKETS.PROFILES, `avatars/${userId}/${fileName}`);
  }
};

export const propertyStorage = {
  async uploadImage(propertyId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.PROPERTIES, `images/${propertyId}`, file);
  },

  async uploadImages(propertyId: string, files: File[]) {
    return storageService.uploadMultiple(STORAGE_BUCKETS.PROPERTIES, `images/${propertyId}`, files);
  },

  async deleteImage(propertyId: string, fileName: string) {
    return storageService.deleteFile(STORAGE_BUCKETS.PROPERTIES, `images/${propertyId}/${fileName}`);
  },

  async listImages(propertyId: string) {
    return storageService.listFiles(STORAGE_BUCKETS.PROPERTIES, `images/${propertyId}`);
  }
};

export const documentStorage = {
  async uploadLeaseDocument(leaseId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.DOCUMENTS, `leases/${leaseId}`, file);
  },

  async uploadInvoiceDocument(invoiceId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.DOCUMENTS, `invoices/${invoiceId}`, file);
  },

  async uploadTenantDocument(tenantId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.DOCUMENTS, `tenants/${tenantId}`, file);
  },

  async uploadLandlordDocument(landlordId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.DOCUMENTS, `landlords/${landlordId}`, file);
  },

  async getSignedUrl(path: string) {
    return storageService.getSignedUrl(STORAGE_BUCKETS.DOCUMENTS, path);
  }
};

export const maintenanceStorage = {
  async uploadPhoto(requestId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.MAINTENANCE, `photos/${requestId}`, file);
  },

  async uploadPhotos(requestId: string, files: File[]) {
    return storageService.uploadMultiple(STORAGE_BUCKETS.MAINTENANCE, `photos/${requestId}`, files);
  },

  async listPhotos(requestId: string) {
    return storageService.listFiles(STORAGE_BUCKETS.MAINTENANCE, `photos/${requestId}`);
  }
};

export const invoiceStorage = {
  async uploadAttachment(invoiceId: string, file: File) {
    return storageService.uploadFile(STORAGE_BUCKETS.INVOICES, `attachments/${invoiceId}`, file);
  },

  async getSignedUrl(path: string) {
    return storageService.getSignedUrl(STORAGE_BUCKETS.INVOICES, path);
  }
};
