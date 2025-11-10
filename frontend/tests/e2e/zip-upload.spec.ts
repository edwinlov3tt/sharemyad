/**
 * E2E Test: Zip File Upload with Creative Sets
 * User Story 3 (P3) - Test-First Development
 *
 * Tests complete user flow: upload zip → extraction → creative set tabs → preview
 */

import { test, expect } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import JSZip from 'jszip'

// Test data directory
const TEST_DATA_DIR = join(__dirname, '../__test-data__')

test.describe('Zip Upload with Creative Sets', () => {
  test.beforeAll(async () => {
    // Create test data directory
    await mkdir(TEST_DATA_DIR, { recursive: true })
  })

  test.beforeEach(async ({ page }) => {
    // Navigate to upload page
    await page.goto('http://localhost:5173/upload')

    // Wait for page to load
    await expect(page.locator('[data-testid="upload-zone"]')).toBeVisible()
  })

  test('should upload zip with creative sets and display tabs', async ({ page }) => {
    // Arrange: Create test zip with Set-A, Set-B, Set-C folders
    const zip = new JSZip()

    // Add files to Set-A
    zip.folder('Set-A')?.file('banner-300x250.jpg', await createFakeImage(300, 250))
    zip.folder('Set-A')?.file('leaderboard-728x90.jpg', await createFakeImage(728, 90))

    // Add files to Set-B
    zip.folder('Set-B')?.file('banner-300x250.jpg', await createFakeImage(300, 250))
    zip.folder('Set-B')?.file('leaderboard-728x90.jpg', await createFakeImage(728, 90))

    // Add files to Set-C
    zip.folder('Set-C')?.file('banner-300x250.jpg', await createFakeImage(300, 250))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipPath = join(TEST_DATA_DIR, 'creative-sets.zip')
    await writeFile(zipPath, zipBuffer)

    // Act: Upload zip file
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('[data-testid="upload-zone"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(zipPath)

    // Wait for upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="upload-progress"]')).toContainText('100%', {
      timeout: 30000
    })

    // Wait for extraction progress
    await expect(page.locator('[data-testid="extraction-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="extraction-progress"]')).toContainText('Extracting files')

    // Wait for completion
    await expect(page.locator('[data-testid="extraction-complete"]')).toBeVisible({
      timeout: 60000
    })

    // Assert: Verify creative set tabs appear
    await expect(page.locator('[data-testid="creative-set-tabs"]')).toBeVisible()

    // Verify all three tabs exist
    await expect(page.locator('[data-testid="set-tab-Set-A"]')).toBeVisible()
    await expect(page.locator('[data-testid="set-tab-Set-B"]')).toBeVisible()
    await expect(page.locator('[data-testid="set-tab-Set-C"]')).toBeVisible()

    // Verify Set-A is selected by default (first set)
    await expect(page.locator('[data-testid="set-tab-Set-A"]')).toHaveAttribute('aria-selected', 'true')

    // Verify asset grid shows Set-A assets (2 files)
    await expect(page.locator('[data-testid="asset-grid"]')).toBeVisible()
    const setAAssets = page.locator('[data-testid^="asset-card-"]')
    await expect(setAAssets).toHaveCount(2)

    // Verify filenames visible
    await expect(page.locator('text=banner-300x250.jpg')).toBeVisible()
    await expect(page.locator('text=leaderboard-728x90.jpg')).toBeVisible()

    // Act: Switch to Set-B
    await page.locator('[data-testid="set-tab-Set-B"]').click()

    // Assert: Set-B selected
    await expect(page.locator('[data-testid="set-tab-Set-B"]')).toHaveAttribute('aria-selected', 'true')

    // Verify Set-B assets displayed (2 files)
    await expect(setAAssets).toHaveCount(2)

    // Act: Switch to Set-C
    await page.locator('[data-testid="set-tab-Set-C"]').click()

    // Assert: Set-C selected and shows 1 asset
    await expect(page.locator('[data-testid="set-tab-Set-C"]')).toHaveAttribute('aria-selected', 'true')
    await expect(setAAssets).toHaveCount(1)
  })

  test('should extract nested folder structure and display correctly', async ({ page }) => {
    // Arrange: Create zip with nested Campaign/Display structure
    const zip = new JSZip()
    zip.folder('Campaign')?.folder('Display')?.folder('Set-A')?.file('banner.jpg', await createFakeImage(300, 250))
    zip.folder('Campaign')?.folder('Display')?.folder('Set-B')?.file('banner.jpg', await createFakeImage(300, 250))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipPath = join(TEST_DATA_DIR, 'nested.zip')
    await writeFile(zipPath, zipBuffer)

    // Act: Upload
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('[data-testid="upload-zone"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(zipPath)

    // Wait for completion
    await expect(page.locator('[data-testid="extraction-complete"]')).toBeVisible({ timeout: 60000 })

    // Assert: Creative sets detected despite nesting
    await expect(page.locator('[data-testid="set-tab-Set-A"]')).toBeVisible()
    await expect(page.locator('[data-testid="set-tab-Set-B"]')).toBeVisible()

    // Verify folder structure warning for deep nesting
    const folderWarning = page.locator('[data-testid="folder-structure-warning"]')
    if (await folderWarning.isVisible()) {
      await expect(folderWarning).toContainText('Deeply nested folders')
    }
  })

  test('should show warning when 500-file limit reached', async ({ page }) => {
    // Arrange: Create zip with 550 small files
    const zip = new JSZip()
    for (let i = 1; i <= 550; i++) {
      zip.file(`file${i}.jpg`, await createFakeImage(100, 100))
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipPath = join(TEST_DATA_DIR, 'large-zip.zip')
    await writeFile(zipPath, zipBuffer)

    // Act: Upload
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('[data-testid="upload-zone"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(zipPath)

    // Wait for extraction
    await expect(page.locator('[data-testid="extraction-progress"]')).toBeVisible()

    // Wait for completion or warning
    await page.waitForSelector('[data-testid="extraction-complete"], [data-testid="file-limit-warning"]', {
      timeout: 120000
    })

    // Assert: Warning appears
    await expect(page.locator('[data-testid="file-limit-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-limit-warning"]')).toContainText('File limit reached')
    await expect(page.locator('[data-testid="file-limit-warning"]')).toContainText('500 of 550')

    // Verify only 500 assets displayed
    const assets = page.locator('[data-testid^="asset-card-"]')
    const assetCount = await assets.count()
    expect(assetCount).toBeLessThanOrEqual(500)
  })

  test('should display extraction progress updates in real-time', async ({ page }) => {
    // Arrange: Create zip with 30 files for visible progress
    const zip = new JSZip()
    for (let i = 1; i <= 30; i++) {
      zip.folder('Set-A')?.file(`image${i}.jpg`, await createFakeImage(300, 250))
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipPath = join(TEST_DATA_DIR, 'progress-test.zip')
    await writeFile(zipPath, zipBuffer)

    // Act: Upload
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('[data-testid="upload-zone"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(zipPath)

    // Assert: Progress updates visible
    await expect(page.locator('[data-testid="extraction-progress"]')).toBeVisible()

    // Wait and capture progress text changes
    const progressTexts: string[] = []

    // Poll progress text for changes
    for (let i = 0; i < 10; i++) {
      const text = await page.locator('[data-testid="extraction-progress"]').textContent()
      if (text) progressTexts.push(text)
      await page.waitForTimeout(2000) // Wait 2 seconds between checks

      // Break if extraction complete
      if (await page.locator('[data-testid="extraction-complete"]').isVisible()) {
        break
      }
    }

    // Verify progress text showed file counts
    expect(progressTexts.length).toBeGreaterThan(0)
    expect(progressTexts.some(text => text.includes('/30'))).toBeTruthy()
  })

  test('should handle corrupted zip with error message', async ({ page }) => {
    // Arrange: Create corrupted zip buffer
    const validZip = new JSZip()
    validZip.file('test.jpg', await createFakeImage(100, 100))
    const zipBuffer = await validZip.generateAsync({ type: 'nodebuffer' })

    // Corrupt the buffer
    const corruptedBuffer = Buffer.from(zipBuffer)
    corruptedBuffer[100] = 0xFF
    corruptedBuffer[101] = 0xFF

    const zipPath = join(TEST_DATA_DIR, 'corrupted.zip')
    await writeFile(zipPath, corruptedBuffer)

    // Act: Upload
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('[data-testid="upload-zone"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(zipPath)

    // Assert: Error message displayed
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="upload-error"]')).toContainText(/corrupted|invalid|failed/i)

    // Verify error is actionable
    const errorText = await page.locator('[data-testid="upload-error"]').textContent()
    expect(errorText?.toLowerCase()).toContain('try')
  })

  test('should detect and display HTML5 bundle indicator', async ({ page }) => {
    // Arrange: Create zip with HTML5 bundle
    const zip = new JSZip()
    zip.file('index.html', Buffer.from('<html><body>Ad Content</body></html>'))
    zip.file('styles.css', Buffer.from('body { color: red; }'))
    zip.file('script.js', Buffer.from('console.log("loaded");'))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipPath = join(TEST_DATA_DIR, 'html5-bundle.zip')
    await writeFile(zipPath, zipBuffer)

    // Act: Upload
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('[data-testid="upload-zone"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(zipPath)

    // Wait for extraction
    await expect(page.locator('[data-testid="extraction-complete"]')).toBeVisible({ timeout: 60000 })

    // Assert: HTML5 bundle indicator visible
    const indexAsset = page.locator('[data-testid="asset-card-index.html"]')
    await expect(indexAsset).toBeVisible()

    // Verify HTML5 badge/icon
    await expect(indexAsset.locator('[data-testid="html5-bundle-badge"]')).toBeVisible()
    await expect(indexAsset.locator('[data-testid="html5-bundle-badge"]')).toContainText('HTML5')
  })

  test('should be keyboard navigable through creative set tabs', async ({ page }) => {
    // Arrange: Create zip with 3 sets
    const zip = new JSZip()
    zip.folder('A')?.file('test.jpg', await createFakeImage(100, 100))
    zip.folder('B')?.file('test.jpg', await createFakeImage(100, 100))
    zip.folder('C')?.file('test.jpg', await createFakeImage(100, 100))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipPath = join(TEST_DATA_DIR, 'keyboard-test.zip')
    await writeFile(zipPath, zipBuffer)

    // Act: Upload and wait
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.locator('[data-testid="upload-zone"]').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(zipPath)

    await expect(page.locator('[data-testid="extraction-complete"]')).toBeVisible({ timeout: 60000 })

    // Focus first tab
    await page.locator('[data-testid="creative-set-tabs"]').focus()
    await page.keyboard.press('Tab') // Move to first tab

    // Verify first tab focusable
    await expect(page.locator('[data-testid="set-tab-A"]')).toBeFocused()

    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-testid="set-tab-B"]')).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-testid="set-tab-C"]')).toBeFocused()

    // Select with Enter/Space
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="set-tab-C"]')).toHaveAttribute('aria-selected', 'true')

    // Verify asset grid updated to Set-C
    const assets = page.locator('[data-testid^="asset-card-"]')
    await expect(assets).toHaveCount(1)
  })
})

/**
 * Helper: Create fake image buffer for testing
 * Creates minimal valid JPEG data
 */
async function createFakeImage(width: number, height: number): Promise<Buffer> {
  // Minimal JPEG header (not a real image, but passes basic validation)
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, // SOI marker
    0xFF, 0xE0, // APP0 marker
    0x00, 0x10, // APP0 length
    0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF identifier
    0x01, 0x01, // JFIF version
    0x00, // Density units
    0x00, 0x01, 0x00, 0x01, // X/Y density
    0x00, 0x00, // Thumbnail size
    0xFF, 0xD9 // EOI marker
  ])

  return jpegHeader
}
