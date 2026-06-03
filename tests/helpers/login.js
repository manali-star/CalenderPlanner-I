import { expect } from '@playwright/test';

import { SELECTORS } from './selectors';

// PRESIDENT LOGIN
export async function presidentLogin(page) {

  await page.goto('http://localhost:5173/');

  await page.getByTestId(SELECTORS.emailInput).fill(
    'president_test@campusflow.com'
  );

  await page.getByTestId(SELECTORS.passwordInput).fill(
    '123456'
  );

  await page.getByTestId('login-btn').click();

  await expect(page).toHaveURL(
    /localhost:5173/
  );
}

// WARRIOR LOGIN
export async function warriorLogin(page) {

  await page.goto('http://localhost:5173/');

  await page.getByTestId(SELECTORS.emailInput).fill(
    'warrior_test@campusflow.com'
  );

  await page.getByTestId(SELECTORS.passwordInput).fill(
    '123456'
  );

  await page.getByTestId(SELECTORS.loginButton).click();

  await expect(page).toHaveURL(
    /localhost:5173/
  );
}