import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { apiClient } from '../../services/api.js';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export function LeadModal({ lead, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [fupDate, setFupDate] = useState('');
  const [fupChannel, setFupChannel] = useState('whatsapp');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/kanban/leads/${lead.id}/events`);
        if (!cancelled) setEvents(data.events || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lead.id]);

  const addNoteHandler = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    await apiClient.post(`/kanban/leads/${lead.id}/notes`, { text: note.trim() });
    setNote('');
    const { data } = await apiClient.get(`/kanban/leads/${lead.id}/events`);
    setEvents(data.events || []);
  };

  const addFollowupHandler = async (e) => {
    e.preventDefault();
    if (!fupDate) return;
    await apiClient.post(`/kanban/leads/${lead.id}/followup`, { date: fupDate, channel: fupChannel });
    setFupDate('');
    const { data } = await apiClient.get(`/kanban/leads/${lead.id}/events`);
    setEvents(data.events || []);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 720, maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{lead.name}</h2>
          <button className="secondary-button" onClick={onClose}>Fechar</button>
        </div>
        <p style={{ color: '#666' }}>{lead.email || '—'} • {lead.phone || '—'}</p>

        <h3>Timeline</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : events.length === 0 ? (
          <p>Nenhum evento ainda.</p>
        ) : (
          <ul>
            {events.map((ev) => (
              <li key={ev.id} style={{ marginBottom: 8 }}>
                <strong>{ev.type}</strong> — <small>{dayjs(ev.created_at).fromNow()}</small>
                {ev.payload && (
                  <div style={{ fontSize: '0.9rem', color: '#444' }}>
                    {ev.type === 'stage_changed' && (
                      <span>Etapa: {ev.payload.from} → {ev.payload.to}</span>
                    )}
                    {ev.type === 'note' && (
                      <span>Nota: {ev.payload.text}</span>
                    )}
                    {ev.type === 'followup' && (
                      <span>Follow-up em {ev.payload.date} via {ev.payload.channel}</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="card" style={{ marginTop: 12 }}>
          <h3>Adicionar nota</h3>
          <form onSubmit={addNoteHandler}>
            <div className="form-field">
              <label>Nota</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Digite uma nota" />
            </div>
            <button className="primary-button" type="submit" disabled={!note.trim()}>Salvar nota</button>
          </form>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <h3>Agendar follow-up</h3>
          <form onSubmit={addFollowupHandler}>
            <div className="form-field">
              <label>Data/Hora</label>
              <input type="datetime-local" value={fupDate} onChange={(e) => setFupDate(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Canal</label>
              <select value={fupChannel} onChange={(e) => setFupChannel(e.target.value)}>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Telefone</option>
                <option value="email">E-mail</option>
              </select>
            </div>
            <button className="primary-button" type="submit" disabled={!fupDate}>Agendar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
