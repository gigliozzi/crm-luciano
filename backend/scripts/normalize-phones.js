import { initializeDatabase, getDb } from '../src/db/connection.js';
import { normalizePhoneE164 } from '../src/utils/phone.js';

async function main() {
  await initializeDatabase();
  const db = await getDb();
  const contacts = await db.all('SELECT id, phone FROM contacts WHERE phone IS NOT NULL AND TRIM(phone) <> ""');

  let updated = 0;
  for (const c of contacts) {
    const normalized = normalizePhoneE164(c.phone);
    if (normalized && normalized !== c.phone) {
      await db.run('UPDATE contacts SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', normalized, c.id);
      updated++;
    }
  }

  console.log(`Normalização concluída. Telefones atualizados: ${updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

