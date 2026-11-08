import { test, expect } from '@playwright/test'

async function enterLearnerDashboard(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/examforge/')
  const future = new Date()
  future.setDate(future.getDate() + 30)
  const date = [future.getFullYear(), String(future.getMonth() + 1).padStart(2, '0'), String(future.getDate()).padStart(2, '0')].join('-')
  await page.locator('input[type="date"]').fill(date)
  await page.getByRole('button', { name: 'Mechanics', exact: true }).click()
  await page.getByRole('button', { name: 'Electricity', exact: true }).click()
  await page.getByRole('button', { name: /Start Forging/ }).click()
  await page.getByRole('button', { name: 'Past Papers' }).click()
}

test('CAPS roadmaps switch grade and subject and link to the matching DBE ATP', async ({ page }) => {
  await enterLearnerDashboard(page)

  await page.getByLabel('Roadmap grade').selectOption('10')
  await page.getByLabel('Roadmap subject').selectOption('mathematics')
  await expect(page.getByText('Algebraic expressions', { exact: true })).toBeVisible()
  const grade10Math = page.getByRole('link', { name: 'Open official ATP source' })
  await expect(grade10Math).toHaveAttribute('href', /Grade%2010.*Maths|Gr%2010%20Maths/i)

  await page.getByLabel('Roadmap grade').selectOption('11')
  await page.getByLabel('Roadmap subject').selectOption('physical-science')
  await expect(page.getByText(/Vectors in two dimensions and Newton’s laws/)).toBeVisible()
  await expect(grade10Math).toHaveAttribute('href', /fileticket=HofhdeKXMCM/)

  await page.getByLabel('Roadmap grade').selectOption('12')
  await page.getByLabel('Roadmap subject').selectOption('physical-science')
  await expect(page.getByText('Doppler Effect', { exact: false })).toBeVisible()
  await expect(grade10Math).toHaveAttribute('href', /fileticket=6y_u-yjj97c/)
})

test('official DBE paper archive cards are provenance-labelled and searchable by year and subject', async ({ page }) => {
  await enterLearnerDashboard(page)
  await expect(page.getByText('8 verified archive entries')).toBeVisible()
  await expect(page.locator('.archive-card')).toHaveCount(8)
  for (const link of await page.locator('.archive-card a').all()) {
    await expect(link).toHaveAttribute('href', /^https:\/\/www\.education\.gov\.za\//)
  }

  await page.getByRole('button', { name: '2026', exact: true }).click()
  await expect(page.locator('.archive-card')).toHaveCount(2)
  await page.getByRole('button', { name: '2025', exact: true }).click()
  await expect(page.locator('.archive-card')).toHaveCount(4)
  await page.getByRole('button', { name: 'Physical Science', exact: true }).click()
  await expect(page.locator('.archive-card')).toHaveCount(2)
  await expect(page.locator('.archive-card').first()).toContainText('Physical Sciences')
  await expect(page.locator('.archive-provenance').first()).toContainText('Department of Basic Education')
})
