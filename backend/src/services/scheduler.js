import cron from 'node-cron';
import { getDb } from '../db/connection.js';
import { dispatchBirthdayNotifications } from './notificationService.js';

// Fetch contacts whose birthday occurs in `daysAhead` days from now (localtime).
async function fetchBirthdaysInDays(daysAhead = 0) {
  const db = await getDb();
  // Calculate target month-day and current year.
  const row = await db.get(
    "SELECT strftime('%m-%d', datetime('now','localtime', ?)) AS target_md, strftime('%Y','now','localtime') AS yyyy",
    `+${daysAhead} days`
  );
  const targetMd = row.target_md; // e.g., '03-25'
  const year = Number(row.yyyy);
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  // Treat Feb 29 birthdays as Feb 28 on non-leap years.
  if (!isLeapYear && targetMd === '02-28') {
    return db.all(
      `SELECT contacts.* FROM contacts
       WHERE strftime('%m-%d', birth_date) IN ('02-28','02-29')`
    );
  }

  return db.all(
    `SELECT contacts.* FROM contacts
     WHERE strftime('%m-%d', birth_date) = ?`,
    targetMd
  );
}

/**
 * Runs the birthday reminder workflow for events in 3 days.
 */
export async function runBirthdayReminder() {
  const contacts = await fetchBirthdaysInDays(3);
  if (contacts.length === 0) {
    console.log('[scheduler] Nenhum aniversário no período alvo.');
    return;
  }
  console.log(`[scheduler] Encontrados ${contacts.length} aniversariantes.`);
  await dispatchBirthdayNotifications(contacts);
}

/**
 * Configures the cron job to execute daily at midnight.
 */
export function startBirthdayScheduler() {
  cron.schedule('0 0 * * *', () => {
    runBirthdayReminder().catch((error) => console.error('[scheduler] Erro ao executar job', error));
  }, {
    timezone: 'America/Sao_Paulo',
  });
}
