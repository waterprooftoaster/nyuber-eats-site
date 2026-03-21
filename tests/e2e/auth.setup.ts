import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test@goobereats.test'
const TEST_PASSWORD = 'testpassword123'
const TEST_USERNAME = 'testuser'

setup('create test user and authenticate', async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SECRET_KEY!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Delete existing test user if present (idempotent setup)
  const { data: existing } = await supabase.auth.admin.listUsers()
  const existingUser = existing?.users?.find((u) => u.email === TEST_EMAIL)
  if (existingUser) {
    await supabase.from('profiles').delete().eq('id', existingUser.id)
    await supabase.auth.admin.deleteUser(existingUser.id)
  }

  // Create test user via admin API (auto-confirmed)
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (createError || !created.user) {
    throw new Error(`Failed to create test user: ${createError?.message}`)
  }

  // Create profile for the user
  const { error: profileError } = await supabase.from('profiles').insert({
    id: created.user.id,
    username: TEST_USERNAME,
    email: TEST_EMAIL,
  })
  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`)
  }

  // Sign in via the login page
  await page.goto('/auth/login')

  // Step 1: Enter email
  await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Step 2: Enter password (no confirm = sign in)
  await page.getByPlaceholder('Password', { exact: true }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Submit' }).click()

  // Wait for redirect to homepage
  await page.waitForURL('/', { timeout: 10000 })

  // Save auth state
  await page.context().storageState({ path: '.auth/user.json' })
})
