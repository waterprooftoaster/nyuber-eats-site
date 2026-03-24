import { test } from '@playwright/test'
import path from 'path'

const RESTAURANT_ID = 'ce531dea-d630-4c94-aa64-d703dc5ed3c5' // Joe's Pizza (seeded with menu items)
const RESTAURANT_URL = `/restaurant/${RESTAURANT_ID}`
const SCREENSHOT_DIR = path.join(__dirname, '../../screenshots')

// Wait for at least one menu item button to be hydrated and visible
async function waitForMenuItems(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => {
      const buttons = document.querySelectorAll('[data-testid="menu-grid"] button')
      return buttons.length > 0
    },
    { timeout: 15000 },
  )
}

test('phone 375px — restaurant menu page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(RESTAURANT_URL)
  await waitForMenuItems(page)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'menu-phone-375.png'),
    fullPage: true,
  })
})

test('tablet 768px — restaurant menu page', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto(RESTAURANT_URL)
  await waitForMenuItems(page)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'menu-tablet-768.png'),
    fullPage: true,
  })
})

test('phone 375px — menu item modal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(RESTAURANT_URL)
  await waitForMenuItems(page)

  // Click the first item button inside the menu grid
  await page.locator('[data-testid="menu-grid"] button').first().click()

  // Wait for the modal/dialog overlay to appear
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 })

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'menu-item-modal-phone-375.png'),
    fullPage: false,
  })
})
