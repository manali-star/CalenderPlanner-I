import { presidentLogin, warriorLogin } from './login';
import { openTaskManagement } from './navigation';

// PRESIDENT TASK MANAGEMENT FLOW
export async function openPresidentTaskManagement(page) {

  await presidentLogin(page);

  await openTaskManagement(page);
}

// WARRIOR DASHBOARD FLOW
export async function openWarriorDashboard(page) {

  await warriorLogin(page);
}