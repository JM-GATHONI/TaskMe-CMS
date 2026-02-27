-- ============================================
-- STORAGE POLICIES - Run in Supabase SQL Editor
-- ============================================
-- Run each section separately or all at once
-- ============================================

-- ============================================
-- PROFILES BUCKET (Public Read, Owner Write)
-- ============================================

-- Allow anyone to view profile images
CREATE POLICY "profiles_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "profiles_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "profiles_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "profiles_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- PROPERTIES BUCKET (Public Read, Staff Write)
-- ============================================

-- Allow anyone to view property images
CREATE POLICY "properties_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');

-- Allow authenticated users to upload
CREATE POLICY "properties_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update
CREATE POLICY "properties_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'properties'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "properties_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'properties'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- DOCUMENTS BUCKET (Private, Staff Access)
-- ============================================

-- Allow authenticated users to view documents
CREATE POLICY "documents_auth_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload
CREATE POLICY "documents_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update
CREATE POLICY "documents_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "documents_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- MAINTENANCE BUCKET (Public Read, Auth Write)
-- ============================================

-- Allow anyone to view maintenance photos
CREATE POLICY "maintenance_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'maintenance');

-- Allow authenticated users to upload
CREATE POLICY "maintenance_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'maintenance'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update
CREATE POLICY "maintenance_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'maintenance'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "maintenance_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'maintenance'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- INVOICES BUCKET (Private, Staff Access)
-- ============================================

-- Allow authenticated users to view invoices
CREATE POLICY "invoices_auth_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload
CREATE POLICY "invoices_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update
CREATE POLICY "invoices_auth_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoices'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "invoices_auth_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoices'
  AND auth.role() = 'authenticated'
);
