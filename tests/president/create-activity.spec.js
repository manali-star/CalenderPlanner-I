import { test, expect } from '@playwright/test';

import { TEST_ACTIVITY } from '../helpers/testData';

import { openPresidentTaskManagement } from '../helpers/workflows';

test('president can create activity', async ({ page }) => {

await openPresidentTaskManagement(page);

// Open activity modal
await page.getByTestId(
  'assign-task-btn'
).click();

  // Fill activity name
  await page.getByTestId(
    'activity-name-input'
  ).fill(TEST_ACTIVITY.title);

  // Fill participants
  await page.getByTestId(
    'participants-input'
  ).fill(TEST_ACTIVITY.participants);

  // Fill location
  await page.getByTestId(
    'location-input'
  ).fill(TEST_ACTIVITY.location);

  // Fill description
  await page.getByTestId(
    'description-input'
  ).fill(TEST_ACTIVITY.description);

// Open warrior dropdown
await page.getByTestId(
  'assign-warrior-select'
).click();

// Wait for dropdown options
await page.waitForTimeout(1000);

// Select warrior
await page.getByRole('button', {
  name: /Akanksha Mane/
}).click();

  // Create activity
  await page.getByTestId(
    'create-activity-btn'
  ).click();

// Wait after submit
await page.waitForTimeout(3000);
});