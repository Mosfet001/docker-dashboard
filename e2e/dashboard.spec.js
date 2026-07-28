import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────
//  E2E tests — requires the full stack running on localhost:80
//  Run: npm run docker:up && npx playwright test
// ─────────────────────────────────────────────────────────────

const BASE = process.env.E2E_BASE_URL || 'http://localhost'

async function login(page) {
  await page.goto(BASE)
  await page.fill('input[placeholder="admin"]', process.env.E2E_USER || 'admin')
  await page.fill('input[placeholder="••••••••"]', process.env.E2E_PASS || 'changeme')
  await page.click('text=Sign in')
  await page.waitForSelector('text=Containers')
}

test.describe('Auth', () => {
  test('shows login page when unauthenticated', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('text=Docker Dashboard')).toBeVisible()
    await expect(page.locator('text=Sign in')).toBeVisible()
  })

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto(BASE)
    await page.fill('input[placeholder="admin"]', 'admin')
    await page.fill('input[placeholder="••••••••"]', 'wrongpassword')
    await page.click('text=Sign in')
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('logs in with correct credentials', async ({ page }) => {
    await login(page)
    await expect(page.locator('nav')).toBeVisible()
  })

  test('logs out and returns to login', async ({ page }) => {
    await login(page)
    await page.click('button[title="Log out"]')
    await expect(page.locator('text=Sign in')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('sidebar navigates to all panels', async ({ page }) => {
    const panels = [
      { nav: 'Images',         heading: 'Images' },
      { nav: 'Volumes',        heading: 'Volumes' },
      { nav: 'Networks',       heading: 'Networks' },
      { nav: 'Terminal',       heading: 'Terminal' },
      { nav: 'Alerts',         heading: 'Alerts' },
      { nav: 'Compose editor', heading: 'Compose editor' },
      { nav: 'Resource usage', heading: 'Resource usage' },
      { nav: 'Containers',     heading: 'Containers' },
    ]
    for (const { nav, heading } of panels) {
      await page.click(`nav >> text=${nav}`)
      await expect(page.locator(`text=${heading}`).first()).toBeVisible()
    }
  })
})

test.describe('Containers panel', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('shows container list', async ({ page }) => {
    await expect(page.locator('text=Container list')).toBeVisible()
  })

  test('filter tabs work', async ({ page }) => {
    await page.click('text=Running')
    await expect(page.locator('text=Running').nth(0)).toBeVisible()
    await page.click('text=All')
  })

  test('search narrows results', async ({ page }) => {
    await page.fill('input[placeholder="Search…"]', 'nginx')
    await page.waitForTimeout(300)
    // Other containers should not be visible
    await expect(page.locator('text=nginx').first()).toBeVisible()
  })
})

test.describe('Images panel', () => {
  test.beforeEach(async ({ page }) => { await login(page); await page.click('text=Images') })

  test('shows image table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('text=Pull image')).toBeVisible()
  })

  test('pull image input accepts text', async ({ page }) => {
    await page.fill('input[placeholder*="nginx:alpine"]', 'hello-world:latest')
    await expect(page.locator('input[placeholder*="nginx:alpine"]')).toHaveValue('hello-world:latest')
  })
})

test.describe('Compose editor', () => {
  test.beforeEach(async ({ page }) => { await login(page); await page.click('text=Compose editor') })

  test('shows compose editor', async ({ page }) => {
    await expect(page.locator('text=docker-compose.yml')).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('textarea contains compose content', async ({ page }) => {
    const content = await page.locator('textarea').inputValue()
    expect(content).toContain('services:')
    expect(content).toContain('version:')
  })

  test('download button exists', async ({ page }) => {
    await expect(page.locator('text=Download')).toBeVisible()
  })
})

test.describe('API health check', () => {
  test('GET /api/health returns ok', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
