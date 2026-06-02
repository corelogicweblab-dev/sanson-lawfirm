-- Supabase Storage RLS for bucket "documents"
-- Run in Supabase Dashboard → SQL Editor

DROP POLICY IF EXISTS "documents_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_delete" ON storage.objects;

CREATE POLICY "documents_authenticated_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'documents')
);

CREATE POLICY "documents_authenticated_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'documents')
);

CREATE POLICY "documents_authenticated_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'documents')
)
WITH CHECK (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'documents')
);

CREATE POLICY "documents_authenticated_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'documents')
);
