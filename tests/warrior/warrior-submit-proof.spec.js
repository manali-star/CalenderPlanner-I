import { test, expect } from '@playwright/test';

import { warriorLogin } from '../helpers/login';

test(
  'warrior can submit completion proof',
  async ({ page }) => {

    // Login as warrior
    await warriorLogin(page);

    // Open My Tasks
    await page.getByText(
      'My Tasks'
    ).click();

    // Verify task visible
    await expect(
      page.getByText(/Test warrior/i)
    ).toBeVisible();

    // Upload proof file
    await page.locator(
      'input[type="file"]'
    ).setInputFiles(
      'tests/fixtures/proof.png'
    );

    // Fill completion notes
    await page.getByPlaceholder(
      /Describe your work/i
    ).fill(
      'Playwright automated submission test'
    );

    // Submit proof
    await page.getByText(
      /Submit Proof/i
    ).click();

    // Verify pending review status
    await expect(
      page.getByText(/Pending Review/i)
    ).toBeVisible();
  }
);