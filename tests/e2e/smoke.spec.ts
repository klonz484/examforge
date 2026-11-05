import { test, expect } from '@playwright/test'

test('ExamForge loads its onboarding screen without a browser error', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page).toHaveTitle(/ExamForge/)
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.getByRole('heading', { name: /set up your exam focus/i })).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('ExamForge renders at a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  await expect(page.locator('#root')).not.toBeEmpty()
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})
