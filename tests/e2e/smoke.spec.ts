import { test, expect } from '@playwright/test'

test('ExamForge loads from its GitHub Pages project path without a browser error', async ({ page }) => {
  const pageErrors: string[] = []
  const failedAssets: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('requestfailed', request => failedAssets.push(request.url()))

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')

  await expect(page).toHaveTitle(/ExamForge/)
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.getByRole('heading', { name: /set up your exam focus/i })).toBeVisible()
  expect(pageErrors).toEqual([])
  expect(failedAssets).toEqual([])
})

test('ExamForge renders at a narrow mobile viewport on its project path', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/examforge/')

  await expect(page.locator('#root')).not.toBeEmpty()
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})


test('student can complete onboarding and reopen saved study settings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  // Each test starts with clean browser storage; no signed-in session or student data is used.
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/examforge/')

  const examDate = new Date()
  examDate.setDate(examDate.getDate() + 30)
  const dateValue = [
    examDate.getFullYear(),
    String(examDate.getMonth() + 1).padStart(2, '0'),
    String(examDate.getDate()).padStart(2, '0'),
  ].join('-')

  await page.locator('input[type="date"]').fill(dateValue)
  await page.getByRole('button', { name: 'Grade 11' }).click()
  await page.getByRole('button', { name: /Mathematics/ }).click()
  await page.getByRole('button', { name: 'Algebra', exact: true }).click()
  await page.getByRole('button', { name: 'Functions', exact: true }).click()

  const startButton = page.getByRole('button', { name: /Start Forging/ })
  await expect(startButton).toBeEnabled()
  await startButton.click()

  await expect(page.getByRole('heading', { name: /Tonight’s 20/ })).toBeVisible()
  await expect(page.locator('.dashboard-pills .pill')).toContainText(['Algebra', 'Functions'])

  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('button', { name: /Study settings/ }).click()

  await expect(page.getByRole('heading', { name: /Set up your exam focus/ })).toBeVisible()
  await expect(page.locator('input[type="date"]')).toHaveValue(dateValue)
  await expect(page.getByRole('button', { name: 'Grade 11' })).toHaveClass(/chosen/)
  await expect(page.getByRole('button', { name: /Mathematics/ })).toHaveClass(/chosen/)
  await expect(page.getByRole('button', { name: 'Algebra', exact: true })).toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: 'Functions', exact: true })).toHaveClass(/selected/)
})


test('legacy shared browser data never changes the signed-out default setup', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ef-profile', JSON.stringify({
      grade: '10', examDate: '2026-11-20', subject: 'Mathematics', weak: ['Algebra', 'Functions'],
    }))
    localStorage.setItem('ef-sessions', JSON.stringify([{ date: '2026-11-06', score: 5, seconds: 120, subject: 'Mathematics' }]))
    localStorage.setItem('ef-attempts', JSON.stringify([{ topic: 'Algebra', correct: true, t: Date.now() }]))
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')

  const expectedDate = new Date()
  expectedDate.setDate(expectedDate.getDate() + 20)
  const dateValue = [
    expectedDate.getFullYear(),
    String(expectedDate.getMonth() + 1).padStart(2, '0'),
    String(expectedDate.getDate()).padStart(2, '0'),
  ].join('-')

  await expect(page.locator('input[type="date"]')).toHaveValue(dateValue)
  await expect(page.getByRole('button', { name: 'Grade 12' })).toHaveClass(/chosen/)
  await expect(page.getByRole('button', { name: /Physical Science/ })).toHaveClass(/chosen/)
  await expect(page.getByRole('button', { name: 'Mechanics', exact: true })).not.toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: 'Electricity', exact: true })).not.toHaveClass(/selected/)
})
