import { expect, test } from '@playwright/test'

test('learner can pause, recover, complete Tonight’s 20 and review saved mistakes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto('/examforge/')

  const examDate = new Date()
  examDate.setDate(examDate.getDate() + 30)
  await page.locator('input[type="date"]').fill([
    examDate.getFullYear(),
    String(examDate.getMonth() + 1).padStart(2, '0'),
    String(examDate.getDate()).padStart(2, '0'),
  ].join('-'))
  await page.getByRole('button', { name: 'Mechanics', exact: true }).click()
  await page.getByRole('button', { name: 'Electricity', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()

  await page.getByRole('button', { name: /Start Tonight/ }).click()
  await expect(page.locator('.rewind-overlay')).toBeVisible()
  await expect(page.locator('.question-provenance')).toContainText('ExamForge original practice')
  await expect(page.locator('.question-provenance')).toContainText('not an official DBE question')

  // Select D, which is an incorrect distractor in the current Grade 12 starter bank.
  await page.locator('.answer-option').nth(3).click()
  await expect(page.locator('.explanation')).toBeVisible()
  await page.getByRole('button', { name: 'Save & exit' }).click()
  await expect(page.locator('.rewind-overlay')).not.toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /Resume saved session/ })).toBeVisible()
  await page.getByRole('button', { name: /Resume saved session/ }).click()
  await expect(page.locator('.rewind-overlay')).toBeVisible()
  await expect(page.locator('.answer-option').nth(3)).toHaveClass(/picked/)
  await page.getByRole('button', { name: 'Next question' }).click()

  for (let question = 1; question < 5; question++) {
    await page.locator('.answer-option').nth(3).click()
    await expect(page.locator('.explanation')).toBeVisible()
    await page.getByRole('button', { name: question === 4 ? 'Finish Rewind' : 'Next question' }).click()
  }

  await expect(page.locator('.session-summary')).toBeVisible()
  await expect(page.locator('.session-summary')).toContainText('Tonight’s 20 complete')
  await expect(page.locator('.session-summary')).toContainText('0/5 correct')

  await page.getByRole('button', { name: /Progress/ }).click()
  await expect(page.locator('.mistake-notebook')).toBeVisible()
  await expect(page.locator('.mistake-notebook .mistake-row')).toHaveCount(5)
})
