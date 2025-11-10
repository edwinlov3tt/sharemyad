-- Database Verification Script for ShareMyAd
-- Run this in Supabase SQL Editor to verify setup

-- ✅ Check 1: Custom Types
SELECT 'Custom Types' as check_category, typname as name, 'EXISTS' as status
FROM pg_type
WHERE typname IN ('session_type', 'session_status', 'file_type', 'validation_status', 'job_type', 'job_status')
ORDER BY typname;

-- ✅ Check 2: Tables
SELECT 'Tables' as check_category, table_name as name, 'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('upload_sessions', 'creative_sets', 'creative_assets', 'thumbnails', 'processing_jobs', 'folder_structure')
ORDER BY table_name;

-- ✅ Check 3: Row Level Security
SELECT 'RLS Enabled' as check_category, tablename as name,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('upload_sessions', 'creative_sets', 'creative_assets', 'thumbnails', 'processing_jobs', 'folder_structure')
ORDER BY tablename;

-- ✅ Check 4: RLS Policies Count
SELECT 'RLS Policies' as check_category, tablename as name, COUNT(*) as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ✅ Check 5: Triggers
SELECT 'Triggers' as check_category, trigger_name as name, event_object_table as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- ✅ Check 6: Storage Buckets
SELECT 'Storage Buckets' as check_category, name,
       CASE WHEN public THEN 'PUBLIC' ELSE 'PRIVATE' END as status
FROM storage.buckets
ORDER BY name;

-- Summary
SELECT
  '=== SUMMARY ===' as info,
  (SELECT COUNT(*) FROM pg_type WHERE typname IN ('session_type', 'session_status', 'file_type', 'validation_status', 'job_type', 'job_status')) as types_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('upload_sessions', 'creative_sets', 'creative_assets', 'thumbnails', 'processing_jobs', 'folder_structure')) as tables_count,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as triggers_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_count,
  (SELECT COUNT(*) FROM storage.buckets WHERE name = 'temp-uploads') as buckets_count;

-- Expected values:
-- types_count: 6
-- tables_count: 6
-- triggers_count: 2-3
-- policies_count: 6
-- buckets_count: 1
