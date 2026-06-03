import { test, expect } from '@playwright/test';

import { warriorLogin } from '../helpers/login';

test('warrior cannot access president dashboard', async ({ page }) => {
await warriorLogin(page);

await expect(
  page.getByText(/Welcome Back/i)
).toBeVisible();

  await expect(
    page.getByText('President Dashboard')
  ).not.toBeVisible();

});