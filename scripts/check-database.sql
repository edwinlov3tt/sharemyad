-- Check what exists in the database

-- Check for custom types
SELECT
  typname as type_name,
  typtype as type_category
FROM pg_type
WHERE typname IN ('session_type', 'session_status', 'file_type', 'validation_status', 'job_type', 'job_status')
ORDER BY typname;

-- Check for tables
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('upload_sessions', 'creative_sets', 'creative_assets', 'thumbnails', 'processing_jobs', 'folder_structure')
ORDER BY table_name;

-- Check for triggers
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Check for RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
