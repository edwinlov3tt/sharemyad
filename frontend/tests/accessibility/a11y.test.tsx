/**
 * Accessibility Tests using axe-core
 * Tests all components for WCAG 2.1 Level AA compliance
 * per Constitution Principle V
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import React from 'react'

// Import components to test
import { UploadZone } from '../../src/components/upload/UploadZone'
import { UploadProgress } from '../../src/components/upload/UploadProgress'
import { FileValidator } from '../../src/components/upload/FileValidator'
import { AssetCard } from '../../src/components/preview/AssetCard'
import { AssetGrid } from '../../src/components/preview/AssetGrid'
import { LoadingSpinner } from '../../src/components/shared/LoadingSpinner'
import { ErrorBoundary } from '../../src/components/shared/ErrorBoundary'

// Extend expect with axe matchers
expect.extend(toHaveNoViolations)

// Configure axe for WCAG 2.1 AA
const axe = configureAxe({
  rules: {
    // Ensure color contrast of at least 4.5:1 for normal text
    'color-contrast': { enabled: true },
    // Ensure all images have alt text
    'image-alt': { enabled: true },
    // Ensure all form elements have labels
    'label': { enabled: true },
    // Ensure all buttons have accessible names
    'button-name': { enabled: true },
    // Ensure proper heading hierarchy
    'heading-order': { enabled: true },
    // Ensure links have discernible text
    'link-name': { enabled: true },
    // Ensure ARIA attributes are valid
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
  },
})

describe('Accessibility: Upload Components', () => {
  describe('UploadZone', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <UploadZone
          onFileSelected={() => {}}
          disabled={false}
          multiple={false}
          accept={{ 'image/*': ['.jpg', '.png', '.gif'] }}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations when disabled', async () => {
      const { container } = render(
        <UploadZone
          onFileSelected={() => {}}
          disabled={true}
          multiple={false}
          accept={{ 'image/*': ['.jpg', '.png', '.gif'] }}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('UploadProgress', () => {
    it('should have no violations when uploading', async () => {
      const { container } = render(
        <UploadProgress
          progress={50}
          status="uploading"
          filename="test.jpg"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations when completed', async () => {
      const { container } = render(
        <UploadProgress
          progress={100}
          status="completed"
          filename="test.jpg"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations when error', async () => {
      const { container } = render(
        <UploadProgress
          progress={0}
          status="error"
          filename="test.jpg"
          error="Upload failed"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('FileValidator', () => {
    it('should have no violations with valid results', async () => {
      const { container } = render(
        <FileValidator
          results={[
            {
              filename: 'test.jpg',
              status: 'valid',
              fileType: 'image',
              mimeType: 'image/jpeg',
              sizeBytes: 50000,
              messages: ['Valid IAB standard size'],
            },
          ]}
          overallStatus="valid"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with warning results', async () => {
      const { container } = render(
        <FileValidator
          results={[
            {
              filename: 'test.jpg',
              status: 'warning',
              fileType: 'image',
              mimeType: 'image/jpeg',
              sizeBytes: 50000,
              messages: ['Non-standard dimensions'],
            },
          ]}
          overallStatus="warning"
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility: Preview Components', () => {
  describe('AssetCard', () => {
    it('should have no violations for image asset', async () => {
      const { container } = render(
        <AssetCard
          asset={{
            id: 'test-1',
            creative_set_id: 'set-1',
            filename_original: 'test.jpg',
            filename_sanitized: 'test.jpg',
            file_type: 'image',
            mime_type: 'image/jpeg',
            file_size_bytes: 50000,
            width: 300,
            height: 250,
            storage_url: 'https://example.com/test.jpg',
            temp_storage_url: 'https://example.com/test.jpg',
            validation_status: 'valid',
            validation_notes: 'Valid',
            is_html5_bundle: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations for video asset', async () => {
      const { container } = render(
        <AssetCard
          asset={{
            id: 'test-2',
            creative_set_id: 'set-1',
            filename_original: 'test.mp4',
            filename_sanitized: 'test.mp4',
            file_type: 'video',
            mime_type: 'video/mp4',
            file_size_bytes: 5000000,
            width: 1920,
            height: 1080,
            duration_seconds: 30,
            storage_url: 'https://example.com/test.mp4',
            temp_storage_url: 'https://example.com/test.mp4',
            validation_status: 'valid',
            validation_notes: 'Valid',
            is_html5_bundle: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('AssetGrid', () => {
    it('should have no violations with multiple assets', async () => {
      const assets = [
        {
          id: 'test-1',
          creative_set_id: 'set-1',
          filename_original: 'banner1.jpg',
          filename_sanitized: 'banner1.jpg',
          file_type: 'image' as const,
          mime_type: 'image/jpeg',
          file_size_bytes: 50000,
          width: 300,
          height: 250,
          storage_url: 'https://example.com/banner1.jpg',
          temp_storage_url: 'https://example.com/banner1.jpg',
          validation_status: 'valid' as const,
          validation_notes: 'Valid',
          is_html5_bundle: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'test-2',
          creative_set_id: 'set-1',
          filename_original: 'banner2.png',
          filename_sanitized: 'banner2.png',
          file_type: 'image' as const,
          mime_type: 'image/png',
          file_size_bytes: 75000,
          width: 728,
          height: 90,
          storage_url: 'https://example.com/banner2.png',
          temp_storage_url: 'https://example.com/banner2.png',
          validation_status: 'warning' as const,
          validation_notes: 'Non-standard size',
          is_html5_bundle: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      const { container } = render(<AssetGrid assets={assets} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with empty grid', async () => {
      const { container } = render(<AssetGrid assets={[]} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility: Shared Components', () => {
  describe('LoadingSpinner', () => {
    it('should have no violations with default size', async () => {
      const { container } = render(<LoadingSpinner />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with custom message', async () => {
      const { container } = render(<LoadingSpinner message="Loading assets..." />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('ErrorBoundary', () => {
    it('should have no violations when rendering children', async () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('Accessibility: Keyboard Navigation', () => {
  it('UploadZone should be keyboard focusable', () => {
    const { container } = render(
      <UploadZone
        onFileSelected={() => {}}
        disabled={false}
        multiple={false}
        accept={{ 'image/*': ['.jpg', '.png', '.gif'] }}
      />
    )

    const dropzone = container.querySelector('[role="button"]')
    expect(dropzone).toBeTruthy()
    expect(dropzone?.getAttribute('tabindex')).toBe('0')
  })

  it('AssetCard should have proper ARIA attributes', () => {
    const { container } = render(
      <AssetCard
        asset={{
          id: 'test-1',
          creative_set_id: 'set-1',
          filename_original: 'test.jpg',
          filename_sanitized: 'test.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
          file_size_bytes: 50000,
          width: 300,
          height: 250,
          storage_url: 'https://example.com/test.jpg',
          temp_storage_url: 'https://example.com/test.jpg',
          validation_status: 'valid',
          validation_notes: 'Valid',
          is_html5_bundle: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }}
      />
    )

    const card = container.querySelector('[role="article"]')
    expect(card).toBeTruthy()
    expect(card?.getAttribute('aria-label')).toBeTruthy()
  })
})

describe('Accessibility: Color Contrast', () => {
  it('should have sufficient contrast for status badges', async () => {
    const { container } = render(
      <FileValidator
        results={[
          {
            filename: 'valid.jpg',
            status: 'valid',
            fileType: 'image',
            mimeType: 'image/jpeg',
            sizeBytes: 50000,
            messages: ['Valid'],
          },
          {
            filename: 'warning.jpg',
            status: 'warning',
            fileType: 'image',
            mimeType: 'image/jpeg',
            sizeBytes: 50000,
            messages: ['Warning'],
          },
          {
            filename: 'invalid.jpg',
            status: 'invalid',
            fileType: 'image',
            mimeType: 'image/jpeg',
            sizeBytes: 50000,
            messages: ['Invalid'],
          },
        ]}
        overallStatus="warning"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('Accessibility: Screen Reader Support', () => {
  it('UploadProgress should have aria-live region', () => {
    const { container } = render(
      <UploadProgress
        progress={50}
        status="uploading"
        filename="test.jpg"
      />
    )

    const liveRegion = container.querySelector('[aria-live]')
    expect(liveRegion).toBeTruthy()
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite')
  })

  it('UploadZone should announce drag state changes', () => {
    const { container } = render(
      <UploadZone
        onFileSelected={() => {}}
        disabled={false}
        multiple={false}
        accept={{ 'image/*': ['.jpg', '.png', '.gif'] }}
      />
    )

    // Check for status announcer
    const statusRegion = container.querySelector('[role="status"]')
    expect(statusRegion).toBeTruthy()
  })
})
