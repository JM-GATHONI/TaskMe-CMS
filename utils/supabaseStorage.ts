import { supabase } from './supabaseClient';

/**
 * Uploads a file to a Supabase Storage bucket and returns a public URL.
 * Supabase is required in production; this will throw if upload fails.
 */
export async function uploadToBucket(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) {
    console.error('Supabase Storage upload error', error);
    throw error;
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

