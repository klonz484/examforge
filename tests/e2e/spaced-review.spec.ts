import { test, expect } from '@playwright/test'

test('learner can turn a saved mistake into a spaced-review card', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')
  const future = new Date()
  future.setDate(future.getDate() + 30)
  const examDate = [
    future.getFullYear(),
    String(future.getMonth() + 1).padStart(2, '0'),
    String(future.getDate()).padStart(2, '0'),
  ].join('-')
  await page.locator('input[type="date"]').fill(examDate)

  const mathematics = page.getByRole('button', { name: 'Mathematics ATP-listed', exact: true })
  if (await mathematics.getAttribute('aria-pressed') !== 'true') await mathematics.click()
  await page.getByLabel('Choose your first study focus').selectOption('mathematics')
  const selectedTopics = page.locator('.topic-pills .pill.selected')
  while (await selectedTopics.count()) await selectedTopics.first().click()
  await page.getByRole('button', { name: 'Algebra', exact: true }).click()
  await page.getByRole('button', { name: 'Functions', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()

  await expect(page.getByRole('heading', { name: /Tonight’s 20/ })).toBeVisible()
  await page.getByRole('button', { name: /Start Tonight’s 20/ }).click()

  // Grade 12 Mathematics starter questions do not use option D as the correct answer.
  for (let index = 0; index < 5; index += 1) {
    await page.locator('.answer-option').nth(3).click()
    await expect(page.locator('.explanation')).toBeVisible()
    await page.getByRole('button', { name: index === 4 ? /Finish Rewind/ : /Next question/ }).click()
    if (index < 4) await expect(page.locator('.answer-option')).toHaveCount(4)
  }

  await expect(page.getByText(/Tonight’s 20 complete:/)).toBeVisible()
  await page.getByRole('button', { name: 'Progress' }).click()
  await expect(page.getByRole('heading', { name: 'Mistake notebook' })).toBeVisible()
  await expect(page.getByText(/5 saved questions/)).toBeVisible()

  await page.getByRole('button', { name: 'Review now' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Reveal correction' }).click()
  await expect(page.getByText('Correct answer')).toBeVisible()
  await page.getByRole('button', { name: 'Again' }).click()
  await expect(page.getByText(/Due /).first()).toBeVisible()
})
