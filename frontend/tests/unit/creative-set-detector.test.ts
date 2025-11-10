/**
 * Creative Set Detector - Verification Test (Vitest compatible)
 * This is a standalone test to verify the pattern matching logic
 */

import { describe, it, expect } from 'vitest'

/**
 * Creative Set Detector Logic (Node.js compatible version)
 * Duplicated from supabase/functions for testing purposes
 */

interface CreativeSet {
  name: string
  folders: string[]
  pattern?: string
}

const SET_PATTERNS: Array<{
  name: string
  regex: RegExp
  extractName: (match: RegExpMatchArray) => string
}> = [
  {
    name: 'set-prefix',
    regex: /^(?:Set[-_]?)([A-Za-z0-9]+)$/i,
    extractName: (match) => `Set-${match[1]}`
  },
  {
    name: 'version-number',
    regex: /^Version[-_]?(\d+)$/i,
    extractName: (match) => `Version-${match[1]}`
  },
  {
    name: 'v-short',
    regex: /^[Vv](\d+)$/,
    extractName: (match) => `v${match[1]}`
  },
  {
    name: 'test-prefix',
    regex: /^Test[-_]?([A-Za-z0-9]+)$/i,
    extractName: (match) => `Test-${match[1]}`
  },
  {
    name: 'single-letter',
    regex: /^([A-Z])$/i,
    extractName: (match) => match[1].toUpperCase()
  },
  {
    name: 'variant-prefix',
    regex: /^Variant[-_]?([A-Za-z0-9]+)$/i,
    extractName: (match) => `Variant-${match[1]}`
  },
  {
    name: 'control-treatment',
    regex: /^(Control|Treatment)$/i,
    extractName: (match) => match[1]
  },
  {
    name: 'draft-final',
    regex: /^(Draft|Final)$/i,
    extractName: (match) => match[1]
  }
]

function detectCreativeSets(folders: string[]): CreativeSet[] {
  if (folders.length === 0) {
    return []
  }

  const setsMap = new Map<string, { folders: string[]; pattern: string }>()

  for (const folderPath of folders) {
    const pathParts = folderPath.split('/')
    const folderName = pathParts[pathParts.length - 1]

    let matched = false

    for (const pattern of SET_PATTERNS) {
      const match = folderName.match(pattern.regex)

      if (match) {
        const setName = pattern.extractName(match)

        if (!setsMap.has(setName)) {
          setsMap.set(setName, { folders: [], pattern: pattern.name })
        }

        setsMap.get(setName)!.folders.push(folderPath)
        matched = true
        break
      }
    }
  }

  return Array.from(setsMap.entries()).map(([name, { folders, pattern }]) => ({
    name,
    folders,
    pattern
  }))
}

describe('Creative Set Detector - Pattern Matching Verification', () => {
  describe('Set-X Pattern', () => {
    it('should detect Set-A, Set-B, Set-C', () => {
      const folders = ['Set-A', 'Set-B', 'Set-C']
      const sets = detectCreativeSets(folders)

      expect(sets).toHaveLength(3)
      expect(sets.map(s => s.name)).toContain('Set-A')
      expect(sets.map(s => s.name)).toContain('Set-B')
      expect(sets.map(s => s.name)).toContain('Set-C')
    })

    it('should detect single letters A, B, C', () => {
      const folders = ['A', 'B', 'C']
      const sets = detectCreativeSets(folders)

      expect(sets).toHaveLength(3)
      expect(sets.map(s => s.name)).toContain('A')
      expect(sets.map(s => s.name)).toContain('B')
      expect(sets.map(s => s.name)).toContain('C')
    })

    it('should handle case insensitive matching', () => {
      const folders = ['set-a', 'SET-B', 'Set-C']
      const sets = detectCreativeSets(folders)

      expect(sets).toHaveLength(3)
    })
  })

  describe('Version Pattern', () => {
    it('should detect Version-1, Version-2', () => {
      const folders = ['Version-1', 'Version-2', 'Version-3']
      const sets = detectCreativeSets(folders)

      expect(sets).toHaveLength(3)
      expect(sets.map(s => s.name)).toContain('Version-1')
      expect(sets.map(s => s.name)).toContain('Version-2')
    })

    it('should detect v1, v2, v3', () => {
      const folders = ['v1', 'v2', 'v3']
      const sets = detectCreativeSets(folders)

      expect(sets).toHaveLength(3)
      expect(sets.map(s => s.name)).toContain('v1')
      expect(sets.map(s => s.name)).toContain('v2')
    })
  })

  describe('Test Pattern', () => {
    it('should detect Test-A, Test-B', () => {
      const folders = ['Test-A', 'Test-B']
      const sets = detectCreativeSets(folders)

      expect(sets).toHaveLength(2)
      expect(sets.map(s => s.name)).toContain('Test-A')
      expect(sets.map(s => s.name)).toContain('Test-B')
    })
  })

  describe('Nested Paths', () => {
    it('should extract set names from nested paths', () => {
      const folders = [
        'Campaign/Display/Set-A',
        'Campaign/Display/Set-B'
      ]

      const sets = detectCreativeSets(folders)
      const setNames = sets.map(s => s.name)

      expect(setNames).toContain('Set-A')
      expect(setNames).toContain('Set-B')
    })
  })

  describe('Accuracy Target (90%)', () => {
    it('should detect at least 90% of common patterns', () => {
      const folders = [
        // Pattern matches (18)
        'Set-A', 'Set-B', 'Set-C',
        'Version-1', 'Version-2',
        'v1', 'v2', 'v3',
        'Test-A', 'Test-B',
        'A', 'B', 'C',
        'Version_1', 'Version_2',
        'TEST-1', 'TEST-2',
        'Control',

        // Non-matches (2)
        'Assets',
        'Backup'
      ]

      const sets = detectCreativeSets(folders)
      const detectedCount = sets.reduce((sum, set) => sum + set.folders.length, 0)
      const accuracy = (detectedCount / folders.length) * 100

      expect(accuracy).toBeGreaterThanOrEqual(90)
    })
  })

  describe('Performance', () => {
    it('should process 500 folders quickly', () => {
      const folders = []
      for (let i = 0; i < 500; i++) {
        const setName = String.fromCharCode(65 + (i % 26))
        folders.push(`Set-${setName}${Math.floor(i / 26)}`)
      }

      const start = performance.now()
      const sets = detectCreativeSets(folders)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(500)
      expect(sets.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty folder list', () => {
      const folders: string[] = []
      const sets = detectCreativeSets(folders)

      expect(sets).toHaveLength(0)
    })

    it('should handle folders with no pattern matches', () => {
      const folders = ['Images', 'Assets', 'Creative']
      const sets = detectCreativeSets(folders)

      expect(Array.isArray(sets)).toBe(true)
      expect(sets.length).toBeLessThanOrEqual(1)
    })
  })
})
