import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SIGNUP_EMAIL = 'signup-test@goobereats.test'
const SIGNUP_PASSWORD = 'signup123456'
const SIGNUP_USERNAME = 'signupuser'

test.describe('Authentication flow', () => {
  // Clean up any existing test user before the test
  test.beforeAll(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SECRET_KEY!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data } = await supabase.auth.admin.listUsers()
    const existing = data?.users?.find((u) => u.email === SIGNUP_EMAIL)
    if (existing) {
      await supabase.from('profiles').delete().eq('id', existing.id)
      await supabase.auth.admin.deleteUser(existing.id)
    }
  })

  test('sign up, onboard, sign out, sign in', async ({ page }) => {
    test.setTimeout(60000)

    // --- Sign Up ---
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // Step 1: Enter email
    await page.getByPlaceholder('Enter your email').fill(SIGNUP_EMAIL)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // Step 2: Enter password + confirm password (triggers sign-up)
    await page.getByPlaceholder('Password', { exact: true }).fill(SIGNUP_PASSWORD)
    await page.getByPlaceholder('Confirm Password').fill(SIGNUP_PASSWORD)
    await page.getByRole('button', { name: 'Submit' }).click()

    // Step 3: Onboarding — enter username (wait generously for server action)
    await expect(page.getByText('What should we call you?')).toBeVisible({ timeout: 15000 })
    await page.getByPlaceholder('Username').fill(SIGNUP_USERNAME)
    await page.getByRole('button', { name: 'Get Started' }).click()

    // Should redirect to homepage
    await page.waitForURL('/', { timeout: 15000 })
    await expect(page.locator('[data-testid="restaurant-card"]').first()).toBeVisible()

    // --- Sign Out ---
    await page.goto('/account')
    await expect(page.getByText(SIGNUP_EMAIL)).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await page.waitForURL('/', { timeout: 15000 })

    // --- Sign In ---
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // Step 1: Enter email
    await page.getByPlaceholder('Enter your email').fill(SIGNUP_EMAIL)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // Step 2: Enter password only (no confirm = sign in)
    await page.getByPlaceholder('Password', { exact: true }).fill(SIGNUP_PASSWORD)
    await page.getByRole('button', { name: 'Submit' }).click()

    // Should redirect to homepage
    await page.waitForURL('/', { timeout: 15000 })
  })
})
