import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '../services/api.js';
import { ContactForm } from '../components/ContactForm.jsx';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const orderedContacts = useMemo(
    () =>
      [...contacts].sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }),
    [contacts]
  );

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/contacts');
      setContacts(data.contacts);
    } catch (err) {
      setError('Não foi possível carregar os contatos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreate = async (payload) => {
    const { data } = await apiClient.post('/contacts', payload);
    setContacts((current) => [...current, data.contact]);
    setShowForm(false);
  };

  const handleUpdate = async (payload) => {
    if (!editing) return;
    const { data } = await apiClient.put(`/contacts/${editing.id}`, payload);
    setContacts((current) => current.map((contact) => (contact.id === editing.id ? data.contact : contact)));
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Remover contato ${contact.first_name}?`)) {
      return;
    }
    await apiClient.delete(`/contacts/${contact.id}`);
    setContacts((current) => current.filter((item) => item.id !== contact.id));
  };

  const startCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (contact) => {
    setEditing(contact);
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div>
      <h1>Contatos</h1>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Lista</h2>
          <button className="primary-button" onClick={startCreate}>
            Novo contato
          </button>
        </div>

        {loading && <p>Carregando contatos...</p>}
        {error && <p style={{ color: '#d32f2f' }}>{error}</p>}

        {!loading && orderedContacts.length === 0 && <p>Nenhum contato cadastrado ainda.</p>}

        {!loading && orderedContacts.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Aniversário</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orderedContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    {contact.first_name} {contact.last_name}
                  </td>
                  <td>{dayjs(contact.birth_date).format('DD/MM/YYYY')}</td>
                  <td>{contact.email || '-'}</td>
                  <td>{contact.phone || '-'}</td>
                  <td>
                    <div className="actions">
                      <button onClick={() => startEdit(contact)}>Editar</button>
                      <button className="delete" onClick={() => handleDelete(contact)}>
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2>{editing ? 'Editar contato' : 'Novo contato'}</h2>
          <ContactForm initialValues={editing && {
            firstName: editing.first_name,
            lastName: editing.last_name,
            birthDate: editing.birth_date,
            email: editing.email,
            phone: editing.phone,
          }} onSubmit={editing ? handleUpdate : handleCreate} onCancel={cancelForm} />
        </div>
      )}
    </div>
  );
}
