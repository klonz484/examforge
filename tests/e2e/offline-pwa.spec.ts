import { expect, test } from '@playwright/test'

test('PWA shell reloads from the service-worker cache while offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')
  const appRoot = page.locator('#root')
  await expect(appRoot).not.toBeEmpty()
  const onboardingHeading = page.getByRole('heading', { name: /Set up your exam focus/i })
  await expect(onboardingHeading).toBeVisible()
  await expect(page.getByText('Choose your subjects')).toBeVisible()

  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable')
    await navigator.serviceWorker.ready
  })

  // Reload once online so the active worker controls this page and caches the
  // HTML shell plus the hashed JavaScript/CSS assets before network is removed.
  await page.reload()
  await expect(appRoot).not.toBeEmpty()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  await context.setOffline(true)
  try {
    await page.reload()
    await expect(appRoot).not.toBeEmpty()
    await expect(onboardingHeading).toBeVisible()
    await expect(page.getByText('Choose your subjects')).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})
