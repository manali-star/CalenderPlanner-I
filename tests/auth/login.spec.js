import { test, expect } from '@playwright/test';

import { presidentLogin } from '../helpers/login';

test('president can login successfully', async ({ page }) => {
await presidentLogin(page);
});