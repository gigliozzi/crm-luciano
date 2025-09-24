import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br.js';
import { apiClient } from '../services/api.js';

dayjs.locale('pt-br');

export default function DashboardPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get('/contacts/birthdays/today');
        setContacts(data.contacts);
      } catch (err) {
        setError('Não foi possível carregar os aniversariantes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Aniversariantes do dia</h2>
        {loading && <p>Carregando...</p>}
        {error && <p style={{ color: '#d32f2f' }}>{error}</p>}
        {!loading && contacts.length === 0 && <p>Nenhum contato faz aniversário hoje.</p>}
        {!loading && contacts.length > 0 && (
          <ul>
            {contacts.map((contact) => (
              <li key={contact.id}>
                <strong>
                  {contact.first_name} {contact.last_name}
                </strong>{' '}
                - {dayjs(contact.birth_date).format('DD [de] MMMM')}{' '}
                {contact.phone && <span>Telefone: {contact.phone} </span>}
                {contact.email && <span>E-mail: {contact.email}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
