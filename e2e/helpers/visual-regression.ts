import { expect, Page } from '@playwright/test'

// Helper to take consistent screenshots for visual comparison
export async function takeScreenshot(page: Page, name: string) {
  // Wait for fonts and images to load
  await page.waitForLoadState('networkidle')
  // Small delay for any CSS animations to complete
  await page.waitForTimeout(500)

  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixels: 100, // Allow minor rendering differences
    threshold: 0.2,
  })
}

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tabletLandscape: { width: 1024, height: 768 },
  tabletPortrait: { width: 768, height: 1024 },
} as const
