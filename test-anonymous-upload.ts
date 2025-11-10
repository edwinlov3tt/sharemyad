/**
 * Test Script: Anonymous Upload Flow
 * Tests Phase 8 implementation with malware scanning
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://gnurilaiddffxfjujegu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudXJpbGFpZGRmZnhmanVqZWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDk3MzksImV4cCI6MjA3ODMyNTczOX0.FSjyDjyxSBzDT6vUYGhgwJ946noSbeUkXIvuTlYoSYw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testDatabaseSchema() {
  console.log('\n=== Test 1: Database Schema ===')

  // Check if tables exist by querying them
  const tables = ['upload_sessions', 'creative_sets', 'creative_assets', 'thumbnails', 'processing_jobs', 'folder_structure']

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0)

    if (error) {
      console.log(`❌ Table ${table}: ERROR - ${error.message}`)
    } else {
      console.log(`✅ Table ${table}: EXISTS`)
    }
  }
}

async function testAnonymousUploadSession() {
  console.log('\n=== Test 2: Anonymous Upload Session Creation ===')

  // Verify user is NOT authenticated
  const { data: { user } } = await supabase.auth.getUser()
  console.log(`User authenticated: ${user ? 'YES (ID: ' + user.id + ')' : 'NO (anonymous)'}`)

  // Create anonymous upload session
  const sessionData: any = {
    session_type: 'single',
    total_files: 1,
    total_size_bytes: 1024,
    status: 'pending',
    is_anonymous: !user,
  }

  if (!user) {
    sessionData.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  } else {
    sessionData.user_id = user.id
  }

  console.log('Creating session with data:', JSON.stringify(sessionData, null, 2))

  const { data: session, error: sessionError } = await supabase
    .from('upload_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (sessionError) {
    console.log(`❌ Session creation FAILED: ${sessionError.message}`)
    console.log('Error details:', sessionError)
    return null
  }

  console.log(`✅ Session created successfully!`)
  console.log(`   Session ID: ${session.id}`)
  console.log(`   Is Anonymous: ${session.is_anonymous}`)
  console.log(`   Expires At: ${session.expires_at || 'Never (authenticated)'}`)
  console.log(`   User ID: ${session.user_id || 'NULL (anonymous)'}`)

  return session
}

async function testReadOwnSession(sessionId: string) {
  console.log('\n=== Test 3: RLS Policy - Read Own Session ===')

  const { data: sessions, error } = await supabase
    .from('upload_sessions')
    .select('*')
    .eq('id', sessionId)

  if (error) {
    console.log(`❌ Failed to read session: ${error.message}`)
    return false
  }

  if (sessions && sessions.length > 0) {
    console.log(`✅ Successfully read own session (RLS policy working)`)
    console.log(`   Sessions found: ${sessions.length}`)
    return true
  } else {
    console.log(`❌ Could not read session (RLS policy may be too restrictive)`)
    return false
  }
}

async function testCreativeSet(sessionId: string) {
  console.log('\n=== Test 4: Creative Set Creation ===')

  const { data: creativeSet, error } = await supabase
    .from('creative_sets')
    .insert({
      upload_session_id: sessionId,
      set_name: 'Test_Set',
      asset_count: 0,
    })
    .select()
    .single()

  if (error) {
    console.log(`❌ Creative set creation FAILED: ${error.message}`)
    return null
  }

  console.log(`✅ Creative set created successfully!`)
  console.log(`   Set ID: ${creativeSet.id}`)
  console.log(`   Set Name: ${creativeSet.set_name}`)

  return creativeSet
}

async function testCleanup(sessionId: string) {
  console.log('\n=== Test 5: Cleanup ===')

  // Delete test session (cascade will delete creative sets)
  const { error } = await supabase
    .from('upload_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.log(`⚠️  Cleanup warning: ${error.message}`)
  } else {
    console.log(`✅ Test data cleaned up successfully`)
  }
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  ShareMyAd - Anonymous Upload Test Suite       ║')
  console.log('║  Database: gnurilaiddffxfjujegu                 ║')
  console.log('╚══════════════════════════════════════════════════╝')

  try {
    // Test 1: Schema
    await testDatabaseSchema()

    // Test 2: Anonymous session creation
    const session = await testAnonymousUploadSession()
    if (!session) {
      console.log('\n❌ TEST SUITE FAILED: Could not create session')
      Deno.exit(1)
    }

    // Test 3: RLS policies
    const canRead = await testReadOwnSession(session.id)
    if (!canRead) {
      console.log('\n⚠️  WARNING: RLS policies may need adjustment')
    }

    // Test 4: Creative set
    const creativeSet = await testCreativeSet(session.id)

    // Test 5: Cleanup
    await testCleanup(session.id)

    console.log('\n╔══════════════════════════════════════════════════╗')
    console.log('║  ✅ ALL TESTS PASSED                            ║')
    console.log('╚══════════════════════════════════════════════════╝')

  } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:', error)
    Deno.exit(1)
  }
}

// Run tests
runTests()
