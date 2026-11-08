import { expect, test } from '@playwright/test'

test('PWA shell reloads from the service-worker cache while offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')
  const appShell = page.locator('.app-shell')
  await expect(appShell).toBeVisible()
  const initialText = (await appShell.innerText()).trim()
  expect(initialText.length).toBeGreaterThan(0)

  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable')
    await navigator.serviceWorker.ready
  })

  // Reload once online so the active worker controls this page and caches the
  // HTML shell plus the hashed JavaScript/CSS assets before network is removed.
  await page.reload()
  await expect(appShell).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  await context.setOffline(true)
  try {
    await page.reload()
    await expect(page.locator('#root')).toBeVisible()
    await expect(appShell).toBeVisible()
    await expect(appShell).toContainText(initialText.slice(0, 24))
  } finally {
    await context.setOffline(false)
  }
})
