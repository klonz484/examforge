// Consumer-level regression coverage for the shared UI snapshot.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("ExamForge consumes shared navigation and modal form components", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto("/examforge/");

  const onboardingA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(onboardingA11y.violations, JSON.stringify(onboardingA11y.violations, null, 2)).toEqual([]);

  const date = new Date();
  date.setDate(date.getDate() + 30);
  const dateValue = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  await page.locator('input[type="date"]').fill(dateValue);
  await page.getByRole("button", { name: "Mathematics ATP-listed", exact: true }).click();
  await page.getByRole("button", { name: "Algebra", exact: true }).click();
  await page.getByRole("button", { name: "Functions", exact: true }).click();
  await page.getByRole("button", { name: /Start Forging/ }).click();

  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Past Papers" }).click();
  await expect(page.getByRole("heading", { name: "Past Papers" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Past Papers" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "Your Progress" })).toBeVisible();

  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: /Account \/ sign in/ }).click();
  const dialog = page.getByRole("dialog", { name: "Create your account" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Email address" })).toBeVisible();
  await expect(dialog.getByLabel("Password")).toHaveAttribute("autocomplete", "new-password");
  const dialogA11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(dialogA11y.violations, JSON.stringify(dialogA11y.violations, null, 2)).toEqual([]);
  await page.keyboard.press("Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBeTruthy();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
});
