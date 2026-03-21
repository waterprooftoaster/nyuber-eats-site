import { type Page, expect } from '@playwright/test'

/**
 * Navigate to the homepage and click the first restaurant card.
 * Returns the restaurant page URL (e.g. /restaurant/{uuid}).
 */
export async function navigateToFirstRestaurant(page: Page): Promise<string> {
  await page.goto('/')
  const firstCard = page.locator('[data-testid="restaurant-card"]').first()
  await expect(firstCard).toBeVisible()
  await firstCard.click()
  await page.waitForURL(/\/restaurant\//)
  return page.url()
}

/**
 * On a restaurant page, click the first menu item and intercept the
 * options API call to extract the menu item ID.
 */
export async function getMenuItemId(page: Page): Promise<string> {
  const responsePromise = page.waitForResponse((res) =>
    res.url().includes('/api/menu-items/') && res.url().includes('/options'),
  )
  await page.locator('[data-testid="menu-item-card"]').first().click()
  const response = await responsePromise
  const url = response.url()
  const match = url.match(/\/api\/menu-items\/([^/]+)\/options/)
  if (!match) throw new Error('Could not extract menu item ID from options URL')
  return match[1]
}

/**
 * Extract the eatery ID from the current restaurant page URL.
 */
export function getEateryIdFromUrl(url: string): string {
  const match = url.match(/\/restaurant\/([^/?]+)/)
  if (!match) throw new Error('Not on a restaurant page')
  return match[1]
}
