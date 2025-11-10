/**
 * Unit Test: Client-side validation service
 * User Story 1 (T031): Tests validation service per research.md:229-259
 *
 * Tests cover:
 * - MIME type validation against whitelist
 * - File size validation (500MB limit)
 * - Magic byte validation to prevent MIME spoofing
 * - Dimension validation against industry standards
 */

import { describe, it, expect } from 'vitest'
import {
  validateMimeType,
  validateFileSize,
  validateFileSignature,
  validateDimensions,
  getFileTypeFromMime,
} from '../../src/services/validationService'

describe('Validation Service', () => {
  describe('validateMimeType', () => {
    it('should accept valid JPEG mime type', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
      expect(result.message).toContain('Valid file type')
    })

    it('should accept valid PNG mime type', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
    })

    it('should accept valid GIF mime type', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
    })

    it('should accept valid MP4 mime type', () => {
      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
    })

    it('should accept valid WEBM mime type', () => {
      const file = new File(['test'], 'test.webm', { type: 'video/webm' })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
    })

    it('should accept HTML mime type', () => {
      const file = new File(['<html></html>'], 'index.html', {
        type: 'text/html',
      })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
    })

    it('should accept ZIP mime type (for HTML5 bundles)', () => {
      const file = new File(['PK'], 'bundle.zip', { type: 'application/zip' })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
    })

    it('should reject PDF files', () => {
      const file = new File(['test'], 'document.pdf', {
        type: 'application/pdf',
      })
      const result = validateMimeType(file)

      expect(result.status).toBe('invalid')
      expect(result.message).toContain('not supported')
    })

    it('should reject unsupported mime types', () => {
      const file = new File(['test'], 'audio.mp3', { type: 'audio/mpeg' })
      const result = validateMimeType(file)

      expect(result.status).toBe('invalid')
    })

    it('should be case-insensitive', () => {
      const file = new File(['test'], 'test.jpg', { type: 'IMAGE/JPEG' })
      const result = validateMimeType(file)

      expect(result.status).toBe('valid')
    })
  })

  describe('validateFileSize', () => {
    const MB = 1024 * 1024

    it('should accept file under 500MB limit', () => {
      const file = new File(['x'.repeat(10 * MB)], 'small.jpg', {
        type: 'image/jpeg',
      })
      const result = validateFileSize(file)

      expect(result.status).toBe('valid')
    })

    it('should accept file at 500MB limit (using Object.defineProperty)', () => {
      // NOTE: jsdom can't create 500MB strings in memory
      // Use Object.defineProperty to mock file size
      const file = new File(['test'], 'max.mp4', {
        type: 'video/mp4',
      })
      Object.defineProperty(file, 'size', { value: 500 * MB, writable: false })

      const result = validateFileSize(file)

      expect(result.status).toBe('valid')
    })

    it('should reject file over 500MB limit (using Object.defineProperty)', () => {
      // NOTE: jsdom can't create 501MB strings in memory
      // Use Object.defineProperty to mock file size
      const file = new File(['test'], 'large.mp4', {
        type: 'video/mp4',
      })
      Object.defineProperty(file, 'size', { value: 501 * MB, writable: false })

      const result = validateFileSize(file)

      expect(result.status).toBe('invalid')
      expect(result.message).toContain('exceeds maximum of 500MB')
      expect(result.message).toContain('501')
    })

    it('should accept very small files', () => {
      const file = new File(['x'], 'tiny.jpg', { type: 'image/jpeg' })
      const result = validateFileSize(file)

      expect(result.status).toBe('valid')
    })

    it('should include file size in message', () => {
      const file = new File(['x'.repeat(10240)], 'test.jpg', {
        type: 'image/jpeg',
      })
      const result = validateFileSize(file)

      expect(result.message).toMatch(/\d+\.\d+KB/)
    })
  })

  describe('validateFileSignature', () => {
    it('should validate JPEG magic bytes (FF D8 FF)', async () => {
      // NOTE: Skipped - jsdom's File implementation doesn't support arrayBuffer()
      // This functionality is tested in browser/E2E tests
      // JPEG signature: FF D8 FF
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(28).fill(0)])
      const file = new File([jpegBytes], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('valid')
      expect(result.message).toContain('Valid image/jpeg')
    })

    it('should validate PNG magic bytes (89 50 4E 47)', async () => {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(24).fill(0)])
      const file = new File([pngBytes], 'test.png', { type: 'image/png' })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('valid')
      expect(result.message).toContain('Valid image/png')
    })

    it('should validate GIF87a magic bytes', async () => {
      // GIF87a signature: 47 49 46 38 37 61
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, ...new Array(26).fill(0)])
      const file = new File([gifBytes], 'test.gif', { type: 'image/gif' })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('valid')
      expect(result.message).toContain('Valid image/gif')
    })

    it('should validate GIF89a magic bytes', async () => {
      // GIF89a signature: 47 49 46 38 39 61
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, ...new Array(26).fill(0)])
      const file = new File([gifBytes], 'test.gif', { type: 'image/gif' })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('valid')
      expect(result.message).toContain('Valid image/gif')
    })

    it('should validate ZIP magic bytes (50 4B 03 04)', async () => {
      // ZIP signature: 50 4B 03 04
      const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new Array(28).fill(0)])
      const file = new File([zipBytes], 'test.zip', { type: 'application/zip' })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('valid')
      expect(result.message).toContain('Valid application/zip')
    })

    it('should skip validation for HTML files', async () => {
      const file = new File(['<html></html>'], 'index.html', {
        type: 'text/html',
      })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('valid')
      expect(result.message).toContain('skipped')
    })

    it('should reject JPEG file with PNG signature (MIME spoofing)', async () => {
      // PNG signature but JPEG MIME type
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(24).fill(0)])
      const file = new File([pngBytes], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('invalid')
      expect(result.message).toContain('does not match')
    })

    it('should reject file with incorrect signature', async () => {
      // Invalid signature (all zeros)
      const invalidBytes = new Uint8Array(32).fill(0)
      const file = new File([invalidBytes], 'test.jpg', { type: 'image/jpeg' })

      const result = await validateFileSignature(file)

      expect(result.status).toBe('invalid')
      expect(result.message).toContain('does not match')
    })
  })

  describe('validateDimensions', () => {
    it('should validate standard IAB Medium Rectangle (300x250)', () => {
      const result = validateDimensions(300, 250, 150, 'image')

      expect(result.status).toBe('valid')
      expect(result.message).toContain('300x250')
      expect(result.message).toContain('Medium Rectangle')
    })

    it('should validate standard IAB Leaderboard (728x90)', () => {
      const result = validateDimensions(728, 90, 150, 'image')

      expect(result.status).toBe('valid')
      expect(result.message).toContain('728x90')
      expect(result.message).toContain('Leaderboard')
    })

    it('should validate standard IAB Mobile Banner (320x50)', () => {
      const result = validateDimensions(320, 50, 80, 'image')

      expect(result.status).toBe('valid')
      expect(result.message).toContain('320x50')
      expect(result.message).toContain('Mobile Banner')
    })

    it('should warn for standard dimensions with oversized file', () => {
      // 300x250 with 300KB file (exceeds IAB max of 200KB)
      const result = validateDimensions(300, 250, 300, 'image')

      expect(result.status).toBe('warning')
      expect(result.message).toContain('exceeds recommended')
    })

    it('should warn for non-standard dimensions with small file', () => {
      // Custom dimensions
      const result = validateDimensions(400, 300, 150, 'image')

      expect(result.status).toBe('warning')
      expect(result.message).toContain('Non-standard dimensions')
    })

    it('should warn for non-standard dimensions with large file', () => {
      // Custom dimensions with large file (but under fallback limit of 512000KB)
      const result = validateDimensions(400, 300, 50000, 'image')

      // Based on validation-standards.json, fallback allows up to 512000KB
      expect(result.status).toBe('warning')
      expect(result.message).toContain('Non-standard dimensions')
    })

    it('should validate Instagram Square (1080x1080)', () => {
      const result = validateDimensions(1080, 1080, 8000, 'image')

      expect(result.status).toBe('valid')
      expect(result.message).toContain('1080x1080')
      expect(result.message).toContain('Instagram Square')
    })

    it('should validate Facebook Link (1200x628)', () => {
      // NOTE: Facebook Link is 1200x628, not 630
      const result = validateDimensions(1200, 628, 5000, 'image')

      expect(result.status).toBe('valid')
      expect(result.message).toContain('1200x628')
      expect(result.message).toContain('Facebook Link')
    })
  })

  describe('getFileTypeFromMime', () => {
    it('should return "image" for image/* mime types', () => {
      expect(getFileTypeFromMime('image/jpeg')).toBe('image')
      expect(getFileTypeFromMime('image/png')).toBe('image')
      expect(getFileTypeFromMime('image/gif')).toBe('image')
    })

    it('should return "video" for video/* mime types', () => {
      expect(getFileTypeFromMime('video/mp4')).toBe('video')
      expect(getFileTypeFromMime('video/webm')).toBe('video')
    })

    it('should return "html5" for HTML mime type', () => {
      expect(getFileTypeFromMime('text/html')).toBe('html5')
    })

    it('should return "html5" for ZIP mime type', () => {
      expect(getFileTypeFromMime('application/zip')).toBe('html5')
    })

    it('should return "image" as fallback for unknown types', () => {
      expect(getFileTypeFromMime('application/octet-stream')).toBe('image')
    })
  })
})
