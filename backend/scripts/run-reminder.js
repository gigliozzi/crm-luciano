import { initializeDatabase, getDb } from '../src/db/connection.js';
import { config } from '../src/config/env.js';
import { runBirthdayReminder } from '../src/services/scheduler.js';

async function main() {
  await initializeDatabase();
  const db = await getDb();
  const now = new Date();
  const birth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const admin = await db.get('SELECT id FROM users WHERE email = ?', config.defaults.adminEmail);
  if (!admin) {
    console.error('Usuário admin não encontrado. Verifique DEFAULT_ADMIN_EMAIL.');
    process.exit(1);
  }
  await db.run(
    'INSERT INTO contacts (user_id, first_name, last_name, birth_date, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
    admin.id,
    'Teste',
    'Aniversário',
    birth,
    config.mail.from || 'test@example.com',
    '+551199999999'
  );
  console.log('Contato de teste criado com aniversário hoje.');
  await runBirthdayReminder();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
