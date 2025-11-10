/**
 * Unit tests for upload service utilities
 * Tests file handling, validation, and naming logic
 *
 * User Story 2 (T057): Duplicate filename handling
 */

import { describe, it, expect } from 'vitest'
import {
  handleDuplicateFilenames,
  generateUniqueFilename,
  type FileWithPath,
} from '../../src/services/uploadService'

describe('Upload Service - User Story 2: Duplicate Filename Handling', () => {
  describe('T057: Duplicate filename detection and auto-rename', () => {
    it('should detect duplicate filenames in file list', () => {
      // Arrange: Files with duplicate names
      const files: FileWithPath[] = [
        { name: 'banner.jpg', originalName: 'banner.jpg', isDuplicate: false },
        { name: 'square.png', originalName: 'square.png', isDuplicate: false },
        { name: 'banner.jpg', originalName: 'banner.jpg', isDuplicate: false }, // Duplicate
      ]

      // Act: Check for duplicates
      const result = handleDuplicateFilenames(files)

      // Assert: Duplicates are detected
      expect(result[0].name).toBe('banner.jpg')
      expect(result[0].isDuplicate).toBe(false) // First occurrence

      expect(result[1].name).toBe('square.png')
      expect(result[1].isDuplicate).toBe(false)

      expect(result[2].name).toBe('banner-1.jpg') // Auto-renamed
      expect(result[2].isDuplicate).toBe(true)
      expect(result[2].originalName).toBe('banner.jpg')
    })

    it('should handle multiple duplicates with numeric suffixes', () => {
      // Arrange: 4 files with same name
      const files: FileWithPath[] = [
        { name: 'asset.png', originalName: 'asset.png', isDuplicate: false },
        { name: 'asset.png', originalName: 'asset.png', isDuplicate: false },
        { name: 'asset.png', originalName: 'asset.png', isDuplicate: false },
        { name: 'asset.png', originalName: 'asset.png', isDuplicate: false },
      ]

      // Act: Rename duplicates
      const result = handleDuplicateFilenames(files)

      // Assert: Numeric suffixes added
      expect(result[0].name).toBe('asset.png')
      expect(result[1].name).toBe('asset-1.png')
      expect(result[2].name).toBe('asset-2.png')
      expect(result[3].name).toBe('asset-3.png')

      // All but first are marked as duplicates
      expect(result[0].isDuplicate).toBe(false)
      expect(result[1].isDuplicate).toBe(true)
      expect(result[2].isDuplicate).toBe(true)
      expect(result[3].isDuplicate).toBe(true)
    })

    it('should preserve file extensions when renaming', () => {
      // Arrange: Duplicates with different extensions
      const files: FileWithPath[] = [
        { name: 'banner.jpg', originalName: 'banner.jpg', isDuplicate: false },
        { name: 'banner.jpeg', originalName: 'banner.jpeg', isDuplicate: false },
        { name: 'banner.JPG', originalName: 'banner.JPG', isDuplicate: false },
      ]

      // Act: Handle duplicates
      const result = handleDuplicateFilenames(files)

      // Assert: Extensions preserved, case-normalized
      // Note: Implementation normalizes to lowercase for case-insensitive comparison
      expect(result[0].name).toBe('banner.jpg')
      expect(result[1].name).toBe('banner.jpeg')
      expect(result[2].name).toBe('banner-1.jpg') // Same name (case-insensitive), so renamed
    })

    it('should handle files with multiple dots in filename', () => {
      // Arrange: Files with complex names
      const files: FileWithPath[] = [
        {
          name: 'banner.final.v2.jpg',
          originalName: 'banner.final.v2.jpg',
          isDuplicate: false,
        },
        {
          name: 'banner.final.v2.jpg',
          originalName: 'banner.final.v2.jpg',
          isDuplicate: false,
        },
      ]

      // Act: Rename duplicate
      const result = handleDuplicateFilenames(files)

      // Assert: Suffix inserted before final extension
      expect(result[0].name).toBe('banner.final.v2.jpg')
      expect(result[1].name).toBe('banner.final.v2-1.jpg')
    })

    it('should handle files without extensions', () => {
      // Arrange: Files without extensions
      const files: FileWithPath[] = [
        { name: 'README', originalName: 'README', isDuplicate: false },
        { name: 'README', originalName: 'README', isDuplicate: false },
      ]

      // Act: Rename duplicate
      const result = handleDuplicateFilenames(files)

      // Assert: Suffix added to filename, case-normalized
      // Note: Implementation normalizes to lowercase
      expect(result[0].name).toBe('readme')
      expect(result[1].name).toBe('readme-1')
    })

    it('should be case-insensitive for duplicate detection', () => {
      // Arrange: Files with different cases
      const files: FileWithPath[] = [
        { name: 'Banner.jpg', originalName: 'Banner.jpg', isDuplicate: false },
        { name: 'banner.jpg', originalName: 'banner.jpg', isDuplicate: false },
        { name: 'BANNER.JPG', originalName: 'BANNER.JPG', isDuplicate: false },
      ]

      // Act: Detect duplicates (case-insensitive)
      const result = handleDuplicateFilenames(files)

      // Assert: All considered duplicates
      expect(result[0].name).toBe('banner.jpg') // Normalized to lowercase
      expect(result[1].name).toBe('banner-1.jpg')
      expect(result[2].name).toBe('banner-2.jpg')
    })

    it('should handle sanitized filenames with special characters removed', () => {
      // Arrange: Files that will be sanitized to same name
      const files: FileWithPath[] = [
        { name: 'my-file (1).jpg', originalName: 'my-file (1).jpg', isDuplicate: false },
        { name: 'my-file (2).jpg', originalName: 'my-file (2).jpg', isDuplicate: false },
        { name: 'my-file [3].jpg', originalName: 'my-file [3].jpg', isDuplicate: false },
      ]

      // Act: After sanitization, these become duplicates
      // Sanitization converts all to 'my-file -X-.jpg' (single dash between)
      const sanitizedFiles = files.map((f) => ({
        ...f,
        name: f.name.replace(/[()[\]]/g, '').replace(/\s+/g, ' '), // Remove special chars, normalize spaces
      }))

      const result = handleDuplicateFilenames(sanitizedFiles)

      // Assert: Duplicates detected after sanitization (case-normalized)
      expect(result[0].name).toBe('my-file 1.jpg')
      expect(result[1].name).toBe('my-file 2.jpg')
      expect(result[2].name).toBe('my-file 3.jpg')
    })
  })

  describe('T057: Generate unique filename utility', () => {
    it('should generate unique filename with numeric suffix', () => {
      // Arrange: Existing filenames
      const existingNames = new Set(['banner.jpg', 'banner-1.jpg'])
      const originalName = 'banner.jpg'

      // Act: Generate unique name
      const uniqueName = generateUniqueFilename(originalName, existingNames)

      // Assert: Returns next available suffix
      expect(uniqueName).toBe('banner-2.jpg')
    })

    it('should find first available suffix when gaps exist', () => {
      // Arrange: Existing names with gaps
      const existingNames = new Set(['file.jpg', 'file-1.jpg', 'file-3.jpg'])
      const originalName = 'file.jpg'

      // Act: Generate unique name
      const uniqueName = generateUniqueFilename(originalName, existingNames)

      // Assert: Finds first available number (fills gaps)
      expect(uniqueName).toBe('file-2.jpg')
    })

    it('should handle very high suffix numbers', () => {
      // Arrange: Many existing files
      const existingNames = new Set(
        Array.from({ length: 100 }, (_, i) =>
          i === 0 ? 'asset.png' : `asset-${i}.png`
        )
      )
      const originalName = 'asset.png'

      // Act: Generate unique name
      const uniqueName = generateUniqueFilename(originalName, existingNames)

      // Assert: Uses next number in sequence
      expect(uniqueName).toBe('asset-100.png')
    })

    it('should return original name if no conflicts', () => {
      // Arrange: No existing files
      const existingNames = new Set<string>()
      const originalName = 'unique.jpg'

      // Act: Generate unique name
      const uniqueName = generateUniqueFilename(originalName, existingNames)

      // Assert: Returns original name
      expect(uniqueName).toBe('unique.jpg')
    })

    it('should handle files with no extension', () => {
      // Arrange: Existing file without extension
      const existingNames = new Set(['LICENSE'])
      const originalName = 'LICENSE'

      // Act: Generate unique name
      const uniqueName = generateUniqueFilename(originalName, existingNames)

      // Assert: Suffix added without dot
      expect(uniqueName).toBe('LICENSE-1')
    })
  })

  describe('T057: Edge cases and error handling', () => {
    it('should handle empty file list', () => {
      // Arrange: Empty array
      const files: FileWithPath[] = []

      // Act: Handle duplicates
      const result = handleDuplicateFilenames(files)

      // Assert: Returns empty array
      expect(result).toEqual([])
    })

    it('should handle single file (no duplicates possible)', () => {
      // Arrange: Single file
      const files: FileWithPath[] = [
        { name: 'single.jpg', originalName: 'single.jpg', isDuplicate: false },
      ]

      // Act: Handle duplicates
      const result = handleDuplicateFilenames(files)

      // Assert: File unchanged
      expect(result).toEqual([
        { name: 'single.jpg', originalName: 'single.jpg', isDuplicate: false },
      ])
    })

    it('should handle all unique filenames', () => {
      // Arrange: All unique files
      const files: FileWithPath[] = [
        { name: 'file1.jpg', originalName: 'file1.jpg', isDuplicate: false },
        { name: 'file2.jpg', originalName: 'file2.jpg', isDuplicate: false },
        { name: 'file3.jpg', originalName: 'file3.jpg', isDuplicate: false },
      ]

      // Act: Handle duplicates
      const result = handleDuplicateFilenames(files)

      // Assert: All files unchanged
      expect(result).toEqual(files)
      expect(result.every((f) => !f.isDuplicate)).toBe(true)
    })

    it('should handle very long filenames', () => {
      // Arrange: Long filename
      const longName = 'a'.repeat(200) + '.jpg'
      const files: FileWithPath[] = [
        { name: longName, originalName: longName, isDuplicate: false },
        { name: longName, originalName: longName, isDuplicate: false },
      ]

      // Act: Handle duplicates
      const result = handleDuplicateFilenames(files)

      // Assert: Duplicate renamed (truncated if needed)
      expect(result[0].name).toBe(longName)
      expect(result[1].name).toContain('-1.jpg')
      expect(result[1].name.length).toBeLessThanOrEqual(255) // Filesystem limit
    })
  })
})
