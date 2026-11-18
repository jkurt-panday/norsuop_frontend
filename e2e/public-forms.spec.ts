import { expect, test } from '@playwright/test'

test.describe('public form routes', () => {
  test('renders the OP form at the Laravel-compatible route', async ({ page }) => {
    await page.route('**/api/v1/public/opform/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            memberships: [{ id: 1, member_code: 'REG', member_desc: 'Regular' }],
            paymentOptions: [{ id: 2, payment_desc: 'Tuition' }],
            courses: [{ id: 3, course_code: 'MBA', course_desc: 'Master of Business Administration' }],
            academicTerms: [{ id: 4, school_year: '2025-2026', semester: 'First Semester' }],
            collegeOffices: [{ id: 5, name: 'Main Campus' }],
          },
        }),
      })
    })

    await page.goto('/public/opform')
    await expect(page.getByRole('heading', { name: 'NORSU Order of Payment - MAIN CAMPUS' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Student' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Academic Details')).toBeVisible()
    await expect(page.getByLabel('Course')).toBeVisible()
  })

  test('switches OP form to general mode and hides academic fields', async ({ page }) => {
    await page.route('**/api/v1/public/opform/options', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { memberships: [], paymentOptions: [], courses: [], academicTerms: [], collegeOffices: [] } }) })
    })

    await page.goto('/public/opform')
    await page.getByRole('tab', { name: 'General' }).click()
    await expect(page.getByText('Academic Details')).toHaveCount(0)
    await expect(page.getByLabel('Position / Designation')).toBeEnabled()
  })

  test('renders the assessment form and validates the route contract', async ({ page }) => {
    await page.route('**/api/v1/public/assessmentform/options', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { courses: [{ id: 3, course_code: 'MBA', course_desc: 'Master of Business Administration' }] } }) })
    })

    await page.goto('/assessment')
    await expect(page.getByRole('heading', { name: 'Assessment Form' })).toBeVisible()
    await expect(page.getByLabel('Course')).toBeVisible()
    await expect(page.getByLabel('Enrolled under')).toBeVisible()
  })
})
