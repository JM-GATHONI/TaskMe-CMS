-- ============================================
-- STORAGE BUCKETS SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profiles', 'profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('properties', 'properties', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('maintenance', 'maintenance', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']),
  ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- PROFILES BUCKET POLICIES
-- Allow anyone to view profile images (public bucket)
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================

-- PROPERTIES BUCKET POLICIES
-- Allow anyone to view property images (public bucket)
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');

-- Allow staff and admins to upload property images
CREATE POLICY "Staff can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant', 'Field Agent')
  )
);

-- Allow staff and admins to update property images
CREATE POLICY "Staff can update property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'properties'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant', 'Field Agent')
  )
);

-- Allow staff and admins to delete property images
CREATE POLICY "Staff can delete property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'properties'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant', 'Field Agent')
  )
);

-- ============================================

-- DOCUMENTS BUCKET POLICIES (Private)
-- Users can only view documents in their own folder
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Branch Manager', 'Accountant')
    )
  )
);

-- Allow staff to upload documents
CREATE POLICY "Staff can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant', 'Field Agent')
  )
);

-- Allow staff to update documents
CREATE POLICY "Staff can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant', 'Field Agent')
  )
);

-- Allow staff to delete documents
CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant')
  )
);

-- ============================================

-- MAINTENANCE BUCKET POLICIES
-- Allow anyone to view maintenance photos (public bucket)
CREATE POLICY "Public can view maintenance photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'maintenance');

-- Allow tenants, staff, and contractors to upload maintenance photos
CREATE POLICY "Users can upload maintenance photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'maintenance'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Allow staff to update maintenance photos
CREATE POLICY "Staff can update maintenance photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'maintenance'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Field Agent', 'Contractor')
  )
);

-- Allow staff to delete maintenance photos
CREATE POLICY "Staff can delete maintenance photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'maintenance'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Field Agent')
  )
);

-- ============================================

-- INVOICES BUCKET POLICIES (Private)
-- Users can view invoices related to them
CREATE POLICY "Users can view related invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('Super Admin', 'Branch Manager', 'Accountant')
    )
  )
);

-- Allow staff to upload invoice attachments
CREATE POLICY "Staff can upload invoice attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant')
  )
);

-- Allow staff to update invoice attachments
CREATE POLICY "Staff can update invoice attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant')
  )
);

-- Allow staff to delete invoice attachments
CREATE POLICY "Staff can delete invoice attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('Super Admin', 'Branch Manager', 'Accountant')
  )
);

-- ============================================
-- HELPER FUNCTION FOR FOLDER NAME EXTRACTION
-- ============================================

CREATE OR REPLACE FUNCTION storage.foldername(path text)
RETURNS text[] AS $$
BEGIN
  RETURN string_to_array(path, '/');
END;
$$ LANGUAGE plpgsql;
