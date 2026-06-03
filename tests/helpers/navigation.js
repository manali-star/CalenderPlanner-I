import { expect } from '@playwright/test';

// OPEN TASK MANAGEMENT
export async function openTaskManagement(page) {

  await page.getByText(
    'Task Management'
  ).click();

  await expect(
    page.getByTestId('assign-task-btn')
  ).toBeVisible();
}